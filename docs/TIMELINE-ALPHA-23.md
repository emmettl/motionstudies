# Shared map timeline · alpha.23

England's broad track and visible round handle become a shared instrument for the full-screen map editions. `StudyTimeline` uses it beneath its activity chart; plain clocks use the exported `TimelineScrubber`. Framework-free time mapping remains in core; React and CSS remain in web.

The visible rail is 8px tall and the handle 20px across. The native grab target is 44×44px, and the complete rail or chart accepts touch seeking. GLEISLICHT retains its larger 48px control height. Keyboard arrows, Home/End, disabled state, unique input IDs and formatted accessible values are preserved. Pointer capture completes a drag released outside the control. The namespaced stylesheet overrides legacy shell thumb geometry so inherited CSS cannot silently shrink the grab target.

## Consumer audit and adoption

| Edition | Shared use | Edition-owned presentation and behavior |
| --- | --- | --- |
| England | Bus and power `RecordedClock` scrubber | Green palette, persistent clock, epoch versus civil-day times, separate dates and capture coverage, existing seek/play callbacks |
| GLEISLICHT | Main railway/journey, orbital and road-history scrubbers | Theme tokens, translated labels, journey progress, Now exit, orbital rhythm chart, orange road evidence chart |
| All Change | London network and cycle clocks | Pink palette, disabled operational mode, cycle clock, playback controls |
| Correspondances | Paris network clock | Theme tokens, French labels, service-window and playback policy |
| LUFT | Existing `StudyTimeline` adopts the new scrubber | Gold accent, activity bars/lines, missing-data semantics, dock clearance and playback policy |
| Underfall | Main bus/rail and map-road interval clocks | Green palette, recording bounds, pause-on-seek, date/evidence labels, interval semantics |

No synthetic bins are introduced to make plain clocks fit the activity-chart API. Specialist evidence plots stay local: for example GLEISLICHT's road density chart and orbital rhythm. Underfall's separate tide and road study panels remain possible subsequent scrubber consumers; non-time controls such as terrain distance, opacity and volume are outside this migration. Local / Express and NORIKAE remain parked.

## Release and verification

All four shared packages were published at coordinated version `0.1.0-alpha.23` under `next`. The registry artifacts match the tested tarballs. [Successful trusted release workflow](https://github.com/emmettl/motionstudies/actions/runs/35125130777).

Shared validation: 338 unit tests, typecheck, lint and architecture checks. The final release passed 100 packed-consumer browser tests with two skips, plus 34 loader browser tests. The final shell-compatibility checks also exercise keyboard endpoints, epoch seconds, touch seeking at the edge of the target and releasing a drag outside it on desktop Chromium and iPhone WebKit.

Consumer checks against compiled candidates passed: England 31 recording/power tests and mobile browser inspection; GLEISLICHT 135 component tests, three compact/touch browser checks and its unchanged 360 KiB JavaScript budget; All Change 277 tests, five mobile/cycle browser checks and existing bundle limits; Correspondances 25 unit tests and four day-loading/mobile browser checks; Underfall eleven recording/road lifecycle checks; LUFT four search/layout/loop checks against its production build. Browser suites include desktop Chromium and iPhone WebKit, with device-specific cases skipped on the other device.

GLEISLICHT's Now regression additionally verifies that the control preserves caller clock precision even when manual seek steps are coarser. LUFT's footer clearance and Underfall's footer rows allow the larger target without covering map content. All six editions now have exact alpha.23 dependency pins and npm registry lockfile resolutions. Their production builds passed again after installing from the registry; GLEISLICHT and All Change also passed their existing bundle budgets again. Candidate tarballs were used only for prepublication checks.

## Adoption commits

These edition commits are local and have not been pushed or deployed by this task. The shared package implementation and this release record are pushed to motionstudies main.

| Edition | Commit | Branch |
| --- | --- | --- |
| England | `8a1d9cd` | `main` |
| GLEISLICHT | `9684a43e` | `main` |
| All Change | `a19c237` | `main` |
| Correspondances | `4559d07` | `main` |
| LUFT | `4b08827` | `main` |
| Underfall | `93ad5a6` | `codex/worker-history-consumer` |

Unrelated research files and GLEISLICHT's pre-existing manifest/script ordering and ignore-file edits were preserved outside these commits. LUFT remains at edition version 0.2.2.
