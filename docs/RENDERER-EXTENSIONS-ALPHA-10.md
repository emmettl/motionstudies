# Renderer extensions — alpha.10

`0.1.0-alpha.10` adds typed extension points to `@motionstudies/three`. Default rendering remains unchanged. Editions can provide behaviour without rewriting compiled renderer functions.

## Public contracts

Import `useNetworkScene` and the extension types from `@motionstudies/three/scene-extensions`.

- `NationalNetworkScene.children` renders inside the Canvas. `useNetworkScene()` supplies current scene props, projection, projected stops and paths, and lake detours. These are read-only and follow spatial layout changes. Layers should follow the existing playback clock and must not add another `onTime` reporter.
- `extensions.trainPosition` overrides train interpolation. Return `undefined` for shared interpolation, `null` to hide a journey, or a projected point. Swarms, trails, labels, selection markers and camera targeting share the resolver. Replacing the callback invalidates paused caches.
- `extensions.roadConditions` supplies the road-condition sampler.
- `extensions.createTrailBackend` supplies optional asynchronous trail computation. Its constructor must be pure. The renderer resets datasets, selects a visibility key, submits time and train IDs, consumes frames and disposes the backend. An unavailable backend uses synchronous trails. The backend must reject stale results after selection or dataset changes, allow reset after disposal and make disposal idempotent. Counts describe line segments, with two RGB vertices per segment. Invalid frames are rejected before any geometry is changed. A backend used with a custom train resolver must implement equivalent positioning.
- `extensions.createCameraDriver` receives the perspective camera, mutable renderer target and projection. Its `update(delta)` returns true while it owns a frame and false to resume the normal camera. The renderer disposes it on replacement, projection changes or unmount.
- `NationalNetworkScene.frameloop` exposes the Canvas scheduling mode, allowing an edition to suspend an obscured atlas.
- `HubPulseScene.flowPolicy` optionally supplies flow eligibility, cycle offset and particle visibility. Omitted callbacks retain the shared policy.

Keep extension factories and policy objects stable outside rendering, or memoize them. This avoids unnecessary backend and camera lifecycle restarts.

## Edition migration

All Change moves its bus position cache, road sampler, quiet map, National Rail layer and hub flow rules onto these contracts. Its motion, performance and National Rail renderer rewriting plugins are removed.

Gleislicht moves its trail worker, atlas flight camera and road sampler onto these contracts. Its performance and orbital renderer rewriting plugins are removed.

Correspondances renders its Paris arc layer as a scene child, removing that injection from its layout adapter.

Edition-specific visual styling, picking and Paris geometry morphing still use adapters. This release removes five complete rewriting plugins and several injections; it does not yet eliminate every renderer transform.

## Verification

Shared browser regressions cover projection updates, child cleanup, resolver replacement and fallback, camera ownership and disposal, asynchronous trail frames and synchronous fallback. Trail-frame unit tests verify active-buffer uploads and atomic rejection of invalid frames. Edition regressions exercise their actual worker, camera, rail and spatial-layout integrations.

## Publication and adoption

All four packages were published as `0.1.0-alpha.10` under the npm `next` tag on 13 September 2026. [PR #4](https://github.com/emmettl/motionstudies/pull/4) merged as `741bdb4`; [trusted publication](https://github.com/emmettl/motionstudies/actions/runs/34748536561) passed verification and publication with npm provenance.

| Edition / main | Adoption commit | Validation |
| --- | --- | --- |
| All Change | `ddf6220` | 280 unit tests, typecheck, lint, registry boundaries, build and transfer budgets; 12 Chromium/WebKit rail, bus and renderer checks |
| Correspondances | `bba2eaa` | 25 unit tests, typecheck, lint, registry boundaries, build and all layer/transfer budgets; 18 Chromium/WebKit arc, morph, airport and renderer checks |
| Gleislicht | `455ba82` | 1,410 unit tests after incorporating concurrent main changes, typecheck, lint, registry boundaries, build and transfer budgets; worker/paused geometry checks and 4 passing orbital handover checks |

The shared release passed 223 unit tests, 72 packed browser specimens (2 touch-inapplicable tests skipped), and all 32 loader/extension browser checks. Final edition installations use registry lockfiles with integrity hashes. All 83 compiled JavaScript files from the four installed packages match the browser-tested candidate byte for byte. The initial orbital test failure was caused by absent generated movement fixtures in the isolated checkout; preparing the normal data fixtures resolved it on Chromium and WebKit.

The London, Paris and Swiss main branches are pushed. Their existing hosted deployment workflows run separately from the completed local validation above. Other editions retain alpha.9 in this pass because they do not need these extension integrations. Visual styling, picking, Paris geometry morphing, shared search behaviour and general tooling consolidation remain future work.
