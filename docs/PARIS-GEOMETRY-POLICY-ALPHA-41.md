# Paris geometry morph — alpha.41

19 October 2026

The optional spatial morph policy moves Paris's last private renderer transformation behind the supported API. Its authored radial lens remains in Paris; the renderer owns persistent buffer updates, source-vertex blending, bounds, cleanup and disposal. Grid and water opacity use material callbacks. See the [contract](SPATIAL-MORPH-POLICY.md).

Paris removes its Vite renderer rewrite plugin, the layout/scale adapters, its duplicated geometry hook and vertex-blending code, and the redundant heart-layout construction in the app. Its label, camera and material regression tests execute the unmodified installed renderer. The obsolete adapter-composition/drift tests are removed.

Node 24 passes shared type/lint/architecture gates, 481 units, 11 hosting checks, 100 packed-consumer browser checks (two existing skips), 36 loader/renderer browser checks and all four publication dry runs. The six renderer lifecycle cases also pass after the final precision-restoration adjustment. Paris passes type/lint/boundary checks, 29 units, 238 Chromium/WebKit browser cases (two existing skips), plus the focused 18-journey pass, production build and every payload/data gate. Three obsolete adapter-composition/drift tests were removed; the retained behavioural tests exercise the published renderer directly.

The opening remains 629.2 KiB against 630 KiB; the ten-line view is 681.3 KiB against its previously approved 682 KiB cap. No payload cap changes were needed.

All four packages were published under public `next` from `281b5868f7a9caae9ebfd4d03aed3d189d73bf21` through [trusted run 39289071255](https://github.com/emmettl/motionstudies/actions/runs/39289071255). Registry metadata, SHA-512 integrities, downloaded archives and next tags match. Every package file matches the checked candidates.

Paris passed an empty-cache registry install, lock integrity and installed-file comparisons and all final leaf checks. Its browser journeys exercised byte-identical package contents before publication. Adoption commit: `4e887ef853c1c4b4d9ec4ac970592ecf85dd0c64`.

No private renderer source transforms remain in Paris. See [release evidence](evidence/paris-geometry-policy-alpha41.json).
