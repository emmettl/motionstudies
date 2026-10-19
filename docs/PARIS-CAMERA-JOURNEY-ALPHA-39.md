# Paris camera journeys — alpha.39 candidate

19 October 2026

This candidate removes Paris's remaining camera-control source transforms. Authored journey timing, reduced-motion interpolation and morph-following geographic/station focus now use optional hooks on the existing public camera driver. Standard command handling and camera lifecycle remain renderer-owned. See the [policy contract](CAMERA-JOURNEY-POLICY.md).

The driver receives the already-resolved command target, avoiding a duplicate geographic projection. It resolves the heart lens once per command, reuses station target vectors and falls back to standard vehicle-following damping. Direct pointer and wheel intent releases authored focus. The remaining adapter hooks concern materials and geometry.

The preceding alpha.38 Cloudflare deployment succeeded; Pages validation was still running when this work started.

## Candidate status

Node 24 passes 476 shared units, 11 hosting checks, type/lint/architecture gates, 100 packed-browser checks (two existing skips), 34 loader checks and all four publication dry runs. Paris passes 31 units, 18 Chromium/WebKit journeys, type/lint/boundary checks, production build and its separate AIR, Métro, Transilien and tram data/provenance checks.

The only failing gate is the 681 KiB ten-line composition cap in `scripts/check-paris-proof.mjs`: the candidate measures 697,450 bytes against 697,344, exceeding it by 106 bytes. The default opening is 644,065 bytes (629.0 KiB) against 645,120 (630 KiB). JS, CSS, base, twelve-line and fourteen-line caps remain satisfied. A proposed increase of the ten-line cap alone to 682 KiB is prepared separately and awaits approval. It is not applied in this candidate. No npm publication or main-branch push has been performed for alpha.39.

See [candidate evidence](evidence/paris-camera-journey-alpha39.json).
