# Renderer alpha.4: standard selection labels

Status: npm publication, all six consumer upgrades and pushing the changes were explicitly approved on 8 September 2026. Trusted release verification and adoption are in progress; registry pins change only after publication succeeds.

Selecting a station gives its label first priority. Selecting a route gives its terminal stops priority over intermediate stations, including branch endpoints and short turns. Selecting a service uses that journey's endpoints. The shared renderer applies these priorities before retained labels, ordinary ranking and collision allocation, in both geographic and diagram layouts. The canonical requirement is in [the edition contract](EDITIONS.md#selection-and-station-labels).

The implementation lives in `packages/three/src/station-labels.ts` and `NationalNetworkScene.tsx`. It reads active and reference timetables independently, so reference stop indexes do not need to match the active chunk. The independent lab now offers route selection as well as station and service selection. No public API or additional data request is required.

## Consumer adoption

Update the exact coordinated `@motionstudies/core`, `data`, `three` and `web` pins to `0.1.0-alpha.4` in Gleislicht, All Change, Correspondances, Local / Express, Umlauf and NORIKAE, then generate each lockfile from npm after publication. Keep the private proofs' existing publication gates. MANIFEST has no matching network station/route selection scene and is unaffected.

All Change removes its duplicate selection helper, Vite selection hooks and local regression suite now covered by the shared tests. Its upgrade also removes the double-sided ribbon and faded-layer transforms already supplied by alpha.3; London marker, density, geometry and colour adaptations remain. Correspondances retains its edition-specific density adapter, which has been checked against alpha.4. The other consumers receive the behaviour through the shared scene without application changes.

The local review bundle contains six scoped patches for the edition manifests, documentation and London adapter cleanup. It excludes registry lockfiles until the release exists and preserves unrelated edition work. Temporary consumer copies install the actual candidate tarballs; no sibling source, workspace links or file dependencies are introduced into the edition repositories.

## Validation

- Shared types, lint and architecture checks passed; 145 unit tests passed, including branch/reverse-direction endpoints, short turns, selected-station precedence, clearing selection, retained-label competition and remapped reference stop tables.
- The packed release consumer passed public import/declaration checks, Node tooling, its production build and 12 Chromium/WebKit browser specimens (two existing mouse-only skips). The publication dry run passed without publishing.
- All six temporary edition candidates passed unit tests, lint, type checks and production builds. Their focused selection browser checks passed on dedicated production preview ports: All Change 4, Gleislicht 4, Correspondances 4, Local / Express 2, Umlauf 2 and NORIKAE 2 (18 total).

Publish through the existing trusted `release.yml` workflow after approval and committed-source verification. Then apply the reviewed consumer patches, install alpha.4 from the registry to regenerate their lockfiles, and run the edition boundary/regression checks. Local candidate validation does not itself publish or deploy any edition.
