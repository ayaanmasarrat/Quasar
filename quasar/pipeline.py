"""Fixture adapter -> county validation -> scoring -> GeoJSON contract."""

import json
import math
from pathlib import Path

from .config import COUNTY_FIPS, COUNTY_NAME, NOTICE, require_county
from .scoring import score

FIXTURES = Path(__file__).parent / "fixtures"


def scenarios() -> list[dict]:
    return json.loads((FIXTURES / "scenarios.json").read_text())


def feature_for(record: dict, scenario: dict) -> dict:
    require_county(record.get("county_fips"))
    lon, lat = record["longitude"], record["latitude"]
    if any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in (lon, lat)):
        raise ValueError("Coordinates must be finite numbers")
    if not (-180 <= lon <= 180 and -90 <= lat <= 90):
        raise ValueError("Coordinates must use WGS84 longitude/latitude")
    values = {**record, "rainfall_6h_mm": scenario["rainfall_6h_mm"],
              "gauge_margin_m": scenario["gauge_margin_m"]}
    return {"type": "Feature", "id": record["id"],
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {"id": record["id"], "label": record["label"],
                           "county_fips": COUNTY_FIPS, "risk": score(values)}}


def collection(scenario_id: str = "baseline") -> dict:
    scenario = next((s for s in scenarios() if s["id"] == scenario_id), None)
    if scenario is None:
        raise ValueError("Unknown scenario")
    source = json.loads((FIXTURES / "properties.json").read_text())
    require_county(source["county_fips"])
    features = [feature_for(p, scenario) for p in source["properties"]]
    # Unknown values sort last and are never treated as zero risk.
    features.sort(key=lambda f: (f["properties"]["risk"]["score"] is None,
                                 -(f["properties"]["risk"]["score"] or 0)))
    return {"type": "FeatureCollection", "county_fips": COUNTY_FIPS,
            "county_name": COUNTY_NAME, "mode": "synthetic_demo",
            "scenario": scenario, "provenance": source["provenance"],
            "notice": NOTICE, "features": features}
