const CONFIG = window.SG_ENERGY_MAP_CONFIG || {};
const TOKEN_STORAGE_KEY = "sg-energy-mapbox-token";

const PERIODS = {
  hot: { label: "Relative hot (May)", shortLabel: "Hot" },
  cold: { label: "Relative cold (Dec)", shortLabel: "Cold" },
  transition: { label: "Transition (Oct)", shortLabel: "Transition" }
};

const WEATHER_VARIABLES = {
  temp: { label: "2 m temperature", shortLabel: "Temperature", unit: "degC", suffix: "c" },
  wind: { label: "10 m wind speed", shortLabel: "Wind", unit: "m/s", suffix: "ms" },
  rh: { label: "Relative humidity", shortLabel: "RH", unit: "%", suffix: "pct" },
  solar: { label: "Solar shortwave radiation", shortLabel: "Solar", unit: "W/m2", suffix: "wm2" }
};

const METRICS = {
  building_type: {
    label: "Building type",
    shortLabel: "Type",
    category: "building",
    kind: "categorical",
    layer: "buildings"
  },
  height_m: {
    label: "Building height",
    shortLabel: "Height",
    category: "building",
    unit: "m",
    layer: "buildings",
    fieldByLayer: { buildings: "height_m", building_overview_500m: "mean_height_m" },
    ramp: ["#d7eef7", "#8fd0df", "#43a6bd", "#23748d", "#123d55"]
  },
  weather_temp: {
    label: WEATHER_VARIABLES.temp.label,
    shortLabel: WEATHER_VARIABLES.temp.shortLabel,
    category: "weather",
    unit: WEATHER_VARIABLES.temp.unit,
    variable: "temp",
    ramp: ["#2468a8", "#4fb6c2", "#f3de75", "#f59d3d", "#d94335"]
  },
  weather_wind: {
    label: WEATHER_VARIABLES.wind.label,
    shortLabel: WEATHER_VARIABLES.wind.shortLabel,
    category: "weather",
    unit: WEATHER_VARIABLES.wind.unit,
    variable: "wind",
    ramp: ["#eef6ff", "#b9ddf2", "#6fb7d5", "#2c83aa", "#0d4566"]
  },
  weather_rh: {
    label: WEATHER_VARIABLES.rh.label,
    shortLabel: WEATHER_VARIABLES.rh.shortLabel,
    category: "weather",
    unit: WEATHER_VARIABLES.rh.unit,
    variable: "rh",
    ramp: ["#f5eee3", "#d8deb6", "#9bc68e", "#4aa477", "#126d67"]
  },
  weather_solar: {
    label: WEATHER_VARIABLES.solar.label,
    shortLabel: WEATHER_VARIABLES.solar.shortLabel,
    category: "weather",
    unit: WEATHER_VARIABLES.solar.unit,
    variable: "solar",
    ramp: ["#eef3f7", "#f6de8a", "#f6ae45", "#e66732", "#a8232d"]
  },
  energy_cold: {
    label: "Energy use - Relative cold (Dec)",
    shortLabel: "Relative cold (Dec)",
    category: "energy",
    unit: "kWh",
    fieldByLayer: { buildings: "energy_total_kwh", grid_500m: "winter_energy_kwh" },
    ramp: ["#e5f3fb", "#9bcfe5", "#53a8c9", "#287da5", "#12496e"]
  },
  energy_hot: {
    label: "Energy use - Relative hot (May)",
    shortLabel: "Relative hot (May)",
    category: "energy",
    unit: "kWh",
    fieldByLayer: { buildings: "energy_total_kwh", grid_500m: "summer_energy_kwh" },
    ramp: ["#fff3c7", "#f8c766", "#ed8f3a", "#d9572e", "#8f241f"]
  },
  energy_transition: {
    label: "Energy use - Transition (Oct)",
    shortLabel: "Transition (Oct)",
    category: "energy",
    unit: "kWh",
    fieldByLayer: { buildings: "energy_total_kwh", grid_500m: "autumn_energy_kwh" },
    ramp: ["#eef5dc", "#b7d88a", "#72b56e", "#2f8d66", "#11615a"]
  },
  energy_microclimate: {
    label: "Energy use with microclimate",
    shortLabel: "With microclimate",
    category: "energy",
    unit: "kWh",
    fieldByLayer: { buildings: "energy_total_kwh", grid_500m: "summer_energy_kwh" },
    ramp: ["#f2effa", "#c5b6e6", "#9275ca", "#6845a8", "#3d2477"]
  },
  eui_2023: {
    label: "Measured energy use (EUI 2023)",
    shortLabel: "Measured EUI",
    category: "energy",
    unit: "kWh/m2",
    fieldByLayer: { buildings: "eui_2023", building_overview_500m: "mean_eui_2023" },
    ramp: ["#f2f5f7", "#bdd7d8", "#74b5b0", "#2c8a82", "#075d59"]
  }
};

const BUILDING_TYPE_GROUPS = {
  public_service: {
    label: "Public service",
    share: "11.6%",
    color: "#2563eb",
    types: ["industrial", "hospital", "clinic", "nursing_home"]
  },
  commercial: {
    label: "Commercial",
    share: "5.4%",
    color: "#ea580c",
    types: ["retail", "mixed_development", "business_park", "shophouse", "hawker_centre"]
  },
  education: {
    label: "Education",
    share: "2.2%",
    color: "#7c3aed",
    types: ["ihl", "non_ihl"]
  },
  residential: {
    label: "Residential",
    share: "77.4%",
    color: "#059669",
    types: ["private_apartment", "hdb", "landed_property", "hotel"]
  },
  office_amenity: {
    label: "Office and amenities",
    share: "3.4%",
    color: "#0891b2",
    types: ["office", "community_cultural", "data_centre", "sports", "restaurant", "supermarket"]
  }
};

const TYPE_LABELS = {
  business_park: "Business park",
  clinic: "Clinic",
  community_cultural: "Community cultural",
  data_centre: "Data center",
  hawker_centre: "Hawker centre",
  hdb: "HDB",
  hospital: "Hospital",
  hotel: "Hotel",
  ihl: "Institutes of higher learning",
  industrial: "Industrial",
  landed_property: "Landed property",
  mixed_development: "Mixed development",
  non_ihl: "Non-institutes of higher learning",
  nursing_home: "Nursing home",
  office: "Office",
  private_apartment: "Private apartment",
  restaurant: "Restaurant",
  retail: "Retail",
  shophouse: "Shophouse",
  sports: "Sports",
  supermarket: "Supermarket"
};

const TYPE_COLORS = {
  industrial: "#2563eb",
  hospital: "#4f83f1",
  clinic: "#7ba4f5",
  nursing_home: "#a6c4fb",
  retail: "#ea580c",
  mixed_development: "#f07b2f",
  business_park: "#f59d55",
  shophouse: "#f8b879",
  hawker_centre: "#c94808",
  ihl: "#7c3aed",
  non_ihl: "#a78bfa",
  private_apartment: "#047857",
  hdb: "#10b981",
  landed_property: "#65c889",
  hotel: "#98d8aa",
  office: "#0891b2",
  community_cultural: "#2bb4c7",
  data_centre: "#0e7490",
  sports: "#67d6e2",
  restaurant: "#7dd3fc",
  supermarket: "#bae6fd"
};

const state = {
  map: null,
  metadata: null,
  buildings: null,
  grid: null,
  mode: "combined",
  metric: "energy_hot",
  period: "hot",
  heightScale: 1,
  gridOpacity: 0.54,
  popup: null,
  selectedBuildingId: null,
  selectedGridId: null,
  useVectorTiles: false,
  useHostedTilesets: false,
  sourceLayers: {},
  sourceTypes: {},
  searchIndex: null,
  fallbackSources: {
    weather: false,
    buildingOverview: false
  }
};

const els = {
  tokenDialog: document.getElementById("tokenDialog"),
  tokenInput: document.getElementById("tokenInput"),
  tokenSave: document.getElementById("tokenSave"),
  tokenClear: document.getElementById("tokenClear"),
  loading: document.getElementById("loading"),
  layerMode: document.getElementById("layerMode"),
  buildingMetricButtons: document.getElementById("buildingMetricButtons"),
  weatherButtons: document.getElementById("weatherButtons"),
  energyButtons: document.getElementById("energyButtons"),
  periodButtons: document.getElementById("periodButtons"),
  searchInput: document.getElementById("searchInput"),
  searchButton: document.getElementById("searchButton"),
  heightScale: document.getElementById("heightScale"),
  gridOpacity: document.getElementById("gridOpacity"),
  buildingCount: document.getElementById("buildingCount"),
  gridCount: document.getElementById("gridCount"),
  legendTitle: document.getElementById("legendTitle"),
  legendRamp: document.getElementById("legendRamp"),
  legendTicks: document.getElementById("legendTicks"),
  typeLegend: document.getElementById("typeLegend"),
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

function metricDefinition(metric = state.metric) {
  return METRICS[metric] || METRICS.energy_hot;
}

function weatherField(metric = state.metric, period = state.period) {
  const def = metricDefinition(metric);
  const weather = WEATHER_VARIABLES[def.variable];
  return `${def.variable}_${period}_${weather.suffix}`;
}

function fieldForLayer(layerName, metric = state.metric) {
  const def = metricDefinition(metric);
  if (def.category === "weather") return layerName === "weather_500m" ? weatherField(metric, state.period) : null;
  if (def.kind === "categorical") return layerName === "buildings" ? "building_type" : null;
  return def.fieldByLayer?.[layerName] || null;
}

function statsLayerForMetric(metric = state.metric) {
  const def = metricDefinition(metric);
  if (def.category === "weather") return "weather_500m";
  if (state.mode !== "buildings" && def.fieldByLayer?.grid_500m) return "grid_500m";
  if (state.mode !== "grid" && def.fieldByLayer?.buildings) return "buildings";
  return "grid_500m";
}

function metricStats(layerName, metric = state.metric) {
  const field = fieldForLayer(layerName, metric);
  return state.metadata?.layers?.[layerName]?.metrics?.[field] || null;
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

function hasTileset(kind) {
  return Boolean(tilesetConfig(kind).url);
}

function hasCoreHostedTilesets() {
  return Boolean(tilesetConfig("buildings").url && tilesetConfig("grid").url);
}

function sourceLayer(kind) {
  if (state.sourceTypes[kind] !== "vector") return {};
  return { "source-layer": state.sourceLayers[kind] };
}

function tilesetId(url) {
  return url?.startsWith("mapbox://") ? url.replace("mapbox://", "") : "";
}

async function resolveTilesetSourceLayer(kind) {
  const config = tilesetConfig(kind);
  if (!config.url) return null;
  if (config.sourceLayer) return config.sourceLayer;
  const id = tilesetId(config.url);
  if (!id) return null;
  const response = await fetch(
    `https://api.mapbox.com/v4/${id}.json?secure&access_token=${encodeURIComponent(mapboxgl.accessToken)}`,
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error(`Tileset metadata failed for ${kind}: ${response.status}`);
  const tilejson = await response.json();
  return tilejson.vector_layers?.[0]?.id || null;
}

async function resolveHostedSourceLayers() {
  const kinds = ["buildings", "grid", "weather", "buildingOverview"].filter(hasTileset);
  for (const kind of kinds) {
    const sourceLayerId = await resolveTilesetSourceLayer(kind);
    if (!sourceLayerId) throw new Error(`Could not resolve source layer for ${kind}`);
    state.sourceLayers[kind] = sourceLayerId;
  }
}

async function urlExists(path) {
  try {
    const response = await fetch(path, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

function buildInterpolateExpression(layerName, metric, fallbackColor = "rgba(144, 154, 162, 0.28)") {
  const def = metricDefinition(metric);
  const field = fieldForLayer(layerName, metric);
  const stats = metricStats(layerName, metric);
  if (!field || !stats || !stats.stops?.length) return fallbackColor;
  const stops = stats.stops;
  const expression = ["interpolate", ["linear"], ["to-number", ["get", field], stops[0]]];
  stops.forEach((stop, index) => {
    expression.push(stop, def.ramp[index] || def.ramp[def.ramp.length - 1]);
  });
  return ["case", ["has", field], expression, fallbackColor];
}

function buildTypeExpression() {
  const expression = ["match", ["coalesce", ["get", "building_type"], "unknown"]];
  Object.entries(TYPE_COLORS).forEach(([type, color]) => expression.push(type, color));
  expression.push("#aab3bb");
  return expression;
}

function buildArchetypeExpression() {
  const expression = ["match", ["coalesce", ["get", "dominant_archetype"], "unknown"]];
  Object.entries(BUILDING_TYPE_GROUPS).forEach(([group, def]) => expression.push(group, def.color));
  expression.push("none", "rgba(170, 179, 187, 0.08)", "rgba(170, 179, 187, 0.18)");
  return expression;
}

function buildingColorExpression() {
  if (state.metric === "building_type") return buildTypeExpression();
  if (metricDefinition().category === "weather") return "rgba(65, 79, 92, 0.42)";
  return buildInterpolateExpression("buildings", state.metric, "rgba(94, 110, 124, 0.36)");
}

function gridColorExpression() {
  return buildInterpolateExpression("grid_500m", state.metric, "rgba(86, 112, 130, 0.18)");
}

function weatherColorExpression() {
  return buildInterpolateExpression("weather_500m", state.metric, "rgba(92, 122, 145, 0.18)");
}

function overviewColorExpression() {
  if (state.metric === "height_m" || state.metric === "eui_2023") {
    return buildInterpolateExpression("building_overview_500m", state.metric, "rgba(115, 133, 148, 0.18)");
  }
  return buildArchetypeExpression();
}

function heightExpression() {
  return [
    "*",
    ["max", 2, ["to-number", ["coalesce", ["get", "height_m"], 4], 4]],
    state.heightScale
  ];
}

function createMetricButton(container, key) {
  const def = METRICS[key];
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = def.shortLabel;
  button.dataset.metric = key;
  button.addEventListener("click", () => {
    state.metric = key;
    if (def.category === "weather" && state.mode === "buildings") {
      state.mode = "combined";
      els.layerMode.value = "combined";
    }
    updateMapStyle();
    updateMetricButtons();
    updateLegend();
  });
  container.appendChild(button);
}

function initMetricButtons() {
  [
    [els.buildingMetricButtons, ["building_type", "height_m"]],
    [els.weatherButtons, ["weather_wind", "weather_temp", "weather_rh", "weather_solar"]],
    [
      els.energyButtons,
      ["energy_cold", "energy_hot", "energy_transition", "energy_microclimate", "eui_2023"]
    ]
  ].forEach(([container, keys]) => {
    container.innerHTML = "";
    keys.forEach((key) => createMetricButton(container, key));
  });

  els.periodButtons.innerHTML = "";
  Object.entries(PERIODS).forEach(([key, period]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = period.shortLabel;
    button.dataset.period = key;
    button.addEventListener("click", () => {
      state.period = key;
      updateMapStyle();
      updateMetricButtons();
      updateLegend();
    });
    els.periodButtons.appendChild(button);
  });
  updateMetricButtons();
}

function updateMetricButtons() {
  const buttons = [
    ...els.buildingMetricButtons.querySelectorAll("button"),
    ...els.weatherButtons.querySelectorAll("button"),
    ...els.energyButtons.querySelectorAll("button")
  ];
  buttons.forEach((button) => {
    const metric = button.dataset.metric;
    const def = metricDefinition(metric);
    const unavailable = state.mode === "grid" && def.category !== "weather" && !fieldForLayer("grid_500m", metric);
    button.classList.toggle("active", metric === state.metric);
    button.disabled = unavailable;
  });
  [...els.periodButtons.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("active", button.dataset.period === state.period);
  });
  els.periodButtons.closest(".control-block").classList.toggle(
    "hidden-block",
    metricDefinition().category !== "weather"
  );
}

function setVisibility(layer, visible) {
  if (state.map.getLayer(layer)) {
    state.map.setLayoutProperty(layer, "visibility", visible ? "visible" : "none");
  }
}

function updateLayerVisibility() {
  if (!state.map) return;
  const metric = metricDefinition();
  const showBuildings = state.mode !== "grid";
  const showGrid = state.mode !== "buildings";
  const showWeather = metric.category === "weather" && showGrid;
  const showGridFill = showGrid && !showWeather && Boolean(fieldForLayer("grid_500m", state.metric));
  setVisibility("weather-fill", showWeather);
  setVisibility("grid-fill", showGridFill);
  setVisibility("grid-line", showGrid || showWeather);
  setVisibility("grid-selected", showGrid || showWeather);
  setVisibility("building-overview-fill", showBuildings);
  setVisibility("building-overview-line", showBuildings);
  setVisibility("buildings-extrusion", showBuildings);
  setVisibility("building-selected", showBuildings);
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
  if (state.map.getLayer("weather-fill")) {
    state.map.setPaintProperty("weather-fill", "fill-color", weatherColorExpression());
    state.map.setPaintProperty("weather-fill", "fill-opacity", Math.min(0.72, state.gridOpacity + 0.08));
  }
  if (state.map.getLayer("building-overview-fill")) {
    state.map.setPaintProperty("building-overview-fill", "fill-color", overviewColorExpression());
  }
  updateLayerVisibility();
}

function renderTypeLegend() {
  const groups = state.metadata?.building_type_groups || BUILDING_TYPE_GROUPS;
  const counts = state.metadata?.layers?.buildings?.building_type_counts || {};
  els.typeLegend.innerHTML = Object.entries(groups)
    .map(([groupId, group]) => {
      const typeRows = group.types
        .filter((type) => counts[type] || TYPE_COLORS[type])
        .map((type) => {
          const count = counts[type] ? compactCount(counts[type]) : "--";
          return `
            <button class="type-swatch-row" type="button" data-type="${type}">
              <span class="swatch" style="background:${TYPE_COLORS[type] || group.color}"></span>
              <span>${TYPE_LABELS[type] || type}</span>
              <strong>${count}</strong>
            </button>
          `;
        })
        .join("");
      return `
        <div class="type-group">
          <div class="type-group-head">
            <span class="swatch large" style="background:${group.color}"></span>
            <strong>${group.label}</strong>
            <em>${group.share || ""}</em>
          </div>
          <div class="type-group-list">${typeRows}</div>
        </div>
      `;
    })
    .join("");
}

function updateLegend() {
  updateMetricButtons();
  if (state.metric === "building_type") {
    els.legendTitle.textContent = "Building archetypes";
    els.legendRamp.classList.add("hidden");
    els.legendTicks.classList.add("hidden");
    els.typeLegend.classList.remove("hidden");
    renderTypeLegend();
    return;
  }
  els.legendRamp.classList.remove("hidden");
  els.legendTicks.classList.remove("hidden");
  els.typeLegend.classList.add("hidden");
  const def = metricDefinition();
  const statsLayer = statsLayerForMetric(state.metric);
  const stats = metricStats(statsLayer, state.metric);
  const periodLabel = def.category === "weather" ? ` - ${PERIODS[state.period].label}` : "";
  els.legendTitle.textContent = `${def.label}${periodLabel}`;
  els.legendRamp.style.background = `linear-gradient(90deg, ${def.ramp.join(", ")})`;
  if (!stats?.stops) {
    els.legendTicks.innerHTML = "<span>No data</span>";
    return;
  }
  els.legendTicks.innerHTML = stats.stops.map((stop) => `<span>${formatNumber(stop, def.unit)}</span>`).join("");
}

function detailRow(label, value) {
  return `<div class="detail-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function buildingTypeGroup(type) {
  return Object.entries(BUILDING_TYPE_GROUPS).find(([, group]) => group.types.includes(type))?.[1]?.label || "Unknown";
}

function buildingDetails(props) {
  const metricField = fieldForLayer("buildings", state.metric);
  const metric = metricDefinition();
  return [
    detailRow("Object ID", props.objectid ?? "No data"),
    detailRow("Source ID", props.source_id ?? "No data"),
    detailRow("Grid ID", props.grid_id ?? "No data"),
    detailRow("Archetype", buildingTypeGroup(props.building_type)),
    detailRow("Subtype", TYPE_LABELS[props.building_type] || props.building_type || "No data"),
    detailRow("Height", formatNumber(props.height_m, "m")),
    detailRow("Footprint", formatNumber(props.footprint_m2, "m2")),
    detailRow("GFA", formatNumber(props.gfa_m2, "m2")),
    detailRow("Measured EUI", formatNumber(props.eui_2023, "kWh/m2")),
    detailRow("Energy use", formatNumber(props.energy_total_kwh, "kWh")),
    detailRow("Relative cold sensitivity", formatNumber(props.winter_pct, "%", 100)),
    detailRow("Relative hot sensitivity", formatNumber(props.summer_pct, "%", 100)),
    detailRow("Transition sensitivity", formatNumber(props.autumn_pct, "%", 100)),
    detailRow("Active metric", metric.kind === "categorical" ? TYPE_LABELS[props.building_type] || props.building_type : formatNumber(props[metricField], metric.unit))
  ].join("");
}

function gridDetails(props) {
  const metric = metricDefinition();
  const metricField = metric.category === "weather" ? weatherField() : fieldForLayer("grid_500m", state.metric);
  const rows = [
    detailRow("Grid ID", props.grid_id ?? "No data"),
    detailRow("Relative cold energy", formatNumber(props.winter_energy_kwh, "kWh")),
    detailRow("Relative hot energy", formatNumber(props.summer_energy_kwh, "kWh")),
    detailRow("Transition energy", formatNumber(props.autumn_energy_kwh, "kWh")),
    detailRow("Relative cold sensitivity", formatNumber(props.winter_pct, "%", 100)),
    detailRow("Relative hot sensitivity", formatNumber(props.summer_pct, "%", 100)),
    detailRow("Transition sensitivity", formatNumber(props.autumn_pct, "%", 100))
  ];
  if (metric.category === "weather") {
    rows.push(detailRow(`${metric.label} (${PERIODS[state.period].shortLabel})`, formatNumber(props[metricField], metric.unit)));
  }
  return rows.join("");
}

function overviewDetails(props) {
  return [
    detailRow("Grid ID", props.grid_id ?? "No data"),
    detailRow("Buildings", compactCount(props.building_count)),
    detailRow("Dominant archetype", props.dominant_archetype_label || "No data"),
    detailRow("Dominant subtype", props.dominant_type_label || "No data"),
    detailRow("Mean height", formatNumber(props.mean_height_m, "m")),
    detailRow("Mean EUI 2023", formatNumber(props.mean_eui_2023, "kWh/m2")),
    detailRow("Mean energy use", formatNumber(props.mean_energy_kwh, "kWh"))
  ].join("");
}

function updateFeaturePanel(feature, type) {
  if (!feature) {
    els.featureTitle.textContent = "Click a building or district cell";
    els.featureDetails.innerHTML = "<p>Use hover for quick values and click to pin detailed attributes.</p>";
    return;
  }
  if (type === "building") {
    els.featureTitle.textContent = `Building ${feature.properties.objectid}`;
    els.featureDetails.innerHTML = buildingDetails(feature.properties);
  } else if (type === "overview") {
    els.featureTitle.textContent = `District overview ${feature.properties.grid_id}`;
    els.featureDetails.innerHTML = overviewDetails(feature.properties);
  } else {
    els.featureTitle.textContent = `500 m grid ${feature.properties.grid_id}`;
    els.featureDetails.innerHTML = gridDetails(feature.properties);
  }
}

function popupHtml(feature, type) {
  const props = feature.properties;
  const metric = metricDefinition();
  if (type === "building") {
    const field = fieldForLayer("buildings", state.metric);
    const value =
      metric.kind === "categorical"
        ? TYPE_LABELS[props.building_type] || props.building_type || "No data"
        : formatNumber(props[field], metric.unit);
    return `
      <p class="popup-title">Building ${props.objectid}</p>
      <div class="popup-line"><span>Subtype</span><strong>${TYPE_LABELS[props.building_type] || props.building_type || "No data"}</strong></div>
      <div class="popup-line"><span>${metric.label}</span><strong>${value}</strong></div>
      <div class="popup-line"><span>Height</span><strong>${formatNumber(props.height_m, "m")}</strong></div>
    `;
  }
  if (type === "overview") {
    return `
      <p class="popup-title">District overview ${props.grid_id}</p>
      <div class="popup-line"><span>Buildings</span><strong>${compactCount(props.building_count)}</strong></div>
      <div class="popup-line"><span>Dominant type</span><strong>${props.dominant_type_label || "No data"}</strong></div>
    `;
  }
  const field = metric.category === "weather" ? weatherField() : fieldForLayer("grid_500m", state.metric);
  const label = metric.category === "weather" ? `${metric.label} (${PERIODS[state.period].shortLabel})` : metric.label;
  return `
    <p class="popup-title">500 m grid ${props.grid_id}</p>
    <div class="popup-line"><span>${label}</span><strong>${formatNumber(props[field], metric.unit)}</strong></div>
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
  if (feature.geometry?.type === "Point") return feature.geometry.coordinates;
  const coords = [];
  const walk = (part) => {
    if (typeof part?.[0] === "number") coords.push(part);
    else part?.forEach(walk);
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

function addHostedSource(kind, promoteField) {
  state.sourceTypes[kind] = "vector";
  state.map.addSource(kind, {
    type: "vector",
    url: tilesetConfig(kind).url,
    promoteId: { [state.sourceLayers[kind]]: promoteField }
  });
}

function addGeojsonSource(kind, data, promoteField) {
  state.sourceTypes[kind] = "geojson";
  state.map.addSource(kind, {
    type: "geojson",
    data,
    promoteId: promoteField
  });
}

async function addOptionalGridSource(kind, dataUrl, promoteField) {
  if (hasTileset(kind)) {
    addHostedSource(kind, promoteField);
    return true;
  }
  if (await urlExists(dataUrl)) {
    addGeojsonSource(kind, dataUrl, promoteField);
    return true;
  }
  return false;
}

async function addLayers() {
  if (state.useHostedTilesets) {
    await resolveHostedSourceLayers();
    addHostedSource("grid", "grid_id");
    addHostedSource("buildings", "objectid");
  } else if (state.useVectorTiles) {
    state.sourceTypes.grid = "vector";
    state.sourceTypes.buildings = "vector";
    state.sourceLayers.grid = "grid_500m";
    state.sourceLayers.buildings = "buildings_sg";
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
    addGeojsonSource("grid", state.grid, "grid_id");
    addGeojsonSource("buildings", state.buildings, "objectid");
  }

  state.fallbackSources.weather = await addOptionalGridSource(
    "weather",
    "mapbox-studio-upload/03_weather_500m.geojson",
    "grid_id"
  );
  state.fallbackSources.buildingOverview = await addOptionalGridSource(
    "buildingOverview",
    "mapbox-studio-upload/04_building_overview_500m.geojson",
    "grid_id"
  );

  if (state.fallbackSources.buildingOverview) {
    state.map.addLayer({
      id: "building-overview-fill",
      type: "fill",
      source: "buildingOverview",
      ...sourceLayer("buildingOverview"),
      maxzoom: 11.2,
      paint: {
        "fill-color": overviewColorExpression(),
        "fill-opacity": [
          "interpolate",
          ["linear"],
          ["to-number", ["get", "building_count"], 0],
          0,
          0.05,
          20,
          0.22,
          150,
          0.48
        ]
      }
    });
    state.map.addLayer({
      id: "building-overview-line",
      type: "line",
      source: "buildingOverview",
      ...sourceLayer("buildingOverview"),
      maxzoom: 11.2,
      paint: {
        "line-color": "rgba(42, 55, 67, 0.24)",
        "line-width": 0.35
      }
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
      "line-color": "rgba(43, 55, 64, 0.22)",
      "line-width": 0.5
    }
  });

  if (state.fallbackSources.weather) {
    state.map.addLayer({
      id: "weather-fill",
      type: "fill",
      source: "weather",
      ...sourceLayer("weather"),
      paint: {
        "fill-color": weatherColorExpression(),
        "fill-opacity": Math.min(0.72, state.gridOpacity + 0.08)
      }
    });
  }

  state.map.addLayer({
    id: "grid-selected",
    type: "line",
    source: "grid",
    ...sourceLayer("grid"),
    filter: ["==", ["get", "grid_id"], -999999],
    paint: {
      "line-color": "#111827",
      "line-width": 3
    }
  });
  state.map.addLayer({
    id: "buildings-extrusion",
    type: "fill-extrusion",
    source: "buildings",
    ...sourceLayer("buildings"),
    minzoom: 11,
    paint: {
      "fill-extrusion-color": buildingColorExpression(),
      "fill-extrusion-height": heightExpression(),
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.88,
      "fill-extrusion-vertical-gradient": true
    }
  });
  state.map.addLayer({
    id: "building-selected",
    type: "fill-extrusion",
    source: "buildings",
    ...sourceLayer("buildings"),
    minzoom: 11,
    filter: ["==", ["get", "objectid"], -999999],
    paint: {
      "fill-extrusion-color": "#111827",
      "fill-extrusion-height": heightExpression(),
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.92
    }
  });

  state.popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 12
  });

  [
    ["buildings-extrusion", "building"],
    ["grid-fill", "grid"],
    ["weather-fill", "grid"],
    ["building-overview-fill", "overview"]
  ].forEach(([layer, type]) => {
    if (!state.map.getLayer(layer)) return;
    state.map.on("mousemove", layer, (event) => {
      state.map.getCanvas().style.cursor = "pointer";
      const feature = event.features?.[0];
      if (!feature) return;
      state.popup.setLngLat(event.lngLat).setHTML(popupHtml(feature, type)).addTo(state.map);
    });
    state.map.on("mouseleave", layer, () => {
      state.map.getCanvas().style.cursor = "";
      state.popup.remove();
    });
    state.map.on("click", layer, (event) => {
      const feature = event.features?.[0];
      if (!feature) return;
      setSelectedFeature(feature, type);
    });
  });

  updateLayerVisibility();
}

async function loadData() {
  showLoading("Loading metadata...");
  const metadataResponse = await fetch("data/metadata.json", { cache: "no-store" });
  if (!metadataResponse.ok) throw new Error(`Metadata request failed: ${metadataResponse.status}`);
  state.metadata = await metadataResponse.json();
  els.buildingCount.textContent = compactCount(state.metadata.layers.buildings.count);
  els.gridCount.textContent = compactCount(state.metadata.layers.grid_500m.count);

  state.useHostedTilesets = hasCoreHostedTilesets();
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

  showLoading("Loading building GeoJSON...");
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
    zoom: 10.95,
    pitch: 52,
    bearing: -18,
    antialias: true
  });
  state.map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
  state.map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");

  state.map.on("load", async () => {
    try {
      await loadData();
      await addLayers();
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
    if (state.mode === "grid" && metricDefinition().category !== "weather" && !fieldForLayer("grid_500m", state.metric)) {
      state.metric = "energy_hot";
    }
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
    state.map?.flyTo({ center: [103.8198, 1.3521], zoom: 10.95, pitch: 52, bearing: -18, duration: 900 });
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
