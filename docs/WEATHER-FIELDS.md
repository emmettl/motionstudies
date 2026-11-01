# Shared weather fields and playback

**1 November 2026 — alpha.46 published and registry-verified.** Shared infrastructure for KRAFT's weather experiments, Zugunruhe's ERA5 cloud grid and Gleislicht's satellite-derived cloud playback. Source acquisition remains offline; edition renderers retain their appearance, projection, lighting and interpretation.

## Package boundaries

| Export | Responsibility |
| --- | --- |
| `@motionstudies/core/domain/weather-field` | Validated evidence contract; native time support; scalar sampling; compatible wind components; meteorological wind conversion; percentage/validity byte pixels |
| `@motionstudies/data/weather` | Compile cached Open-Meteo location responses and decoded regular CF/NetCDF scalar grids; orient axes south-to-north; preserve masks, units and interval endpoints; percentage packing |
| `@motionstudies/three/weather-textures` | Two-frame GPU resources; changed-frame uploads; native time policy; explicit legacy brackets; deterministic seeking; idempotent disposal; scalar/validity shader helper |
| `@motionstudies/web/weather-assets` | Bounded gzip/identity decoding, decoded-byte SHA-256 verification and weather JSON validation |

The existing `core/domain/gridded-series`, `field-paths` and `daylight` remain compatible. No new source calls, recurring collector, cloud bill or renderer style is enabled by importing these modules.

## Evidence contract

A `WeatherField` has a regular latitude/longitude grid, named variables and a source ledger. Each source records publisher, URL, retrieval instant, original SHA-256, licence and attribution. Each variable explicitly declares units, evidence kind, contributing source IDs, times and frames. A height can specify value, unit and reference such as metres above ground or above sea level. Product/model version and methodological details should travel in the release's source metadata and method record; they must not be inferred from an endpoint's current defaults.

Grid rows run south-to-north and columns west-to-east. Axes have a single positive angular step. Rotated/projected grids, unequal angular spacing and antimeridian-crossing crops require explicit preprocessing rather than a false regular-grid declaration. Null is unavailable; zero and signed quantities remain valid. The reader rejects bad coordinates, UTC dates, frame dimensions, source linkage and overlapping intervals.

Each variable chooses its own time support:

- `instant`: linear temporal and bilinear spatial sampling, with exact endpoint handling and no extrapolation.
- `interval-mean`: a native average held on the explicit half-open interval. Radiation means do not turn into extra instantaneous measurements.
- `interval-total`: a native interval amount, also held with its units intact. Sampling does not silently convert energy to power.

Intervals use UTC starts plus a positive duration. Adapters require an explicit start/end timestamp convention before normalizing interval quantities. Gaps between intervals stay unavailable. Separate variables can have different resolutions and timestamps; there is no assumption that one clock position makes them equivalent measurements.

`weatherWindAt` requires m/s components with matching heights, evidence kinds, time support and native time axes, and returns null when either component is unavailable. `windFromDirection` converts meteorological wind-from bearings into east/north velocity. Any projection conversion remains with the scene. Field paths can consume these velocities as illustrative paths, never observed air-parcel or cloud trajectories.

## Offline preparation

Use the existing `@motionstudies/data/source-store` for bounded cached capture, offline replay and original response metadata. Apply the source's access terms, pacing and storage admission before collecting. The new adapters deliberately perform no HTTP requests.

`compileOpenMeteoWeather` takes explicit grid geometry, retained location responses, variable mappings and source records. It verifies coordinate placement, UTC offsets, consistent time axes, source units, lengths and duplicate locations. Select and preserve the model in the capture URL. For example, shortwave radiation from a backward-looking hourly response uses:

```js
const radiation = {
  input: 'shortwave_radiation', unit: 'W/m²', evidenceKind: 'reanalysis',
  timeSupport: 'interval-mean', intervalSeconds: 3600, timestampPosition: 'end',
}
```

`compileWeatherRaster` accepts arrays from an independently decoded NetCDF/CF source, checks regular axes and flips descending longitude/latitude axes. Explicit fill values become null. It does not decode NetCDF containers, reinterpret CF calendars, invent units or fill missing cells. Provider-specific STAC discovery and NetCDF extraction remain acquisition adapters until another producer justifies sharing them. The original file and catalogue checksum remain in the source store; compiled bytes have their own release descriptors.

A browser can decode verified static JSON with `decodeWeatherField`. `decodeWeatherBytes` also supports compact binary fields used by existing consumers. It detects retained gzip versus host-decoded responses, enforces both configured and declared decoded sizes during decompression, then checks the decoded hash. Feed the result to a format-specific validator. A failure leaves the optional weather layer unavailable; no other date is substituted.

## GPU resources

`createGridTexturePair` owns two DataTextures and stable uniforms. Its callback supplies RGBA pixels: value in R premultiplied by validity, validity in A. Float textures retain signed quantities and source units. Byte coverage textures preserve the established percentage encoding. The shared shader rejects any weighted missing neighbour rather than portraying it as clear sky.

`update(time)` uses the same native time policy as CPU sampling. A false result means the caller must hide the layer; textures retaining their last values do not establish current coverage. `invalidate()` forces reload after a variable change. `setFrames()` permits an edition's explicit, validated legacy bracket policy. `dispose()` is idempotent. The source's pixel arrays are copied into owned buffers.

Changing opacity is not changing measured cloud cover. Colours, edge feathering, procedural detail, cloud height and shadows remain authored scene choices. Gleislicht's illustrative shadows are not a radiation measurement. Atmospheric winds at 100 metres cannot be used to imply reconstructed trajectories of every cloud layer.

## Extraction and consumers

The migration patches under `scripts/weather-migrations/` are applied and tested in isolated consumer copies:

- Zugunruhe replaces its duplicated scalar reader with the existing shared gridded reader and moves texture uploads to the shared pair. Its shader, regional cover mean's fractional output and soundtrack remain unchanged. Cached ERA5 responses recompile identically for all 1,363 cells, 13 retained hours and four variables.
- Gleislicht replaces its decoded-byte verifier, percentage pixel encoder and texture upload lifecycle. Its manifest validation, native cloud artefacts, 25-frame legacy clock, shader, texture precision and illustrative shadows remain local. Existing tests verify all three recorded cloud days, wrong hashes, missingness and exact clock behaviour.

Run the consumer check with explicit source locations when sibling checkouts are elsewhere:

```sh
node scripts/check-weather-consumers.mjs --gleislicht /path/to/gleislicht --zugunruhe /path/to/zugunruhe
```

The checker builds real tarballs, installs them into isolated copies and runs the editions' checks/builds without modifying source checkouts. Measured and audio assets are read-only inputs. Registry adoption and public deployment are distinct from this check and from npm publication.

The lab's Weather specimen renders the shared GPU path and displays the same CPU reading. It contrasts interpolated cloud fraction with hourly radiation means and demonstrates exclusive ends and a missing corner. Chromium and mobile WebKit tests also run against packed production builds. Pure tests exercise source rejection, reversed axes, interval gaps, paired winds, coverage bytes, texture caching and integrity failures.

The [trusted publication](https://github.com/emmettl/motionstudies/actions/runs/41298308659) and [registry evidence](evidence/weather-alpha46.json) verify all four package archives. Registry-based edition adoption is tracked in [Gleislicht #23](https://github.com/emmettl/gleislicht/pull/23) and [Zugunruhe #1](https://github.com/emmettl/zugunruhe/pull/1).

## Remaining work

KRAFT now has a complete dated 1° European weather grid and a verified combined recorded-day release; see [KRAFT foundations](KRAFT-INFRASTRUCTURE.md). Finer grids and additional dates remain future data work. This extraction does not reconcile electricity providers or acquire pumping data. Satellite-derived cover, reanalysis, station measurements and forecasts retain distinct evidence kinds and dates. Edition adoption should pin the released package version and re-run the documented checks; the migration patches are reviewable implementation changes, not deployment permission or proof of a served revision.
