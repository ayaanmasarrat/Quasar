# Quasar

Miami-Dade County flood risk intelligence starter for the IBM Z Datathon.

Quasar follows the team's Flood Emergency Alert System proposal, narrowed to **Miami-Dade County, Florida (FIPS `12086`)**. It gives the team a working path from a property-like record to an explainable score, a map, and a simulated notification.

## Run locally

Install Python 3.11 or later. From this repository's root:

```sh
python3 -m quasar
```

Open <http://127.0.0.1:8000>. The Python backend has no third-party runtime dependencies. Add your Mapbox public token to enable the map. The site list, H3 indexing, score details and synthetic notification previews work without map credentials. Mapbox's SDK and basemap require internet access. The server is a local demo server, not a production hosting stack.

```sh
cp .env.example .env  # only if you do not already have .env
```

Edit `.env` and set `MAPBOX_PUBLIC_TOKEN=pk.your_public_token`. The app reads `.env` at startup; restart after editing. Existing environment variables take precedence. Use a public browser token with the appropriate Mapbox URL restrictions for your local/demo origin. Secret `sk.` tokens are rejected. `.env` is ignored by Git. An optional `MAPBOX_STYLE` accepts a `mapbox://styles/...` URL.

WeatherNext 3 BigQuery access is confirmed by the project owner. The importer and app integration are implemented; the team's actual project, linked table, account and data have not yet been connected or verified. Follow [integration setup](docs/integrations.md).

```sh
python3 -m unittest discover -s tests -v
npm ci --ignore-scripts
npm run check
npm test
```

## What works today

- Six **fictional** Miami-Dade exercise sites, including one with missing terrain data.
- Three deterministic exercise windows with changing synthetic rainfall and gauge conditions.
- A Mapbox GL JS map, prioritized site list, factor contributions, and explicit unknown scores.
- H3 resolution-7 hotspot summaries of occupied exercise sites, with counts, unknown counts and maximum relative score. Hexagons are not flood extents or sharper weather predictions.
- A WeatherNext 3 BigQuery importer for the native 0.1-degree ensemble-mean hourly precipitation product, with six-hour aggregation, provenance, missing-data and staleness checks.
- Opt-in SMS/email **previews** for elevated scores. Nothing is sent or stored, and no contact details are collected.
- A JSON/GeoJSON API and a separately callable NWS point-alert client.
- Automated tests, GitHub Actions, and a portable container starter.

**This is a baseplate, not a validated flood model.** It has no live parcels, building footprints, FEMA joins, elevation raster processing, trained AI, historical storm replay, real subscriptions, or real delivery. WeatherNext rainfall can be imported for the six fictional site coordinates; when selected, the UI says **MIXED DEMO** because terrain, FEMA and gauge inputs remain invented. Forecasts never validate those property inputs. The dashboard's official-alert panel deliberately says the feed is not connected.

## Demo walkthrough

1. Start at Exercise hour 0 and inspect a site.
2. Switch to hours 6 and 12. The synthetic weather factors change the scores.
3. Inspect the missing-terrain site: it remains unknown rather than receiving a low score.
4. At hour 12, inspect an elevated site, select the simulation opt-in checkbox, and preview an email. The API reports `sent_count: 0`.
5. Explain that the next milestone replaces fixture inputs with timestamped source data and validates the model against a documented Miami-Dade storm.

The exercise dates are a fixed fictional clock, not today's weather or an actual hurricane. All site labels, FEMA zones, elevations, and other attributes are invented.

After importing a valid WeatherNext snapshot and setting `QUASAR_WEATHERNEXT_FILE` in `.env`, restart and choose **WeatherNext 3 + fictional site inputs** in the time-window selector. The UI shows initialization/import timestamps and forecast status. Stale or incomplete rainfall yields unknown scores; it never silently falls back to synthetic rain in that mode. Notification previews remain limited to the synthetic exercise scenarios.

## API

| Method | Path | Result |
| --- | --- | --- |
| GET | `/health` | Server status, county, demo mode |
| GET | `/api/config` | Fixed pilot scope and notices |
| GET | `/api/scenarios` | Three synthetic windows |
| GET | `/api/properties?scenario=peak` | Scored GeoJSON points |
| GET | `/api/properties?scenario=weathernext` | Imported forecast + fictional property inputs, when a valid snapshot is configured |
| GET | `/api/weather/status` | Explicit not-configured, ready, incomplete, stale or invalid snapshot status |
| GET | `/api/official-alerts` | Explicit `not_connected` status |
| POST | `/api/notifications/preview` | Simulation only; no delivery |

Example preview body:

```json
{"property_ids":["demo-001"],"scenario":"peak","channel":"sms","opt_in":true}
```

Other county FIPS values are rejected. `scenario` accepts `baseline`, `heavy-rain`, `peak`, or `weathernext` when a valid snapshot is configured. Unknown sites and scenarios return errors. No cloud query is triggered by loading the dashboard.

## Team work areas

| Area | Start here | First useful contribution |
| --- | --- | --- |
| Data / GIS | `quasar/pipeline.py`, `docs/data-contract.md` | County boundary, parcels and building joins; provenance |
| Modeling / AI | `quasar/scoring.py` | Validated features, baseline evaluation, then trained model |
| Frontend | `quasar/static/` | Mapbox layers, H3 summaries, real parcel polygons |
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
docker run --rm --env-file .env -p 127.0.0.1:8000:8000 quasar:demo
```

Build natively on IBM Z, or use a configured cross-builder:

```sh
docker buildx build --platform linux/s390x -t quasar:demo --load .
```

The container runs as a non-root user. The base image tag, container runtime, outbound network access and `s390x` build must be verified on the provided server; CI's container build alone checks x86 Linux. Browser map and H3 rendering stay on the laptop; no compiled H3 Python package is needed on IBM Z. For WeatherNext in a container, mount the normalized snapshot read-only at the configured container path and ensure UID 10001 can read it; do not bake Google credentials into the image. The import can run on a laptop or Cloud Shell, then transfer only its snapshot to IBM Z. There is no cloud deployment in this starter.

## Next milestones

1. Acquire an authoritative Miami-Dade county polygon and clip residential parcels/building footprints. Enforce real geometry membership before accepting external data.
2. Add FEMA NFHL and USGS 3DEP features with CRS, vertical datum, missing-data flags, and source timestamps. Evaluate coastal/tidal and canal conditions specific to Miami-Dade.
3. Ingest NWS official alerts and USGS observations. Implement caching, staleness, expired-alert handling and outage states before wiring a live feed into the UI.
4. Configure the owner's existing WeatherNext BigQuery access, dry-run the generated query against the actual linked schema, and import a current forecast window. Extend coverage to real county-filtered assets after the GIS work.
5. Select and document a historical storm that affected Miami-Dade, acquire archived inputs and observed outcomes, and implement reproducible replay. Split training/evaluation by event/time to avoid leakage.
6. Compare the transparent baseline with a trained model, document validation and uncertainty, then demonstrate the pipeline on IBM Z.
7. Add persistent consent, unsubscribe, deduplication and delivery infrastructure only if real notifications are in scope. The datathon proposal calls for simulated delivery.

See [architecture](docs/architecture.md), [data contract](docs/data-contract.md), and [source catalog](docs/data-sources.md).
