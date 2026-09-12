# Airport data and dependency refresh · 0.1.0-alpha.7

The coordinated release adds an optional live airport board with an independently controlled Study/Now mode, explicit retrieval time, bounded stale data and a return to the recorded study when live data is unavailable. Airport headers and split-flap columns have been refined. The shared Cloudflare airport service is deployed separately from npm and retains its edition/airport allowlist, paid-query budgets and private short-lived cache.

`@motionstudies/data/adsb-heatmap` consolidates recorded heatmap decoding, transport filtering, flight segmentation, snapshot/day compilation and source/chunk hashes. Endpoint enrichment now uses the same decoder. Edition scripts retain their source selection, region, clock and output paths. The new compiler preserves the existing opening/day IDs and chunk payloads on the comparison fixture and fixes southern-coordinate and non-ICAO callsign handling.

## Dependency decisions

Registry and upstream release metadata were checked on 12 September 2026. Shared build/test tooling upgrades are Vite 8.2.2 → 8.3.0, Playwright 1.62.1 → 1.63.0 and Oxlint 1.81.0 → 1.82.0. Edition upgrades additionally include AWS S3 3.1127.0 → 3.1131.0, Workers types 5.20260905.1 → 5.20260911.1, Wrangler 4.129.0 → 4.131.1 and patch releases of existing Node type versions, where used.

React and React DOM stay at 19.2.8 with matching 19.2 types: React Three Fiber 9.7.0 declares `>=19 <19.3` peers. React 19.3 is therefore held despite being a stable minor release. Three.js and its types stay on 0.185; Babel 8 and SunCalc 2 are held because they cross breaking-version boundaries. Existing compatible packages already at their latest release stay unchanged. Shared dependencies remain exact coordinated pins under npm's `next` tag.

References: [React 19.3](https://react.dev/blog/2026/09/09/react-19-3), [Fiber registry metadata](https://registry.npmjs.org/@react-three/fiber/9.7.0), [Vite 8.3](https://github.com/vitejs/vite/releases/tag/v8.3.0), [Playwright release notes](https://playwright.dev/docs/release-notes), [Oxlint 1.82](https://github.com/oxc-project/oxc/releases/tag/apps_v1.82.0).

## Validation and adoption

Local release gates passed: typecheck, lint, architecture checks, 192 unit tests, 14 publication-gate tests, 38 packed browser checks (two touch-inapplicable skips), 24 loader checks, production build and all four npm publication dry runs. The updated root dependency tree reports zero audit vulnerabilities. Edition adoption and the trusted publication run will be recorded below once completed. The intended consumers are Gleislicht, All Change, Correspondances, Local / Express, Umlauf, Norikae, Manifest, Underfall and Zugunruhe. Publication of private or gated study content is independent of dependency adoption.
