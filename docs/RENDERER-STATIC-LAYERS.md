# Private rail and context layers

21 October 2026

`NationalNetworkScene.tsx` now composes private rail and context modules instead of owning their implementation. Its public props, projection type and package exports are unchanged; the emitted scene declaration is byte-identical to alpha.41. The initial source pass retained the existing published versions. The refactor is now published in alpha.42; see the [release and edition adoption record](RENDERER-ALPHA-42.md).

- `scene-context-layers.tsx` owns ground, geographic and diagram water, reference paths and borders. Each layer retains its geometry memoisation, spatial morph lifecycle, frame callback and disposal.
- `scene-rail-layers.tsx` owns structural/local rails, station points, route ribbons and traffic strokes. Snapshot, projected geometry, framing and display inputs remain explicit props. Geometry and textures retain their existing component lifetime; no global cache or new scene subscription is introduced.
- `scene-path-geometry.ts` contains coordinate projection, segment lookup and line construction shared with selection layers. It imports the public projection type only; it does not import the scene at runtime.
- `scene-map-style.ts` retains the existing style policy lookup. `scene-light-texture.ts` supplies the existing texture factory; calling layers still own and dispose their textures.

The scene entry shrinks from 4,518 to 3,302 lines. All 19 extracted function bodies are byte-identical to their originals. No batching, draw suppression, transform caching, animation or material changes are included. The [idle/decode baseline](IDLE-DECODE-2026-10-21.md) established no redundant paused uploads or known zero-opacity submissions to fix. Matrix and draw-submission samples alone do not establish that a particular transform optimisation is beneficial.

Paris's private regression harness now locates border and traffic components in their defining modules, with a fallback for the existing alpha.41 package. Product code continues to use supported public imports.

Node 24.22.0 / npm 11.21.1 validation passes shared type checks, 481 unit tests, 11 hosting checks, architecture checks, 100 packed-consumer browser cases (two existing skips), 36 shared loader/renderer browser cases and four publication dry runs. Lint retains only the existing unused `extname` warning.

Paris passes 29 unit tests with both its installed alpha.41 packages and the newly compiled candidate. The candidate production build passes every proof/data/payload gate: 356.6 KiB JS, 629.2 KiB opening against 630 KiB, and 681.3 KiB ten-line composition against 682 KiB. No limits change. Candidate checks run in an isolated checkout copy; they do not represent a published npm adoption. The compatibility-only Paris test change is pushed as `280e614`.

The candidate also passes 19 focused Chromium/WebKit browser cases (one existing platform skip): heart/region transitions, rapid reversal and reduced motion, failed-layer retry, AIR isolation, station labels, scale/clock preservation, phone chrome, buffer reuse on return, paused seeks and selection, and visible-geometry draw checks. This confirms the relevant workload behaviour; it is not a claim of faster frames.
