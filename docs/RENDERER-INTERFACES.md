# Renderer styling and infrastructure interfaces

`@motionstudies/three/scene-style` and `scene-extensions` let editions supply
presentation policy without rewriting compiled renderer code. All additions are
optional; omitting them retains the existing rendering and pointer-down selection.

## Styling

`NetworkMapStyle` accepts vehicle elevation, trail elevation offset, diagram lane
spacing and ribbon widths, station label rank/refresh policy, category-specific
train label camera limits, road stroke styles, and airport presentation.
Measurements use the renderer's world units and semantic camera height; opacity
uses the usual 0–1 material range. Supply finite dimensions and nonnegative refresh
intervals. A road opacity callback receives the current subdued and selected state.

`airports.independent` keeps configured airport infrastructure visible without a
flight snapshot, independently of flight-label visibility. Its default is false.

## Infrastructure and geometry

`NationalNetworkScene.infrastructureSnapshot` supplies a complete route reference
when the active service window is sparse or empty. Its stop and path indexes must
match the active snapshot and projected geometry. It defaults to the active snapshot
and does not add vehicles to that window.

`NetworkSceneExtensions.DiagramStations` replaces built-in line-map station glyphs.
`diagramSegmentKey` and `diagramOrderedPoints` control shared route grouping and
orientation in line-map mode. Editions retain their diagram geometry algorithms.
`RoadOverlay` mounts edition-owned labels or decorations when road topology exists,
including when observations are absent. Components receive typed public data and
projection props; they may also use the existing `useNetworkScene` context.

## Picking

`@motionstudies/three/scene-picking` exposes metadata on actual scene objects and
geometries. `scenePickMetadata(object)` returns optional train/station/airport targets,
vertex-aligned train entries, or vertex-aligned stop indexes. Consumers must respect
object/ancestor visibility and geometry `drawRange`; filtered vehicles have undefined
entries, and unused buffer capacity is not selectable. Metadata is weakly held and
does not retain disposed geometry.

Edition-owned glyphs publish metadata with `setScenePickMetadata`. Reusable vehicle
buffers can update individual entries with `setScenePickTrain`. Passing undefined
to the metadata setter removes an entry. Treat returned arrays as read-only.

Set `stationPicking: 'custom'` when mounting an edition-owned selection component
as a scene child. `aircraftPicking` can select on click and reject a candidate using
the event coordinates, drag distance, camera and scene—for example, to prioritize
a station or airport label. Omission preserves built-in station targets and aircraft
pointer-down selection.

The lab's infrastructure specimen verifies public picking metadata, paused style
updates, component slots and infrastructure across empty service windows in an
isolated consumer installed from npm tarballs, on Chromium and mobile WebKit.
