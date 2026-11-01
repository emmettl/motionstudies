# Shared WebGPU adapters

Coordinated alpha.49 adds opt-in node-renderer support to `@motionstudies/three`.
The existing WebGL scene components and their default backend are unchanged.
Hydraulic solvers, data releases and water appearance remain edition-owned.

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
