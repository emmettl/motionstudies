# Station labels and picking policy

The alpha.35 renderer adds opt-in policies through the existing public
`@motionstudies/three/scene-style` and `scene-extensions` exports. Omitted options
retain the default rendering and picking behaviour.

`NetworkMapStyle.stationLabels` accepts:

- `orderStations(ranked)`: order the renderer-ranked station identities without
  changing source names, ranks or stop indexes. The returned array may be new.
- `semanticHeight(height, spatialLayoutMix)`: adjust the existing semantic camera
  height for an authored layout. Labels and tap targets use the same result.
- `eligible(station, height, tierLimit?)`: apply edition admission rules. Selected
  stations and selected-route emphasis retain the renderer's existing priority.
- `screenHeight(width, focused, rank, height)`: choose label height in CSS pixels.
  The same sizing rule supplies ordinary station tap bounds.
- `viewportPadding`: omit labels whose box crosses the inset. The train-label
  style accepts the same option. Omission keeps existing partial edge labels.

The existing `rankLimit` and `refreshInterval` options remain supported. Built-in
station targets now honour an explicitly configured rank limit as labels do.
Collision handling, label/frame budgets, sprite caches and GPU disposal remain
renderer responsibilities. Keep policy objects and callbacks stable to retain
those caches; replace the policy when its inputs change. Callbacks are synchronous
and must not mutate station data or start request/clock lifecycles.

`NetworkSceneExtensions.acceptsStationPick(event)` can reject a valid station tap
before hit testing, for example when an independent airport label has priority.
It receives the scene, camera, canvas, client coordinates, touch flag and gesture
distance. Drag, cancellation and multi-pointer checks still run first. The
existing custom `stationPicking` mode and aircraft picking policy are unchanged.

Paris supplies its existing editorial station order, neighbourhood admission,
layout height scaling, label sizing and airport priority directly through these
options. Its build adapter no longer transforms `StationTapTarget.js` or
`station-picking.js`, and no longer rewrites the matching station-label and
viewport-clipping expressions in the main scene.

Paris still has separate guarded transforms for camera travel/framing,
train-label budget and sizing, geometry morphing and material opacity. Those are
later boundaries; this release does not claim to remove the whole build adapter.
