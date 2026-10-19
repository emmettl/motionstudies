# Paris viewport framing — alpha.37

19 October 2026

The coordinated alpha.37 candidate exposes optional camera viewport framing through scene extensions. Paris supplies its existing inset/zoom calculation and removes the entire `paris-airport-renderer.ts` transform. The shared renderer retains camera ownership and restores standard projection settings when the policy is removed.

See the [policy contract](CAMERA-VIEWPORT-POLICY.md). This is the viewport portion of camera consolidation; authored journey timing and focus tracking remain guarded, alongside material opacity and geometry morphing.

The preceding alpha.36 Cloudflare deployment succeeded. The alpha.35 integrity repair also completed hosted validation. Current alpha.36 Pages validation was still running when this work started.

## Candidate validation

Node 24 passes 475 shared units, 11 hosting tests, type/lint/architecture gates and Paris's 28 units, type/lint/boundary checks, production build and unchanged payload gates. The eight-line opening is 628.8 KiB / 630 KiB; ten lines is 697,289 bytes / 697,344 (55 bytes of headroom). The first candidate exceeded the ten-line limit; simplifying the standard projection lifecycle and reusing the existing Three.js clamp helper recovered the budget without changing its limit.

Camera vectors are allocated once together, avoiding the old unused `useRef` initializer vector on every render. Standard camera interpolation remains unchanged. Packed-browser, loader, Paris-browser and publication evidence will be completed after their gates finish.
