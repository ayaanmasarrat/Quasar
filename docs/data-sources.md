# Source catalog and access checklist

The proposal names these data families. Only hand-authored synthetic fixtures power the dashboard today. Links below are starting points; no dataset download, license review or access approval is implied. Official documentation links were checked when preparing the starter on October 17, 2026.

| Source | Intended use | Starter status / next action |
| --- | --- | --- |
| [Miami-Dade GIS Data Service](https://www.miamidade.gov/global/service.page?Mduid_service=ser1468850841882434) | County polygon, residential parcels, addresses, footprints | Planned: discover exact layers, inspect fields/terms, clip and join |
| [Census county identifiers](https://tigerweb.geo.census.gov/tigerwebmain/Files/acs26/tigerweb_acs26_county_fl.html) | Pilot identity | Miami-Dade FIPS `12086`; authoritative county geometry still needed |
| [NWS API documentation](https://www.weather.gov/documentation/services-web-api) | Official alerts and weather inputs | Optional point client implemented; UI feed not connected |
| [NWS alert geolocation guide](https://www.weather.gov/media/documentation/docs/NWS_Geolocation.pdf) | County/zone/polygon matching | Review before countywide ingestion; do not assume one forecast zone |
| [FEMA National Flood Hazard Layer](https://www.fema.gov/flood-maps/national-flood-hazard-layer) | Zones and available base flood elevations | Planned: verify layer versions and Miami-Dade coverage |
| [USGS 3DEP](https://www.usgs.gov/3d-elevation-program) | Terrain/elevation | Planned: select product, resolution and vertical datum |
| [USGS Water Data APIs](https://api.waterdata.usgs.gov/) | Gauge observations | Planned: select hydrologically relevant gauges, normalize units and datums |
| Google WeatherNext 3 (as named in proposal) | Forecast rainfall / storm variables | Not integrated; team must verify current product, availability, permissions, cost and data schema before choosing an access route |
| [NOAA National Centers for Environmental Information](https://www.ncei.noaa.gov/) | Historical storm/rainfall/outcome records | Planned: select a Miami-Dade event and archive inputs for replay |
| [Leaflet](https://leafletjs.com/download.html) / [OpenStreetMap tiles](https://operations.osmfoundation.org/policies/tiles/) | Browser basemap | Leaflet 1.9.4 with CDN integrity hashes and OSM attribution; external network needed |
| [IBM s390x container examples](https://github.com/IBM/ai-on-z-containers) | Deployment reference | Container supplied; actual IBM Z host test pending |

Do not commit raw parcel/address downloads or credentials. Use ignored `data/raw/` and `data/processed/`. Commit acquisition and transformation scripts plus a small reproducible, permitted sample when the team selects sources. For replay, preserve source files and checksums and distinguish observation timestamps from when data became available.
