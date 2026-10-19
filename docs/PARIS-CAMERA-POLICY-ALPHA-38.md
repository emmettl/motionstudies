# Paris viewport framing — alpha.38

19 October 2026

The coordinated alpha.38 candidate exposes optional camera viewport framing through scene extensions. Paris supplies its existing inset/zoom calculation and removes the entire `paris-airport-renderer.ts` transform. The shared renderer retains camera ownership and restores standard projection settings when the policy is removed.

See the [policy contract](CAMERA-VIEWPORT-POLICY.md). This is the viewport portion of camera consolidation; authored journey timing and focus tracking remain guarded, alongside material opacity and geometry morphing.

The preceding alpha.36 Cloudflare deployment succeeded. The alpha.35 integrity repair also completed hosted validation. Current alpha.36 Pages validation was still running when this work started.

## Candidate validation

Node 24 passes 475 shared units, 11 hosting tests, type/lint/architecture gates and Paris's 28 units, type/lint/boundary checks, production build and unchanged payload gates. The eight-line opening is 628.8 KiB / 630 KiB; ten lines is 697,279 bytes / 697,344 (65 bytes of headroom). The first candidate exceeded the ten-line limit; simplifying the standard projection lifecycle and reusing the existing Three.js clamp helper recovered the budget without changing its limit.

Camera scratch vectors are allocated together; the mutable target retains its existing `useRef` ownership. Standard camera interpolation remains unchanged. Packed-consumer browser checks pass 100 with two existing skips; all 34 loader checks, 18 Paris browser journeys and four publication dry runs pass.

Alpha.37 published the viewport API first. Hosted lint reported three new hook dependency warnings from grouping the mutable target into a memoised object; alpha.38 restores the target ref and removes those warnings. Paris adopts alpha.38 directly.

## Publication and adoption

All four packages are public `0.1.0-alpha.38` under `next`, from source `abcb28224abca77b42a66e830d9048762b530e3d`, through [trusted run 39248335535](https://github.com/emmettl/motionstudies/actions/runs/39248335535). Registry integrities, downloaded tarballs, tags and candidate package file identity are verified. Paris's final lockfile explicitly matches the hosted release integrities; an empty-cache installation, installed file comparison and final type, lint, boundary, unit, build and payload checks pass.

See [machine-readable evidence](evidence/paris-camera-policy-alpha38.json). Camera journey/focus, geometry and material transforms remain for later bounded migrations.
