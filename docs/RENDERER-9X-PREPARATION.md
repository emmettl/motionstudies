# Renderer preparation on stable Fiber 9

`codex/renderer-9x-preparation` keeps the workspace and lab on exact
**@react-three/fiber 9.8.2**, React 19.3.1 and Three 0.186.1. The shared Three
package advertises the validated `^9.8.2` peer range. This is the preparation
candidate intended to land before Fiber 10; it is not an npm publication or an
edition dependency rollout. The separate [v10 prototype](https://github.com/emmettl/motionstudies/pull/59)
retains the release-specific experiment.

## Changes available on 9.x

- `@motionstudies/three/webgl-study` re-exports the real stable Canvas, useFrame
  and useThree APIs as `WebGLStudyCanvas`, `useWebGLStudyFrame` and
  `useWebGLStudyState`. Shared scenes, the lab terrain/probe and extension fixtures
  use this boundary. It explicitly owns WebGL; it does not implement another
  reconciler, timer or renderer. The future v10 port changes this single typed
  import boundary to `/legacy`.
- `@motionstudies/three/frame-state` exposes `frameRenderer(state)` and
  `frameElapsed(state)`. They preserve renderer identity and the existing canvas
  clock origin. They accept both the stable `gl`/`clock.elapsedTime` shape and the
  future `renderer`/`elapsed` shape. Reading elapsed time never advances a clock;
  zero is valid and missing/nonfinite time is rejected. All shared frame consumers
  use these helpers. Application-owned timetable/replay clocks stay separate.
- Camera scheduling has one private `useCameraFrame` boundary. It retains Fiber
  9's supported negative priority so camera transforms precede label and pick
  projection. The future v10 change is localized here, replacing that priority
  with the input phase. No v10 scheduler object is passed to a 9.x hook.
- The luminous sprite/line/halo factories, portable gradient textures, explicit
  additive output profile and three-backend raw-Three comparison scene work on
  the 9.x dependency baseline. Node materials remain an explicit opt-in, with
  their own renderer; the shared network/hub/station scenes retain WebGL.
- Lightweight opt-in renderer counters replace the r3f-perf/Drei dependency
  chain on 9.x already. Spector capture and node diagnostics retain their scopes.
- The frozen packed-consumer harness, isolated loader-server settings, renderer
  inventory and bundle/evidence tools also land in this preparation candidate.

A downstream layer can adopt the public boundary after a coordinated shared
release publishes these exports:

```tsx
import { useWebGLStudyFrame as useFrame, useWebGLStudyState as useThree } from '@motionstudies/three/webgl-study'
import { frameElapsed, frameRenderer } from '@motionstudies/three/frame-state'

function Overlay() {
  const state = useThree()
  const renderer = frameRenderer(state)
  useFrame((frame, delta) => {
    const elapsed = frameElapsed(frame)
    // Use elapsed/delta for presentation work; the edition owns its study clock.
    void renderer; void elapsed; void delta
  })
  return null
}
```

The register's local edition inventory remains a dated inspection. It does not
claim that those checkouts already consume these unpublished exports. Keep exact
published pins in editions and adopt through their own checks after release.

## Changes deferred to v10

The `/legacy` entry, default node Canvas configuration, v10 frame-state typing,
and phase-based camera ordering are release-specific changes. They stay on the
v10 prototype branch. The 9.x candidate neither imports `/legacy` nor widens its
peer contract to claim v10 support. The v10 default-Canvas fixture is replaced
here with `gpu-study.html`, which exercises the public WebGL boundary on 9.x.

Fiber 9 itself constructs Three's deprecated `Clock` internally. The preparation
reads that existing public clock without advancing or replacing it; eliminating
the dependency's internal Clock construction requires the later Fiber upgrade.

Full shared-scene node ports, custom edition layers, authored appearance review
and physical-phone memory/frame/thermal checks remain adoption gates in the
[readiness register](RENDERER-READINESS.md).

## Verification

`npm run typecheck` includes `check:renderer-compat`, an AST check that keeps
version-sensitive state access, Fiber imports and ordered scheduling inside their
named boundaries. It also verifies the stable dependency pins and peer range.

```sh
npm run typecheck
npm test
npm run lint
npm run check:architecture
npm run build
npm run check:packed -- renderer-readiness.spec.ts motion-backends.spec.ts gpu-diagnostics.spec.ts recent-components.spec.ts gpu-lifecycle.spec.ts lab.spec.ts
MOTION_LOADERS_PORT=4183 npm run test:loaders
npm run readiness:native
```

The current candidate results are in
[evidence/renderer-9x-validation.json](evidence/renderer-9x-validation.json).
Earlier `renderer-v10-*` evidence belongs to the independently tested v10
prototype and is retained as historical evidence, not relabelled as a 9.x pass.

On 1 November, this preparation passes typechecking (including the compatibility
boundary check), architecture, lint and build, 548 unit tests and 16 hosting tests.
The frozen tarball run passes all 71 selected scene, lifecycle, diagnostic and
backend cases across Chromium, desktop WebKit and mobile WebKit. The loader and
extension suite passes all 40 cases; strict native WebGPU passes all eight cases.
This is a fresh 9.x validation of the affected scope, not a reused v10 suite result.
Lint retains the pre-existing unused `extname` warning in the architecture script.

Final fixture captures are retained for
[legacy WebGL](evidence/renderer-9x-legacy-scene.png),
[node WebGL 2](evidence/renderer-9x-webgl2-scene.png) and
[native WebGPU](evidence/renderer-9x-webgpu-scene.png), with
[static bundle observations](evidence/renderer-9x-bundles.json).
