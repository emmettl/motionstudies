# Opt-in edition GPU debugging

Alpha.48 adds optional public `@motionstudies/three/debug` and `debug-fiber` entry points. They have no dependency on the lab. The initial adopters are Gleislicht's Network scene and KRAFT's raw Three atmosphere and weather-detail canvases.

## Using the tools

- `?debug=capture` enables Spector.js before renderer creation. Select a renderer, capture a frame, inspect it or download the native Spector JSON.
- `?debug=perf` enables r3f-perf for registered Fiber scenes.
- `?debug=perf,capture` enables both.
- Add `&debugLoop=continuous` only when deliberately profiling continuous Fiber rendering. Natural rendering, including demand and hidden frame policies, is preserved otherwise. Raw Three renderers retain their natural policy.
- Exit using the reload link to remove all instrumentation. Measure normal performance with debugging disabled.

The controls use a shadow root. Normal URLs load neither tool, create no debug controls and register no debug timers. An idle capture requests one frame from the selected renderer. Renderer replacement/unmount removes its registration.

## Reproduction metadata

Exports retain Spector's native capture structure and add `motionstudies` metadata: edition build (with a dirty-source marker for local builds), data release, playback clock, selection, layers, drawing-buffer dimensions, pixel ratio and renderer observations. Fiber captures also include camera position, quaternion, projection and frame-loop policy. KRAFT includes its weather-detail variable, visible field layers and unfold state for the corresponding contexts.

Metadata describes the capture request; `requestedAt` and `capturedAt` bound its timing. A debug URL enables the tools but does not automatically restore arbitrary edition state. Compare a single active Fiber scene at a time because the profiler shares state. Unsupported GPU timing and renderer allocation counts do not establish GPU cost or memory reclamation.

## Release and validation

The [trusted alpha.48 release](https://github.com/emmettl/motionstudies/actions/runs/41320101094) verifies, packs and publishes all four coordinated packages under `next`. [Registry evidence](evidence/edition-debug-alpha48.json) records archive equality, integrities and tags. The pilots' lockfiles match those tested artifacts; their final adoption uses clean registry installs.

Validation includes opt-in parsing and no-op behavior outside a debug document, public export/declaration checks in an isolated tarball consumer, normal-URL lazy loading, actual frame captures, both lab overlays, edition metadata and current-renderer selection, raw Weather replacement, and the two editions' existing browser regressions. Both desktop Chromium and mobile WebKit are covered.

The shared API and consumer dependency/override setup are documented in the [package guide](../packages/README.md#optional-edition-gpu-debugging-alpha48-candidate).
