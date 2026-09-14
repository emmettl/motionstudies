# Vehicle motion alpha.16

`0.1.0-alpha.16` changes how the shared national scene moves vehicles. The visible result is unchanged: the same markers, glow, trails and labels at the same times. The work behind each frame is smaller, so weaker hardware keeps up further into a busy timetable.

## What changed

**Markers interpolate on the GPU.** A sampling pass places every visible journey at the start and end of a short study-time window and uploads both positions. Every frame after that, the point shader moves each marker along that chord from a single uniform; no JavaScript touches the journey until the clock leaves the window. The window covers 0.1 real seconds on smooth frames and 0.2 seconds once frames are sustained below about 40 FPS, capped at 20 study seconds so fast playback never follows a long chord. On a continuing window the previous end sample becomes the new start, so a playing journey costs one path lookup per pass rather than one per frame. Pausing collapses the window onto the clock in one pass, so a paused scene's raw buffers describe exactly what is drawn.

**Trails read sampled history.** Each journey keeps a small ring of positions on a 15-second study-time grid. Trail vertices interpolate between the two grid samples bracketing their nominal time, sharing one phase uniform, so a trail moves continuously while only the grid time crossed since the previous pass costs a lookup. A lone seek refills history at once. A run of seeks closer than 150 ms apart, as when scrubbing or morphing a layout, leaves trails absent until the clock has settled for 150 ms. The earlier `createTrailBackend` extension and its worker contract are removed: the renderer no longer has a per-frame trail workload to offload.

**Offscreen journeys are not sampled.** Before interpolating a path, the pass tests the journey's scheduled chord between its current stops against the ground-plane rectangle the camera can see, expanded by 30% on each side. Journeys outside it take no slot. Focused, selected and compared journeys always draw. When the view leaves that margin, the pass runs again, so panning while paused reveals vehicles as expected. Views that do not reach the ground plane (a near-horizontal camera) disable culling.

**Train labels follow the pass.** Labels read the journey's placed position from the shared motion table instead of interpolating paths again on their own cadence. Arrival labels keep lingering at the terminal.

## Public surface

- `@motionstudies/three/scene-picking` adds `scenePickVertex(geometry, index, out)` and `setSceneMotionMix`. Edition pickers that read the `position` attribute of moving-vehicle geometry directly must read through `scenePickVertex`, which applies the current interpolation phase toward `positionTo`. Without it, a pick lands up to one sampling window behind the drawn marker.
- `@motionstudies/three/render-performance` exports the building blocks for edition-owned moving layers: `VehicleHistory`, `VehicleMotionTable`, `MotionSampleWindow`, `markerStepSeconds`, `createMotionLerp`, `applyMotionLerp` and the ground-view culling helpers. `TrailFrameBudget` accepts a reduced interval as its second constructor argument. `updateActiveGeometry` also uploads a `positionTo` attribute when present.
- `NetworkSceneExtensions.createTrailBackend` and the `TrailBackend`, `TrailDataset` and `TrailFrame` types are removed. Consumers that constructed a worker for trails delete that code; there is nothing to replace it with.

## Assumptions and limits

- Culling uses the scheduled stops. A `trainPosition` resolver that places an unfocused journey far from the chord between its current stops can be culled while visible. The resolvers in All Change and Gleislicht follow route paths between those stops.
- Trail vertices sit on 15-second chords rather than exactly on the path. The trail already consisted of 45-second chords; at street zoom a sharp corner may be cut slightly more within a segment.
- A journey that starts or ends inside a sampling window holds its first or last known position for the rest of that window, at most 0.2 real seconds.
- Measured gains belong to each edition's own profiling record. This release changes mechanism and makes no device-specific frame-rate claim.

## Validation

Shared gates: unit tests, type, lint and architecture checks, the packed-consumer browser checks and the loader checks. The renderer-extension browser regression now verifies that trails follow markers, that hidden journeys clear their trails and that camera drivers still release ownership.

## Publication and adoption

Recorded once the trusted release workflow and edition upgrades complete.
