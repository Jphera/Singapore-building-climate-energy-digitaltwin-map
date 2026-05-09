"""Convert Singapore administrative polygons to website filter GeoJSON."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import geopandas as gpd


SURVEY_RE = re.compile(r"<th>SURVEY_DISTRICT</th>\s*<td>([^<]+)</td>", re.IGNORECASE)
MASTERPLAN_COLUMNS = {"PLN_AREA_C", "PLN_AREA_N", "REGION_N", "REGION_C"}
REGION_ORDER = ["CENTRAL REGION", "EAST REGION", "NORTH REGION", "NORTH-EAST REGION", "WEST REGION"]


def natural_key(value: str):
    return [int(part) if part.isdigit() else part for part in re.split(r"(\d+)", value)]


def extract_region_id(description: str, fallback: str) -> str:
    match = SURVEY_RE.search(description or "")
    return match.group(1).strip() if match else fallback


def title_case(value: str) -> str:
    return " ".join(str(value or "").strip().split()).title()


def survey_region_group(region_id: str) -> str:
    if region_id.upper().startswith("MK"):
        return "MK"
    if region_id.upper().startswith("TS"):
        return "TS"
    return "Other"


def geometry_json(geometry, crs):
    return json.loads(gpd.GeoSeries([geometry], crs=crs).to_json())["features"][0]["geometry"]


def build_masterplan_records(gdf: gpd.GeoDataFrame):
    working = gdf.copy()
    for column in MASTERPLAN_COLUMNS:
        working[column] = working[column].fillna("").astype(str)

    keys = ["REGION_N", "REGION_C", "PLN_AREA_N", "PLN_AREA_C"]
    subzone_counts = working.groupby(keys, dropna=False).size().rename("subzone_count").reset_index()
    dissolved = working.dissolve(by=keys, as_index=False)
    dissolved = dissolved.merge(subzone_counts, on=keys, how="left")

    records = []
    for row in dissolved.itertuples(index=False):
        props = row._asdict()
        geometry = props.pop("geometry")
        region_raw = str(props.get("REGION_N", "") or "Other Region")
        area_raw = str(props.get("PLN_AREA_N", "") or props.get("PLN_AREA_C", "") or "Unknown Area")
        area_code = str(props.get("PLN_AREA_C", "") or area_raw)
        records.append(
            {
                "type": "Feature",
                "properties": {
                    "region_id": area_code,
                    "region_name": title_case(area_raw),
                    "region_group": title_case(region_raw),
                    "region_group_code": str(props.get("REGION_C", "") or ""),
                    "planning_area_code": area_code,
                    "subzone_count": int(props.get("subzone_count") or 0),
                },
                "geometry": geometry_json(geometry, gdf.crs),
            }
        )

    def sort_key(feature):
        group_raw = str(feature["properties"]["region_group"]).upper()
        group_index = REGION_ORDER.index(group_raw) if group_raw in REGION_ORDER else len(REGION_ORDER)
        return (group_index, natural_key(feature["properties"]["region_name"]))

    return sorted(records, key=sort_key)


def build_survey_records(gdf: gpd.GeoDataFrame):
    records = []
    for row in gdf.itertuples(index=False):
        props = row._asdict()
        geometry = props.pop("geometry")
        region_id = extract_region_id(str(props.get("Descriptio", "")), str(props.get("Name", "")))
        records.append(
            {
                "type": "Feature",
                "properties": {
                    "region_id": region_id,
                    "region_name": region_id,
                    "region_group": survey_region_group(region_id),
                },
                "geometry": geometry_json(geometry, gdf.crs),
            }
        )
    return sorted(records, key=lambda feature: natural_key(feature["properties"]["region_id"]))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--shp", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    gdf = gpd.read_file(args.shp)
    if gdf.crs is None:
        gdf = gdf.set_crs("EPSG:4326")
    elif gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs("EPSG:4326")

    records = build_masterplan_records(gdf) if MASTERPLAN_COLUMNS.issubset(gdf.columns) else build_survey_records(gdf)
    feature_collection = {"type": "FeatureCollection", "features": records}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(feature_collection, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"out": str(args.out), "features": len(records)}, indent=2))


if __name__ == "__main__":
    main()
