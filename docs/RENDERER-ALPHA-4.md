# Renderer alpha.4: standard selection labels

Status: published and adopted. Npm publication, all six consumer upgrades and pushing the changes were explicitly approved on 7 September 2026. The [trusted release](https://github.com/emmettl/motionstudies/actions/runs/34163520664) verified committed source `da0d24b` and published all four alpha.4 packages with provenance under the `next` tag. All six editions now pin the matching registry versions.

Selecting a station gives its label first priority. Selecting a route gives its terminal stops priority over intermediate stations, including branch endpoints and short turns. Selecting a service uses that journey's endpoints. The shared renderer applies these priorities before retained labels, ordinary ranking and collision allocation, in both geographic and diagram layouts. The canonical requirement is in [the edition contract](EDITIONS.md#selection-and-station-labels).

The implementation lives in `packages/three/src/station-labels.ts` and `NationalNetworkScene.tsx`. It reads active and reference timetables independently, so reference stop indexes do not need to match the active chunk. The independent lab now offers route selection as well as station and service selection. No public API or additional data request is required.

## Consumer adoption

The exact coordinated `@motionstudies/core`, `data`, `three` and `web` pins and registry lockfiles were updated in all six consumers. MANIFEST has no matching network station/route selection scene and is unaffected. Edition hosting arrangements are unchanged.

All Change removes its duplicate selection helper, Vite selection hooks and local regression suite now covered by the shared tests. Its upgrade also removes the double-sided ribbon and faded-layer transforms already supplied by alpha.3; London marker, density, geometry and colour adaptations remain. Correspondances retains its edition-specific density adapter, which has been checked against alpha.4. The other consumers receive the behaviour through the shared scene without application changes.

The following upgrades were pushed to each edition’s `main` branch. NORIKAE’s existing `codex/synthetic-player` branch also received the upgrade without merging its separate movement-counter change.

| Edition | Adoption commit |
| --- | --- |
| allchange | [`6925cc4`](https://github.com/emmettl/allchange/commit/6925cc43ac154a44ee309f2f2b0b9eca4d303dcc) |
| gleislicht | [`476dc50`](https://github.com/emmettl/gleislicht/commit/476dc505384c60e07cb73370ecdeb4374e7585a5) |
| correspondances | [`167e58f`](https://github.com/emmettl/correspondances/commit/167e58f1106294a9b7ea6373c98706488e2b400a) |
| local-express | [`9e07397`](https://github.com/emmettl/local-express/commit/9e07397c9c2682c5328d583c37434663ef7c0cfb) |
| umlauf | [`8970bc8`](https://github.com/emmettl/umlauf/commit/8970bc81d770a1dd39b6693cbe4e270f6f47f141) |
| norikae | [`b2ad55b`](https://github.com/emmettl/norikae/commit/b2ad55b7277bdccd175825897e8c0b6ddac9cf99) |

## Validation

- Shared types, lint and architecture checks passed; 145 unit tests passed, including branch/reverse-direction endpoints, short turns, selected-station precedence, clearing selection, retained-label competition and remapped reference stop tables.
- The packed release consumer passed public import/declaration checks, Node tooling, its production build and 12 Chromium/WebKit browser specimens (two existing mouse-only skips). The publication dry run passed without publishing.
- All six temporary edition candidates passed unit tests, lint, type checks and production builds. Their focused selection browser checks passed on dedicated production preview ports: All Change 4, Gleislicht 4, Correspondances 4, Local / Express 2, Umlauf 2 and NORIKAE 2 (18 total).

Registry installation was checked after npm completed processing the release. All six installed manifests and lockfiles resolve alpha.4 from npm with integrity hashes; no local tarballs, sibling source or workspace links remain in the editions. Their local types, lint, unit, package-boundary and production-build checks passed, along with applicable payload budgets and observation-worker checks. All Change was additionally verified from a clean archive of its exact commit so unrelated ongoing National Rail work was excluded from the release.
