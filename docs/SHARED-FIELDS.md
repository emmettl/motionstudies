# Shared estimated fields, gridded series, field paths and daylight

[Package contracts](../packages/README.md#estimated-fields-gridded-series-field-paths-and-daylight) · [Zugunruhe brief](ZUGUNRUHE.md) · [National study](NATIONAL-STUDY.md#a-second-axis-power-weather-and-light) · [Release process](RELEASING.md)

**Prepared 13 September 2026 in the shared workspace; not yet published.** This is the first shared extraction justified by a non-transport work. It is recorded here before any version is assigned so that the reason for the shared code precedes its release.

## Why

Zugunruhe consumed only the shared design tokens. Its continental estimate, currents, cloud context and daylight were local vanilla JavaScript with their own tests, even though they implement rules the series has since adopted generally: a smooth surface must expose where its evidence weakens; missing values stay missing; illustrative flow is not a trajectory; a rendering's softness is set by the measurement, not by taste.

The [national study](NATIONAL-STUDY.md) proposes a second axis alongside transport: measured generation at named stations, demand estimated between grid supply points, rain radar, model wind and the sun's terminator. Those are the same four behaviours. Two works needing the same code is the series' admission test for shared code, so the models move into `@motionstudies/core` and Zugunruhe becomes a consumer like the transit editions.

## What moved

Source: [Zugunruhe `3a85e47`](https://github.com/emmettl/zugunruhe/commit/3a85e47), `src/continent-model.js`, `src/currents-model.js`, `src/cloud-model.js` and `src/daylight.js`, with their `node:test` suites ported to Vitest.

| Shared module | Origin | Behaviour retained | What changed |
| --- | --- | --- | --- |
| `core/domain/supported-field` | `continent-model.js` | Haversine distance; Gaussian neighbour weight with a smooth taper to finite reach; support fading from the nearest contributing station; null values excluded, zero retained; east/north blending; south-to-north grid rows; a station can be withheld for holdout tests | Kernel, reach and support distances are `FieldSupportOptions` (defaults equal the original 90/180/240/120/240 km). Levels are a parameter, not fifteen altitude bands. Values keep their units instead of dividing by 100. Unavailable channels are NaN rather than −1 or 0. `vectorSupport` is reported separately, and the `movement` flag reproduces the original movement grid |
| `core/domain/gridded-series` | `cloud-model.js` | Adjacent-frame bracketing with exact endpoints; bilinear/linear reading; any missing weighted sample makes the reading unavailable; area-weighted mean | Generic over variable keys; the mean returns source units and takes an optional valid range instead of assuming 0–100 percent cover |
| `core/domain/field-paths` | `currents-model.js` | Explicit midpoint integration; refusal to start from, cross or land on unsupported field; trail segments with end fades that restore identically when scrubbing | `secondsPerStep` replaces the fixed five-minute study unit; tracks carry a `level` rather than a band; readings use `{value, vector, support}` |
| `core/domain/daylight` | `daylight.js` | Sun direction in the same scene frame; twilight, warmth and daylight envelopes | Place is a parameter rather than a fixed site. The solar position is implemented directly from the Astronomy Answers algorithm so core keeps zero dependencies; it matches SunCalc 1.9 to a thousandth of a degree at five instants across seasons and hemispheres. Envelope thresholds are options |

Retained in the edition: the per-band uniform wind shader, five-minute profile interpolation with its first-five-band mean, the Three.js field, currents and atmosphere renderers, the site's data files and compositions. Bilinear grid reading, previously a currents function, now lives beside the grid it reads.

## Specimen and validation

The lab's **Published day** specimen opens a trimmed copy of the day compiled from the recorded national hour (three slices, two small operators) through `@motionstudies/core/domain/published-day`, draws a slice's cells, lets a cell be picked for its members, and opens one member's pack to draw its track and read its journey at the slice; every figure shown is read from the files. Its browser test descends from the manifest to a cell to one vehicle and moves between slices.

The lab's **Fields** specimen exercises all four modules with a synthetic archipelago: seven instruments on a 0.1° grid, one silent for part of the study, one without vectors, an invented cover series rendered as haze, trails that end where support ends, and a terminator crossing from the east as the clock advances. Brightness is the estimate, opacity is support; clicking reads the estimate, cover and sun altitude at a place. Its browser test checks a supported reading beside an instrument, an unsupported reading beyond reach, the effect of widening the kernel, and the silent instrument appearing and disappearing with the clock.

Workspace validation on 13 September 2026: 296 shared unit tests; core, lab and test typechecks; lint; architecture boundaries; the packed-consumer check including the new browser specimen in Chromium and WebKit. These are local results, not a published release.

## Adoption

1. Publish in the next coordinated alpha with the ordinary release workflow. Nothing here publishes on its own.
2. Zugunruhe adopts the exact published version, replaces the four local modules with imports, keeps its renderers, and re-runs its three-night audit to confirm identical fields. The −1 texture sentinel and the density-per-hundred normalisation become renderer concerns during that adoption.
3. The national study consumes the same modules for demand haze between grid supply points, weather grids and the terminator, with its own kernel scales recorded as part of each field's provenance.

Adoption is recorded separately from publication, as with the transit editions.
