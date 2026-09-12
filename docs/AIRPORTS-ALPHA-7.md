# Airport data and dependency refresh · 0.1.0-alpha.7

The coordinated release adds an optional live airport board with an independently controlled Study/Now mode, explicit retrieval time, bounded stale data and a return to the recorded study when live data is unavailable. Airport headers and split-flap columns have been refined. The shared Cloudflare airport service is deployed separately from npm and retains its edition/airport allowlist, paid-query budgets and private short-lived cache.

`@motionstudies/data/adsb-heatmap` consolidates recorded heatmap decoding, transport filtering, flight segmentation, snapshot/day compilation and source/chunk hashes. Endpoint enrichment now uses the same decoder. Edition scripts retain their source selection, region, clock and output paths. The new compiler preserves the existing opening/day IDs and chunk payloads on the comparison fixture and fixes southern-coordinate and non-ICAO callsign handling.

## Dependency decisions

Registry and upstream release metadata were checked on 12 September 2026. Shared build/test tooling upgrades are Vite 8.2.2 → 8.3.0, Playwright 1.62.1 → 1.63.0 and Oxlint 1.81.0 → 1.82.0. Edition upgrades additionally include AWS S3 3.1127.0 → 3.1131.0, Workers types 5.20260905.1 → 5.20260911.1, Wrangler 4.129.0 → 4.131.1 and patch releases of existing Node type versions, where used.

React and React DOM stay at 19.2.8 with matching 19.2 types: React Three Fiber 9.7.0 declares `>=19 <19.3` peers. React 19.3 is therefore held despite being a stable minor release. Three.js and its types stay on 0.185; Babel 8 and SunCalc 2 are held because they cross breaking-version boundaries. Existing compatible packages already at their latest release stay unchanged. Shared dependencies remain exact coordinated pins under npm's `next` tag.

References: [React 19.3](https://react.dev/blog/2026/09/09/react-19-3), [Fiber registry metadata](https://registry.npmjs.org/@react-three/fiber/9.7.0), [Vite 8.3](https://github.com/vitejs/vite/releases/tag/v8.3.0), [Playwright release notes](https://playwright.dev/docs/release-notes), [Oxlint 1.82](https://github.com/oxc-project/oxc/releases/tag/apps_v1.82.0).

## Validation and adoption

Local release gates passed: typecheck, lint, architecture checks, 192 unit tests, 14 publication-gate tests, 38 packed browser checks (two touch-inapplicable skips), 24 loader checks, production build and all four npm publication dry runs. The updated root dependency tree reports zero audit vulnerabilities. All four packages were published with provenance under `next` from `ed80cb5` through the [trusted release workflow](https://github.com/emmettl/motionstudies/actions/runs/34711907900). Registry metadata was verified for every package. The upgraded consumers are Gleislicht, All Change, Correspondances, Local / Express, Umlauf, Norikae, Manifest, Underfall and Zugunruhe. Publication of private or gated study content is independent of dependency adoption.

## Edition adoption

All consumers install exact `0.1.0-alpha.7` versions from npm with registry URLs and integrity hashes in their lockfiles. Local type, lint, unit, architecture/boundary, production-build, worker and budget gates passed wherever the edition declares them. Authored datasets and their publication gates remain unchanged.

| Edition | Adoption commit | Browser validation |
| --- | --- | --- |
| Gleislicht | `4b5b700` | 4 airport/rendering cases |
| All Change | `ad7e2ec` | 2 airport interaction cases |
| Correspondances | `75a501f` | 18 airport and air-loader cases |
| Local / Express | `16c6cd7` | 19 successful cases, one touch-inapplicable skip |
| Umlauf | `ae69fc0` | 30 cases |
| Norikae development | `58f64bd` | 14 cases |
| Norikae main | `c20406a` | 12 cases |
| Manifest | `db51197` | 31 cases |
| Underfall | `79cb148` | No browser suite declared |
| Zugunruhe | `72a1755` | 14 graphics and navigation cases |

Gleislicht and Correspondances now call `ingestAdsbHeatmaps` from their existing scripts; both retain their flags, source defaults and legacy ID choices. The installed registry package reproduces the original comparison fixture's aircraft indexes and byte-identical day chunks. All Change already consumes shared endpoint enrichment.

The Norikae browser check exposed a keyboard-scrubbing race when Home is pressed at the current minimum: the range value may not change, so its change handler cannot pause playback. Both branches now pause on navigation-key intent and pass their complete suites. Local / Express's progressive-load case passed on retry and was then rerun independently without retries; it passed. Busy development ports were bypassed using temporary test configurations, without stopping existing previews.

Underfall has no configured Git remote, so its validated upgrade is committed locally. The other adoption commits are pushed to their existing remote branches. Gleislicht's working checkout was fast-forwarded after preserving and restoring its unrelated edits. The duplicate Gleislicht clone is not a separate edition. Private/gated content publication remains controlled by each edition's existing workflow.

The production lab now calls the airport service at `motionstudies.app`; local development retains the same-origin proxy. Six live-airport browser cases passed against the production preview in Chromium and WebKit.
