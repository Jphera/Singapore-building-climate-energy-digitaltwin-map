const CONFIG = window.SG_ENERGY_MAP_CONFIG || {};
const TOKEN_STORAGE_KEY = "sg-energy-mapbox-token";

const METRICS = {
  winter_pct: {
    label: "Winter sensitivity",
    shortLabel: "Winter",
    unit: "%",
    scale: 100,
    layer: "both",
    ramp: ["#2f6f9f", "#46b3b8", "#f4e88b", "#f2a545", "#d94835"]
  },
  summer_pct: {
    label: "Summer sensitivity",
    shortLabel: "Summer",
    unit: "%",
    scale: 100,
    layer: "both",
    ramp: ["#2f6f9f", "#46b3b8", "#f4e88b", "#f2a545", "#d94835"]
  },
  autumn_pct: {
    label: "Transition-season sensitivity",
    shortLabel: "Transition",
    unit: "%",
    scale: 100,
    layer: "both",
    ramp: ["#2f6f9f", "#46b3b8", "#f4e88b", "#f2a545", "#d94835"]
  },
  eui_2023: {
    label: "EUI 2023",
    shortLabel: "EUI 2023",
    unit: "kWh/m2",
    scale: 1,
    layer: "buildings",
    ramp: ["#275d88", "#3ba6a1", "#e6de76", "#e89142", "#bd3f32"]
  },
  energy_total_kwh: {
    label: "Building total energy",
    shortLabel: "Energy",
    unit: "kWh",
    scale: 1,
    layer: "buildings",
    ramp: ["#25476e", "#368a9a", "#b7d782", "#f0a747", "#bf4a38"]
  },
  height_m: {
    label: "Building height",
    shortLabel: "Height",
    unit: "m",
    scale: 1,
    layer: "buildings",
    ramp: ["#375a7a", "#45a6a1", "#d7d46a", "#e58d46", "#b84039"]
  }
};

const TYPE_COLORS = {
  hdb: "#5ad7c7",
  landed_property: "#9bd76b",
  private_apartment: "#5da7e8",
  office: "#f5b84b",
  retail: "#f36b5d",
  industrial: "#a57ce8",
  hotel: "#f08bc4",
  hospital: "#f07f52",
  school: "#7cc576",
  non_ihl: "#7cc576",
  sports: "#64c6e8",
  community_cultural: "#d9b45f",
  hawker_centre: "#d98d5f"
};

const state = {
  map: null,
  metadata: null,
  buildings: null,
  grid: null,
  mode: "combined",
  metric: "summer_pct",
  heightScale: 1,
  gridOpacity: 0.48,
  popup: null,
  selectedBuildingId: null,
  selectedGridId: null,
  useVectorTiles: false,
  useHostedTilesets: false,
  searchIndex: null
};

const els = {
  tokenDialog: document.getElementById("tokenDialog"),
  tokenInput: document.getElementById("tokenInput"),
  tokenSave: document.getElementById("tokenSave"),
  tokenClear: document.getElementById("tokenClear"),
  loading: document.getElementById("loading"),
  layerMode: document.getElementById("layerMode"),
  metricButtons: document.getElementById("metricButtons"),
  searchInput: document.getElementById("searchInput"),
  searchButton: document.getElementById("searchButton"),
  heightScale: document.getElementById("heightScale"),
  gridOpacity: document.getElementById("gridOpacity"),
  buildingCount: document.getElementById("buildingCount"),
  gridCount: document.getElementById("gridCount"),
  legendTitle: document.getElementById("legendTitle"),
  legendRamp: document.getElementById("legendRamp"),
  legendTicks: document.getElementById("legendTicks"),
  featureTitle: document.getElementById("featureTitle"),
  featureDetails: document.getElementById("featureDetails"),
  resetView: document.getElementById("resetView")
};

function getToken() {
  return CONFIG.mapboxAccessToken || localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

function showTokenDialog() {
  els.tokenDialog.classList.add("visible");
}

function hideTokenDialog() {
  els.tokenDialog.classList.remove("visible");
}

function formatNumber(value, unit = "", scale = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "No data";
  const scaled = numeric * scale;
  const abs = Math.abs(scaled);
  let text;
  if (abs >= 1000000) text = `${(scaled / 1000000).toFixed(2)}M`;
  else if (abs >= 10000) text = Math.round(scaled).toLocaleString();
  else if (abs >= 100) text = scaled.toLocaleString(undefined, { maximumFractionDigits: 1 });
  else if (abs >= 1) text = scaled.toLocaleString(undefined, { maximumFractionDigits: 2 });
  else text = scaled.toLocaleString(undefined, { maximumFractionDigits: 3 });
  return unit ? `${text} ${unit}` : text;
}

function compactCount(value) {
  return Number(value || 0).toLocaleString();
}

function metricStats(sourceName, metric) {
  return state.metadata?.layers?.[sourceName]?.metrics?.[metric] || null;
}

function showLoading(message) {
  els.loading.textContent = message;
  els.loading.classList.remove("hidden");
}

function hideLoading() {
  els.loading.classList.add("hidden");
}

function siteBaseUrl() {
  return new URL(".", window.location.href).href.replace(/\/$/, "");
}

function vectorTileUrl(kind) {
  return `${siteBaseUrl()}/data/mvt/${kind}/{z}/{x}/{y}.pbf`;
}

function tilesetConfig(kind) {
  return CONFIG.mapboxTilesets?.[kind] || {};
}

function hasHostedTilesets() {
  return Boolean(
    tilesetConfig("buildings").url &&
      tilesetConfig("buildings").sourceLayer &&
      tilesetConfig("grid").url &&
      tilesetConfig("grid").sourceLayer
  );
}

function sourceLayer(kind) {
  if (!state.useVectorTiles) return {};
  if (state.useHostedTilesets) {
    return { "source-layer": tilesetConfig(kind).sourceLayer };
  }
  return { "source-layer": kind === "grid" ? "grid_500m" : "buildings_sg" };
}

async function urlExists(path) {
  try {
    const response = await fetch(path, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

function metricForActiveLayer() {
  if (state.mode === "grid" && !metricStats("grid_500m", state.metric)) {
    return "summer_pct";
  }
  return state.metric;
}

function buildInterpolateExpression(sourceName, metric) {
  const def = METRICS[metric];
  const stats = metricStats(sourceName, metric);
  if (!stats || !stats.stops?.length) return "#8a949b";
  const stops = stats.stops;
  const expression = ["interpolate", ["linear"], ["to-number", ["get", metric], stops[0]]];
  stops.forEach((stop, index) => {
    expression.push(stop, def.ramp[index] || def.ramp[def.ramp.length - 1]);
  });
  return ["case", ["has", metric], expression, "rgba(150, 159, 166, 0.26)"];
}

function buildTypeExpression() {
  const expression = ["match", ["coalesce", ["get", "building_type"], "unknown"]];
  Object.entries(TYPE_COLORS).forEach(([type, color]) => expression.push(type, color));
  expression.push("#9aa0a6");
  return expression;
}

function buildingColorExpression() {
  if (state.metric === "building_type") return buildTypeExpression();
  return buildInterpolateExpression("buildings", state.metric);
}

function gridColorExpression() {
  const metric = metricForActiveLayer();
  return buildInterpolateExpression("grid_500m", metric);
}

function heightExpression() {
  return [
    "*",
    ["max", 2, ["to-number", ["coalesce", ["get", "height_m"], 4], 4]],
    state.heightScale
  ];
}

function initMetricButtons() {
  const metrics = {
    winter_pct: METRICS.winter_pct,
    summer_pct: METRICS.summer_pct,
    autumn_pct: METRICS.autumn_pct,
    eui_2023: METRICS.eui_2023,
    energy_total_kwh: METRICS.energy_total_kwh,
    height_m: METRICS.height_m,
    building_type: { label: "Building type", shortLabel: "Type", layer: "buildings" }
  };
  els.metricButtons.innerHTML = "";
  Object.entries(metrics).forEach(([key, metric]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = metric.shortLabel;
    button.dataset.metric = key;
    button.addEventListener("click", () => {
      state.metric = key;
      updateMapStyle();
      updateMetricButtons();
      updateLegend();
    });
    els.metricButtons.appendChild(button);
  });
  updateMetricButtons();
}

function updateMetricButtons() {
  [...els.metricButtons.querySelectorAll("button")].forEach((button) => {
    const metric = button.dataset.metric;
    const unavailable = state.mode === "grid" && !metricStats("grid_500m", metric);
    button.classList.toggle("active", metric === state.metric);
    button.disabled = unavailable;
  });
}

function updateLayerVisibility() {
  if (!state.map) return;
  const showBuildings = state.mode !== "grid";
  const showGrid = state.mode !== "buildings";
  const layers = {
    "grid-fill": showGrid,
    "grid-line": showGrid,
    "grid-selected": showGrid,
    "buildings-extrusion": showBuildings,
    "building-selected": showBuildings
  };
  Object.entries(layers).forEach(([layer, visible]) => {
    if (state.map.getLayer(layer)) {
      state.map.setLayoutProperty(layer, "visibility", visible ? "visible" : "none");
    }
  });
}

function updateMapStyle() {
  if (!state.map?.isStyleLoaded()) return;
  if (state.map.getLayer("buildings-extrusion")) {
    state.map.setPaintProperty("buildings-extrusion", "fill-extrusion-color", buildingColorExpression());
    state.map.setPaintProperty("buildings-extrusion", "fill-extrusion-height", heightExpression());
  }
  if (state.map.getLayer("building-selected")) {
    state.map.setPaintProperty("building-selected", "fill-extrusion-height", heightExpression());
  }
  if (state.map.getLayer("grid-fill")) {
    state.map.setPaintProperty("grid-fill", "fill-color", gridColorExpression());
    state.map.setPaintProperty("grid-fill", "fill-opacity", state.gridOpacity);
  }
  updateLayerVisibility();
}

function updateLegend() {
  if (state.metric === "building_type") {
    els.legendTitle.textContent = "Building type";
    els.legendRamp.style.background = "linear-gradient(90deg, #5ad7c7, #9bd76b, #5da7e8, #f5b84b, #f36b5d, #a57ce8)";
    els.legendTicks.innerHTML = ["HDB", "Office", "Retail", "Industrial"].map((item) => `<span>${item}</span>`).join("");
    return;
  }
  const metric = metricForActiveLayer();
  const def = METRICS[metric];
  const sourceName = state.mode === "grid" ? "grid_500m" : "buildings";
  const stats = metricStats(sourceName, metric) || metricStats("buildings", metric) || metricStats("grid_500m", metric);
  els.legendTitle.textContent = def.label;
  els.legendRamp.style.background = `linear-gradient(90deg, ${def.ramp.join(", ")})`;
  if (!stats?.stops) {
    els.legendTicks.innerHTML = "<span>No data</span>";
    return;
  }
  els.legendTicks.innerHTML = stats.stops
    .map((stop) => `<span>${formatNumber(stop, def.unit, def.scale)}</span>`)
    .join("");
}

function detailRow(label, value) {
  return `<div class="detail-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function buildingDetails(props) {
  const pctMetric = METRICS[state.metric] ? state.metric : "summer_pct";
  const rows = [
    detailRow("Object ID", props.objectid ?? "No data"),
    detailRow("Source ID", props.source_id ?? "No data"),
    detailRow("Grid ID", props.grid_id ?? "No data"),
    detailRow("Type", props.building_type ?? "No data"),
    detailRow("Height", formatNumber(props.height_m, "m")),
    detailRow("Footprint", formatNumber(props.footprint_m2, "m2")),
    detailRow("GFA", formatNumber(props.gfa_m2, "m2")),
    detailRow("EUI 2023", formatNumber(props.eui_2023, "kWh/m2")),
    detailRow("Energy", formatNumber(props.energy_total_kwh, "kWh")),
    detailRow("Winter", formatNumber(props.winter_pct, "%", 100)),
    detailRow("Summer", formatNumber(props.summer_pct, "%", 100)),
    detailRow("Transition", formatNumber(props.autumn_pct, "%", 100)),
    detailRow("Active metric", formatNumber(props[pctMetric], METRICS[pctMetric]?.unit || "", METRICS[pctMetric]?.scale || 1))
  ];
  return rows.join("");
}

function gridDetails(props) {
  return [
    detailRow("Grid ID", props.grid_id ?? "No data"),
    detailRow("Winter", formatNumber(props.winter_pct, "%", 100)),
    detailRow("Summer", formatNumber(props.summer_pct, "%", 100)),
    detailRow("Transition", formatNumber(props.autumn_pct, "%", 100)),
    detailRow("Winter energy", formatNumber(props.winter_energy_kwh, "kWh")),
    detailRow("Summer energy", formatNumber(props.summer_energy_kwh, "kWh")),
    detailRow("Transition energy", formatNumber(props.autumn_energy_kwh, "kWh"))
  ].join("");
}

function updateFeaturePanel(feature, type) {
  if (!feature) {
    els.featureTitle.textContent = "Click a building or grid cell";
    els.featureDetails.innerHTML = "<p>Use hover for quick values and click to pin detailed attributes.</p>";
    return;
  }
  if (type === "building") {
    els.featureTitle.textContent = `Building ${feature.properties.objectid}`;
    els.featureDetails.innerHTML = buildingDetails(feature.properties);
  } else {
    els.featureTitle.textContent = `500 m grid ${feature.properties.grid_id}`;
    els.featureDetails.innerHTML = gridDetails(feature.properties);
  }
}

function popupHtml(feature, type) {
  const props = feature.properties;
  const metric = metricForActiveLayer();
  const def = METRICS[metric];
  const title = type === "building" ? `Building ${props.objectid}` : `Grid ${props.grid_id}`;
  const typeLine = type === "building" ? `<div class="popup-line"><span>Type</span><strong>${props.building_type || "No data"}</strong></div>` : "";
  return `
    <p class="popup-title">${title}</p>
    ${typeLine}
    <div class="popup-line"><span>${def.label}</span><strong>${formatNumber(props[metric], def.unit, def.scale)}</strong></div>
    <div class="popup-line"><span>Height</span><strong>${formatNumber(props.height_m, "m")}</strong></div>
  `;
}

function setSelectedFeature(feature, type) {
  if (type === "building") {
    state.selectedBuildingId = Number(feature.properties.objectid);
    state.selectedGridId = null;
    state.map.setFilter("building-selected", ["==", ["get", "objectid"], state.selectedBuildingId]);
    state.map.setFilter("grid-selected", ["==", ["get", "grid_id"], -999999]);
  } else {
    state.selectedGridId = Number(feature.properties.grid_id);
    state.selectedBuildingId = null;
    state.map.setFilter("grid-selected", ["==", ["get", "grid_id"], state.selectedGridId]);
    state.map.setFilter("building-selected", ["==", ["get", "objectid"], -999999]);
  }
  updateFeaturePanel(feature, type);
}

function featureCenter(feature) {
  if (feature.properties?.lon && feature.properties?.lat) {
    return [Number(feature.properties.lon), Number(feature.properties.lat)];
  }
  const coords = [];
  const walk = (part) => {
    if (typeof part[0] === "number") coords.push(part);
    else part.forEach(walk);
  };
  walk(feature.geometry.coordinates);
  const lon = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
  const lat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
  return [lon, lat];
}

async function loadSearchIndex() {
  if (state.searchIndex) return state.searchIndex;
  showLoading("Loading search index...");
  const response = await fetch("data/search_index.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Search index request failed: ${response.status}`);
  state.searchIndex = normalizeSearchIndex(await response.json());
  hideLoading();
  return state.searchIndex;
}

function rowsToObjects(rows, fields) {
  return rows.map((row) => {
    const record = {};
    fields.forEach((field, index) => {
      record[field] = row[index];
    });
    return record;
  });
}

function normalizeSearchIndex(index) {
  if (index.buildingFields && index.gridFields) {
    return {
      buildings: rowsToObjects(index.buildings, index.buildingFields),
      grids: rowsToObjects(index.grids, index.gridFields)
    };
  }
  return index;
}

function featureFromIndex(record, type) {
  return {
    type: "Feature",
    properties: record,
    geometry: {
      type: "Point",
      coordinates: [Number(record.lon), Number(record.lat)]
    }
  };
}

async function findFeature(query) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  if (state.useVectorTiles || !state.buildings) {
    const index = await loadSearchIndex();
    const building = index.buildings.find((props) => {
      return (
        String(props.objectid).toLowerCase() === trimmed ||
        String(props.source_id || "").toLowerCase() === trimmed
      );
    });
    if (building) return { feature: featureFromIndex(building, "building"), type: "building" };
    if (Number.isFinite(numeric)) {
      const grid = index.grids.find((props) => Number(props.grid_id) === numeric);
      if (grid) return { feature: featureFromIndex(grid, "grid"), type: "grid" };
    }
    return null;
  }
  const building = state.buildings.features.find((feature) => {
    const props = feature.properties;
    return (
      String(props.objectid).toLowerCase() === trimmed ||
      String(props.source_id || "").toLowerCase() === trimmed
    );
  });
  if (building) return { feature: building, type: "building" };
  if (Number.isFinite(numeric)) {
    const grid = state.grid.features.find((feature) => Number(feature.properties.grid_id) === numeric);
    if (grid) return { feature: grid, type: "grid" };
  }
  return null;
}

async function search() {
  const result = await findFeature(els.searchInput.value);
  if (!result) {
    els.searchInput.focus();
    return;
  }
  setSelectedFeature(result.feature, result.type);
  state.map.flyTo({
    center: featureCenter(result.feature),
    zoom: result.type === "building" ? 16.4 : 13.2,
    pitch: result.type === "building" ? 62 : 48,
    duration: 900
  });
}

function addLayers() {
  if (state.useHostedTilesets) {
    state.map.addSource("grid", {
      type: "vector",
      url: tilesetConfig("grid").url,
      promoteId: { [tilesetConfig("grid").sourceLayer]: "grid_id" }
    });
    state.map.addSource("buildings", {
      type: "vector",
      url: tilesetConfig("buildings").url,
      promoteId: { [tilesetConfig("buildings").sourceLayer]: "objectid" }
    });
  } else if (state.useVectorTiles) {
    state.map.addSource("grid", {
      type: "vector",
      tiles: [vectorTileUrl("grid")],
      minzoom: 8,
      maxzoom: 15,
      promoteId: { grid_500m: "grid_id" }
    });
    state.map.addSource("buildings", {
      type: "vector",
      tiles: [vectorTileUrl("buildings")],
      minzoom: 10,
      maxzoom: 16,
      promoteId: { buildings_sg: "objectid" }
    });
  } else {
    state.map.addSource("grid", {
      type: "geojson",
      data: state.grid,
      promoteId: "grid_id"
    });
    state.map.addSource("buildings", {
      type: "geojson",
      data: state.buildings,
      promoteId: "objectid"
    });
  }

  state.map.addLayer({
    id: "grid-fill",
    type: "fill",
    source: "grid",
    ...sourceLayer("grid"),
    paint: {
      "fill-color": gridColorExpression(),
      "fill-opacity": state.gridOpacity
    }
  });
  state.map.addLayer({
    id: "grid-line",
    type: "line",
    source: "grid",
    ...sourceLayer("grid"),
    paint: {
      "line-color": "rgba(43, 55, 64, 0.24)",
      "line-width": 0.5
    }
  });
  state.map.addLayer({
    id: "grid-selected",
    type: "line",
    source: "grid",
    ...sourceLayer("grid"),
    filter: ["==", ["get", "grid_id"], -999999],
    paint: {
      "line-color": "#1a2a35",
      "line-width": 3
    }
  });
  state.map.addLayer({
    id: "buildings-extrusion",
    type: "fill-extrusion",
    source: "buildings",
    ...sourceLayer("buildings"),
    minzoom: 10,
    paint: {
      "fill-extrusion-color": buildingColorExpression(),
      "fill-extrusion-height": heightExpression(),
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.86,
      "fill-extrusion-vertical-gradient": true
    }
  });
  state.map.addLayer({
    id: "building-selected",
    type: "fill-extrusion",
    source: "buildings",
    ...sourceLayer("buildings"),
    filter: ["==", ["get", "objectid"], -999999],
    paint: {
      "fill-extrusion-color": "#111827",
      "fill-extrusion-height": heightExpression(),
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.9
    }
  });

  state.popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 12
  });

  ["buildings-extrusion", "grid-fill"].forEach((layer) => {
    state.map.on("mousemove", layer, (event) => {
      state.map.getCanvas().style.cursor = "pointer";
      const feature = event.features?.[0];
      if (!feature) return;
      const type = layer === "buildings-extrusion" ? "building" : "grid";
      state.popup.setLngLat(event.lngLat).setHTML(popupHtml(feature, type)).addTo(state.map);
    });
    state.map.on("mouseleave", layer, () => {
      state.map.getCanvas().style.cursor = "";
      state.popup.remove();
    });
    state.map.on("click", layer, (event) => {
      const feature = event.features?.[0];
      if (!feature) return;
      const type = layer === "buildings-extrusion" ? "building" : "grid";
      setSelectedFeature(feature, type);
    });
  });

  updateLayerVisibility();
}

async function loadData() {
  showLoading("Loading metadata...");
  const metadataResponse = await fetch("data/metadata.json", { cache: "no-store" });
  if (!metadataResponse.ok) throw new Error(`Metadata request failed: ${metadataResponse.status}`);
  const metadata = await metadataResponse.json();
  state.metadata = metadata;
  els.buildingCount.textContent = compactCount(metadata.layers.buildings.count);
  els.gridCount.textContent = compactCount(metadata.layers.grid_500m.count);

  state.useHostedTilesets = hasHostedTilesets();
  if (state.useHostedTilesets) {
    state.useVectorTiles = true;
    showLoading("Loading Mapbox Studio tilesets...");
    return;
  }

  const vectorTilesReady =
    CONFIG.preferVectorTiles !== false &&
    window.location.protocol !== "file:" &&
    (await urlExists("data/mvt/grid/metadata.json")) &&
    (await urlExists("data/mvt/buildings/metadata.json"));

  state.useVectorTiles = vectorTilesReady;
  if (state.useVectorTiles) {
    showLoading("Loading local vector tiles...");
    return;
  }

  showLoading("Loading 500 m grid GeoJSON...");
  const gridResponse = await fetch("data/grid_500m.geojson", { cache: "no-store" });
  if (!gridResponse.ok) throw new Error(`Grid request failed: ${gridResponse.status}`);
  state.grid = await gridResponse.json();

  showLoading("Loading building GeoJSON (about 82 MB)...");
  const buildingResponse = await fetch("data/buildings_sg.geojson", { cache: "no-store" });
  if (!buildingResponse.ok) throw new Error(`Building request failed: ${buildingResponse.status}`);
  state.buildings = await buildingResponse.json();
}

function initMap(token) {
  mapboxgl.accessToken = token;
  state.map = new mapboxgl.Map({
    container: "map",
    style: CONFIG.styleUrl || "mapbox://styles/mapbox/light-v11",
    center: [103.8198, 1.3521],
    zoom: 11.25,
    pitch: 58,
    bearing: -18,
    antialias: true
  });
  state.map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
  state.map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");

  state.map.on("load", async () => {
    try {
      await loadData();
      addLayers();
      updateLegend();
      hideLoading();
    } catch (error) {
      showLoading(`Data loading failed: ${error.message}`);
      console.error(error);
    }
  });
}

function bindEvents() {
  els.tokenSave.addEventListener("click", () => {
    const token = els.tokenInput.value.trim();
    if (!token) return;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    hideTokenDialog();
    showLoading("Starting map...");
    initMap(token);
  });
  els.tokenClear.addEventListener("click", () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    els.tokenInput.value = "";
  });
  els.layerMode.addEventListener("change", () => {
    state.mode = els.layerMode.value;
    updateMetricButtons();
    updateMapStyle();
    updateLegend();
  });
  els.searchButton.addEventListener("click", search);
  els.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") search();
  });
  els.heightScale.addEventListener("input", () => {
    state.heightScale = Number(els.heightScale.value);
    updateMapStyle();
  });
  els.gridOpacity.addEventListener("input", () => {
    state.gridOpacity = Number(els.gridOpacity.value);
    updateMapStyle();
  });
  els.resetView.addEventListener("click", () => {
    state.selectedBuildingId = null;
    state.selectedGridId = null;
    if (state.map?.getLayer("building-selected")) {
      state.map.setFilter("building-selected", ["==", ["get", "objectid"], -999999]);
      state.map.setFilter("grid-selected", ["==", ["get", "grid_id"], -999999]);
    }
    updateFeaturePanel(null);
    state.map?.flyTo({ center: [103.8198, 1.3521], zoom: 11.25, pitch: 58, bearing: -18, duration: 900 });
  });
}

function boot() {
  bindEvents();
  initMetricButtons();
  if (window.location.protocol === "file:") {
    showLoading("Open this project from http://127.0.0.1:8765/ instead of double-clicking index.html.");
    return;
  }
  const token = getToken();
  if (!token) {
    showTokenDialog();
    hideLoading();
    return;
  }
  showLoading("Starting map...");
  initMap(token);
}

boot();
