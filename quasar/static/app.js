"use strict";
const $ = (id) => document.getElementById(id);
const colors = { elevated: "#ee9b82", moderate: "#e6c36e", lower_relative: "#82c6c1", unknown: "#a4a8bb" };
const names = { rainfall_6h_mm: "Rainfall, six hours (mm)", elevation_m: "Terrain elevation (m)", fema_zone: "Illustrative FEMA zone", waterway_distance_m: "Waterway distance (m)", gauge_margin_m: "Margin below flood stage (m)" };
let map, markers, selectedId, current, requestId = 0;
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
  if (risk.band === "elevated") {
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
  $("site-count").textContent = data.features.length;
  $("elevated-count").textContent = data.features.filter((f) => f.properties.risk.band === "elevated").length;
  $("unknown-count").textContent = data.features.filter((f) => f.properties.risk.band === "unknown").length;
  const time = (value) => new Date(value).toLocaleString("en-US", {timeZone:"America/New_York", month:"short", day:"numeric", hour:"numeric", timeZoneName:"short"});
  $("window").textContent = `Exercise clock: ${time(data.scenario.valid_from)} – ${time(data.scenario.valid_to)}`;
  $("sites").replaceChildren();
  if (markers) markers.clearLayers();
  for (const feature of data.features) {
    const p = feature.properties, row = element("tr"), button = element("button", "Inspect");
    button.setAttribute("aria-label", `Inspect ${p.label}`);
    button.onclick = () => choose(p.id);
    const action = element("td"); action.append(button);
    row.append(element("td", p.label), element("td", p.risk.score ?? "Unknown"), element("td", bandLabel(p.risk.band)), action);
    $("sites").append(row);
    if (markers) {
      const [lon, lat] = feature.geometry.coordinates;
      const popup = element("div", `${p.label}: ${p.risk.score ?? "Unknown"} (synthetic)`);
      L.circleMarker([lat,lon], {radius:9, color:colors[p.risk.band], fillColor:colors[p.risk.band], fillOpacity:.85, weight:2})
        .addTo(markers).bindPopup(popup).on("click", () => choose(p.id));
    }
  }
  choose(selectedId || data.features[0]?.id);
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
  // The table and all core features work when the CDN or map tiles are unavailable.
  if (window.L) {
    $("map").replaceChildren();
    map = L.map("map").setView([25.68,-80.37],10);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:18, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
    markers = L.layerGroup().addTo(map);
  }
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
start();
