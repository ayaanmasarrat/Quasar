# Source catalog and access checklist

The proposal names these data families. Synthetic fixtures power the default exercise. WeatherNext 3 BigQuery access is confirmed by the owner; its importer is implemented and awaits actual connection details/live verification. Other dataset downloads and license reviews remain pending. Official integration documentation was checked on October 17, 2026.

| Source | Intended use | Starter status / next action |
| --- | --- | --- |
| [Miami-Dade GIS Data Service](https://www.miamidade.gov/global/service.page?Mduid_service=ser1468850841882434) | County polygon, residential parcels, addresses, footprints | Planned: discover exact layers, inspect fields/terms, clip and join |
| [Census county identifiers](https://tigerweb.geo.census.gov/tigerwebmain/Files/acs26/tigerweb_acs26_county_fl.html) | Pilot identity | Miami-Dade FIPS `12086`; authoritative county geometry still needed |
| [NWS API documentation](https://www.weather.gov/documentation/services-web-api) | Official alerts and weather inputs | Optional point client implemented; UI feed not connected |
| [NWS alert geolocation guide](https://www.weather.gov/media/documentation/docs/NWS_Geolocation.pdf) | County/zone/polygon matching | Review before countywide ingestion; do not assume one forecast zone |
| [FEMA National Flood Hazard Layer](https://www.fema.gov/flood-maps/national-flood-hazard-layer) | Zones and available base flood elevations | Planned: verify layer versions and Miami-Dade coverage |
| [USGS 3DEP](https://www.usgs.gov/3d-elevation-program) | Terrain/elevation | Planned: select product, resolution and vertical datum |
| [USGS Water Data APIs](https://api.waterdata.usgs.gov/) | Gauge observations | Planned: select hydrologically relevant gauges, normalize units and datums |
| [Google WeatherNext 3 BigQuery](https://developers.google.com/weathernext/guides/bigquery) | Forecast rainfall | Implemented: point join to 0.1-degree grid, hourly mean meters -> mm, six-hour aggregation; actual linked table/account verification pending |
| [NOAA National Centers for Environmental Information](https://www.ncei.noaa.gov/) | Historical storm/rainfall/outcome records | Planned: select a Miami-Dade event and archive inputs for replay |
| [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides/get-started/) | Browser basemap and data layers | Replaces Leaflet; SDK 3.33.0, local public token, Mapbox-hosted style |
| [H3 JavaScript](https://github.com/uber/h3-js) | Site indexing and hotspot summaries | Bundled 4.3.0 with license/notice; resolution 7; no claim of finer forecast resolution |
| [IBM s390x container examples](https://github.com/IBM/ai-on-z-containers) | Deployment reference | Container supplied; actual IBM Z host test pending |

Do not commit raw parcel/address downloads or credentials. Use ignored `data/raw/` and `data/processed/`. Commit acquisition and transformation scripts plus a small reproducible, permitted sample when the team selects sources. For replay, preserve source files and checksums and distinguish observation timestamps from when data became available.
