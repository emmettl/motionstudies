# Shared WebGPU adapters

Coordinated alpha.49 adds opt-in node-renderer support to `@motionstudies/three`.
The existing WebGL scene components and their default backend are unchanged.
Hydraulic solvers, data releases and water appearance remain edition-owned.

Published under `next` through [trusted run 41337297853](https://github.com/emmettl/motionstudies/actions/runs/41337297853).
All four registry tarballs and tags are [verified against CI](evidence/webgpu-alpha49-release.json).
The release passes 538 unit tests, 276 packed browser checks (2 skipped) and
40 loader checks. Local native verification additionally confirms 36 matching
point/line pixel-result cases across legacy WebGL, node WebGL 2 and native WebGPU.

## Windowed motion

`three/motion-lerp` exposes the existing `createMotionUniforms`,
`createMotionLerp` and `applyMotionLerp` contract without loading node materials.
Existing imports from `three/render-performance` continue to work.

`three/motion-lerp-nodes` supplies `createMotionLerpNodes(uniforms)` and
`applyMotionLerpNodes(material, nodes)` for regular `PointsNodeMaterial` and
`LineBasicNodeMaterial` objects on either WebGPURenderer backend. Both adapters
consume the same mutable clock/stale objects and the vertex-aligned `position`,
`positionTo` and `motionTime` attributes. Update the shared clock before rendering;
no per-frame attribute upload or material rebuild is needed.

Interpolation clamps to each vertex's time window, with the same 1e-3 minimum
span as the legacy shader. A reversed window hides an empty slot. A vertex is
hidden only outside the inclusive early/late stale tolerance. Hiding moves it
outside clip space on both backends. CPU picking still uses `scenePickVertex`
and `setSceneMotionClock`; scheduling and evidence validity do not change.

The node adapter owns `positionNode` and `vertexNode`. Instanced sprites, skinned
meshes and wide-line materials have different vertex contracts and are not
covered. Native WebGPU point primitives remain one pixel; larger glyphs need a
separate sprite implementation, not a promise of legacy point-size parity.

`lab/gpu-motion.html` renders points and line segments into a small GPU target.
Twelve cases cover interpolation/clamping, both stale boundaries, reversed and
zero-duration windows, the minimum span and backward seeking. Browser checks
compare actual pixel counts and centres with the legacy renderer. `backend=auto`
uses the available node backend; `backend=webgpu` rejects silent fallback and is
used for native verification on a capable machine. No simulation files are made.

## Node-renderer diagnostics

Import `prepareNodeDebug` from `@motionstudies/three/debug-nodes`:

```ts
const debug = await prepareNodeDebug({ edition: 'example', build: sourceBuild })
const renderer = new WebGPURenderer()
await renderer.init()
await debug?.observe(renderer) // before creating materials/GPU resources
// Create application resources, scene and camera.
debug?.mount({
  label: 'Live scene',
  redraw: () => renderer.render(scene, camera),
  metadata: () => ({ playbackTime: clock.time, playing: clock.playing }),
})
// During application teardown, before renderer.dispose():
debug?.dispose()
```

No recognized debug flag means no runtime/tool import, renderer retention,
controls or timer. With `debug=perf` or `debug=capture`, the panel can save renderer
observations, application/build metadata, generated WGSL/GLSL and GPU errors.
The counters are Three's observations and memory estimates, not GPU timings.
Reports do not read back GPU fields, compile extra programs, render or advance
application time. Error hooks chain existing handlers; teardown restores only
hooks still owned by the session, without overwriting later application hooks.
Storage is bounded to 64 shader builders and the latest 32 errors.

`debug=capture` imports Spector only for the **actual WebGL 2 fallback** and spies
on its real context. Capturing an idle frame invokes the supplied redraw once;
normal application frames remain responsible for simulation passes. Native
WebGPU offers diagnostics and WGSL, with WebGL capture explicitly disabled.
One session observes one initialized renderer. The existing `three/debug` and
`three/debug-fiber` APIs remain available for the legacy WebGL renderer/Fiber.

Exit debugging reloads without the instrumentation. Renderer policy, automatic
backend selection and playback ownership stay with the consumer. Schwall's
node-fluid preview is the first adopter; its numerical model stays in Schwall.

## Readiness primitives and composed scene

The **unpublished stable `codex/renderer-9x-preparation` candidate** adds public
building blocks for preserving the luminous family on a node renderer while
retaining Fiber 9.8.2. See [the stable preparation plan](RENDERER-9X-PREPARATION.md). Alpha.49's published adapters
and evidence above remain historical release facts. See the
[edition readiness register](RENDERER-READINESS.md) for the independent migration gates.

| Public entry | Contract |
| --- | --- |
| `three/motion-sprites` | Instanced quad geometry, mutable clock/stale/viewport/opacity objects, CPU position sampling and screen-space picking. |
| `three/luminous-materials` | Legacy GLSL sprite material and additive thin line material. |
| `three/luminous-materials-nodes` | Matching node sprite and thin line materials, targeting native WebGPU or node WebGL 2. |
| `three/luminous-output` | Explicit display-space additive output binding for flat luminous scenes, with renderer state restored after each draw. |
| `three/light-textures` | The authored family orb/halo/spark and glow gradients, snapshotted as portable RGBA DataTextures. |
| `three/debug-performance` | Opt-in WebGL study-canvas CPU cadence and Three resource counters. No extra canvas or GPU timing claim. |

The sprite contract has one instance per glyph: local `positions`, `positionsTo`,
`windows` (study seconds), linear RGB `colours`, and `sizes` (CSS-pixel diameter).
A selection halo can use the same geometry/motion contract with a larger size,
its own opacity and the authored halo texture. Instanced quads retain variable
screen sizes on native WebGPU, independent of point-primitive restrictions.

The texture factories snapshot the existing painted gradients to explicit unpremultiplied RGBA bytes, stored bottom-first with `flipY=false`. This avoids differing external-canvas colour/alpha conversion between WebKit's WebGL and native WebGPU uploads; the authored orientation and gradients are retained.

Both materials interpolate the same windows, clamp progress, use the same 1e-3
minimum span, and hide reversed/expired slots. The CPU picking helper follows the
same clock and camera instead of raycasting the unmoved source quad. Update
`uniforms.viewport.value` to the CSS canvas size on every resize; DPR does not
change that contract. Mutating the clock changes no instance attributes. Instance
attributes can be updated explicitly for new windows/data, with `needsUpdate`.

```ts
import { Mesh } from 'three'
import { createMotionSpriteGeometry, createMotionSpriteUniforms } from '@motionstudies/three/motion-sprites'
import { createLuminousSpriteNodeMaterial } from '@motionstudies/three/luminous-materials-nodes'
import { createMotionLightTexture } from '@motionstudies/three/light-textures'
import { createLuminousOutput } from '@motionstudies/three/luminous-output'

const uniforms = createMotionSpriteUniforms()
uniforms.viewport.value.set(canvasCssWidth, canvasCssHeight)
const geometry = createMotionSpriteGeometry(instanceData)
const texture = createMotionLightTexture('orb')
const output = createLuminousOutput()
const material = createLuminousSpriteNodeMaterial(uniforms, texture, output)
const mesh = new Mesh(geometry, material)
mesh.frustumCulled = false // The shader moves instances beyond the source quad's bounds.
// Before drawing: uniforms.clock.value = canonicalStudyTime
// Draw this flat scene: output.render(renderer, scene, camera)
// Teardown: geometry.dispose(); material.dispose(); texture.dispose()
```

Three's node renderer normally composites in linear space before display conversion;
legacy WebGL additive layers convert each material before blending. Offscreen
linear-target comparisons alone miss the stronger halo this can create on screen.
`createLuminousOutput` makes the legacy display-space choice explicit: pass its
binding to **every** node sprite/line material in that flat scene and draw through
`output.render`. It encodes those colours before additive canvas blending, adjusts
the clear colour, and restores the renderer's output colour space, tone mapping,
clear colour/alpha and prior target even after a draw error. Portable offscreen
comparisons use a `WebGLRenderTarget` on either API and retain linear output.

This profile requires a clear-colour background and family-bound materials; a
scene background is rejected. It is not a general PBR, lighting or post-processing
adapter. Without the binding, node factories retain Three's normal linear pipeline.
Complete shared-scene ports must choose and verify their compositing policy.

Caller-owned textures, geometry and materials have separate disposal. Keep data
needed for picking and reconstruction until the caller releases it. Conservative
spatial culling, wide ribbons, size attenuation, animated spatial morphs and full
shared-scene adoption are separate work; these factories do not claim those vertex
contracts. Thin route/geography lines use the common line styling; trails can add
the existing regular-line motion adapter. Hydraulics, orbital models, routing
traces and source evidence remain edition-owned.

### Comparison suite

`gpu-readiness.html?backend=legacy|webgl2|webgpu|auto` composes a moving luminous
glyph, selection halo, motion-adapted trail, route and geographic outline. It is
labelled synthetic. Twelve rendered cases cover stale boundaries, interpolation,
backward seeking, reversed and zero/minimum-duration windows. Comparisons use
actual pixels: glyph visibility, centres, extents and energy plus an 8×8 RGB tile
signature of the composed frame, both offscreen and from the final canvas. Framebuffer rows are normalized for the APIs'
different readback origins. The limits are one pixel for paired glyph extent,
less than one pixel for centroid, 3% green energy and 0.5 mean 8-bit channel levels
for composed tiles. A separate final-canvas halo annulus must retain RGB energy within 5%. These bounds are fixture-specific, not blanket edition image
acceptance criteria.

Browser interactions additionally verify label visibility, screen-space picking
after pan/zoom and resize, reverse seeking, reduced-motion opening, repeated
resource recreation, and injected WebGL context / native GPU device loss followed
by reconstruction with the same camera and study time. Explicit `GPUDevice.destroy`
is a fault injection, not a physical-phone eviction or thermal test. Tests retain
backend reports and canvas images as attachments. The old `gpu-motion.html` point
and line fixture remains an independent check of the regular vertex adapter.

`gpu-study.html` exercises the **stable public WebGL study Canvas** with a real
renderer and finite elapsed seconds/delta. The default v10 Canvas probe remains
on the separate v10 prototype. Ordinary national/hub/station/terrain compositions
use the stable WebGL boundary on this candidate.

```sh
npm run typecheck
npm run lint
npm run check:architecture
npm test
npm run check:packed
# Focused scene, lifecycle and diagnostics checks:
npm run readiness:matrix
# Native-capable host; this path rejects fallback instead of skipping it:
npm run readiness:native
npm run build:lab
node scripts/measure-renderer-bundles.mjs renderer-bundles.json
```

The native Chromium check opts into WebGPU (and Metal on macOS); CI should run it
on a capable GPU host. Ordinary Chromium and WebKit checks cover forced WebGL fallback and automatic
selection; the strict path additionally requires native execution. `firstFrameMs` measures renderer creation through first
render submission, excluding module transfer and GPU completion. Twelve forced
RAF intervals describe instrumented frame cadence, not GPU timings. Payload bytes
and Three geometry/texture counters are observations, not total browser memory.
Bundle measurements cover static JavaScript entry dependencies; lazy scenes,
fonts, CSS and data need separate edition budgets. Physical-device and sustained
performance acceptance remains an edition gate.

The packed checker snapshots the lab and browser tests together, installs an exact
Playwright runner in that consumer, and retains results outside the temporary app.
For loader/extension checks use a free port, for example
`MOTION_LOADERS_PORT=4183 npm run test:loaders`. Reusing an existing loader server
requires explicit `MOTION_LOADERS_REUSE=1`; this avoids testing an unrelated checkout.

Save Playwright JSON with `PLAYWRIGHT_JSON_OUTPUT_FILE=/absolute/path/report.json`.
`npm run readiness:record -- --packed broad.json --matrix final-matrix.json
--native native.json --loaders loaders.json --output validation.json` merges
scoped reruns by stable case identity, rejects unresolved failures or missing
native proof, and records candidate source-input hashes and backend observations.
It also writes the three `*-scene.png` files directly from each strict-native
test's paired report/capture attachments and records their hashes and provenance.
Identical pixels are reported explicitly, not rejected: the unlit fixture disables
antialiasing and aims for backend parity. Its runtime reports establish backend
identity. The recorder leaves author visual review pending rather than attesting it.
