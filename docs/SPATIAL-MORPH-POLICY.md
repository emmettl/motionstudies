# Topology-preserving spatial morphs

`NetworkSceneExtensions.spatialMorph(x, z, projection)` maps geographic world coordinates to authored world coordinates. Keep this callback stable and return finite x/z coordinates. The renderer preserves y and source vertices. When configured, it replaces the `spatialLayout` target; `spatialLayoutMix` still controls progress.

The main network's stops and paths use the same projection as persistent rail, station, route-identity and traffic buffers. Geographic water, reference paths and boundary buffers also morph. Their geometry and attributes stay mounted; bounds conservatively contain both endpoints. Source path lengths are recomputed after blending, so train interpolation follows the rendered segments, including paths longer than 32 points. Background context networks, roads and aircraft keep their existing independent projection rules.

Geometry preparation runs when resources or the projection change. Mix changes update position values in a layout effect, without rebuilding topology or adding an animation loop. Cleanup restores original positions and bounds before replacement or removal. The renderer owns disposal; the separate station-position buffer is disposed with its source positions.

`@motionstudies/three/spatial-morph` exports the callback type and pure projection/blending/preparation helpers. `prepareGeometryMorph(resources, projection, callback)` accepts a geometry or nested resource records, deduplicates geometry, and returns `update(mix)` and `restore()`. It supports ordinary non-normalized three-component position attributes. Call `restore()` before preparing another projection; do not dispose renderer-owned geometry from a policy.

`NetworkMapStyle.materials.groundGridOpacityScale(mix)` and `waterOpacityScale(mix)` independently control grid and water opacity. Their defaults retain the existing grid and water fade. Paris fades its geographic grid and retains its morphed Seine throughout the transition.

Omitting `spatialMorph` retains the existing spatial-layout projection and resampling behaviour. Paris's radial lens and geographic evidence remain edition-owned; its private renderer transformations and duplicated geometry/blending code are removed.
