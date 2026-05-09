"""Prepare weekly energy Mapbox upload layers from Singapore seasonal workbooks.

The script joins six seasonal workbook totals to the existing building GeoJSON,
aggregates them to 500 m grid cells, and updates metadata stats used by the
frontend legend. It writes upload-ready GeoJSON files but does not modify
Mapbox Studio directly.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import pandas as pd


FIELD_MAP = {
    "hot_tmy_kwh": "sg_summer_tmy_energy_cop_EUI.xlsx",
    "hot_micro_kwh": "sg_summer_climate_energy_cop_EUI.xlsx",
    "cold_tmy_kwh": "sg_winter_tmy_energy_cop_EUI.xlsx",
    "cold_micro_kwh": "sg_winter_climate_energy_cop_EUI.xlsx",
    "trans_tmy_kwh": "sg_autumn_tmy_energy_cop_EUI_version2.xlsx",
    "trans_micro_kwh": "sg_autumn_climate_energy_cop_EUI_version2.xlsx",
}

DIFF_FIELDS = {
    "hot_diff_pct": ("hot_micro_kwh", "hot_tmy_kwh"),
    "cold_diff_pct": ("cold_micro_kwh", "cold_tmy_kwh"),
    "trans_diff_pct": ("trans_micro_kwh", "trans_tmy_kwh"),
}

ENERGY_FIELDS = list(FIELD_MAP) + list(DIFF_FIELDS)


def finite(value):
    if value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def rounded(value, digits=6):
    number = finite(value)
    if number is None:
        return None
    return round(number, digits)


def stats(values):
    series = pd.Series([value for value in values if finite(value) is not None], dtype="float64")
    if series.empty:
        return {"min": None, "max": None, "mean": None, "stops": []}
    return {
        "min": rounded(series.min()),
        "max": rounded(series.max()),
        "mean": rounded(series.mean()),
        "stops": [rounded(value) for value in series.quantile([0.05, 0.25, 0.5, 0.75, 0.95]).tolist()],
    }


def read_energy_table(source_dir: Path) -> dict[int, dict[str, float]]:
    records: dict[int, dict[str, float]] = {}
    for field, filename in FIELD_MAP.items():
        path = source_dir / filename
        df = pd.read_excel(path, usecols=["TARGET_FID", "total_energy_kwh"])
        df = df.dropna(subset=["TARGET_FID"])
        for row in df.itertuples(index=False):
            object_id = int(row.TARGET_FID)
            records.setdefault(object_id, {})[field] = float(row.total_energy_kwh)

    for values in records.values():
        for field, (micro_field, tmy_field) in DIFF_FIELDS.items():
            micro = finite(values.get(micro_field))
            tmy = finite(values.get(tmy_field))
            values[field] = (micro - tmy) / tmy if micro is not None and tmy not in (None, 0) else None
    return records


def load_geojson(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump_geojson(data, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def update_buildings(buildings, energy_by_object: dict[int, dict[str, float]]):
    missing = 0
    grid_totals: dict[int, dict[str, float]] = {}
    for feature in buildings["features"]:
        props = feature.get("properties", {})
        object_id = int(props.get("objectid"))
        energy = energy_by_object.get(object_id)
        if not energy:
            missing += 1
            continue

        for field in ENERGY_FIELDS:
            props[field] = rounded(energy.get(field))

        grid_id = props.get("grid_id")
        if grid_id is None:
            continue
        grid_bucket = grid_totals.setdefault(int(grid_id), {field: 0.0 for field in FIELD_MAP})
        for field in FIELD_MAP:
            value = finite(energy.get(field))
            if value is not None:
                grid_bucket[field] += value

    for grid_bucket in grid_totals.values():
        for field, (micro_field, tmy_field) in DIFF_FIELDS.items():
            micro = finite(grid_bucket.get(micro_field))
            tmy = finite(grid_bucket.get(tmy_field))
            grid_bucket[field] = (micro - tmy) / tmy if micro is not None and tmy not in (None, 0) else None
    return missing, grid_totals


def update_grid(grid, grid_totals: dict[int, dict[str, float]]):
    missing = 0
    for feature in grid["features"]:
        props = feature.get("properties", {})
        grid_id = props.get("grid_id")
        totals = grid_totals.get(int(grid_id)) if grid_id is not None else None
        if not totals:
            missing += 1
            continue
        for field in ENERGY_FIELDS:
            props[field] = rounded(totals.get(field))
    return missing


def update_metadata(metadata_path: Path, buildings, grid):
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    for layer_name, geojson in [("buildings", buildings), ("grid_500m", grid)]:
        layer = metadata.setdefault("layers", {}).setdefault(layer_name, {})
        metric_bucket = layer.setdefault("metrics", {})
        for field in ENERGY_FIELDS:
            metric_bucket[field] = stats(
                feature.get("properties", {}).get(field) for feature in geojson.get("features", [])
            )
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", required=True, type=Path)
    parser.add_argument("--buildings-geojson", required=True, type=Path)
    parser.add_argument("--grid-geojson", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    parser.add_argument("--metadata", required=True, type=Path)
    args = parser.parse_args()

    energy_by_object = read_energy_table(args.source_dir)
    buildings = load_geojson(args.buildings_geojson)
    grid = load_geojson(args.grid_geojson)

    missing_buildings, grid_totals = update_buildings(buildings, energy_by_object)
    missing_grid = update_grid(grid, grid_totals)

    buildings_out = args.out_dir / "05_buildings_energy_weekly.geojson"
    grid_out = args.out_dir / "06_grid_energy_weekly.geojson"
    dump_geojson(buildings, buildings_out)
    dump_geojson(grid, grid_out)
    update_metadata(args.metadata, buildings, grid)

    report = {
        "building_features": len(buildings.get("features", [])),
        "grid_features": len(grid.get("features", [])),
        "energy_records": len(energy_by_object),
        "missing_buildings": missing_buildings,
        "missing_grid_cells": missing_grid,
        "buildings_out": str(buildings_out),
        "grid_out": str(grid_out),
        "fields": ENERGY_FIELDS,
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
