# Shared instructions for AI coding assistants

## Scope

- This repository is Quasar, a Miami-Dade County flood intelligence datathon project. Only county FIPS `12086` is in scope.
- Read `README.md` and relevant `docs/` before changing interfaces. The supplied proposal is context; direct user instructions control scope.
- Keep synthetic data visibly labeled. Never invent source access, official alerts, historic observations, real parcels, or model validation.
- Project estimates supplement official NWS/local guidance. Do not express a score as flood depth, flood probability, an evacuation order, or a guarantee of safety.
- The existing score is an illustrative heuristic, not trained AI. Model work must document training data, evaluation and limitations.

## Development

- Work on a feature branch; open a pull request targeting `preview`. Do not push to `main` or deploy without explicit user authorization.
- Prefer small changes within your assigned area. Coordinate changes to `docs/data-contract.md`, the API, or shared fixtures.
- Run `python3 -m unittest discover -s tests -v` and `node --check quasar/static/app.js` before proposing a merge. Add tests for changed scoring, data validation and API behavior.
- Keep the Python starter dependency-free unless a new dependency materially helps. Check `s390x` availability before adding compiled GIS/ML packages.
- Store external downloads under ignored `data/raw/` and derived artifacts under ignored `data/processed/`. Record retrieval time, license, CRS, units, source identifier and processing steps.
- External property data requires authoritative county-boundary validation; trusting a supplied FIPS tag or a bounding box is insufficient.
- Preserve unknown and stale data states. Missing inputs never mean low risk. Upstream errors never mean no active alerts.
- Notification code is simulation only. Do not collect real contact data, send messages, or add delivery credentials without explicit task authorization.
- Do not commit secrets, `.env`, real opt-ins, raw property datasets, or server credentials.
- Do not start deployments, change shared infrastructure, or access the team's IBM Z host unless asked.
