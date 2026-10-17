# Architecture and implementation status

```text
Synthetic JSON adapters
    -> Miami-Dade scope checks
    -> property/weather feature contract
    -> illustrative score + factor contributions + unknown state
    -> GeoJSON API
    -> map / prioritized list / simulated notification preview

Optional NWS point client -> timestamped official feed response (CLI only)

Planned: county GIS / FEMA / USGS / optional WeatherNext / historical archive
    -> spatial joins + provenance + freshness -> validated model + replay
```

One Python process serves the API and static frontend. There is no database, worker, scheduler or external message delivery. This keeps the starter easy to run on each teammate's computer and on IBM Z. A later public service needs an application hosting stack, authentication, persistence, rate limits and operational monitoring.

The API always uses synthetic fixtures. The NWS adapter is intentionally separate: live alerts must not appear to validate a synthetic property score. Call it explicitly to inspect official alerts for one fixture coordinate:

```sh
python3 -m quasar.adapters.nws --property-id demo-001 --user-agent 'Quasar-datathon/0.1 (YOUR_CONTACT)'
```

Replace `YOUR_CONTACT` with a team-approved identifying contact. The client queries the official NWS active-alert endpoint by point, preserves the raw GeoJSON and retrieval time, uses a timeout, and propagates failures. Its response is not countywide coverage. Before UI integration, add expiration/freshness validation, caching, retry/backoff and comprehensive zone/polygon coverage tests. Do not infer "no flood hazard" from an empty response.

## Scoring baseline

| Input | Weight | Illustrative exposure normalization |
| --- | --- | --- |
| Six-hour rainfall (mm) | 35% | rainfall / 120 |
| Terrain elevation (m) | 20% | (10 - elevation) / 10 |
| FEMA zone | 20% | V/VE: 1; A/AE/AH/AO: 0.8; X: 0.2 |
| Distance to waterway (m) | 10% | 1 - distance / 1000 |
| Gauge margin below flood stage (m) | 15% | (1 - margin) / 1.5 |

Clamp each normalized feature to 0-1, multiply by its weight and 100, and sum. Contributions are reported in score points. Bands are `lower_relative` below 35, `moderate` from 35 to below 65, and `elevated` at 65 or above. Any missing factor or unrecognized FEMA zone yields `unknown`, with a null score. A complete synthetic input reports `data_status: synthetic`; missing inputs report `incomplete`.

These weights, limits and bands are arbitrary demonstration parameters. FEMA X variants are simplified and need proper subtype handling. Low absolute elevation alone is not a flood model. Gauge-to-property linkage, terrain connectivity, drainage/canals, coastal tides, surge, soils and antecedent conditions are not modeled. All fixture gauges and attributes are invented. A gauge flood-stage margin is meaningful only with a defensible gauge linkage and compatible vertical datum. Do not use this score for operational decisions.

For real data, maintain observed time, forecast issue/valid times, data age and source references at feature level. Establish staleness thresholds per source before scoring. The fixed synthetic exercise clock does not implement live freshness validation.

## IBM Z plan

The Python core has no third-party runtime packages and the container has no processor-specific build instructions. This is a portability design choice, not certification. Run the tests and container on the actual Linux `s390x` host before claiming IBM Z compatibility. Add ML/GIS packages only after checking native wheels or a reproducible build on the team's target host.
