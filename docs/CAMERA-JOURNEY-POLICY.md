# Camera command and journey policy

`NetworkCameraDriver` retains its `update(delta)` / `dispose()` ownership contract and adds three optional hooks:

- `onCommand(command, station, target)` receives each new command after the standard camera resolves its map target. The target is borrowed: copy its coordinates instead of retaining the vector.
- `onGesture()` receives pointer-down or wheel intent, including gestures whose camera movement is suppressed while following a selected vehicle.
- `prepareFrame(target, stops, spatialLayoutMix, delta, following)` may update the standard map target in place and return an interpolation fraction, or return `undefined` for standard damping. Layout mix is clamped; delta is elapsed frame time in seconds. Do not retain the renderer-owned target or stop array.

A frame claimed by `update` skips standard preparation and interpolation. Without these hooks, the existing camera behavior remains. Keep the factory stable; the renderer disposes and replaces the driver when its factory, camera or projection retires. Policies must not start a second animation loop or study-clock reporter.

`stationCentre(station, stops, output?)` is available through `@motionstudies/three/map-camera`. It uses the same station indices as picking, ignores missing stops, fixes elevation at zero and returns the origin for an empty station. Supplying an output vector avoids allocation during a layout morph.

Paris keeps authored focus until a direct gesture or new command releases it. Geographic focus interpolates to the heart lens; station focus follows current projected stop positions. Focus/reset journeys use rate 3.2 for up to 1.6 seconds, while vehicle following retains standard damping. A live reduced-motion preference snaps interpolation. Lens coordinates are resolved at command time, and target vectors are updated in place.

The camera-control transforms have been removed from Paris's adapter. Its remaining transforms concern material opacity and geometry morphing.
