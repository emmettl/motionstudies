# Stable dependency refresh — alpha.31

Prepared 30 September 2026. All four shared packages move together to `0.1.0-alpha.31`, published under `next`; each edition consumes exact published package versions. This is dependency maintenance, including for the paused New York and Tokyo studies.

## Versions

| Dependency | Previous baseline | Selected version |
| --- | --- | --- |
| React Three Fiber | 9.7.0 | 9.8.1 |
| React / React DOM | 19.2.8 | 19.3.0 |
| Three.js | 0.185.1 | 0.186.1 |
| React / React DOM types | 19.2.18 / 19.2.7 | 19.3.0 |
| Three.js types | 0.185.4 | 0.186.0 |
| Vite | 8.3.0 | 8.3.1 |
| Vitest | 5.0.0 | 5.0.3 |
| Oxlint | 1.82.0 | 1.86.0 |
| Fast XML parser | 5.11.1 | 5.11.2 |
| Babel parser | 7.29.8 | 7.29.9 |
| npm (packageManager and CI) | 11.19.0 | 11.21.0 |
| AWS S3 SDK (editions that use it) | 3.1131.0 | 3.1144.0 |
| Cloudflare Workers types | 5.20260911.1 | 5.20260930.2 |
| Wrangler | 4.131.1 | 4.145.0 |
| jsdom | 30.0.1 | 30.1.1 |
| Node types, existing 26.x / 22.x lines | 26.5.1 / 22.20.2 | 26.6.3 / 22.20.4 |
| DuckDB Node API (recorder) | 1.5.5-r.5 | 1.5.6-r.1 |

TypeScript 7.0.2, Playwright 1.63.0 and the Vite React plugin 6.1.1 were already current. R3F 10 prereleases are excluded. npm remains on 11.x and SunCalc remains on 1.9.0: their new major versions require separate migration review. Driftbox packages are outside this transport dependency refresh.

[R3F release notes](https://github.com/pmndrs/react-three-fiber/releases/tag/v9.8.1) cover Activity/Suspense, renderer disposal and runtime configuration fixes. The preceding 9.8.0 release adds React 19.3 support. [Vite 8.3.1](https://github.com/vitejs/vite/releases/tag/v8.3.1), [Vitest 5.0.3](https://github.com/vitest-dev/vitest/releases/tag/v5.0.3) and [Oxlint releases](https://github.com/oxc-project/oxc/releases) supply the toolchain fixes. The [Three.js 185 → 186 migration notes](https://github.com/mrdoob/three.js/wiki/Migration-Guide#185--186) were reviewed; the shared scenes do not use the changed helper APIs or custom Object3D disposal overrides.

The shared Three.js package declares the new renderer baseline in its peers. No renderer implementation changes were planned. The only shared source change since alpha.30 is the previously merged feed-observer redirect fix: Workers-compatible manual redirects are rejected without forwarding credentials.

## Validation and publication

Local type, lint and architecture checks passed, as did all 439 unit tests, 100 packed-consumer browser checks (two existing skips), 34 loader checks, the catalogue/lab build and hosting publication checks. Validation uses an isolated Node 24.21.0 / npm 11.21.0 toolchain. The final packed gate and publication dry run passed after adding the XML parser patch. [Trusted release 36779204421, attempt 2](https://github.com/emmettl/motionstudies/actions/runs/36779204421) published all four packages under `next` from commit `7d686afd11d4f39d862c1fb42acaabb720415bc8`. Every registry artifact matches its tested tarball byte-for-byte. The first attempt was cancelled before publication because the Ubuntu dependency mirror stalled. [Catalogue CI/deployment 36779205017](https://github.com/emmettl/motionstudies/actions/runs/36779205017) also passed.

## Edition adoption

The rollout uses isolated branches based on each remote `main`, preserving unrelated local work and unpushed commits. Targets: All Change, Correspondances, England, Gleislicht, Local / Express, LUFT, MANIFEST, NORIKAE, PFAD, Umlauf, Underfall, Zugunruhe and the recorder. No new data-acquisition policy, recorder-service restart or change to publication eligibility is part of this dependency update. Existing deployment workflows retain their normal data-preparation steps.

## Compatibility and transfer sizes

London and Paris extraction tests now bind the public `mapLabelBoxesOverlap` helper. Paris’s renderer adapter matches that helper call while retaining both viewport-margin guards. Gleislicht’s frequency-card test waits for its lazy-loaded translation without relaxing the expected text.

Identical-source before/after builds with the same fixtures measured roughly 15.7 KiB more compressed JavaScript from the shared/rendering dependency refresh. Each affected repository records the measured change and explicit limits in `docs/DEPENDENCIES-ALPHA-31.md`.

| Edition | JS before → after, KiB gzip | Revised JS limit | Total transfer limit |
| --- | --- | --- | --- |
| All Change | 346.9 → 362.6 | 366 KiB | 650 KiB, unchanged |
| Correspondances | 338.6 → 354.3 | 358 KiB | Base 440 KiB / opening 630 KiB (was 425 / 625) |
| Gleislicht | 359.6 → 375.2 | 380 KiB | 792 KiB, unchanged |
| Local / Express | 330.1 → 345.8 | 350 KiB | 390 KiB, unchanged |

CSS, data and optional-feature limits remain unchanged. Existing edition tests, type/lint/boundary checks, builds and budget gates pass locally. Browser coverage includes LUFT (153 passed, five existing skips), MANIFEST (35), PFAD (14, after incorporating concurrent route/replay work), Local / Express (21, one device-specific skip), Underfall (43, one existing skip), and the adapted Paris renderer (seven, one device-specific skip).

## Pushed revisions

| Repository | Dependency commit |
| --- | --- |
| allchange | [`96fe33b`](https://github.com/emmettl/allchange/commit/96fe33bf5c602f98a83836502508c490d2bcc267) |
| correspondances | [`cbf0d74`](https://github.com/emmettl/correspondances/commit/cbf0d749fc8229b3c762698529162e909206157a) |
| england | [`7f09546`](https://github.com/emmettl/england/commit/7f09546f6e64658b33b439f08c7c9b051e5ba41b) |
| gleislicht | [`5910d68`](https://github.com/emmettl/gleislicht/commit/5910d68b2eb4c78376007b42639d1c4a17986b7b) |
| local-express | [`2414264`](https://github.com/emmettl/local-express/commit/2414264501efe36473009358afd43ef57ae9a195) |
| luft | [`211b12f`](https://github.com/emmettl/luft/commit/211b12fff5615d1e3dc8d13668458569e2b0497e) |
| manifest | [`1f1698b`](https://github.com/emmettl/manifest/commit/1f1698b54d3dd3f9046db69ad6cf363175d22d5d) |
| motionstudies-recorder | [`85d7ed7`](https://github.com/emmettl/motionstudies-recorder/commit/85d7ed783db9f44d2b85343efd11c0f6eade8214) |
| norikae | [`c94a9b9`](https://github.com/emmettl/norikae/commit/c94a9b92b0b5b17388391b12162834459cc173d0) |
| pfad | [`8797ab6`](https://github.com/emmettl/pfad/commit/8797ab605b84a3d767d1b72f4d31bdc5a22cb042) |
| umlauf | [`326802d`](https://github.com/emmettl/umlauf/commit/326802ddd557460fbe51ff02c2e535502df4e857) |
| underfall | [`f4773eb`](https://github.com/emmettl/underfall/commit/f4773eb88a745ad7d9a99a5d7d89c4ba7d4d4854) |
| zugunruhe | [`491339a`](https://github.com/emmettl/zugunruhe/commit/491339a57fce7998ec5b6dcafdb2b214f4f932f3) |

Exact package integrity values and downstream pins are saved in [the release evidence](evidence/dependencies-alpha31.json).

## Hosted validation status

All dependency commits above are pushed to their remote `main` branches. At the 1 October 2026 rollout checkpoint, MANIFEST, NORIKAE and Umlauf had passed validation and both publication stages; PFAD had passed validation and Pages, with Cloudflare publishing. London’s check/build and both Chromium shards had passed, with mobile WebKit still running. Paris, LUFT, Zugunruhe and Gleislicht’s remaining browser/data/deployment jobs were still running. Gleislicht’s check job had passed all unit, build and fixture-budget gates. Follow the workflow links in the evidence snapshot for subsequent results.

GitHub refused to start hosted jobs for [England](https://github.com/emmettl/england/actions/runs/36782294956), [Local / Express](https://github.com/emmettl/local-express/actions/runs/36782553196), [Underfall](https://github.com/emmettl/underfall/actions/runs/36782362165) and [the recorder](https://github.com/emmettl/motionstudies-recorder/actions/runs/36782304999). Each annotation cites failed account payments or an Actions spending limit; no test steps ran. Their local checks passed, including the available New York and Underfall browser suites. Those hosted runs require the GitHub account issue to be resolved; publication gates were not bypassed.
