"""Transparent demonstration baseline; no trained model or hydrologic validation."""

import math

from .config import MODEL_VERSION

# Illustrative choices for a coding demo, not calibrated flood-risk coefficients.
WEIGHTS = {
    "rainfall_6h_mm": 0.35,
    "elevation_m": 0.20,
    "fema_zone": 0.20,
    "waterway_distance_m": 0.10,
    "gauge_margin_m": 0.15,
}
ZONE_EXPOSURE = {"VE": 1.0, "V": 1.0, "AE": 0.8, "A": 0.8, "AH": 0.8, "AO": 0.8, "X": 0.2}


def clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def score(inputs: dict) -> dict:
    """Gauge margin = flood-stage threshold minus observed stage, same datum/units.

    Nulls or unrecognized FEMA zones produce unknown risk, never an all-clear.
    Each factor reports its weighted contribution, summing to the raw score.
    """
    missing = []
    for key in WEIGHTS:
        value = inputs.get(key)
        if value is None or (key == "fema_zone" and value not in ZONE_EXPOSURE):
            missing.append(key)
            continue
        if key != "fema_zone":
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                raise ValueError(f"{key} must be a finite number or null")
            if key in ("rainfall_6h_mm", "waterway_distance_m") and value < 0:
                raise ValueError(f"{key} must be non-negative")
    if missing:
        return {"score": None, "band": "unknown", "factors": [], "missing": missing,
                "model_version": MODEL_VERSION, "data_status": "incomplete"}
    normalized = {
        "rainfall_6h_mm": clamp(inputs["rainfall_6h_mm"] / 120),
        "elevation_m": clamp((10 - inputs["elevation_m"]) / 10),
        "fema_zone": ZONE_EXPOSURE[inputs["fema_zone"]],
        "waterway_distance_m": clamp(1 - inputs["waterway_distance_m"] / 1000),
        "gauge_margin_m": clamp((1 - inputs["gauge_margin_m"]) / 1.5),
    }
    factors = [{"name": key, "value": inputs[key], "weight": weight,
                "contribution": round(normalized[key] * weight * 100, 3)}
               for key, weight in WEIGHTS.items()]
    total = round(sum(f["contribution"] for f in factors), 1)
    band = "elevated" if total >= 65 else "moderate" if total >= 35 else "lower_relative"
    return {"score": total, "band": band, "factors": factors, "missing": [],
            "model_version": MODEL_VERSION, "data_status": "synthetic"}
