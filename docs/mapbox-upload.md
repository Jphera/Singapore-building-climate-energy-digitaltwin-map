# Mapbox Studio Upload Notes

This site can run with the core building and 500 m grid tilesets already configured in `src/config.js`.
The WRF weather layer and low-zoom building overview layer are prepared as GeoJSON files in
`mapbox-studio-upload/` and can also be uploaded to Mapbox Studio for faster production delivery.

## Upload Files

Upload these files in Mapbox Studio Data manager:

1. `mapbox-studio-upload/03_weather_500m.geojson`
2. `mapbox-studio-upload/04_building_overview_500m.geojson`

Recommended tileset names:

- `03_weather_500m`
- `04_building_overview_500m`

After each upload finishes processing, open the tileset detail page and copy the tileset URL, for example
`mapbox://username.tilesetid`.

## Update Frontend Config

Edit `src/config.js` after Mapbox Studio processing finishes:

```js
weather: {
  url: "mapbox://username.weatherTilesetId",
  sourceLayer: ""
},
buildingOverview: {
  url: "mapbox://username.overviewTilesetId",
  sourceLayer: ""
}
```

Leaving `sourceLayer` empty is intentional. The app fetches the TileJSON metadata and resolves the real
Mapbox source-layer id automatically. If a network policy blocks this request, fill in the source-layer id shown
in Mapbox Studio.

## Mapbox Token

Do not commit unrestricted Mapbox tokens. This public demo uses a browser-side Mapbox public token; restrict it in
Mapbox account settings to the production domains before sharing the site:

- `https://urbandt.org/*`
- `https://www.urbandt.org/*`
- optional local testing URLs such as `http://127.0.0.1:8765/*`

If the configured token is removed or invalid, the app falls back to the startup dialog and stores the pasted public
token only in the browser's local storage.

## Regenerate Upload Layers

Run this from the repository root when the WRF CSVs or building/grid data change:

```powershell
python .\scripts\prepare_mapbox_layers.py `
  --grid-geojson "F:\博士文件\石老师课题组\第四篇小论文-城市能碳计算\1.Mapbox-website\data\grid_500m.geojson" `
  --buildings-geojson "F:\博士文件\石老师课题组\第四篇小论文-城市能碳计算\1.Mapbox-website\data\buildings_sg.geojson" `
  --wrf-root "F:\博士文件\石老师课题组\第四篇小论文-城市能碳计算\WRF模拟结果文件" `
  --metadata ".\data\metadata.json" `
  --out-dir ".\mapbox-studio-upload" `
  --timeseries-out-dir ".\data\weather-timeseries"
```

The `mapbox-studio-upload` files are spatial layers for Mapbox Studio. The `data/weather-timeseries` JSON files are
used directly by the website for the WRF hourly slider and do not need to be uploaded to Mapbox Studio.
