# Paris train-label policy — alpha.36

19 October 2026

The next coordinated release exposes optional train-label density and CSS-pixel sizing callbacks. Paris supplies its existing functions through `NetworkMapStyle.trainLabels` and removes the two corresponding source transforms and injected imports. See the [policy contract](TRAIN-LABEL-POLICY.md).

The default edition behaviour is unchanged. Off mode, selected/comparison budgets, collision and frame work, non-rail suppression and the label pool remain renderer-owned. Camera, material and geometry transforms remain guarded in Paris.

## Candidate verification

Node 24 checks pass: 472 shared unit tests and 11 hosting tests, type, lint and architecture checks. Paris passes 27 units, 18 Chromium/WebKit journeys, type, lint, boundary, production build and all unchanged payload gates. The eight-line opening is 628.8 KiB / 630 KiB, and ten lines is 680.9 KiB / 681 KiB. Packed-package, loader, publication and final registry evidence will be recorded when complete.

The preceding alpha.35 hosted rollout exposed candidate archive hashes retained in Paris's lockfile. Commit `a7d763a` repairs all four registry integrities and passes an empty-cache install. Alpha.36 adoption must explicitly copy and verify hosted manifest integrities before its own empty-cache installation.
