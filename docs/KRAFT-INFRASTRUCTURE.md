# KRAFT shared foundations and first recorded release

**1 November 2026.** Shared area/border power contracts, offline column compilation and an integrated power/weather specimen are prepared for coordinated `0.1.0-alpha.47`. The recorder compiles the frozen six-country electricity survey and a complete coarse European ERA5 grid into a reproducible private research release for 16 September UTC. Publication verification and edition adoption are recorded below when complete.

## Shared contracts

| Export | Responsibility |
| --- | --- |
| `@motionstudies/core/domain/power-series` | Area identities and scope, native interval means, source/status/category evidence, oriented physical exchanges, validation, interval/value lookup, explicit-membership sums and coverage-aware MWh integration |
| `@motionstudies/data/power-series` | Offline compilation of explicit columns: MW/GW conversion, start/end timestamp conventions, original row indices, native intervals and UTC-window selection |
| Existing `core/domain/power-day` | GB per-unit settlement, declared plans and settlement revisions; its version 1 contract stays intact |
| Existing weather/data/release modules | Grid evidence, wind components, interval radiation, verified decoding, GPU texture pairs and safe static handoffs; see [weather infrastructure](WEATHER-FIELDS.md) |

Reporting areas identify countries, bidding zones or control areas with descriptions. Geometry cannot establish their equivalence. A series retains provider category identity, evidence/status, source identity and original row indices. Physical exchanges explicitly name their positive from/to direction. Opposite-side reports remain separate series, including disagreements. The consumer chooses a report for a visual band; the core reader never deduplicates or averages them silently.

`powerIntervalAt` returns native evidence including a null value; `powerSeriesAt` returns only an available value. Both use epoch milliseconds or explicit UTC timestamps and half-open support. A missing interval and a null reported value remain unavailable. `sumPowerSeriesAt` requires explicit, unique MW-series membership and reports available/missing contributors. `integratePowerSeries` clips native support to the requested span and returns energy plus available/missing seconds and coverage. It never expands a partial total to a complete day. Percentages are excluded from power sums and energy integration.

The data compiler accepts explicit source columns rather than making provider decisions. It rejects implicit local times, unknown units, ambiguous interval conventions and overlapping data. The recorder's Energy-Charts adapter supplies the reviewed category mapping, area scope, capture validation and publication exclusions. Unexpected provider categories fail for review.

## First dated inputs

The retained electricity bytes are the twelve audited Energy-Charts responses for AT, CH, DE, FR, IT and NL. They are imported by hash into the recorder source store. Their original retrieval instant was not retained by that initial probe: `retrievedAt` remains null and the actual import instant is recorded separately. Provider generation time is preserved separately from acquisition time. Cached imports retain their identity on rerun.

Weather uses an explicit 1° sample grid, 15°W–30°E and 35–70°N: **46 × 36 = 1,656 cells**. It samples ERA5's finer underlying grid with nearest-cell selection and elevation downscaling disabled. It is a complete coarse research field, not a claim of 1° native ERA5 resolution or a terrain-resolving field. Thirty-four batches of at most fifty locations retained **3,551,478 response bytes**. Requests are spaced and cached; HTTP 429 honours a bounded `Retry-After` or stops for a later explicit resume.

The model is pinned in every capture URL. Inputs are hourly 100 m wind speed/direction, cloud fraction and shortwave radiation. The compiler derives eastward/northward wind before interpolation. Wind and cloud retain 25 instants from midnight through next midnight; radiation retains 24 preceding-hour means, shifted explicitly to interval starts. All selected cells/frames are populated. The provider vintage may contain preliminary ERA5T; a frozen release records its vintage rather than promising final reanalysis. [Open-Meteo historical documentation](https://open-meteo.com/en/docs/historical-weather-api)

## Recorded-day release

The private `kraft-recorded-day` manifest describes `power.json`, `weather.json.gz`, `sources.json` and `audit.json`, each with byte count and SHA-256. The weather descriptor also records decoded size/digest for the existing browser decoder. The complete output, including manifest, is **2,338,889 bytes**, below a 24 MiB ceiling. It contains **146 power series**; all **13,152** interval values resolve to original retained rows. Four Italian storage series have partial coverage, reported explicitly. The weather grid has four variables: wind U/V, radiation and cloud.

The compiler reads only captured objects, verifies their bytes, refuses an existing output directory and cleans failed staging output. Replaying the same captures produces a byte-identical manifest and artifacts. Release metadata does not turn unresolved rights into permission: it is marked private research, UK-related border columns are excluded, aggregate categories retain their scope, and upstream exceptions remain a public-release gate. Swissgrid/BFE material with unresolved permissions is not incorporated into this first bundle. Source data licences are distinct from the packages' MIT code licence. The Open-Meteo free-service capture is for non-commercial research; data licensing and commercial service access are separate conditions. [Open-Meteo terms](https://open-meteo.com/en/terms)

## Recorder workflow

Commands live in `motionstudies-recorder`; every destination is explicit and raw captures stay private:

```sh
npm run data:kraft:power:import -- --root /path/to/frozen-survey --ledger /path/to/kraft-sources-2026-11-01.json --store /path/to/source-store --out /path/to/power-capture.json
npm run data:kraft:weather -- --date 2026-09-16 --store /path/to/source-store --out /path/to/weather-capture.json
# Add --offline on rerun to prove the weather capture is complete without requests.
npm run data:kraft:release -- --power-capture /path/to/power-capture.json --weather-capture /path/to/weather-capture.json --store /path/to/source-store --out /path/to/new-release
npm run data:kraft:verify -- --manifest /path/to/new-release/manifest.json --store /path/to/source-store --power-capture /path/to/power-capture.json --weather-capture /path/to/weather-capture.json
```

The verifier checks every release file, decoded weather bytes, native electricity values/timestamps against the source store and a complete weather recompile. With only `--manifest`, it can verify the distributable release without access to the private store. A frozen artifact can be copied to another machine; neither browser nor compiler imports recorder source or depends on its private directory layout.

## Validation and adoption

The lab's **Power + weather** specimen shares one UTC clock between a synthetic quarter-hour exchange, hourly demand, cloud interpolation and the weather GPU path. It exercises zero crossings, missing samples, interval gaps, source inspection, hourly transitions and exclusive ends. Pixel assertions check the hourly GPU change and transparent clearing outside coverage. The lab uses invented data so the public widget lab does not redistribute the private European evidence bundle. Packed Chromium/WebKit checks run this specimen through actual package exports.

Core/data tests cover quantities, categories, signs, partial coverage, invalid provenance, timestamps and ambiguous support. Recorder tests exercise cache/offline replay, rate-limit handling, source corruption, immutable publication and deterministic outputs. The existing England/recorder compatibility gate remains a regression for the GB writer/reader contract. See the [dated release evidence](evidence/kraft-recorded-day-2026-09-16.json).

The independent KRAFT scaffold follows publication verification. It will consume exact registry pins and copied verified artifacts, keeping composition, geographic anchors, band treatments and source-selection policy in the edition. No shared power renderer is established by these foundations. The Swiss reconciliation, pumping, regional PV and geometry questions remain in the [data survey](KRAFT-SURVEY.md).
