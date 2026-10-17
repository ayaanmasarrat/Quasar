# Data contract, version 1

## Pilot boundary

Miami-Dade County is fixed to FIPS `12086`, timezone `America/New_York`. API coordinates are WGS84 (EPSG:4326), `[longitude, latitude]`. The fixture loader checks county tags and coordinate validity. **It does not yet perform a county polygon intersection** and must not be used as an external-data import path without that check.

Fixtures contain six invented points. They are not parcels or building footprints. They are deliberately small enough for every teammate to read.

## Property adapter record

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Stable adapter identifier; demo IDs start `demo-` |
| `label` | string | Display label; do not use real owner names |
| `county_fips` | string | Must be `12086` |
| `longitude`, `latitude` | number | WGS84 point |
| `elevation_m` | number or null | Terrain elevation; real integration must specify vertical datum |
| `fema_zone` | string or null | Illustrative normalized FEMA code; unknown codes remain unknown |
| `waterway_distance_m` | non-negative number or null | Distance to a meaningfully connected waterway |

## Scenario record

`id`, `label`, `valid_from`, `valid_to`, `rainfall_6h_mm`, and `gauge_margin_m`.

Times are ISO 8601 UTC with `Z`; UI formats them in Miami's local time. Each fixture window uses one countywide rainfall and gauge value as an explicit simplification. The rainfall value represents total mm for that six-hour window. Gauge margin is `flood_stage_m - observed_stage_m`, using matching datum and units; negative means above the illustrative stage threshold.

## Scored GeoJSON

`GET /api/properties?scenario=peak` returns a FeatureCollection with `county_fips`, `mode`, `scenario`, `provenance`, `notice` and `features`. Each Point feature has stable `id`, label, county and `risk`:

```json
{
  "score": null,
  "band": "unknown",
  "factors": [],
  "missing": ["elevation_m"],
  "model_version": "illustrative-baseline-v1",
  "data_status": "incomplete"
}
```

Complete risk outputs contain five factors: `name`, original `value`, `weight`, and weighted score-point `contribution`. Scores are relative demo values, not calibrated probabilities. Preserve nulls in API and UI.

## Contract for future real adapters

Do not silently replace fixtures. Add an explicit data mode and source status. Every real adapter must retain source URL/record ID, retrieval time, observation/issue/valid times where relevant, CRS, vertical datum, units, license and transformation steps. Add authoritative county geometry validation, source-age limits, missing/stale states, and tests for outside-county records. Store only normalized county-filtered features in the scoring pipeline. Do not turn a centroid association into a claim of building-level inundation.
