# Camera viewport framing

`NetworkSceneExtensions.cameraViewport` is an optional stable callback receiving CSS viewport `width` and `height` and the clamped `spatialLayoutMix`. It returns `{ zoom, offsetY }`, using Three.js's vertical view-offset sign convention, or `undefined` to release the override.

The standard camera applies framing after position/target interpolation and before looking at its target. A frame claimed by a custom camera driver skips this policy. Omitting the policy leaves the default projection unchanged. The renderer owns projection updates and restores standard zoom (one) and clears the view offset, retaining the current viewport aspect on release, callback replacement or unmount. Keep callbacks stable to avoid unnecessary cleanup/reapplication.

Paris uses its existing 13%-height geographic inset and desktop zoom calculation, blending both back to the default framing as its heart layout reaches one. Mobile and desktop breakpoints, rounding and short-viewport minimum zoom are unchanged. The airport-framing transform module is removed entirely.

This boundary controls projection only. Camera commands, gesture cancellation, authored journey timing, reduced-motion handling and morph-following focus retain their existing guarded adapters. Material opacity and geometry morphs are also separate work.
