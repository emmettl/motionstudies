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

Local type, lint and architecture checks passed, as did all 439 unit tests, 100 packed-consumer browser checks (two existing skips), 34 loader checks, the catalogue/lab build and hosting publication checks. Validation uses an isolated Node 24.21.0 / npm 11.21.0 toolchain. The final packed gate and publication dry run are repeated after adding the XML parser patch. Trusted-publication and edition results will be recorded here after completion.

## Edition adoption

The rollout uses isolated branches based on each remote `main`, preserving unrelated local work and unpushed commits. Targets: All Change, Correspondances, England, Gleislicht, Local / Express, LUFT, MANIFEST, NORIKAE, PFAD, Umlauf, Underfall, Zugunruhe and the recorder. No source acquisition, recorder-service restart or change to publication eligibility is part of this dependency update.
