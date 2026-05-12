"""Prepare LCZ web layers and grid statistics.

This script converts the WUDAPT-style LCZ raster into compact GeoJSON patches
and joins 500 m LCZ summary statistics to the existing grid centroids from the
search index. Region ids are assigned from the Singapore planning-area polygons
so the frontend region filter can also control LCZ display.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import rasterio
from rasterio.features import shapes
from shapely.geometry import Point, shape
from shapely.geometry.geo import mapping
from shapely.prepared import prep


LCZ_CODES = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]

LCZ_LABELS = {
    1: "LCZ 1 - Compact high-rise",
    2: "LCZ 2 - Compact mid-rise",
    3: "LCZ 3 - Compact low-rise",
    4: "LCZ 4 - Open high-rise",
    6: "LCZ 6 - Open low-rise",
    7: "LCZ 7 - Lightweight low-rise",
    8: "LCZ 8 - Large low-rise",
    9: "LCZ 9 - Sparsely built",
    10: "LCZ 10 - Heavy industry",
    11: "LCZ A - Dense trees",
    12: "LCZ B - Scattered trees",
    13: "LCZ C - Bush, scrub",
    14: "LCZ D - Low plants",
    15: "LCZ E - Bare rock/paved",
    16: "LCZ F - Bare soil/sand",
    17: "LCZ G - Water",
}


def finite_number(value):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def rounded(value, digits=6):
    number = finite_number(value)
    return None if number is None else round(number, digits)


def rounded_geometry(geometry, digits=6):
    def round_part(value):
        if isinstance(value, (float, int)):
            return round(value, digits)
        return [round_part(item) for item in value]

    return {"type": geometry["type"], "coordinates": round_part(geometry["coordinates"])}


def polygonal_parts(geometry):
    if geometry.is_empty:
        return []
    if geometry.geom_type in {"Polygon", "MultiPolygon"}:
        return [geometry]
    if geometry.geom_type == "GeometryCollection":
        return [part for part in geometry.geoms if part.geom_type in {"Polygon", "MultiPolygon"} and not part.is_empty]
    return []


def load_regions(path: Path):
    data = json.loads(path.read_text(encoding="utf-8"))
    regions = []
    for feature in data.get("features", []):
        props = feature.get("properties", {})
        geom = shape(feature.get("geometry"))
        regions.append(
            {
                "id": str(props.get("region_id") or ""),
                "name": props.get("region_name") or props.get("region_id") or "",
                "geometry": geom,
                "prepared": prep(geom),
            }
        )
    return regions


def region_for_point(point: Point, regions):
    for region in regions:
        if region["prepared"].covers(point):
            return region
    return None


def load_grid_centroids(search_index_path: Path):
    index = json.loads(search_index_path.read_text(encoding="utf-8"))
    fields = index.get("gridFields", [])
    field_positions = {field: idx for idx, field in enumerate(fields)}
    grid_id_idx = field_positions.get("grid_id")
    lon_idx = field_positions.get("lon")
    lat_idx = field_positions.get("lat")
    if grid_id_idx is None or lon_idx is None or lat_idx is None:
        raise ValueError("search_index.json must include grid_id, lon, and lat in gridFields")

    centroids = {}
    for row in index.get("grids", index.get("grid", [])):
        grid_id = row[grid_id_idx]
        lon = finite_number(row[lon_idx])
        lat = finite_number(row[lat_idx])
        if grid_id is None or lon is None or lat is None:
            continue
        centroids[int(grid_id)] = (lon, lat)
    return centroids


def build_grid_stats(lcz_csv_path: Path, centroids, regions):
    fields = ["grid_id", "region_id", "region_name", "lcz_mode", "lcz_purity"] + [f"p_{code}" for code in LCZ_CODES]
    rows = []
    assigned = 0
    missing_region = 0

    with lcz_csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for record in reader:
            grid_id_value = finite_number(record.get("TARGET_FID"))
            if grid_id_value is None:
                continue
            grid_id = int(grid_id_value)
            lon_lat = centroids.get(grid_id)
            region = region_for_point(Point(lon_lat), regions) if lon_lat else None
            if region:
                assigned += 1
                region_id = region["id"]
                region_name = region["name"]
            else:
                missing_region += 1
                region_id = ""
                region_name = ""

            row = [
                grid_id,
                region_id,
                region_name,
                int(finite_number(record.get("LCZ_mode")) or 0),
                rounded(record.get("LCZ_purity"), 3),
            ]
            for code in LCZ_CODES:
                row.append(rounded(record.get(f"p_{code}"), 6) or 0)
            rows.append(row)

    return {"fields": fields, "rows": rows}, {"assigned": assigned, "missing_region": missing_region}


def build_raw_lcz_geojson(raster_path: Path, regions, band_index: int):
    features = []
    summary = {str(code): 0 for code in LCZ_CODES}
    skipped_no_region = 0

    with rasterio.open(raster_path) as src:
        band = src.read(band_index)
        mask = band > 0
        pixel_area = abs(src.transform.a * src.transform.e)

        for geometry, value in shapes(band, mask=mask, transform=src.transform):
            code = int(value)
            if code not in LCZ_LABELS:
                continue
            geom = shape(geometry)
            matched_region = False
            for region in regions:
                if not region["prepared"].intersects(geom):
                    continue
                clipped = geom.intersection(region["geometry"])
                for part in polygonal_parts(clipped):
                    cell_count = max(1, int(round(part.area / pixel_area)))
                    summary[str(code)] += cell_count
                    matched_region = True
                    features.append(
                        {
                            "type": "Feature",
                            "properties": {
                                "lcz_code": code,
                                "lcz_label": LCZ_LABELS[code],
                                "region_id": region["id"],
                                "region_name": region["name"],
                                "cell_count": cell_count,
                            },
                            "geometry": rounded_geometry(mapping(part)),
                        }
                    )
            if not matched_region:
                skipped_no_region += 1

    return {"type": "FeatureCollection", "features": features}, summary, skipped_no_region


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lcz-raster", required=True, type=Path)
    parser.add_argument("--lcz-grid-csv", required=True, type=Path)
    parser.add_argument("--regions-geojson", required=True, type=Path)
    parser.add_argument("--search-index", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    parser.add_argument("--band-index", type=int, default=2)
    args = parser.parse_args()

    regions = load_regions(args.regions_geojson)
    centroids = load_grid_centroids(args.search_index)
    grid_stats, grid_report = build_grid_stats(args.lcz_grid_csv, centroids, regions)
    raw_geojson, raw_summary, skipped_no_region = build_raw_lcz_geojson(args.lcz_raster, regions, args.band_index)

    args.out_dir.mkdir(parents=True, exist_ok=True)
    grid_payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "lcz_codes": LCZ_CODES,
        "lcz_labels": {str(code): LCZ_LABELS[code] for code in LCZ_CODES},
        "grid": grid_stats,
        "raw_summary": raw_summary,
        "reports": {
            "grid_region_assignment": grid_report,
            "raw_features": len(raw_geojson["features"]),
            "raw_skipped_no_region": skipped_no_region,
        },
    }

    (args.out_dir / "lcz_grid_stats.json").write_text(
        json.dumps(grid_payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
        newline="\n",
    )
    (args.out_dir / "lcz_100m.geojson").write_text(
        json.dumps(raw_geojson, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
        newline="\n",
    )
    print(json.dumps(grid_payload["reports"], indent=2))


if __name__ == "__main__":
    main()
