import argparse
import csv
import json
import math
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


PERIODS = {
    "hot": {
        "label": "Relative hot (May)",
        "files": {
            "temp": "sg_summer_t2-1.csv",
            "wind": "sg_summer_w10-1.csv",
            "rh": "sg_summer_RH2.csv",
            "solar": "sg_summer_SW.csv",
        },
    },
    "transition": {
        "label": "Transition (Oct)",
        "files": {
            "temp": "sg_autumn_t2.csv",
            "wind": "sg_autumn_w10.csv",
            "rh": "sg_autumn_rh2.csv",
            "solar": "sg_autumn_sw.csv",
        },
    },
    "cold": {
        "label": "Relative cold (Dec)",
        "files": {
            "temp": "sg_winter_t2.csv",
            "wind": "sg_winter_w10.csv",
            "rh": "sg_winter_rh.csv",
            "solar": "sg_winter_sw.csv",
        },
    },
}

WEATHER_FIELDS = {
    "temp": {"unit": "degC", "label": "2 m temperature", "suffix": "c", "convert": "kelvin_to_c", "digits": 2},
    "wind": {"unit": "m/s", "label": "10 m wind speed", "suffix": "ms", "convert": None, "digits": 2},
    "rh": {"unit": "%", "label": "Relative humidity", "suffix": "pct", "convert": None, "digits": 1},
    "solar": {"unit": "W/m2", "label": "Solar shortwave radiation", "suffix": "wm2", "convert": None, "digits": 1},
}

BUILDING_TYPE_GROUPS = {
    "public_service": {
        "label": "Public service",
        "share": "11.6%",
        "color": "#2563eb",
        "types": ["industrial", "hospital", "clinic", "nursing_home"],
    },
    "commercial": {
        "label": "Commercial",
        "share": "5.4%",
        "color": "#ea580c",
        "types": ["retail", "mixed_development", "business_park", "shophouse", "hawker_centre"],
    },
    "education": {
        "label": "Education",
        "share": "2.2%",
        "color": "#7c3aed",
        "types": ["ihl", "non_ihl"],
    },
    "residential": {
        "label": "Residential",
        "share": "77.4%",
        "color": "#059669",
        "types": ["private_apartment", "hdb", "landed_property", "hotel"],
    },
    "office_amenity": {
        "label": "Office and amenities",
        "share": "3.4%",
        "color": "#0891b2",
        "types": ["office", "community_cultural", "data_centre", "sports", "restaurant", "supermarket"],
    },
}

TYPE_LABELS = {
    "business_park": "Business park",
    "clinic": "Clinic",
    "community_cultural": "Community cultural",
    "data_centre": "Data center",
    "hawker_centre": "Hawker centre",
    "hdb": "HDB",
    "hospital": "Hospital",
    "hotel": "Hotel",
    "ihl": "Institutes of higher learning",
    "industrial": "Industrial",
    "landed_property": "Landed property",
    "mixed_development": "Mixed development",
    "non_ihl": "Non-institutes of higher learning",
    "nursing_home": "Nursing home",
    "office": "Office",
    "private_apartment": "Private apartment",
    "restaurant": "Restaurant",
    "retail": "Retail",
    "shophouse": "Shophouse",
    "sports": "Sports",
    "supermarket": "Supermarket",
}


def type_to_group():
    lookup = {}
    for group_id, group in BUILDING_TYPE_GROUPS.items():
        for building_type in group["types"]:
            lookup[building_type] = group_id
    return lookup


def parse_number(value):
    if value is None or value == "":
        return None
    try:
        numeric = float(value)
    except ValueError:
        return None
    if not math.isfinite(numeric):
        return None
    return numeric


def convert_value(value, conversion):
    if conversion == "kelvin_to_c":
        return value - 273.15
    return value


def mean(values):
    return sum(values) / len(values) if values else None


def percentile(sorted_values, q):
    if not sorted_values:
        return None
    if len(sorted_values) == 1:
        return sorted_values[0]
    pos = (len(sorted_values) - 1) * q
    low = math.floor(pos)
    high = math.ceil(pos)
    if low == high:
        return sorted_values[low]
    return sorted_values[low] + (sorted_values[high] - sorted_values[low]) * (pos - low)


def metric_stats(features, fields):
    stats = {}
    for field in fields:
        values = [
            value
            for feature in features
            for value in [parse_number(feature["properties"].get(field))]
            if value is not None
        ]
        values.sort()
        if not values:
            continue
        stats[field] = {
            "min": round(values[0], 6),
            "max": round(values[-1], 6),
            "mean": round(sum(values) / len(values), 6),
            "stops": [round(percentile(values, q), 6) for q in [0.05, 0.25, 0.5, 0.75, 0.95]],
        }
    return stats


def read_weather_csv(path, conversion):
    records = {}
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.reader(file)
        header = next(reader)
        value_start = 2
        for row in reader:
            if len(row) <= value_start:
                continue
            grid_id = parse_number(row[1]) or parse_number(row[0])
            if grid_id is None:
                continue
            values = []
            for raw in row[value_start : len(header)]:
                numeric = parse_number(raw)
                if numeric is not None:
                    values.append(convert_value(numeric, conversion))
            if not values:
                continue
            records[int(grid_id)] = {
                "mean": round(mean(values), 4),
                "min": round(min(values), 4),
                "max": round(max(values), 4),
            }
    return records


def read_weather_timeseries_csv(path, conversion, digits):
    grid_rows = {}
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.reader(file)
        header = next(reader)
        times = header[2:]
        for row in reader:
            if len(row) <= 2:
                continue
            grid_id = parse_number(row[1]) or parse_number(row[0])
            if grid_id is None:
                continue
            values = []
            for raw in row[2 : len(header)]:
                numeric = parse_number(raw)
                if numeric is None:
                    values.append(None)
                else:
                    values.append(round(convert_value(numeric, conversion), digits))
            grid_rows[int(grid_id)] = values
    return times, grid_rows


def load_json(path):
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_geojson(path, features):
    path.parent.mkdir(parents=True, exist_ok=True)
    data = {"type": "FeatureCollection", "features": features}
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, separators=(",", ":"))


def clone_feature_with_props(feature, props):
    return {
        "type": "Feature",
        "geometry": feature["geometry"],
        "properties": props,
    }


def build_weather_features(grid_geojson, wrf_root):
    period_dirs = {
        "hot": wrf_root / "Singapore-summer",
        "transition": wrf_root / "Singapore-autumn",
        "cold": wrf_root / "Singapore-winter",
    }
    weather = defaultdict(dict)
    for period, period_def in PERIODS.items():
        period_dir = period_dirs[period]
        for variable, filename in period_def["files"].items():
            field_def = WEATHER_FIELDS[variable]
            records = read_weather_csv(period_dir / filename, field_def["convert"])
            suffix = field_def["suffix"]
            for grid_id, summary in records.items():
                base = f"{variable}_{period}_{suffix}"
                weather[grid_id][base] = summary["mean"]
                weather[grid_id][f"{base}_min"] = summary["min"]
                weather[grid_id][f"{base}_max"] = summary["max"]

    features = []
    for feature in grid_geojson["features"]:
        grid_id = int(feature["properties"]["grid_id"])
        props = {"grid_id": grid_id}
        props.update(feature["properties"])
        props.update(weather.get(grid_id, {}))
        features.append(clone_feature_with_props(feature, props))
    return features


def compact_timeseries(times, grid_rows, variable_def, period, variable):
    grid_ids = sorted(grid_rows)
    time_count = len(times)
    values_by_time = []
    all_values = []
    for time_index in range(time_count):
        row = []
        for grid_id in grid_ids:
            values = grid_rows[grid_id]
            value = values[time_index] if time_index < len(values) else None
            row.append(value)
            if value is not None:
                all_values.append(value)
        values_by_time.append(row)
    all_values.sort()
    stats = {
        "min": round(all_values[0], variable_def["digits"]) if all_values else None,
        "max": round(all_values[-1], variable_def["digits"]) if all_values else None,
        "mean": round(sum(all_values) / len(all_values), variable_def["digits"]) if all_values else None,
        "stops": [
            round(percentile(all_values, q), variable_def["digits"]) for q in [0.05, 0.25, 0.5, 0.75, 0.95]
        ]
        if all_values
        else [],
    }
    return {
        "period": period,
        "periodLabel": PERIODS[period]["label"],
        "variable": variable,
        "label": variable_def["label"],
        "unit": variable_def["unit"],
        "times": times,
        "gridIds": grid_ids,
        "values": values_by_time,
        "stats": stats,
    }


def write_weather_timeseries(wrf_root, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = {
        "periods": {key: value["label"] for key, value in PERIODS.items()},
        "variables": {
            key: {"label": value["label"], "unit": value["unit"]} for key, value in WEATHER_FIELDS.items()
        },
        "files": {},
    }
    period_dirs = {
        "hot": wrf_root / "Singapore-summer",
        "transition": wrf_root / "Singapore-autumn",
        "cold": wrf_root / "Singapore-winter",
    }
    for period, period_def in PERIODS.items():
        manifest["files"][period] = {}
        period_dir = period_dirs[period]
        for variable, filename in period_def["files"].items():
            variable_def = WEATHER_FIELDS[variable]
            times, grid_rows = read_weather_timeseries_csv(
                period_dir / filename, variable_def["convert"], variable_def["digits"]
            )
            payload = compact_timeseries(times, grid_rows, variable_def, period, variable)
            target = out_dir / f"{period}_{variable}.json"
            with target.open("w", encoding="utf-8") as file:
                json.dump(payload, file, ensure_ascii=False, separators=(",", ":"))
            manifest["files"][period][variable] = f"data/weather-timeseries/{target.name}"
    with (out_dir / "manifest.json").open("w", encoding="utf-8") as file:
        json.dump(manifest, file, ensure_ascii=False, indent=2)
    return manifest


def build_overview_features(grid_geojson, buildings_geojson):
    group_lookup = type_to_group()
    aggregates = defaultdict(
        lambda: {
            "building_count": 0,
            "type_counts": Counter(),
            "group_counts": Counter(),
            "height_values": [],
            "eui_values": [],
            "energy_values": [],
        }
    )
    for feature in buildings_geojson["features"]:
        props = feature["properties"]
        grid_id = parse_number(props.get("grid_id"))
        if grid_id is None:
            continue
        grid_id = int(grid_id)
        building_type = props.get("building_type") or "unknown"
        group_id = group_lookup.get(building_type, "unknown")
        aggregate = aggregates[grid_id]
        aggregate["building_count"] += 1
        aggregate["type_counts"][building_type] += 1
        aggregate["group_counts"][group_id] += 1
        for source_key, target_key in [
            ("height_m", "height_values"),
            ("eui_2023", "eui_values"),
            ("energy_total_kwh", "energy_values"),
        ]:
            numeric = parse_number(props.get(source_key))
            if numeric is not None:
                aggregate[target_key].append(numeric)

    features = []
    group_ids = list(BUILDING_TYPE_GROUPS)
    for feature in grid_geojson["features"]:
        grid_id = int(feature["properties"]["grid_id"])
        aggregate = aggregates.get(grid_id)
        props = {"grid_id": grid_id}
        if aggregate:
            dominant_type, dominant_type_count = aggregate["type_counts"].most_common(1)[0]
            dominant_group, dominant_group_count = aggregate["group_counts"].most_common(1)[0]
            props.update(
                {
                    "building_count": aggregate["building_count"],
                    "dominant_type": dominant_type,
                    "dominant_type_label": TYPE_LABELS.get(dominant_type, dominant_type),
                    "dominant_type_count": dominant_type_count,
                    "dominant_archetype": dominant_group,
                    "dominant_archetype_label": BUILDING_TYPE_GROUPS.get(dominant_group, {}).get(
                        "label", "Unknown"
                    ),
                    "dominant_archetype_count": dominant_group_count,
                    "mean_height_m": round(mean(aggregate["height_values"]) or 0, 3),
                    "mean_eui_2023": round(mean(aggregate["eui_values"]) or 0, 3),
                    "mean_energy_kwh": round(mean(aggregate["energy_values"]) or 0, 3),
                }
            )
            for group_id in group_ids:
                props[f"{group_id}_count"] = aggregate["group_counts"].get(group_id, 0)
        else:
            props.update(
                {
                    "building_count": 0,
                    "dominant_type": "none",
                    "dominant_type_label": "No buildings",
                    "dominant_type_count": 0,
                    "dominant_archetype": "none",
                    "dominant_archetype_label": "No buildings",
                    "dominant_archetype_count": 0,
                    "mean_height_m": 0,
                    "mean_eui_2023": 0,
                    "mean_energy_kwh": 0,
                }
            )
            for group_id in group_ids:
                props[f"{group_id}_count"] = 0
        features.append(clone_feature_with_props(feature, props))
    return features


def update_metadata(metadata_path, weather_features, overview_features):
    metadata = load_json(metadata_path)
    weather_metric_fields = [
        f"{variable}_{period}_{field_def['suffix']}"
        for period in PERIODS
        for variable, field_def in WEATHER_FIELDS.items()
    ]
    overview_metric_fields = [
        "building_count",
        "mean_height_m",
        "mean_eui_2023",
        "mean_energy_kwh",
    ]
    metadata["generated_at"] = datetime.now(timezone.utc).isoformat()
    metadata["building_type_groups"] = BUILDING_TYPE_GROUPS
    metadata["building_type_labels"] = TYPE_LABELS
    metadata["layers"]["weather_500m"] = {
        "source_layer": "weather_500m",
        "count": len(weather_features),
        "metrics": metric_stats(weather_features, weather_metric_fields),
        "periods": {key: value["label"] for key, value in PERIODS.items()},
        "variables": {
            key: {"label": value["label"], "unit": value["unit"]} for key, value in WEATHER_FIELDS.items()
        },
    }
    metadata["layers"]["building_overview_500m"] = {
        "source_layer": "building_overview_500m",
        "count": len(overview_features),
        "metrics": metric_stats(overview_features, overview_metric_fields),
    }
    with metadata_path.open("w", encoding="utf-8") as file:
        json.dump(metadata, file, ensure_ascii=False, indent=2)


def parse_args():
    parser = argparse.ArgumentParser(description="Prepare Mapbox upload layers for the Singapore digital twin.")
    parser.add_argument("--grid-geojson", required=True, type=Path)
    parser.add_argument("--buildings-geojson", required=True, type=Path)
    parser.add_argument("--wrf-root", required=True, type=Path)
    parser.add_argument("--metadata", required=True, type=Path)
    parser.add_argument("--out-dir", default=Path("mapbox-studio-upload"), type=Path)
    parser.add_argument("--timeseries-out-dir", default=Path("data/weather-timeseries"), type=Path)
    return parser.parse_args()


def main():
    args = parse_args()
    grid_geojson = load_json(args.grid_geojson)
    buildings_geojson = load_json(args.buildings_geojson)

    weather_features = build_weather_features(grid_geojson, args.wrf_root)
    overview_features = build_overview_features(grid_geojson, buildings_geojson)

    write_geojson(args.out_dir / "03_weather_500m.geojson", weather_features)
    write_geojson(args.out_dir / "04_building_overview_500m.geojson", overview_features)
    write_weather_timeseries(args.wrf_root, args.timeseries_out_dir)
    update_metadata(args.metadata, weather_features, overview_features)

    print(f"Wrote {len(weather_features):,} weather grid features")
    print(f"Wrote {len(overview_features):,} building overview grid features")


if __name__ == "__main__":
    main()
