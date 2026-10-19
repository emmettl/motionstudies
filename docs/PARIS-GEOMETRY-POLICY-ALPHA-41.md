# Paris geometry morph — alpha.41 candidate

19 October 2026

The optional spatial morph policy moves Paris's last private renderer transformation behind the supported API. Its authored radial lens remains in Paris; the renderer owns persistent buffer updates, source-vertex blending, bounds, cleanup and disposal. Grid and water opacity use material callbacks. See the [contract](SPATIAL-MORPH-POLICY.md).

Paris removes its Vite renderer rewrite plugin, the layout/scale adapters, its duplicated geometry hook and vertex-blending code, and the redundant heart-layout construction in the app. Its label, camera and material regression tests execute the unmodified installed renderer. The obsolete adapter-composition/drift tests are removed.

Candidate validation and final registry release evidence are recorded after the relevant checks finish. Publication remains pending.
