window.SG_ENERGY_MAP_CONFIG = {
  mapboxAccessToken: "YOUR_PUBLIC_MAPBOX_TOKEN",
  styleUrl: "mapbox://styles/mapbox/light-v11",
  preferVectorTiles: true,
  mapboxTilesets: {
    buildings: {
      url: "mapbox://YOUR_USERNAME.YOUR_BUILDINGS_TILESET_ID",
      sourceLayer: "buildings_sg"
    },
    grid: {
      url: "mapbox://YOUR_USERNAME.YOUR_GRID_TILESET_ID",
      sourceLayer: "grid_500m"
    }
  }
};
