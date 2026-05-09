# Mapbox Studio Upload Notes

This site can run with the core building and 500 m grid tilesets already configured in `src/config.js`.
The WRF weather layer and low-zoom building overview layer are prepared as GeoJSON files in
`mapbox-studio-upload/` and can also be uploaded to Mapbox Studio for faster production delivery.

## Upload Files

Upload these files in Mapbox Studio Data manager:

1. `mapbox-studio-upload/03_weather_500m.geojson`
2. `mapbox-studio-upload/04_building_overview_500m.geojson`
3. `mapbox-studio-upload/05_buildings_energy_weekly.zip`
4. `mapbox-studio-upload/06_grid_energy_weekly.zip`

Recommended tileset names:

- `03_weather_500m`
- `04_building_overview_500m`
- `05_buildings_energy_weekly`
- `06_grid_energy_weekly`

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
},
buildings: {
  url: "mapbox://username.weeklyBuildingTilesetId",
  sourceLayer: ""
},
grid: {
  url: "mapbox://username.weeklyGridTilesetId",
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

## Regenerate Weekly Energy Layers

When seasonal building energy workbooks change, regenerate the two weekly-energy upload layers:

```powershell
python .\scripts\prepare_energy_weekly_layers.py `
  --source-dir "E:\Codex\sg_energy_sources_tmp" `
  --buildings-geojson "E:\Codex\sg_energy_sources_tmp\buildings_sg.geojson" `
  --grid-geojson "E:\Codex\sg_energy_sources_tmp\grid_500m.geojson" `
  --out-dir "E:\Codex\sg_energy_outputs_tmp" `
  --metadata ".\data\metadata.json"
```

Copy the generated `05_buildings_energy_weekly.geojson` and `06_grid_energy_weekly.geojson` to your local
`1.Mapbox-website\mapbox-studio-upload` folder and upload the `.zip` versions to Mapbox Studio. These files contain
raw building-level values, so keep them out of GitHub.
