# Consolidation alpha.15

This release starts the architecture consolidation with concrete application boundaries and smaller renderer internals.

- `mountMotionStudy` accepts `MotionStudyMountOptions` (`id` and `theme`). Existing edition objects remain structurally compatible. The isolated packed consumer compiles a presentation-only caller without a transport data catalogue.
- Station and train canvas texture construction lives in a private `label-textures` module. Mounted label layers retain cache ownership, frame scheduling, collision state and texture disposal. The module is excluded from public exports.
- Independent airport infrastructure accepts `mapStyle.airports.visible` and `showLabels`. Visibility changes keep GPU resources mounted and respect ancestor visibility during picking. Defaults preserve existing consumers.
- Airport labels whose configured abbreviation equals their IATA code display the code once. Paris no longer patches the aircraft module or rewrites independent-airport mounting/label visibility.

Bristol's first application pilot separates loading from playback intent. A recording-scoped controller owns displayed data/time, loading and play/pause intent; stale, cancelled and superseded responses cannot update it. A pause during loading remains paused on arrival, including repeated seeks in one pending window. Local recording validation checks the existing schema, service clock, full network range, window identity, ordered receipts and point references. It retains existing bytes and does not manufacture missing measurements. Bristol, London and Paris adopt shared control styling for map/playback controls while retaining their palettes and composition.

The controller remains local until a second consumer demonstrates the same lifecycle semantics. The larger station/selection renderer extraction and the remaining authored Paris/Swiss geometry and picking adaptations are separate follow-up work; this release does not claim to remove every edition transform.

Validation: 272 shared unit tests; type, lint and architecture checks; 90 packed-consumer browser checks (two existing skips); 34 loader browser checks. Downstream validation and publication receipts are recorded after release.

The alpha.15 rollout exposed npm's asynchronous publication processing: accepted packages were not all immediately installable. The release workflow now waits for each exact registry version and compares its integrity with the tested artifact before reporting publication complete. The wait retries temporary absence/network failures for up to twenty passes; an artifact mismatch fails immediately.
