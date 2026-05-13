const CONFIG = window.SG_ENERGY_MAP_CONFIG || {};
const TOKEN_STORAGE_KEY = "sg-energy-mapbox-token";

const PERIODS = {
  hot: { label: "Relatively hot season (May)", shortLabel: "Relatively hot season (May)" },
  cold: { label: "Relatively cold season (Dec)", shortLabel: "Relatively cold season (Dec)" },
  transition: { label: "Transitional season (Oct)", shortLabel: "Transitional season (Oct)" }
};

const WEATHER_VARIABLES = {
  temp: { label: "T2m air temperature", shortLabel: "T2m", unit: "degC", suffix: "c" },
  wind: { label: "Wind10m speed", shortLabel: "Wind10m", unit: "m/s", suffix: "ms" },
  rh: { label: "RH2m relative humidity", shortLabel: "RH2m", unit: "%", suffix: "pct" },
  solar: { label: "SWDOWN shortwave radiation", shortLabel: "SWDOWN", unit: "W/m2", suffix: "wm2" }
};

const ENERGY_WEEKLY_RAMP = ["#fff7bc", "#fee391", "#fec44f", "#fe9929", "#d95f0e", "#8c2d04"];
const ENERGY_DIFFERENCE_RAMP = ["#2166ac", "#67a9cf", "#f7f7f7", "#ef8a62", "#b2182b"];

const ENERGY_SIMULATION_METRICS = [
  "energy_hot",
  "energy_cold",
  "energy_transition",
  "energy_hot_micro",
  "energy_cold_micro",
  "energy_transition_micro",
  "energy_hot_diff_pct",
  "energy_cold_diff_pct",
  "energy_transition_diff_pct"
];

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
    label: "Relatively cold season (Dec, non-microclimate)",
    shortLabel: "Relatively cold season (Dec, non-microclimate)",
    category: "energy",
    unit: "kWh",
    fieldByLayer: { buildings: "cold_tmy_kwh", grid_500m: "cold_tmy_kwh" },
    fallbackFieldByLayer: { buildings: "typical_week_energy_kwh", grid_500m: "winter_energy_kwh" },
    ramp: ENERGY_WEEKLY_RAMP
  },
  energy_hot: {
    label: "Relatively hot season (May, non-microclimate)",
    shortLabel: "Relatively hot season (May, non-microclimate)",
    category: "energy",
    unit: "kWh",
    fieldByLayer: { buildings: "hot_tmy_kwh", grid_500m: "hot_tmy_kwh" },
    fallbackFieldByLayer: { buildings: "typical_week_energy_kwh", grid_500m: "summer_energy_kwh" },
    ramp: ENERGY_WEEKLY_RAMP
  },
  energy_transition: {
    label: "Transitional season (Oct, non-microclimate)",
    shortLabel: "Transitional season (Oct, non-microclimate)",
    category: "energy",
    unit: "kWh",
    fieldByLayer: { buildings: "trans_tmy_kwh", grid_500m: "trans_tmy_kwh" },
    fallbackFieldByLayer: { buildings: "typical_week_energy_kwh", grid_500m: "autumn_energy_kwh" },
    ramp: ENERGY_WEEKLY_RAMP
  },
  energy_hot_micro: {
    label: "Relatively hot season (May, microclimate)",
    shortLabel: "Relatively hot season (May, microclimate)",
    category: "energy",
    unit: "kWh",
    fieldByLayer: { buildings: "hot_micro_kwh", grid_500m: "hot_micro_kwh" },
    fallbackBaseFieldByLayer: { buildings: "typical_week_energy_kwh", grid_500m: "summer_energy_kwh" },
    fallbackPctFieldByLayer: { buildings: "summer_pct", grid_500m: "summer_pct" },
    compute: "microclimate_energy",
    ramp: ENERGY_WEEKLY_RAMP
  },
  energy_cold_micro: {
    label: "Relatively cold season (Dec, microclimate)",
    shortLabel: "Relatively cold season (Dec, microclimate)",
    category: "energy",
    unit: "kWh",
    fieldByLayer: { buildings: "cold_micro_kwh", grid_500m: "cold_micro_kwh" },
    fallbackBaseFieldByLayer: { buildings: "typical_week_energy_kwh", grid_500m: "winter_energy_kwh" },
    fallbackPctFieldByLayer: { buildings: "winter_pct", grid_500m: "winter_pct" },
    compute: "microclimate_energy",
    ramp: ENERGY_WEEKLY_RAMP
  },
  energy_transition_micro: {
    label: "Transitional season (Oct, microclimate)",
    shortLabel: "Transitional season (Oct, microclimate)",
    category: "energy",
    unit: "kWh",
    fieldByLayer: { buildings: "trans_micro_kwh", grid_500m: "trans_micro_kwh" },
    fallbackBaseFieldByLayer: { buildings: "typical_week_energy_kwh", grid_500m: "autumn_energy_kwh" },
    fallbackPctFieldByLayer: { buildings: "autumn_pct", grid_500m: "autumn_pct" },
    compute: "microclimate_energy",
    ramp: ENERGY_WEEKLY_RAMP
  },
  energy_hot_diff_pct: {
    label: "Difference for relatively hot season (May, Microclimate vs non-microclimate)",
    shortLabel: "Difference for relatively hot season (May, Microclimate vs non-microclimate)",
    category: "energy",
    unit: "%",
    displayScale: 100,
    fieldByLayer: { buildings: "hot_diff_pct", grid_500m: "hot_diff_pct" },
    fallbackFieldByLayer: { buildings: "summer_pct", grid_500m: "summer_pct" },
    ramp: ENERGY_DIFFERENCE_RAMP
  },
  energy_cold_diff_pct: {
    label: "Difference for relatively cold season (Dec, Microclimate vs non-microclimate)",
    shortLabel: "Difference for relatively cold season (Dec, Microclimate vs non-microclimate)",
    category: "energy",
    unit: "%",
    displayScale: 100,
    fieldByLayer: { buildings: "cold_diff_pct", grid_500m: "cold_diff_pct" },
    fallbackFieldByLayer: { buildings: "winter_pct", grid_500m: "winter_pct" },
    ramp: ENERGY_DIFFERENCE_RAMP
  },
  energy_transition_diff_pct: {
    label: "Difference for transitional season (Oct, Microclimate vs non-microclimate)",
    shortLabel: "Difference for transitional season (Oct, Microclimate vs non-microclimate)",
    category: "energy",
    unit: "%",
    displayScale: 100,
    fieldByLayer: { buildings: "trans_diff_pct", grid_500m: "trans_diff_pct" },
    fallbackFieldByLayer: { buildings: "autumn_pct", grid_500m: "autumn_pct" },
    ramp: ENERGY_DIFFERENCE_RAMP
  },
  eui_2023: {
    label: "Measured yearly energy use intensity",
    shortLabel: "Measured yearly EUI",
    category: "energy",
    unit: "kWh/m2/yr",
    positiveOnly: true,
    fieldByLayer: { buildings: "eui_2023", building_overview_500m: "mean_eui_2023" },
    ramp: ["#eaf4ff", "#7cc7e8", "#f4d35e", "#ee8b3a", "#c7362f"]
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

const LCZ_ORDER = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

const LCZ_LABELS = {
  1: "LCZ 1 - Compact high-rise",
  2: "LCZ 2 - Compact mid-rise",
  3: "LCZ 3 - Compact low-rise",
  4: "LCZ 4 - Open high-rise",
  6: "LCZ 6 - Open low-rise",
  7: "LCZ 7 - Lightweight low-rise",
  8: "LCZ 8 - Large low-rise",
  9: "LCZ 9 - Sparsely built",
  10: "LCZ 10 - Heavy industry",
  11: "LCZ A - Dense trees",
  12: "LCZ B - Scattered trees",
  13: "LCZ C - Bush, scrub",
  14: "LCZ D - Low plants",
  15: "LCZ E - Bare rock/paved",
  16: "LCZ F - Bare soil/sand",
  17: "LCZ G - Water"
};

const LCZ_COLORS = {
  1: "#8c1d18",
  2: "#c73e2d",
  3: "#f07b35",
  4: "#d85c45",
  6: "#f4a261",
  7: "#f2c94c",
  8: "#b8862f",
  9: "#c7b97f",
  10: "#5b5f66",
  11: "#0b6b43",
  12: "#2f8f5b",
  13: "#71bf72",
  14: "#b8d979",
  15: "#9ca3af",
  16: "#d7b98a",
  17: "#3b82f6"
};

const LCZ_GROUPS = [
  { id: "built", label: "Built LCZ types", codes: [1, 2, 3, 4, 6, 7, 8, 9, 10] },
  { id: "land_cover", label: "Land-cover LCZ types", codes: [11, 12, 13, 14, 15, 16, 17] }
];

const REGION_GROUP_LABELS = {
  "Central Region": "Central Region",
  "East Region": "East Region",
  "North Region": "North Region",
  "North-East Region": "North-East Region",
  "West Region": "West Region",
  MK: "Mukim districts (MK)",
  TS: "Town subdivision districts (TS)",
  Other: "Other districts"
};

const REGION_GROUP_ORDER = ["Central Region", "East Region", "North Region", "North-East Region", "West Region", "MK", "TS", "Other"];
const BUILDING_REGION_FIELD = "planning_area_code";

const state = {
  map: null,
  metadata: null,
  buildings: null,
  grid: null,
  regions: null,
  selectedRegionIds: new Set(),
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
  sourceFields: {},
  searchIndex: null,
  weatherManifest: null,
  weatherSeriesCache: {},
  weatherSeries: null,
  activeWeatherSeriesKey: "",
  weatherTimeIndex: 0,
  weatherPlayTimer: null,
  lczLayer: "off",
  lczRaw: null,
  lczGridRows: [],
  lczGridById: new Map(),
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
  regionFilterDropdown: document.getElementById("regionFilterDropdown"),
  regionFilterSummary: document.getElementById("regionFilterSummary"),
  regionFilterList: document.getElementById("regionFilterList"),
  regionSelectAll: document.getElementById("regionSelectAll"),
  regionClearAll: document.getElementById("regionClearAll"),
  lczLayerButtons: document.getElementById("lczLayerButtons"),
  weatherButtons: document.getElementById("weatherButtons"),
  energyBuildingTypeButtons: document.getElementById("energyBuildingTypeButtons"),
  energyMetricSelect: document.getElementById("energyMetricSelect"),
  measuredEnergyButtons: document.getElementById("measuredEnergyButtons"),
  periodButtons: document.getElementById("periodButtons"),
  weatherTimeBlock: document.getElementById("weatherTimeBlock"),
  weatherTime: document.getElementById("weatherTime"),
  weatherTimeLabel: document.getElementById("weatherTimeLabel"),
  weatherPlay: document.getElementById("weatherPlay"),
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

els.regionFilterSummaries = Array.from(document.querySelectorAll("[data-region-filter-summary]"));
els.regionFilterLists = Array.from(document.querySelectorAll("[data-region-filter-list]"));
els.regionSelectAllButtons = Array.from(document.querySelectorAll("[data-region-select-all]"));
els.regionClearAllButtons = Array.from(document.querySelectorAll("[data-region-clear-all]"));

function getToken() {
  const configuredToken =
    CONFIG.mapboxAccessToken || (Array.isArray(CONFIG.mapboxAccessTokenParts) ? CONFIG.mapboxAccessTokenParts.join("") : "");
  return configuredToken || localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

function showTokenDialog() {
  els.tokenDialog.classList.add("visible");
}

function hideTokenDialog() {
  els.tokenDialog.classList.remove("visible");
}

function finiteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatNumber(value, unit = "", scale = 1) {
  if (value === null || value === undefined || value === "") return "No data";
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

function htmlSafe(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function regionFeatures() {
  return state.regions?.features || [];
}

function regionId(feature) {
  return String(feature?.properties?.region_id || "");
}

function regionName(feature) {
  return feature?.properties?.region_name || regionId(feature);
}

function regionGroupId(feature) {
  const explicitGroup = feature?.properties?.region_group;
  if (explicitGroup) return explicitGroup;
  const id = regionId(feature).toUpperCase();
  if (id.startsWith("MK")) return "MK";
  if (id.startsWith("TS")) return "TS";
  return "Other";
}

function regionGroups() {
  const groups = new Map();
  regionFeatures().forEach((feature) => {
    const groupId = regionGroupId(feature);
    if (!groups.has(groupId)) groups.set(groupId, []);
    groups.get(groupId).push(regionId(feature));
  });
  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      const aIndex = REGION_GROUP_ORDER.includes(a) ? REGION_GROUP_ORDER.indexOf(a) : REGION_GROUP_ORDER.length;
      const bIndex = REGION_GROUP_ORDER.includes(b) ? REGION_GROUP_ORDER.indexOf(b) : REGION_GROUP_ORDER.length;
      return aIndex - bIndex;
    })
    .map(([id, ids]) => ({ id, ids, label: REGION_GROUP_LABELS[id] || id }));
}

function regionIdsForGroup(groupId) {
  return regionFeatures()
    .filter((feature) => regionGroupId(feature) === groupId)
    .map(regionId);
}

function regionIds() {
  return regionFeatures().map(regionId);
}

function selectedRegionCount() {
  return state.selectedRegionIds.size;
}

function allRegionsSelected() {
  const ids = regionIds();
  return ids.length > 0 && selectedRegionCount() === ids.length;
}

function regionFalseFilter() {
  return ["==", ["get", "region_id"], "__none__"];
}

function selectedRegionAllows(regionIdValue) {
  const id = String(regionIdValue || "");
  if (!regionFeatures().length) return true;
  if (!id) return false;
  if (allRegionsSelected()) return true;
  if (!selectedRegionCount()) return false;
  return state.selectedRegionIds.has(id);
}

function lczRegionFilterExpression() {
  if (!regionFeatures().length || allRegionsSelected()) return ["has", "region_id"];
  if (!selectedRegionCount()) return regionFalseFilter();
  return ["in", ["get", "region_id"], ["literal", Array.from(state.selectedRegionIds)]];
}

function lczLabel(code) {
  const numeric = Number(code);
  if (!Number.isFinite(numeric) || !LCZ_LABELS[numeric]) return "No data";
  return LCZ_LABELS[numeric];
}

function lczColor(code) {
  return LCZ_COLORS[Number(code)] || "rgba(148, 163, 184, 0.3)";
}

function buildingRegionPropertyAvailable() {
  const hostedFields = state.sourceFields.buildings;
  if (hostedFields) return hostedFields.has(BUILDING_REGION_FIELD);
  const sampleProperties = state.buildings?.features?.[0]?.properties || {};
  return Object.prototype.hasOwnProperty.call(sampleProperties, BUILDING_REGION_FIELD);
}

function buildingRegionFilterExpression() {
  const total = regionFeatures().length;
  if (!total || allRegionsSelected()) return null;
  if (!selectedRegionCount()) return regionFalseFilter();
  if (buildingRegionPropertyAvailable()) {
    return ["in", ["to-string", ["get", BUILDING_REGION_FIELD]], ["literal", Array.from(state.selectedRegionIds)]];
  }
  return null;
}

function buildingSelectionFilterExpression() {
  const idFilter = ["==", ["get", "objectid"], state.selectedBuildingId ?? -999999];
  const regionFilter = buildingRegionFilterExpression();
  return regionFilter ? ["all", idFilter, regionFilter] : idFilter;
}

function selectedRegionLayerFilterExpression() {
  if (!regionFeatures().length || allRegionsSelected() || !selectedRegionCount()) return regionFalseFilter();
  return ["in", ["get", "region_id"], ["literal", Array.from(state.selectedRegionIds)]];
}

function regionLabelFilterExpression() {
  if (!regionFeatures().length || !selectedRegionCount()) return regionFalseFilter();
  return ["in", ["get", "region_id"], ["literal", Array.from(state.selectedRegionIds)]];
}

function updateRegionFilterSummary() {
  const summaries = els.regionFilterSummaries?.length ? els.regionFilterSummaries : [els.regionFilterSummary].filter(Boolean);
  if (!summaries.length) return;
  const total = regionFeatures().length;
  const count = selectedRegionCount();
  let text;
  if (!total) {
    text = "Loading regions...";
  } else if (count === total) {
    text = `All areas (${total})`;
  } else if (!count) {
    text = "No areas selected";
  } else {
    text = `${count} of ${total} areas`;
  }
  summaries.forEach((summary) => {
    summary.textContent = text;
  });
}

function renderRegionFilter() {
  const features = regionFeatures();
  const lists = els.regionFilterLists?.length ? els.regionFilterLists : [els.regionFilterList].filter(Boolean);
  if (!lists.length || !features.length) {
    updateRegionFilterSummary();
    return;
  }
  state.selectedRegionIds = new Set(features.map(regionId));
  const groupMarkup = regionGroups()
    .map((group) => {
      return `
        <label class="region-filter-option region-filter-group-option">
          <input type="checkbox" data-region-group="${htmlSafe(group.id)}" checked />
          <span>${htmlSafe(group.label)}</span>
          <strong>${group.ids.length}</strong>
        </label>
      `;
    })
    .join("");
  const districtMarkup = features
    .map((feature) => {
      const id = regionId(feature);
      const name = regionName(feature);
      return `
        <label class="region-filter-option">
          <input type="checkbox" value="${htmlSafe(id)}" data-region-id="${htmlSafe(id)}" checked />
          <span>${htmlSafe(name)}</span>
        </label>
      `;
    })
    .join("");
  const markup = `
    <div class="region-filter-section">
      <div class="region-filter-section-title">Major regions</div>
      ${groupMarkup}
    </div>
    <div class="region-filter-section">
      <div class="region-filter-section-title">Planning areas</div>
      ${districtMarkup}
    </div>
  `;
  lists.forEach((list) => {
    list.innerHTML = markup;
  });
  updateRegionFilterSummary();
}

function syncRegionCheckboxes() {
  const lists = els.regionFilterLists?.length ? els.regionFilterLists : [els.regionFilterList].filter(Boolean);
  lists.forEach((list) => {
    list.querySelectorAll("input[data-region-id]").forEach((input) => {
      input.checked = state.selectedRegionIds.has(input.value);
    });
    list.querySelectorAll("input[data-region-group]").forEach((input) => {
      const ids = regionIdsForGroup(input.dataset.regionGroup);
      const checkedCount = ids.filter((id) => state.selectedRegionIds.has(id)).length;
      input.checked = ids.length > 0 && checkedCount === ids.length;
      input.indeterminate = checkedCount > 0 && checkedCount < ids.length;
    });
  });
  updateRegionFilterSummary();
}

function shouldShowRegionOverlay() {
  return regionFeatures().length > 0 && selectedRegionCount() > 0 && !allRegionsSelected() && state.mode !== "grid";
}

function shouldShowRegionLabels() {
  return regionFeatures().length > 0 && selectedRegionCount() > 0 && state.mode !== "grid";
}

function expandBoundsWithCoordinates(coordinates, bounds) {
  if (!Array.isArray(coordinates)) return;
  if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    const lng = coordinates[0];
    const lat = coordinates[1];
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      bounds[0] = Math.min(bounds[0], lng);
      bounds[1] = Math.min(bounds[1], lat);
      bounds[2] = Math.max(bounds[2], lng);
      bounds[3] = Math.max(bounds[3], lat);
    }
    return;
  }
  coordinates.forEach((child) => expandBoundsWithCoordinates(child, bounds));
}

function boundsForRegionFeatures(features) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  features.forEach((feature) => expandBoundsWithCoordinates(feature.geometry?.coordinates, bounds));
  if (bounds.some((value) => !Number.isFinite(value))) return null;
  if (bounds[0] === bounds[2]) {
    bounds[0] -= 0.002;
    bounds[2] += 0.002;
  }
  if (bounds[1] === bounds[3]) {
    bounds[1] -= 0.002;
    bounds[3] += 0.002;
  }
  return [
    [bounds[0], bounds[1]],
    [bounds[2], bounds[3]]
  ];
}

function focusRegionIds(ids, maxZoom = 13.8) {
  if (!state.map || !ids.length) return;
  const idsSet = new Set(ids);
  const features = regionFeatures().filter((feature) => idsSet.has(regionId(feature)));
  const bounds = boundsForRegionFeatures(features);
  if (!bounds) return;
  const center = [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
  if (ids.length === 1) {
    state.map.easeTo({ center, zoom: maxZoom, duration: 850, essential: true });
    return;
  }
  const isCompact = window.innerWidth < 900;
  const padding = {
    top: 64,
    bottom: 64,
    left: isCompact ? 32 : Math.min(320, Math.round(window.innerWidth * 0.22)),
    right: window.innerWidth > 1120 ? Math.min(260, Math.round(window.innerWidth * 0.16)) : 32
  };
  try {
    state.map.fitBounds(bounds, {
      padding,
      maxZoom,
      duration: 850,
      essential: true
    });
  } catch (error) {
    console.warn("Region bounds did not fit; using center fallback", error);
    state.map.easeTo({ center, zoom: Math.min(maxZoom, 13.6), duration: 850, essential: true });
    return;
  }
  window.setTimeout(() => {
    const current = state.map.getCenter();
    const movedLng = Math.abs(current.lng - center[0]);
    const movedLat = Math.abs(current.lat - center[1]);
    if (movedLng > 0.18 || movedLat > 0.18) {
      state.map.easeTo({ center, zoom: Math.min(maxZoom, 13.6), duration: 650, essential: true });
    }
  }, 900);
}

function applyLczFeatureState() {
  if (!state.map?.getSource("grid") || !state.lczGridRows.length) return;
  const allSelected = allRegionsSelected();
  try {
    state.lczGridRows.forEach((row) => {
      state.map.setFeatureState(featureStateTarget("grid", row.grid_id), {
        lcz_mode: row.lcz_mode,
        lcz_purity: row.lcz_purity,
        lcz_region_selected: allSelected || selectedRegionAllows(row.region_id)
      });
    });
  } catch (error) {
    console.warn("LCZ feature state could not be applied", error);
  }
}

function applyLczRegionFilter() {
  if (!state.map) return;
  applyLczFeatureState();
  const rawFilter = lczRegionFilterExpression();
  ["lcz-100m-fill", "lcz-100m-line"].forEach((layer) => {
    if (!state.map.getLayer(layer)) return;
    state.map.setFilter(layer, rawFilter);
  });
  if (state.map.getLayer("lcz-grid-fill")) {
    state.map.setPaintProperty("lcz-grid-fill", "fill-opacity", lczGridOpacityExpression());
  }
}

function applyRegionFilter() {
  if (!state.map) return;
  const buildingFilter = buildingRegionFilterExpression();
  const selectedFilter = buildingSelectionFilterExpression();
  try {
    if (state.map.getLayer("buildings-extrusion")) state.map.setFilter("buildings-extrusion", buildingFilter);
    if (state.map.getLayer("building-selected")) state.map.setFilter("building-selected", selectedFilter);
    const regionLayerFilter = selectedRegionLayerFilterExpression();
    ["region-filter-fill", "region-filter-line"].forEach((layer) => {
      if (!state.map.getLayer(layer)) return;
      state.map.setFilter(layer, regionLayerFilter);
      state.map.setLayoutProperty(layer, "visibility", shouldShowRegionOverlay() ? "visible" : "none");
    });
    if (state.map.getLayer("region-filter-label")) {
      state.map.setFilter("region-filter-label", regionLabelFilterExpression());
      state.map.setLayoutProperty("region-filter-label", "visibility", shouldShowRegionLabels() ? "visible" : "none");
    }
    applyLczRegionFilter();
  } catch (error) {
    console.warn("Region filter could not be applied", error);
  }
}

function metricDefinition(metric = state.metric) {
  return METRICS[metric] || METRICS.energy_hot;
}

function metricDisplayScale(metric = state.metric) {
  return metricDefinition(metric).displayScale || 1;
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

function statsFieldForLayer(layerName, metric = state.metric) {
  const def = metricDefinition(metric);
  return def.statsFieldByLayer?.[layerName] || fieldForLayer(layerName, metric);
}

function hasMetricForLayer(layerName, metric = state.metric) {
  const def = metricDefinition(metric);
  if (def.category === "weather") return layerName === "weather_500m";
  if (def.kind === "categorical") return layerName === "buildings";
  return Boolean(def.fieldByLayer?.[layerName] || def.baseFieldByLayer?.[layerName]);
}

function statsLayerForMetric(metric = state.metric) {
  const def = metricDefinition(metric);
  if (def.category === "weather") return "weather_500m";
  if (state.mode !== "buildings" && hasMetricForLayer("grid_500m", metric)) return "grid_500m";
  if (state.mode !== "grid" && hasMetricForLayer("buildings", metric)) return "buildings";
  return "grid_500m";
}

function metricStats(layerName, metric = state.metric) {
  const field = statsFieldForLayer(layerName, metric);
  return state.metadata?.layers?.[layerName]?.metrics?.[field] || null;
}

function metricInputExpression(layerName, metric = state.metric) {
  const def = metricDefinition(metric);
  const field = fieldForLayer(layerName, metric);
  const validMetricValueExpression = (valueExpression) =>
    def.positiveOnly ? [">", valueExpression, 0] : ["!=", valueExpression, -9999];
  if (def.compute === "microclimate_energy") {
    const baseField = def.fallbackBaseFieldByLayer?.[layerName];
    const pctField = def.fallbackPctFieldByLayer?.[layerName];
    if (!baseField || !pctField) return null;
    const fallbackExpression = [
      "let",
      "base_value",
      ["to-number", ["get", baseField], -9999],
      [
        "case",
        ["!=", ["var", "base_value"], -9999],
        ["*", ["var", "base_value"], ["+", 1, ["to-number", ["get", pctField], 0]]],
        -9999
      ]
    ];
    if (!field) return fallbackExpression;
    return [
      "let",
      "direct_value",
      ["to-number", ["get", field], -9999],
      [
        "case",
        ["!=", ["var", "direct_value"], -9999],
        ["var", "direct_value"],
        fallbackExpression
      ]
    ];
  }
  if (!field) return null;
  const fallbackField = def.fallbackFieldByLayer?.[layerName];
  if (!fallbackField) {
    return [
      "let",
      "direct_value",
      ["to-number", ["get", field], -9999],
      ["case", validMetricValueExpression(["var", "direct_value"]), ["var", "direct_value"], -9999]
    ];
  }
  return [
    "let",
    "direct_value",
    ["to-number", ["get", field], -9999],
    [
      "case",
      validMetricValueExpression(["var", "direct_value"]),
      ["var", "direct_value"],
      [
        "let",
        "fallback_value",
        ["to-number", ["get", fallbackField], -9999],
        ["case", validMetricValueExpression(["var", "fallback_value"]), ["var", "fallback_value"], -9999]
      ]
    ]
  ];
}

function metricValueFromProperties(layerName, props, metric = state.metric) {
  const def = metricDefinition(metric);
  if (def.kind === "categorical") return props.building_type;
  const field = fieldForLayer(layerName, metric);
  const direct = finiteNumber(props[field]);
  if (direct !== null && (!def.positiveOnly || direct > 0)) return direct;
  if (def.compute === "microclimate_energy") {
    const base = finiteNumber(props[def.fallbackBaseFieldByLayer?.[layerName]]);
    const pct = finiteNumber(props[def.fallbackPctFieldByLayer?.[layerName]]);
    if (base === null) return null;
    return base * (1 + (pct ?? 0));
  }
  const fallbackField = def.fallbackFieldByLayer?.[layerName];
  const fallback = fallbackField ? finiteNumber(props[fallbackField]) : null;
  return fallback !== null && (!def.positiveOnly || fallback > 0) ? fallback : null;
}

function weatherVariable(metric = state.metric) {
  return metricDefinition(metric).variable;
}

function weatherSeriesKey(period = state.period, variable = weatherVariable()) {
  return `${period}_${variable}`;
}

function formatWeatherTime(raw) {
  if (!raw) return "--";
  return raw.replaceAll("_", "-").replace(/-(\d{2})-(\d{2})$/, " $1:$2");
}

async function loadWeatherManifest() {
  if (state.weatherManifest) return state.weatherManifest;
  const response = await fetch("data/weather-timeseries/manifest.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Weather manifest request failed: ${response.status}`);
  state.weatherManifest = await response.json();
  return state.weatherManifest;
}

async function loadWeatherSeries() {
  if (metricDefinition().category !== "weather") return null;
  const manifest = await loadWeatherManifest();
  const variable = weatherVariable();
  const key = weatherSeriesKey(state.period, variable);
  if (!state.weatherSeriesCache[key]) {
    const path = manifest.files?.[state.period]?.[variable];
    if (!path) throw new Error(`Missing weather timeseries for ${key}`);
    showLoading(`Loading WRF ${WEATHER_VARIABLES[variable].shortLabel} time series...`);
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`Weather timeseries request failed: ${response.status}`);
    const series = await response.json();
    series.gridIndex = new Map(series.gridIds.map((gridId, index) => [Number(gridId), index]));
    state.weatherSeriesCache[key] = series;
    hideLoading();
  }
  state.weatherSeries = state.weatherSeriesCache[key];
  state.activeWeatherSeriesKey = key;
  state.weatherTimeIndex = Math.min(state.weatherTimeIndex, state.weatherSeries.times.length - 1);
  updateWeatherTimeControls();
  return state.weatherSeries;
}

function currentWeatherValue(gridId) {
  const series = state.weatherSeries;
  if (!series) return null;
  const index = series.gridIndex.get(Number(gridId));
  if (index === undefined) return null;
  const value = series.values[state.weatherTimeIndex]?.[index];
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function weatherTimeInputExpression() {
  const series = state.weatherSeries;
  if (!series) return null;
  const row = series.values[state.weatherTimeIndex] || [];
  const expression = ["match", ["to-number", ["get", "grid_id"]]];
  series.gridIds.forEach((gridId, index) => {
    const value = row[index];
    if (Number.isFinite(Number(value))) {
      expression.push(Number(gridId), Number(value));
    }
  });
  expression.push(-9999);
  return expression;
}

function updateWeatherTimeControls() {
  const isWeather = metricDefinition().category === "weather";
  els.weatherTimeBlock.classList.toggle("hidden-block", !isWeather);
  if (!isWeather) {
    stopWeatherPlayback();
    return;
  }
  const series = state.weatherSeries;
  if (!series) {
    els.weatherTime.max = 0;
    els.weatherTime.value = 0;
    els.weatherTimeLabel.textContent = "Loading...";
    return;
  }
  els.weatherTime.max = String(Math.max(0, series.times.length - 1));
  els.weatherTime.value = String(state.weatherTimeIndex);
  els.weatherTimeLabel.textContent = formatWeatherTime(series.times[state.weatherTimeIndex]);
}

function stopWeatherPlayback() {
  if (state.weatherPlayTimer) {
    window.clearInterval(state.weatherPlayTimer);
    state.weatherPlayTimer = null;
  }
  if (els.weatherPlay) els.weatherPlay.textContent = "Play";
}

function toggleWeatherPlayback() {
  if (state.weatherPlayTimer) {
    stopWeatherPlayback();
    return;
  }
  if (!state.weatherSeries) return;
  els.weatherPlay.textContent = "Pause";
  state.weatherPlayTimer = window.setInterval(() => {
    if (!state.weatherSeries) return;
    state.weatherTimeIndex = (state.weatherTimeIndex + 1) % state.weatherSeries.times.length;
    updateWeatherTimeControls();
    updateMapStyle();
    updateLegend();
  }, 650);
}

async function refreshWeatherSeries() {
  updateWeatherTimeControls();
  if (metricDefinition().category !== "weather") {
    state.weatherSeries = null;
    state.activeWeatherSeriesKey = "";
    updateWeatherTimeControls();
    return;
  }
  const key = weatherSeriesKey(state.period, weatherVariable());
  if (state.activeWeatherSeriesKey !== key) {
    state.weatherSeries = null;
    state.activeWeatherSeriesKey = "";
    updateWeatherTimeControls();
  }
  try {
    await loadWeatherSeries();
    updateMapStyle();
    updateLegend();
  } catch (error) {
    console.warn(error);
    state.weatherSeries = null;
    updateWeatherTimeControls();
  }
}

function normalizeLczGridStats(payload) {
  const fields = payload?.grid?.fields || [];
  const rows = (payload?.grid?.rows || []).map((row) => {
    const record = {};
    fields.forEach((field, index) => {
      record[field] = row[index];
    });
    const proportions = {};
    LCZ_ORDER.forEach((code) => {
      proportions[code] = Number(record[`p_${code}`] || 0);
    });
    return {
      grid_id: Number(record.grid_id),
      region_id: record.region_id || "",
      region_name: record.region_name || "",
      lcz_mode: Number(record.lcz_mode || 0),
      lcz_purity: Number(record.lcz_purity || 0),
      proportions
    };
  });
  state.lczGridRows = rows.filter((row) => Number.isFinite(row.grid_id));
  state.lczGridById = new Map(state.lczGridRows.map((row) => [row.grid_id, row]));
  return { fields, rows: state.lczGridRows };
}

async function loadLczData() {
  const [gridResponse, rawResponse] = await Promise.all([
    fetch("data/lcz_grid_stats.json", { cache: "no-store" }),
    fetch("data/lcz_100m.geojson", { cache: "no-store" })
  ]);
  if (!gridResponse.ok) throw new Error(`LCZ grid stats request failed: ${gridResponse.status}`);
  if (!rawResponse.ok) throw new Error(`LCZ 100 m layer request failed: ${rawResponse.status}`);
  normalizeLczGridStats(await gridResponse.json());
  state.lczRaw = await rawResponse.json();
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

function featureStateTarget(kind, id) {
  const target = { source: kind, id: Number(id) };
  if (state.sourceTypes[kind] === "vector") target.sourceLayer = state.sourceLayers[kind];
  return target;
}

function tilesetId(url) {
  return url?.startsWith("mapbox://") ? url.replace("mapbox://", "") : "";
}

async function resolveTilesetSourceLayer(kind) {
  const config = tilesetConfig(kind);
  if (!config.url) return null;
  const id = tilesetId(config.url);
  if (!id) return config.sourceLayer || null;
  try {
    const response = await fetch(
      `https://api.mapbox.com/v4/${id}.json?secure&access_token=${encodeURIComponent(mapboxgl.accessToken)}`,
      { cache: "no-store" }
    );
    if (!response.ok) throw new Error(`Tileset metadata failed for ${kind}: ${response.status}`);
    const tilejson = await response.json();
    const layer =
      tilejson.vector_layers?.find((candidate) => candidate.id === config.sourceLayer) ||
      tilejson.vector_layers?.[0] ||
      null;
    state.sourceFields[kind] = new Set(Object.keys(layer?.fields || {}));
    return layer?.id || config.sourceLayer || null;
  } catch (error) {
    if (config.sourceLayer) return config.sourceLayer;
    throw error;
  }
}

async function resolveRequiredHostedSourceLayers() {
  for (const kind of ["buildings", "grid"]) {
    const sourceLayerId = await resolveTilesetSourceLayer(kind);
    if (!sourceLayerId) throw new Error(`Could not resolve source layer for ${kind}`);
    state.sourceLayers[kind] = sourceLayerId;
  }
}

async function resolveOptionalHostedSourceLayer(kind) {
  try {
    const sourceLayerId = await resolveTilesetSourceLayer(kind);
    if (!sourceLayerId) return false;
    state.sourceLayers[kind] = sourceLayerId;
    return true;
  } catch (error) {
    console.warn(`Falling back from ${kind} tileset`, error);
    return false;
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
  const stats = metricStats(layerName, metric);
  return buildColorExpressionFromInput(metricInputExpression(layerName, metric), stats, def.ramp, fallbackColor);
}

function colorStopPairs(stats, ramp) {
  if (!stats?.stops?.length) return [];
  const pairs = [];
  stats.stops.forEach((stop, index) => {
    const numeric = Number(stop);
    if (!Number.isFinite(numeric)) return;
    if (pairs.length && numeric <= pairs[pairs.length - 1].stop) return;
    pairs.push({ stop: numeric, color: ramp[index] || ramp[ramp.length - 1] });
  });
  return pairs;
}

function buildColorExpressionFromInput(inputExpression, stats, ramp, fallbackColor) {
  const pairs = colorStopPairs(stats, ramp);
  if (!inputExpression || !pairs.length) return fallbackColor;
  const interpolate = ["interpolate", ["linear"], ["var", "weather_value"]];
  pairs.forEach(({ stop, color }) => {
    interpolate.push(stop, color);
  });
  return [
    "let",
    "weather_value",
    inputExpression,
    ["case", ["!=", ["var", "weather_value"], -9999], interpolate, fallbackColor]
  ];
}

function buildTypeExpression() {
  const expression = ["match", ["coalesce", ["get", "building_type"], "unknown"]];
  Object.entries(TYPE_COLORS).forEach(([type, color]) => expression.push(type, color));
  expression.push("#aab3bb");
  return expression;
}

function buildLczExpression(inputExpression) {
  const expression = ["match", ["to-number", inputExpression, -1]];
  LCZ_ORDER.forEach((code) => expression.push(code, LCZ_COLORS[code]));
  expression.push("rgba(148, 163, 184, 0.22)");
  return expression;
}

function lczRawColorExpression() {
  return buildLczExpression(["get", "lcz_code"]);
}

function lczGridColorExpression() {
  return buildLczExpression(["feature-state", "lcz_mode"]);
}

function lczGridOpacityExpression() {
  if (!selectedRegionCount()) return 0;
  if (allRegionsSelected()) return 0.64;
  return ["case", ["boolean", ["feature-state", "lcz_region_selected"], false], 0.66, 0];
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
  if (state.metric === "eui_2023") return buildInterpolateExpression("buildings", state.metric, "rgba(148, 163, 184, 0.12)");
  return buildInterpolateExpression("buildings", state.metric, "rgba(94, 110, 124, 0.36)");
}

function gridColorExpression() {
  return buildInterpolateExpression("grid_500m", state.metric, "rgba(86, 112, 130, 0.18)");
}

function weatherColorExpression() {
  if (state.weatherSeries) {
    return buildColorExpressionFromInput(
      weatherTimeInputExpression(),
      state.weatherSeries.stats,
      metricDefinition().ramp,
      "rgba(92, 122, 145, 0.18)"
    );
  }
  return buildInterpolateExpression("weather_500m", state.metric, "rgba(92, 122, 145, 0.18)");
}

function overviewColorExpression() {
  if (state.metric === "height_m" || state.metric === "eui_2023") {
    const fallback = state.metric === "eui_2023" ? "rgba(148, 163, 184, 0.10)" : "rgba(115, 133, 148, 0.18)";
    return buildInterpolateExpression("building_overview_500m", state.metric, fallback);
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
    state.lczLayer = "off";
    state.metric = key;
    if (def.category === "weather" && state.mode === "buildings") {
      state.mode = "combined";
      els.layerMode.value = "combined";
    }
    if (def.category === "building" && state.mode === "grid") {
      state.mode = "buildings";
      if (els.layerMode) els.layerMode.value = "buildings";
      const layerModeEnergy = document.getElementById("layerModeEnergy");
      if (layerModeEnergy) layerModeEnergy.value = "buildings";
    }
    updateMapStyle();
    updateMetricButtons();
    updateLegend();
    refreshWeatherSeries();
  });
  container.appendChild(button);
}

function populateMetricSelect(select, keys) {
  select.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select weekly simulation layer";
  placeholder.disabled = true;
  placeholder.hidden = true;
  select.appendChild(placeholder);
  keys.forEach((key) => {
    const def = METRICS[key];
    const option = document.createElement("option");
    option.value = key;
    option.textContent = def.shortLabel;
    select.appendChild(option);
  });
  select.value = keys.includes(state.metric) ? state.metric : "";
}

function initMetricButtons() {
  [
    [els.buildingMetricButtons, ["building_type", "height_m"]],
    [els.weatherButtons, ["weather_temp", "weather_wind", "weather_rh", "weather_solar"]],
    [els.energyBuildingTypeButtons, ["building_type"]],
    [els.measuredEnergyButtons, ["eui_2023"]]
  ].forEach(([container, keys]) => {
    if (!container) return;
    container.innerHTML = "";
    keys.forEach((key) => createMetricButton(container, key));
  });

  if (els.energyMetricSelect) {
    populateMetricSelect(els.energyMetricSelect, ENERGY_SIMULATION_METRICS);
  }

  els.periodButtons.innerHTML = "";
  Object.entries(PERIODS).forEach(([key, period]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = period.shortLabel;
    button.dataset.period = key;
    button.addEventListener("click", () => {
      state.period = key;
      state.weatherTimeIndex = 0;
      updateMapStyle();
      updateMetricButtons();
      updateLegend();
      refreshWeatherSeries();
    });
    els.periodButtons.appendChild(button);
  });
  updateMetricButtons();
}

function updateLczButtons() {
  if (!els.lczLayerButtons) return;
  const hasLczData = Boolean(state.lczRaw && state.lczGridRows.length);
  els.lczLayerButtons.querySelectorAll("button[data-lcz-layer]").forEach((button) => {
    const layer = button.dataset.lczLayer;
    button.classList.toggle("active", layer === state.lczLayer);
    button.disabled = layer !== "off" && !hasLczData;
  });
}

function updateMetricButtons() {
  const buttons = [
    ...(els.buildingMetricButtons ? els.buildingMetricButtons.querySelectorAll("button") : []),
    ...(els.weatherButtons ? els.weatherButtons.querySelectorAll("button") : []),
    ...(els.energyBuildingTypeButtons ? els.energyBuildingTypeButtons.querySelectorAll("button") : []),
    ...(els.measuredEnergyButtons ? els.measuredEnergyButtons.querySelectorAll("button") : [])
  ];
  buttons.forEach((button) => {
    const metric = button.dataset.metric;
    const def = metricDefinition(metric);
    const canSwitchToBuildings = Boolean(button.closest("#energyBuildingTypeButtons"));
    const unavailable =
      !canSwitchToBuildings &&
      state.mode === "grid" &&
      def.category !== "weather" &&
      !hasMetricForLayer("grid_500m", metric);
    button.classList.toggle("active", metric === state.metric);
    button.disabled = unavailable;
  });
  updateLczButtons();
  if (els.energyMetricSelect) {
    els.energyMetricSelect.value = ENERGY_SIMULATION_METRICS.includes(state.metric) ? state.metric : "";
    Array.from(els.energyMetricSelect.options).forEach((option) => {
      if (!option.value) return;
      option.disabled =
        state.mode === "grid" &&
        metricDefinition(option.value).category !== "weather" &&
        !hasMetricForLayer("grid_500m", option.value);
    });
  }
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
  const lczActive = state.lczLayer !== "off";
  const showBuildings = state.mode !== "grid";
  const showGrid = state.mode !== "buildings";
  const showWeather = !lczActive && metric.category === "weather" && showGrid;
  const showGridFill = !lczActive && showGrid && !showWeather && hasMetricForLayer("grid_500m", state.metric);
  setVisibility("weather-fill", showWeather);
  setVisibility("grid-fill", showGridFill);
  setVisibility("grid-line", !lczActive && (showGrid || showWeather));
  setVisibility("grid-selected", showGrid || showWeather || state.lczLayer === "grid");
  setVisibility("lcz-100m-fill", state.lczLayer === "raw");
  setVisibility("lcz-100m-line", state.lczLayer === "raw");
  setVisibility("lcz-grid-fill", state.lczLayer === "grid");
  setVisibility("lcz-grid-line", state.lczLayer === "grid");
  setVisibility("building-overview-fill", showBuildings);
  setVisibility("building-overview-line", showBuildings);
  setVisibility("buildings-extrusion", showBuildings);
  setVisibility("building-selected", showBuildings);
  applyRegionFilter();
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
  if (state.map.getLayer("lcz-100m-fill")) {
    state.map.setPaintProperty("lcz-100m-fill", "fill-color", lczRawColorExpression());
  }
  if (state.map.getLayer("lcz-grid-fill")) {
    state.map.setPaintProperty("lcz-grid-fill", "fill-color", lczGridColorExpression());
    state.map.setPaintProperty("lcz-grid-fill", "fill-opacity", lczGridOpacityExpression());
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

function lczStatsForActiveLayer() {
  const counts = Object.fromEntries(LCZ_ORDER.map((code) => [code, 0]));
  let total = 0;
  let gridCells = 0;
  let purityTotal = 0;

  if (state.lczLayer === "grid") {
    state.lczGridRows.forEach((row) => {
      if (!selectedRegionAllows(row.region_id) || !row.lcz_mode) return;
      counts[row.lcz_mode] = (counts[row.lcz_mode] || 0) + 1;
      total += 1;
      gridCells += 1;
      purityTotal += Number(row.lcz_purity || 0);
    });
    return {
      counts,
      total,
      unitLabel: "500 m cells",
      subtitle: gridCells ? `Mean dominant-type purity ${formatNumber(purityTotal / gridCells, "%")}` : "No cells in selected areas"
    };
  }

  (state.lczRaw?.features || []).forEach((feature) => {
    const props = feature.properties || {};
    if (!selectedRegionAllows(props.region_id)) return;
    const code = Number(props.lcz_code);
    const cells = Number(props.cell_count || 0);
    if (!code || !cells) return;
    counts[code] = (counts[code] || 0) + cells;
    total += cells;
  });

  return {
    counts,
    total,
    unitLabel: "100 m cells",
    subtitle: total ? `${compactCount(total)} classified 100 m cells in selected areas` : "No LCZ cells in selected areas"
  };
}

function renderLczLegend() {
  const stats = lczStatsForActiveLayer();
  els.legendTitle.textContent = state.lczLayer === "grid" ? "Dominant LCZ (500 m grid)" : "LCZ classification (100 m)";
  els.legendRamp.classList.add("hidden");
  els.legendTicks.classList.add("hidden");
  els.typeLegend.classList.remove("hidden");

  els.typeLegend.innerHTML = `
    <div class="lcz-summary-note">${htmlSafe(stats.subtitle)}</div>
    ${LCZ_GROUPS.map((group) => {
      const groupCount = group.codes.reduce((sum, code) => sum + (stats.counts[code] || 0), 0);
      const rows = group.codes
        .map((code) => {
          const count = stats.counts[code] || 0;
          const share = stats.total ? `${((count / stats.total) * 100).toFixed(1)}%` : "--";
          return `
            <div class="type-swatch-row lcz-swatch-row">
              <span class="swatch" style="background:${lczColor(code)}"></span>
              <span>${htmlSafe(lczLabel(code))}</span>
              <strong>${share}</strong>
              <em>${count ? compactCount(count) : "--"}</em>
            </div>
          `;
        })
        .join("");
      return `
        <div class="type-group">
          <div class="type-group-head">
            <span class="swatch large" style="background:${group.id === "built" ? "#d85c45" : "#2f8f5b"}"></span>
            <strong>${group.label}</strong>
            <em>${compactCount(groupCount)} ${stats.unitLabel}</em>
          </div>
          <div class="type-group-list">${rows}</div>
        </div>
      `;
    }).join("")}
  `;
}

function updateLegend() {
  updateMetricButtons();
  if (state.lczLayer !== "off") {
    renderLczLegend();
    return;
  }
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
  const stats = def.category === "weather" && state.weatherSeries ? state.weatherSeries.stats : metricStats(statsLayer, state.metric);
  const periodLabel = def.category === "weather" ? ` - ${PERIODS[state.period].label}` : "";
  const timeLabel =
    def.category === "weather" && state.weatherSeries
      ? ` (${formatWeatherTime(state.weatherSeries.times[state.weatherTimeIndex])})`
      : "";
  const pairs = colorStopPairs(stats, def.ramp);
  if (!pairs.length) {
    els.legendTitle.textContent = `${def.label}${periodLabel}${timeLabel}`;
    els.legendRamp.style.background = `linear-gradient(90deg, ${def.ramp.join(", ")})`;
    els.legendTicks.innerHTML = "<span>No data</span>";
    return;
  }
  els.legendTitle.textContent = `${def.label}${periodLabel}${timeLabel}`;
  els.legendRamp.style.background = `linear-gradient(90deg, ${pairs.map(({ color }) => color).join(", ")})`;
  els.legendTicks.innerHTML = pairs
    .map(({ stop }) => `<span>${formatNumber(stop, def.unit, metricDisplayScale())}</span>`)
    .join("");
}

function detailRow(label, value) {
  return `<div class="detail-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function buildingTypeGroup(type) {
  return Object.entries(BUILDING_TYPE_GROUPS).find(([, group]) => group.types.includes(type))?.[1]?.label || "Unknown";
}

function buildingDetails(props) {
  const metric = metricDefinition();
  const activeValue = metricValueFromProperties("buildings", props, state.metric);
  return [
    detailRow("Object ID", props.objectid ?? "No data"),
    detailRow("Source ID", props.source_id ?? "No data"),
    detailRow("Grid ID", props.grid_id ?? "No data"),
    detailRow("Archetype", buildingTypeGroup(props.building_type)),
    detailRow("Subtype", TYPE_LABELS[props.building_type] || props.building_type || "No data"),
    detailRow("Height", formatNumber(props.height_m, "m")),
    detailRow("Footprint", formatNumber(props.footprint_m2, "m2")),
    detailRow("GFA", formatNumber(props.gfa_m2, "m2")),
    detailRow("Measured yearly EUI", formatNumber(metricValueFromProperties("buildings", props, "eui_2023"), "kWh/m2/yr")),
    detailRow("Energy use", formatNumber(props.energy_total_kwh, "kWh")),
    detailRow("Relative cold sensitivity", formatNumber(props.winter_pct, "%", 100)),
    detailRow("Relative hot sensitivity", formatNumber(props.summer_pct, "%", 100)),
    detailRow("Transition sensitivity", formatNumber(props.autumn_pct, "%", 100)),
    detailRow(
      "Active metric",
      metric.kind === "categorical"
        ? TYPE_LABELS[props.building_type] || props.building_type
        : formatNumber(activeValue, metric.unit, metricDisplayScale())
    )
  ].join("");
}

function gridDetails(props) {
  const metric = metricDefinition();
  const metricField = metric.category === "weather" ? weatherField() : fieldForLayer("grid_500m", state.metric);
  const activeValue = metricValueFromProperties("grid_500m", props, state.metric);
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
    const value = currentWeatherValue(props.grid_id);
    rows.push(
      detailRow(
        `${metric.label} (${PERIODS[state.period].shortLabel})`,
        formatNumber(value ?? props[metricField], metric.unit)
      )
    );
  } else if (hasMetricForLayer("grid_500m", state.metric)) {
    rows.push(detailRow("Active metric", formatNumber(activeValue, metric.unit, metricDisplayScale())));
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
    detailRow("Mean yearly EUI", formatNumber(metricValueFromProperties("building_overview_500m", props, "eui_2023"), "kWh/m2/yr")),
    detailRow("Mean energy use", formatNumber(props.mean_energy_kwh, "kWh"))
  ].join("");
}

function updateFeaturePanel(feature, type) {
  if (!els.featureTitle || !els.featureDetails) return;
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
  if (type === "lczRaw") {
    return `
      <p class="popup-title">${htmlSafe(lczLabel(props.lcz_code))}</p>
      <div class="popup-line"><span>Resolution</span><strong>100 m LCZ</strong></div>
      <div class="popup-line"><span>Region</span><strong>${htmlSafe(props.region_name || "No data")}</strong></div>
      <div class="popup-line"><span>Cells</span><strong>${compactCount(props.cell_count)}</strong></div>
    `;
  }
  if (type === "lczGrid") {
    const row = state.lczGridById.get(Number(props.grid_id));
    return `
      <p class="popup-title">500 m grid ${props.grid_id}</p>
      <div class="popup-line"><span>Dominant LCZ</span><strong>${htmlSafe(lczLabel(row?.lcz_mode))}</strong></div>
      <div class="popup-line"><span>Purity</span><strong>${formatNumber(row?.lcz_purity, "%")}</strong></div>
      <div class="popup-line"><span>Region</span><strong>${htmlSafe(row?.region_name || "No data")}</strong></div>
    `;
  }
  if (type === "building") {
    const metricValue = metricValueFromProperties("buildings", props, state.metric);
    const value =
      metric.kind === "categorical"
        ? TYPE_LABELS[props.building_type] || props.building_type || "No data"
        : formatNumber(metricValue, metric.unit, metricDisplayScale());
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
  const value =
    metric.category === "weather"
      ? currentWeatherValue(props.grid_id) ?? props[field]
      : metricValueFromProperties("grid_500m", props, state.metric);
  return `
    <p class="popup-title">500 m grid ${props.grid_id}</p>
    <div class="popup-line"><span>${label}</span><strong>${formatNumber(value, metric.unit, metricDisplayScale())}</strong></div>
  `;
}

function setSelectedFeature(feature, type) {
  if (type === "lczRaw") {
    state.selectedBuildingId = null;
    state.selectedGridId = null;
    updateFeaturePanel(feature, type);
    return;
  }
  if (type === "building") {
    state.selectedBuildingId = Number(feature.properties.objectid);
    state.selectedGridId = null;
    applyRegionFilter();
    state.map.setFilter("grid-selected", ["==", ["get", "grid_id"], -999999]);
  } else {
    state.selectedGridId = Number(feature.properties.grid_id);
    state.selectedBuildingId = null;
    state.map.setFilter("grid-selected", ["==", ["get", "grid_id"], state.selectedGridId]);
    applyRegionFilter();
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
    const resolved = await resolveOptionalHostedSourceLayer(kind);
    if (resolved) {
      addHostedSource(kind, promoteField);
      return true;
    }
  }
  if (await urlExists(dataUrl)) {
    addGeojsonSource(kind, dataUrl, promoteField);
    return true;
  }
  return false;
}

async function addLayers() {
  if (state.useHostedTilesets) {
    await resolveRequiredHostedSourceLayers();
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

  if (state.regions) {
    state.map.addSource("regions", {
      type: "geojson",
      data: state.regions
    });
  }
  if (state.lczRaw) {
    state.map.addSource("lczRaw", {
      type: "geojson",
      data: state.lczRaw
    });
  }

  if (state.fallbackSources.buildingOverview) {
    state.map.addLayer({
      id: "building-overview-fill",
      type: "fill",
      source: "buildingOverview",
      ...sourceLayer("buildingOverview"),
      maxzoom: 10.8,
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
      maxzoom: 10.8,
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

  state.map.addLayer({
    id: "lcz-grid-fill",
    type: "fill",
    source: "grid",
    ...sourceLayer("grid"),
    layout: { visibility: "none" },
    paint: {
      "fill-color": lczGridColorExpression(),
      "fill-opacity": lczGridOpacityExpression()
    }
  });
  state.map.addLayer({
    id: "lcz-grid-line",
    type: "line",
    source: "grid",
    ...sourceLayer("grid"),
    layout: { visibility: "none" },
    paint: {
      "line-color": "rgba(31, 41, 55, 0.36)",
      "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.25, 12, 0.7],
      "line-opacity": 0.82
    }
  });

  if (state.lczRaw) {
    state.map.addLayer({
      id: "lcz-100m-fill",
      type: "fill",
      source: "lczRaw",
      filter: lczRegionFilterExpression(),
      layout: { visibility: "none" },
      paint: {
        "fill-color": lczRawColorExpression(),
        "fill-opacity": 0.62
      }
    });
    state.map.addLayer({
      id: "lcz-100m-line",
      type: "line",
      source: "lczRaw",
      filter: lczRegionFilterExpression(),
      minzoom: 11.2,
      layout: { visibility: "none" },
      paint: {
        "line-color": "rgba(17, 24, 39, 0.24)",
        "line-width": 0.35
      }
    });
  }

  if (state.regions) {
    state.map.addLayer({
      id: "region-filter-fill",
      type: "fill",
      source: "regions",
      filter: regionFalseFilter(),
      layout: { visibility: "none" },
      paint: {
        "fill-color": "#003d7c",
        "fill-opacity": 0.16
      }
    });
    state.map.addLayer({
      id: "region-filter-line",
      type: "line",
      source: "regions",
      filter: regionFalseFilter(),
      layout: { visibility: "none" },
      paint: {
        "line-color": "#003d7c",
        "line-width": 1.8,
        "line-opacity": 0.82
      }
    });
  }

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
    minzoom: 10.4,
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
    minzoom: 10.4,
    filter: ["==", ["get", "objectid"], -999999],
    paint: {
      "fill-extrusion-color": "#111827",
      "fill-extrusion-height": heightExpression(),
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.92
    }
  });
  if (state.regions) {
    state.map.addLayer({
      id: "region-filter-label",
      type: "symbol",
      source: "regions",
      minzoom: 10.2,
      filter: regionFalseFilter(),
      layout: {
        visibility: "none",
        "text-field": ["get", "region_name"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 10.2, 10, 12.5, 13, 15, 15],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": false,
        "text-ignore-placement": false
      },
      paint: {
        "text-color": "#003d7c",
        "text-halo-color": "rgba(255, 255, 255, 0.92)",
        "text-halo-width": 1.8,
        "text-halo-blur": 0.2
      }
    });
  }

  state.popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 12
  });

  [
    ["buildings-extrusion", "building"],
    ["grid-fill", "grid"],
    ["lcz-grid-fill", "lczGrid"],
    ["lcz-100m-fill", "lczRaw"],
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
  applyRegionFilter();
}

async function loadData() {
  showLoading("Loading metadata...");
  const metadataResponse = await fetch("data/metadata.json", { cache: "no-store" });
  if (!metadataResponse.ok) throw new Error(`Metadata request failed: ${metadataResponse.status}`);
  state.metadata = await metadataResponse.json();
  els.buildingCount.textContent = compactCount(state.metadata.layers.buildings.count);
  els.gridCount.textContent = compactCount(state.metadata.layers.grid_500m.count);

  showLoading("Loading Singapore regions...");
  const regionResponse = await fetch("data/regions_sg.geojson", { cache: "no-store" });
  if (!regionResponse.ok) throw new Error(`Region request failed: ${regionResponse.status}`);
  state.regions = await regionResponse.json();
  renderRegionFilter();

  showLoading("Loading LCZ analysis layers...");
  await loadLczData();
  updateLczButtons();

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

    // More detailed 3D view
    center: [103.82, 1.29],
    zoom: 14.1,
    pitch: 50,
    bearing: -28,

    antialias: true,
    attributionControl: false
  });

  state.map.addControl(
    new mapboxgl.AttributionControl({
      compact: false,
      customAttribution:
        '<a class="bior-attribution" href="https://maomaohu.net/" target="_blank" rel="noopener noreferrer">🦁 NUS BIOR Lab</a>'
    }),
    "bottom-right"
  );

  state.map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
  state.map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");

  state.map.on("load", async () => {
    try {
      await loadData();
      await addLayers();
      updateLegend();
      refreshWeatherSeries();
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
    if (state.mode === "grid" && metricDefinition().category !== "weather" && !hasMetricForLayer("grid_500m", state.metric)) {
      state.metric = "energy_hot";
    }
    updateMetricButtons();
    updateMapStyle();
    updateLegend();
    refreshWeatherSeries();
  });
  els.energyMetricSelect?.addEventListener("change", () => {
    if (!els.energyMetricSelect.value) return;
    state.lczLayer = "off";
    state.metric = els.energyMetricSelect.value;
    updateMetricButtons();
    updateMapStyle();
    updateLegend();
    refreshWeatherSeries();
  });
  els.lczLayerButtons?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-lcz-layer]");
    if (!button || button.disabled) return;
    state.lczLayer = button.dataset.lczLayer || "off";
    updateMetricButtons();
    updateMapStyle();
    updateLegend();
  });
  els.searchButton?.addEventListener("click", search);
  els.searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") search();
  });
  els.heightScale?.addEventListener("input", () => {
    state.heightScale = Number(els.heightScale.value);
    updateMapStyle();
  });
  els.gridOpacity?.addEventListener("input", () => {
    state.gridOpacity = Number(els.gridOpacity.value);
    updateMapStyle();
  });
  els.weatherTime.addEventListener("input", () => {
    state.weatherTimeIndex = Number(els.weatherTime.value);
    updateWeatherTimeControls();
    updateMapStyle();
    updateLegend();
  });
  els.weatherPlay.addEventListener("click", toggleWeatherPlayback);
  (els.regionFilterLists || []).forEach((list) => {
    list.addEventListener("change", (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return;
      const groupId = input.dataset.regionGroup;
      if (groupId) {
        const ids = regionIdsForGroup(groupId);
        ids.forEach((id) => {
          if (input.checked) state.selectedRegionIds.add(id);
          else state.selectedRegionIds.delete(id);
        });
        syncRegionCheckboxes();
        applyRegionFilter();
        updateLegend();
        if (input.checked) focusRegionIds(ids, 11.9);
        return;
      }
      const id = input.dataset.regionId || input.value;
      if (input.checked) state.selectedRegionIds.add(id);
      else state.selectedRegionIds.delete(id);
      syncRegionCheckboxes();
      applyRegionFilter();
      updateLegend();
      if (input.checked) focusRegionIds([id], 13.8);
    });
  });
  (els.regionSelectAllButtons || []).forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRegionIds = new Set(regionIds());
      syncRegionCheckboxes();
      applyRegionFilter();
      updateLegend();
    });
  });
  (els.regionClearAllButtons || []).forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRegionIds = new Set();
      syncRegionCheckboxes();
      applyRegionFilter();
      updateLegend();
    });
  });
  els.resetView.addEventListener("click", () => {
    state.selectedBuildingId = null;
    state.selectedGridId = null;
    if (state.map?.getLayer("building-selected")) {
      applyRegionFilter();
      state.map.setFilter("grid-selected", ["==", ["get", "grid_id"], -999999]);
    }
    updateFeaturePanel(null);
    state.map?.flyTo({ center: [103.8198, 1.3521], zoom: 11.35, pitch: 52, bearing: -18, duration: 900 });
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
