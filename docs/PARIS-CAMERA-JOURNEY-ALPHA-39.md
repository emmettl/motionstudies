# Paris camera journeys — alpha.39

19 October 2026

This release removes Paris's remaining camera-control source transforms. Authored journey timing, reduced-motion interpolation and morph-following geographic/station focus now use optional hooks on the existing public camera driver. Standard command handling and camera lifecycle remain renderer-owned. See the [policy contract](CAMERA-JOURNEY-POLICY.md).

The driver receives the already-resolved command target, avoiding a duplicate geographic projection. It resolves the heart lens once per command, reuses station target vectors and falls back to standard vehicle-following damping. Direct pointer and wheel intent releases authored focus. The remaining adapter hooks concern materials and geometry.

The preceding alpha.38 Cloudflare deployment succeeded; Pages validation was still running when this work started.

## Release validation

Node 24 passes 476 shared units, 11 hosting checks, type/lint/architecture gates, 100 packed-browser checks (two existing skips), 34 loader checks and all four publication dry runs. Paris passes 31 units, 18 Chromium/WebKit journeys, type/lint/boundary checks, production build and its separate AIR, Métro, Transilien and tram data/provenance checks.

The ten-line composition measures 697,450 bytes, 106 bytes over its former 681 KiB cap. The user approved raising only that cap to 682 KiB (698,368 bytes); the bundle check now passes. The default opening remains 644,065 bytes (629.0 KiB) against its unchanged 630 KiB cap. JS, CSS, base, twelve-line and fourteen-line caps also pass.

All four packages were published under public `next` from `f0975802aea483e7e37c6459ad320b74ccbd7791` through [trusted run 39282313371](https://github.com/emmettl/motionstudies/actions/runs/39282313371). Registry integrities, downloaded archives and next tags match; every package file matches the checked candidates. Paris passed an empty-cache registry install, type/lint/boundary checks, 31 units, build and bundle gates with the final registry lock integrities.

Paris adoption commit: `413e162266ad46cf0ff534e2582a6a2f6932ba3f`. The 18 browser journeys exercised byte-identical package contents before publication.

See [release evidence](evidence/paris-camera-journey-alpha39.json).
