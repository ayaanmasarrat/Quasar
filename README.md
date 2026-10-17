# Quasar

Miami-Dade County flood risk intelligence starter for the IBM Z Datathon.

Quasar follows the team's Flood Emergency Alert System proposal, narrowed to **Miami-Dade County, Florida (FIPS `12086`)**. It gives the team a working path from a property-like record to an explainable score, a map, and a simulated notification.

## Run locally

Install Python 3.11 or later. From this repository's root:

```sh
python3 -m quasar
```

Open <http://127.0.0.1:8000>. No API keys, Python dependencies, database, or Node installation are needed to run the demo. Leaflet and OpenStreetMap tiles require internet access; the site list, score details, and notification previews work without the map. The server is a local demo server, not a production hosting stack.

```sh
python3 -m unittest discover -s tests -v
node --check quasar/static/app.js  # optional local JavaScript syntax check; runs in CI
```

## What works today

- Six **fictional** Miami-Dade exercise sites, including one with missing terrain data.
- Three deterministic exercise windows with changing synthetic rainfall and gauge conditions.
- An interactive map, prioritized site list, factor contributions, and explicit unknown scores.
- Opt-in SMS/email **previews** for elevated scores. Nothing is sent or stored, and no contact details are collected.
- A JSON/GeoJSON API and a separately callable NWS point-alert client.
- Automated tests, GitHub Actions, and a portable container starter.

**This is a baseplate, not a validated flood model.** It has no live parcels, building footprints, FEMA joins, elevation raster processing, WeatherNext access, trained AI, historical storm replay, real subscriptions, or real delivery. The dashboard's official-alert panel deliberately says the feed is not connected. It never presents synthetic exercise conditions as official alerts.

## Demo walkthrough

1. Start at Exercise hour 0 and inspect a site.
2. Switch to hours 6 and 12. The synthetic weather factors change the scores.
3. Inspect the missing-terrain site: it remains unknown rather than receiving a low score.
4. At hour 12, inspect an elevated site, select the simulation opt-in checkbox, and preview an email. The API reports `sent_count: 0`.
5. Explain that the next milestone replaces fixture inputs with timestamped source data and validates the model against a documented Miami-Dade storm.

The exercise dates are a fixed fictional clock, not today's weather or an actual hurricane. All site labels, FEMA zones, elevations, and other attributes are invented.

## API

| Method | Path | Result |
| --- | --- | --- |
| GET | `/health` | Server status, county, demo mode |
| GET | `/api/config` | Fixed pilot scope and notices |
| GET | `/api/scenarios` | Three synthetic windows |
| GET | `/api/properties?scenario=peak` | Scored GeoJSON points |
| GET | `/api/official-alerts` | Explicit `not_connected` status |
| POST | `/api/notifications/preview` | Simulation only; no delivery |

Example preview body:

```json
{"property_ids":["demo-001"],"scenario":"peak","channel":"sms","opt_in":true}
```

Other county FIPS values are rejected. `scenario` accepts `baseline`, `heavy-rain`, or `peak`. Unknown sites and scenarios return errors.

## Team work areas

| Area | Start here | First useful contribution |
| --- | --- | --- |
| Data / GIS | `quasar/pipeline.py`, `docs/data-contract.md` | County boundary, parcels and building joins; provenance |
| Modeling / AI | `quasar/scoring.py` | Validated features, baseline evaluation, then trained model |
| Frontend | `quasar/static/` | Real parcel polygons, time controls, data freshness |
| Integration / IBM Z | `quasar/server.py`, `Dockerfile` | Server smoke test, environment setup, reproducible replay |

Agree on ownership before editing shared contracts. Use feature branches and small pull requests into `preview`; see [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) for shared AI coding instructions.

## IBM Z / LinuxONE

Develop locally first and run an early compatibility check on IBM Z. The backend uses only Python's standard library, avoiding compiled GIS/ML packages at this stage. No IBM server has been accessed or tested yet.

On your IBM Z Linux host with Python 3.11+:

```sh
python3 -m unittest discover -s tests -v
python3 -m quasar --host 127.0.0.1 --port 8000
```

Use an SSH tunnel to view that localhost service from your laptop. Substitute your actual host and user; do not commit credentials:

```sh
ssh -L 8000:127.0.0.1:8000 USER@IBM_Z_HOST
```

Container option (Docker or equivalent Podman commands):

```sh
docker build -t quasar:demo .
docker run --rm -p 127.0.0.1:8000:8000 quasar:demo
```

Build natively on IBM Z, or use a configured cross-builder:

```sh
docker buildx build --platform linux/s390x -t quasar:demo --load .
```

The container runs as a non-root user. The base image tag, container runtime, outbound network access and `s390x` build must be verified on the provided server; CI's container build alone checks x86 Linux. Browser map rendering stays on the laptop. There is no cloud deployment in this starter.

## Next milestones

1. Acquire an authoritative Miami-Dade county polygon and clip residential parcels/building footprints. Enforce real geometry membership before accepting external data.
2. Add FEMA NFHL and USGS 3DEP features with CRS, vertical datum, missing-data flags, and source timestamps. Evaluate coastal/tidal and canal conditions specific to Miami-Dade.
3. Ingest NWS official alerts and USGS observations. Implement caching, staleness, expired-alert handling and outage states before wiring a live feed into the UI.
4. Check WeatherNext access. Until granted, keep it explicitly unavailable; do not relabel synthetic data or a fallback forecast as WeatherNext.
5. Select and document a historical storm that affected Miami-Dade, acquire archived inputs and observed outcomes, and implement reproducible replay. Split training/evaluation by event/time to avoid leakage.
6. Compare the transparent baseline with a trained model, document validation and uncertainty, then demonstrate the pipeline on IBM Z.
7. Add persistent consent, unsubscribe, deduplication and delivery infrastructure only if real notifications are in scope. The datathon proposal calls for simulated delivery.

See [architecture](docs/architecture.md), [data contract](docs/data-contract.md), and [source catalog](docs/data-sources.md).
