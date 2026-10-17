"use strict";
const $ = (id) => document.getElementById(id);
const colors = { elevated: "#ee9b82", moderate: "#e6c36e", lower_relative: "#82c6c1", unknown: "#a4a8bb" };
const names = { rainfall_6h_mm: "Rainfall, six hours (mm)", elevation_m: "Terrain elevation (m)", fema_zone: "Illustrative FEMA zone", waterway_distance_m: "Waterway distance (m)", gauge_margin_m: "Margin below flood stage (m)" };
let map, mapLoaded = false, selectedId, current, mapData, requestId = 0, started = false;
const bandLabel = (band) => band.replaceAll("_", " ");

async function api(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function choose(id) {
  const feature = current.features.find((item) => item.id === id);
  if (!feature) return;
  selectedId = id;
  const property = feature.properties, risk = property.risk;
  $("detail-heading").textContent = property.label;
  const detail = $("detail");
  detail.replaceChildren(element("p", risk.score === null ? "Unknown" : `${risk.score} / 100`, "score"),
    element("p", `${bandLabel(risk.band)} · unvalidated relative estimate`, "detail-note"));
  for (const factor of risk.factors) {
    const row = element("div", undefined, "factor");
    const line = element("p");
    line.append(element("span", `${names[factor.name]}: ${factor.value}`), element("span", `+${factor.contribution.toFixed(1)}`));
    const track = element("div", undefined, "track"), fill = element("div", undefined, "fill");
    fill.style.width = `${factor.contribution / (factor.weight * 100) * 100}%`;
    track.append(fill); row.append(line, track); detail.append(row);
  }
  if (risk.missing.length) detail.append(element("p", `Missing inputs: ${risk.missing.map((key) => names[key]).join(", ")}. No score is assigned.`, "detail-note"));
  detail.append(element("p", "Factors show points contributed to the score. Weights and thresholds are illustrative.", "detail-note"));
  if (property.forecast) {
    detail.append(element("p", `WeatherNext 3: ${property.forecast.status}; ${property.forecast.available_hours}/6 hourly rainfall inputs. Rainfall: ${property.forecast.rainfall_6h_mm ?? "unavailable"} mm / 6h. Native forecast grid: ${current.forecast.native_resolution}. Other risk inputs are fictional.`, "detail-note"));
  }
  if (mapData) {
    const point = mapData.points.features.find((f) => f.id === id);
    detail.append(element("p", `H3 index: ${point.properties.h3_index} (resolution 7)`, "detail-note"));
  }
  if (risk.band === "elevated" && current.mode === "synthetic_demo") {
    const label = element("label", undefined, "consent"), consent = element("input");
    consent.type = "checkbox";
    label.append(consent, document.createTextNode(" Opt in to a simulated notification for this exercise site."));
    const button = element("button", "Preview simulated email"), result = element("p");
    result.id = "notification-result"; result.setAttribute("role", "status");
    button.onclick = async () => {
      if (!consent.checked) { result.textContent = "Select opt-in to preview a simulated notification."; return; }
      button.disabled = true;
      try {
        const data = await api("/api/notifications/preview", { method: "POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({property_ids:[id], scenario:current.scenario.id, channel:"email", opt_in:true}) });
        result.textContent = `${data.messages[0]?.text || "No elevated-score preview for this scenario."}\nSent: ${data.sent_count}`;
      } catch (error) { result.textContent = error.message; }
      finally { button.disabled = false; }
    };
    detail.append(label, button, result);
  }
}

function render(data) {
  current = data;
  $("mode-badge").textContent = data.mode === "mixed_forecast_demo" ? "MIXED DEMO" : "SYNTHETIC DEMO";
  $("data-notice").textContent = data.notice;
  if (window.h3 && window.QuasarSpatial) mapData = QuasarSpatial.aggregate(data, h3, 7);
  $("site-count").textContent = data.features.length;
  $("elevated-count").textContent = data.features.filter((f) => f.properties.risk.band === "elevated").length;
  $("unknown-count").textContent = data.features.filter((f) => f.properties.risk.band === "unknown").length;
  const time = (value) => new Date(value).toLocaleString("en-US", {timeZone:"America/New_York", month:"short", day:"numeric", hour:"numeric", timeZoneName:"short"});
  $("window").textContent = `${data.forecast ? "Forecast window" : "Exercise clock"}: ${time(data.scenario.valid_from)} – ${time(data.scenario.valid_to)}`;
  $("sites").replaceChildren();
  for (const feature of data.features) {
    const p = feature.properties, row = element("tr"), button = element("button", "Inspect");
    button.setAttribute("aria-label", `Inspect ${p.label}`);
    button.onclick = () => choose(p.id);
    const action = element("td"); action.append(button);
    row.append(element("td", p.label), element("td", p.risk.score ?? "Unknown"), element("td", bandLabel(p.risk.band)), action);
    $("sites").append(row);
  }
  updateMap();
  if (data.forecast) showWeatherStatus(data.forecast);
  choose(selectedId || data.features[0]?.id);
}

function mapColors() {
  return ["match", ["get", "risk_band"], "elevated", colors.elevated, "moderate", colors.moderate,
    "lower_relative", colors.lower_relative, colors.unknown];
}

function updateMap() {
  if (!mapLoaded || !mapData) return;
  map.getSource("sites").setData(mapData.points);
  map.getSource("hotspots").setData(mapData.cells);
}

function setupMap(settings) {
  if (!settings.configured) {
    $("map-status").textContent = "Add MAPBOX_PUBLIC_TOKEN to your local .env and restart the app to enable the map. The site list remains available.";
    $("map").replaceChildren(element("p", "Mapbox token not configured", "map-fallback"));
    return;
  }
  if (!window.mapboxgl || !window.h3 || !window.QuasarSpatial) {
    $("map-status").textContent = "Map libraries unavailable. Check your network; the site list remains available.";
    return;
  }
  try {
    $("map").replaceChildren();
    map = new mapboxgl.Map({container:"map", accessToken:settings.public_token, style:settings.style,
      center:[-80.37,25.68], zoom:9, cooperativeGestures:true});
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    // The shell animates its sidebar width without a window resize event.
    if (window.ResizeObserver) {
      new window.ResizeObserver(() => map.resize()).observe($("map"));
    }
    map.on("error", () => { $("map-status").textContent = "Mapbox could not load a resource. Check your token, URL restrictions and network. The site list remains available."; });
    map.on("load", () => {
      const empty = {type:"FeatureCollection", features:[]};
      map.addSource("hotspots", {type:"geojson", data:empty});
      map.addLayer({id:"hotspot-fill", type:"fill", source:"hotspots", paint:{"fill-color":mapColors(), "fill-opacity":0.25}});
      map.addLayer({id:"hotspot-outline", type:"line", source:"hotspots", paint:{"line-color":mapColors(), "line-width":1}});
      map.addSource("sites", {type:"geojson", data:empty});
      map.addLayer({id:"site-points", type:"circle", source:"sites", paint:{"circle-radius":8,
        "circle-color":mapColors(), "circle-stroke-color":"#ffffff", "circle-stroke-width":1}});
      map.on("click", "site-points", (event) => {
        const id = event.features[0].properties.property_id;
        choose(id);
        const point = current.features.find((f) => f.id === id);
        new mapboxgl.Popup().setLngLat(point.geometry.coordinates)
          .setDOMContent(element("div", `${point.properties.label}: ${point.properties.risk.score ?? "Unknown"} / 100 (demo)`)).addTo(map);
      });
      map.on("click", "hotspot-fill", (event) => {
        // A site click also intersects a hexagon; keep the site popup in that case.
        if (map.queryRenderedFeatures(event.point, {layers:["site-points"]}).length) return;
        const p = event.features[0].properties;
        new mapboxgl.Popup().setLngLat(event.lngLat).setDOMContent(element("div",
          `H3 ${p.h3_index}: ${p.site_count} exercise sites, ${p.unknown_count} unknown, maximum relative score ${p.max_score ?? "Unknown"}. Not a flood extent.`)).addTo(map);
      });
      for (const layer of ["site-points", "hotspot-fill"]) {
        map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
      }
      mapLoaded = true; updateMap(); toggleHex();
    });
    $("hex-toggle").onchange = toggleHex;
  } catch {
    $("map-status").textContent = "Mapbox could not initialize on this browser. The site list remains available.";
  }
}

function toggleHex() {
  if (!mapLoaded) return;
  for (const id of ["hotspot-fill", "hotspot-outline"]) map.setLayoutProperty(id, "visibility", $("hex-toggle").checked ? "visible" : "none");
}

function showWeatherStatus(data) {
  if (data.message) { $("weather-status").textContent = data.message; return; }
  $("weather-status").textContent = `${data.status.toUpperCase()} · initialized ${data.init_time} · imported ${data.retrieved_at} · ${data.native_resolution} ensemble mean. Stale or incomplete rainfall is not scored.`;
}

async function loadScenario() {
  const thisRequest = ++requestId;
  try {
    const data = await api(`/api/properties?scenario=${encodeURIComponent($("scenario").value)}`);
    if (thisRequest !== requestId) return;
    render(data); $("error").hidden = true;
  } catch (error) {
    if (thisRequest !== requestId) return;
    if (current) $("scenario").value = current.scenario.id;
    $("error").textContent = `Could not load exercise data: ${error.message}`;
    $("error").hidden = false;
  }
}

async function start() {
  if (started) return;
  started = true;
  try { setupMap((await api("/api/config")).map); }
  catch { $("map-status").textContent = "Map configuration unavailable; the site list remains available."; }
  try { showWeatherStatus(await api("/api/weather/status")); }
  catch { $("weather-status").textContent = "Forecast status unavailable. No live connection is implied."; }
  try {
    const data = await api("/api/scenarios");
    for (const scenario of data.scenarios) {
      const option = element("option", scenario.label); option.value = scenario.id; $("scenario").append(option);
    }
    $("scenario").disabled = false; $("scenario").onchange = loadScenario;
    await loadScenario();
  } catch (error) {
    $("error").textContent = `Could not initialize the exercise: ${error.message}`; $("error").hidden = false;
  }
  try { $("official-status").textContent = (await api("/api/official-alerts")).message; }
  catch { $("official-status").textContent = "Official feed status unavailable. This is not an all-clear."; }
}
// React mounts the existing map workspace before starting its data controller.
window.Quasar = { start };
if ($("scenario")) start();
else document.dispatchEvent(new Event("quasar:ready"));
