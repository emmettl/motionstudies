# Budgeted vehicle motion alpha.17

`0.1.0-alpha.17` bounds how much JavaScript the shared national scene spends moving vehicles in each frame. Alpha.16 moved interpolation onto the GPU, but a Windows Edge profile of All Change with TfL rail and buses showed the main thread busy for 91.5% of the recording: once a sampling pass took longer than a frame, a pass ran every frame, and GPU interpolation saved nothing. Alpha.17 refreshes only the journeys that are due, within a per-frame time budget.

## What changed

**Every journey has its own window.** Each marker and trail vertex carries a `motionTime` attribute holding the study-time window of its chord. The shader moves the vertex across its own window from a shared clock uniform, so journeys refreshed in different frames all move every frame. Journeys occupy stable buffer slots; a refresh uploads only the changed range.

**Refreshes are scheduled and budgeted.** A journey is due when its window is about to end, when a trail grid time passes, when the clock seeks outside its window, or when selection, zoom visibility or geometry changes. Each frame walks the journeys from where the previous frame stopped and refreshes due ones until the budget is spent. The budget adapts to the device: it grows while frames are smooth, shrinks under sustained load, and grows again while frames stay above roughly 24 FPS but motion falls far enough behind that markers would be hidden. Seeks, selection changes and geometry changes get a larger catch-up budget; spatial layout transitions refresh everything every frame, as before.

**Chords size themselves to the schedule.** A refreshed journey's chord covers the time until its next expected refresh: at least a tenth of a real second, and at most 30 study seconds. On a continuing chord the new start is the drawn position, so a playing journey costs one route lookup per refresh. A playing marker that falls behind holds its last position for up to 30 study seconds or three quarters of a real second, whichever is longer, and is then hidden until refreshed rather than drawn in the wrong place. Paused scenes hide nothing that has been refreshed at the current time.

**Trails are gated under load.** Trail history still fills from a 15-second grid, but once frames are sustained below about 40 FPS a refresh samples at most four grid times; older times stay unknown and the trail is briefly shorter instead of stalling the frame.

**Culling is skipped when it cannot help.** When the expanded view contains every stop, journeys skip the per-journey chord test entirely. Culled journeys are re-evaluated when the view leaves the region they were tested against, not every frame.

## Public surface

- `@motionstudies/three/scene-picking` adds `setSceneMotionClock(geometry, clock, stale)`. `scenePickVertex` reads per-vertex `motionTime` windows when present and returns NaN for hidden vertices; pickers that already skip non-finite projections need no change. `setSceneMotionMix` remains for geometry without windows.
- `@motionstudies/three/render-performance` replaces `MotionSampleWindow`, `markerStepSeconds`, `MARKER_SAMPLE_INTERVAL`, `MARKER_SAMPLE_INTERVAL_REDUCED` and `MAX_MARKER_STEP_SECONDS` with `MotionFrameBudget`, `MotionCycle`, `motionLookahead`, `motionStaleSeconds` and their constants. `createMotionLerp` now takes `createMotionUniforms()`. `VehicleMotionTable` exposes per-journey windows, validity and state, with `displayed(index, time, stale, out)` and `due(...)`. `VehicleHistory.fill` accepts a sample cap. `updateDirtyGeometry` uploads one changed vertex range.
- Edition tests that execute the installed `TrainLabels` source must provide `displayed` on their motion table stand-in.

## Assumptions and limits

- The budget bounds the motion layer's JavaScript, not labels, React work or GPU rendering.
- Under heavy load individual markers refresh less often. They follow longer chords, can briefly hold position, and at high playback rates can be hidden between refreshes. The frame rate is favoured over per-marker freshness until markers would disappear.
- Buffers are sized to the full snapshot rather than the active prefix. Hidden slots cost one vertex-shader invocation each and are clipped.

## Validation

Recorded with the release.

## Publication and adoption

Recorded once the trusted release workflow and edition upgrades complete.
