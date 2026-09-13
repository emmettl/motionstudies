# Consolidation alpha.15

This release starts the architecture consolidation with concrete application boundaries and smaller renderer internals.

- `mountMotionStudy` accepts `MotionStudyMountOptions` (`id` and `theme`). Existing edition objects remain structurally compatible. The isolated packed consumer compiles a presentation-only caller without a transport data catalogue.
- Station and train canvas texture construction lives in a private `label-textures` module. Mounted label layers retain cache ownership, frame scheduling, collision state and texture disposal. The module is excluded from public exports.
- Independent airport infrastructure accepts `mapStyle.airports.visible` and `showLabels`. Visibility changes keep GPU resources mounted and respect ancestor visibility during picking. Defaults preserve existing consumers.
- Airport labels whose configured abbreviation equals their IATA code display the code once. Paris no longer patches the aircraft module or rewrites independent-airport mounting/label visibility.

Bristol's first application pilot separates loading from playback intent. A recording-scoped controller owns displayed data/time, loading and play/pause intent; stale, cancelled and superseded responses cannot update it. A pause during loading remains paused on arrival, including repeated seeks in one pending window. Local recording validation checks the existing schema, service clock, full network range, window identity, ordered receipts and point references. It retains existing bytes and does not manufacture missing measurements. Bristol, London and Paris adopt shared control styling for map/playback controls while retaining their palettes and composition.

Swiss station, train and airport selection now reads the public scene-picking metadata. Three complete compiled-code rewrite hooks and the remaining duplicate pick-metadata writes are removed; edition-owned road badges retain their local metadata. Desktop and phone station/train/road/airport checks pass, alongside all 1,413 Swiss unit tests. The exact production opening JavaScript budget is 359.7 KiB against 360 KiB.

The controller remains local until a second consumer demonstrates the same lifecycle semantics. The larger station/selection renderer extraction and the remaining authored Paris/Swiss geometry and picking adaptations are separate follow-up work; this release does not claim to remove every edition transform.

Validation: 272 shared unit tests; type, lint and architecture checks; 90 packed-consumer browser checks (two existing skips); 34 loader browser checks. Downstream validation and publication receipts are retained in [the release evidence](evidence/consolidation-alpha-15.json).

The alpha.15 rollout exposed npm's asynchronous publication processing: accepted packages were not all immediately installable. The release workflow now waits for each exact registry version and compares its integrity with the tested artifact before reporting publication complete. The wait retries temporary absence/network failures for up to twenty passes; an artifact mismatch fails immediately.

The downstream browser gate exposed an existing camera timing problem in Zugunruhe: a capped playback delta also capped camera travel, stretching a 2.4-second return beyond a minute on a slow renderer. Islands, Sea and Currents now pass elapsed camera time independently of the capped playback step. The original desktop and phone navigation assertions pass without relaxed timeouts, including the previously failing hosted Chromium check.

## Verified rollout

All four `@motionstudies/{core,data,three,web}` packages are published as `0.1.0-alpha.15` on the `next` dist-tag. The registry SHA512 for each package matches its tested artifact from [the trusted release workflow](https://github.com/emmettl/motionstudies/actions/runs/34777637695).

All nine downstream projects declare and install exact registry versions. Seven deployed editions have successful Pages and Cloudflare runs, with matching public commit and source-run markers:

| Downstream | Final commit | Result |
| --- | --- | --- |
| AllChange · London | `019fc32` | [Verified live](https://motionstudies.app/allchange/) |
| Correspondances · Paris | `c091f48` | [Verified live](https://motionstudies.app/correspondances/) |
| Gleislicht · Switzerland | `e3bde9d` | [Verified live](https://motionstudies.app/gleislicht/) |
| Umlauf | `4dc6b81` | [Verified live](https://motionstudies.app/umlauf/) |
| Manifest | `c8e596d` | [Verified live](https://motionstudies.app/manifest/) |
| Zugunruhe | `93119c5` | [Verified live](https://motionstudies.app/zugunruhe/) |
| NORIKAE | `18863ee` | [Verified live](https://motionstudies.app/norikae/) |
| Local/Express | `b6e0962` | Updated in Git; no deployment workflow |
| Underfall · Bristol | `5c1e1f5` | Updated locally; no Git remote |

Hosted browser checks passed: London 59 regression checks plus one production check; Paris 238; Switzerland 103 regression checks plus four production checks; Umlauf 32; Manifest 31; Zugunruhe 34; NORIKAE 12. Existing skips remain documented in the evidence. Bristol passed 90 unit and ten focused browser tests. Local/Express passed its unit, build, boundary and size checks.

The secondary Swiss checkout and NORIKAE feature branch also use alpha.15. Unrelated shared-repository and Swiss working-tree edits were preserved. The concurrent Zugunruhe audio commit was already on main and remains in the final tested release.
