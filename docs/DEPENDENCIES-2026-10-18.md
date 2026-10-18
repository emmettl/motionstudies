# Dependency maintenance — 18 October 2026

This pass updates the shared workspace, fourteen edition/research checkouts and
`motionstudies-recorder`. The four published Motion Studies packages remain at
exact `0.1.0-alpha.31`: consumer dependency patches fit their existing peer ranges,
so this maintenance does not require a new shared-package release. All four
rebuilt tarballs match their published npm integrity values byte-for-byte.

## Stable versions

| Dependency | September baseline | October selection |
| --- | --- | --- |
| React / React DOM | 19.3.0 | 19.3.1 |
| React Three Fiber | 9.8.1 | 9.8.2 |
| Vite | 8.3.1 | 8.3.4 |
| Vite React plugin | 6.1.1 | 6.1.2 |
| Vitest | 5.0.3 | 5.0.5 |
| Playwright | 1.63.0 | 1.64.1 |
| Oxlint | 1.86.0 | 1.88.0 |
| npm, manifests and CI | 11.21.0 | 11.21.1 |
| AWS S3 SDK | 3.1144.0 | 3.1152.0 |
| Workers types | 5.20260930.2 | 5.20261018.1 |
| Wrangler | 4.145.0 | 4.151.1 |
| jsdom | 30.1.1 | 30.1.3 |
| Node types, existing 22 / 24 / 26 lines | 22.20.4 / 24.13.3 / 26.6.3 | 22.20.5 / 24.19.2 / 26.6.5 |
| MapLibre GL, GRID84 | 6.9.0 | 6.15.0 |

GRID84 is brought forward from its older React/Vite/tooling baseline. Existing
range conventions are retained. Three.js 0.186.1, TypeScript 7.0.2, Babel parser
7.29.9, the XML parser and DuckDB API remain unchanged. Babel 8, npm 12 and SunCalc
2 are separate migrations and are excluded. Driftbox packages are outside this
refresh. Registry checks were made on 18 October; validation uses an isolated
Node 24.22.0 / npm 11.21.1 toolchain rather than the host's Node 26 installation.

Gleislicht's local development override forced `sharp` 0.35.4 despite the new
Wrangler chain requesting 0.35.5. It is updated to 0.35.5 to remove the audit finding
for its bundled librsvg dependency. Audits include development dependencies.

## Checkout reconciliation

Fetched `origin` in all sixteen repositories and incorporated every current
`origin/main` into the active checkout. Existing local commits are retained.
Divergent dependency manifests in All Change, Correspondances and Gleislicht were
merged using the published alpha.31 baseline. NORIKAE remains on its existing
`codex/synthetic-player` branch, retaining its station-aware vehicle counting while
incorporating current main. Its inactive local `main` is also fast-forwarded,
with a separate backup. The dependency refresh is also committed independently on
main and merged back into the development branch; both branches are pushed.
GRID84's existing local commit is retained and included in its main push.

Pre-update branches named `codex/pre-refresh-2026-10-18` retain prior committed
states for checkouts that needed a merge. Dirty checkouts were saved before
merging, then restored; those saved stashes remain available. Existing PFAD work,
Swiss local settings, Underfall's local tooling and Zugunruhe audio work are
preserved. The platform workspace's existing untracked operational evidence is
also retained. Maintenance changes are committed separately from that local work and pushed to
the edition and recorder remotes. No package publication or recording-service
restart is required. Normal repository CI and deployment workflows run on push.

LUFT's refreshed source points to the already published 16 October aircraft day.
Its ignored local data still held an older day and correctly failed integrity
validation. The older directory is preserved at
`/private/tmp/luft-pre-refresh-data-20261018`; `data:fetch` downloaded and verified
the exact currently pinned release. No raw source acquisition or data-policy
change was made.

## Berlin playback clock

Ostkreuz no longer clamps foreground frame intervals to 100 ms. A 300 ms delayed
frame at 30× now advances nine study seconds. Visibility changes reset its frame
baseline, preventing hidden-tab time from advancing playback. Looping handles
intervals spanning multiple complete study windows. Unit and controlled-clock
browser regressions cover these behaviours, resumption and pause.

## London layout and Zugunruhe accessibility

London measures the playback panel with a ResizeObserver and reserves its actual
footprint for the service legend and selected cards. This responds to wrapping,
viewport changes and returning from the cycle study. Selected-card height rules
now respect the measured clearance instead of overriding it with fixed offsets.
The existing desktop/phone layout, Buses and AIR interaction regressions pass.

Zugunruhe gives mobile native selects an explicit 44px height and keeps Tab and
Shift+Tab within the active modal. Escape still restores focus to its opener.
The browser regression now checks complete forward and reverse focus cycles.
All four formerly failing WebKit accessibility scenarios pass.

## Test runner and transfer allowance

The platform's `hosting/*-subdomain.test.mjs` files use Node's test API, while the
edition-router tests use Vitest. The test command now runs each through its own
runner, retaining both sets of assertions instead of letting Vitest reject the
Node suites as empty.

Paris was built before and after with identical committed application sources
and fixtures under the same Node/npm toolchain:

| Paris measure, gzip bytes | Before | After |
| --- | ---: | ---: |
| Opening JavaScript | 363,590 | 364,291 |
| Base view | 447,780 | 448,481 |
| Eight-line opening | 642,671 | 643,372 |
| Ten-line opt-in | 696,056 | 696,757 |

The dependency-only increase is 701 bytes. The ten-line limit moves from 680 to
681 KiB (696,320 to 697,344 bytes), accommodating its measured 437-byte overage.
The JavaScript, base, default opening, data, optional-card and other composition
limits are unchanged. All Paris bundle checks pass with this explicit allowance.

## Validation

All sixteen checkouts pass their applicable unit, type, lint, architecture/boundary,
production build and payload-budget checks. **3,547 unit tests passed.** Both London
and Swiss worker typechecks and dry builds pass. All sixteen npm audits report
zero known vulnerabilities, including development dependencies. Final checkout
checks confirm no missing fetched main commits, no merge conflicts, matching
manifest/lockfile roots and the expected installed dependency versions.

The shared release rehearsal passes: 100 packed-consumer browser checks, two skips,
34 loader checks, hosting checks and publication dry run. Nothing was published.

Browser validation covered **1,124 passing scenarios, zero remaining failures
and 26 skips**, including the small England/GRID84 smoke checks. Counts consolidate
fresh-server retries and targeted follow-ups rather than counting repeated attempts
as additional scenarios.

| Workspace / edition | Passed | Remaining failures | Skipped |
| --- | ---: | ---: | ---: |
| Shared workspace | 134 | 0 | 2 |
| All Change | 60 | 0 | 2 |
| Correspondances | 238 | 0 | 2 |
| Gleislicht | 110 | 0 | 11 |
| England smoke | 2 | 0 | 0 |
| Local / Express | 21 | 0 | 1 |
| LUFT | 153 | 0 | 5 |
| MANIFEST | 35 | 0 | 0 |
| NORIKAE | 14 | 0 | 0 |
| PFAD | 86 | 0 | 0 |
| Umlauf | 34 | 0 | 0 |
| Underfall | 43 | 0 | 1 |
| Zugunruhe | 70 | 0 | 2 |
| ZENIT | 120 | 0 | 0 |
| GRID84 smoke | 4 | 0 | 0 |

Chromium defaults to SwiftShader on this host. Remaining local Chromium suites used
explicit `--use-angle=metal`, verified as ANGLE Metal on the Apple M4 Max, through
temporary overlay configs under `/private/tmp/motion-refresh-hardware-configs`.
Their WebKit settings and assertions were unchanged; all suites used one worker.
The software attempts remain recorded. These are local browser results, not
hosted-CI or physical-phone measurements.

Initial concurrent London/Swiss unit timeouts passed complete reruns with two
Vitest workers and unchanged timeouts/assertions. LUFT's two initial browser
failures passed fresh-server reruns; one coincided with a Vite reload. PFAD's
86 scenarios are covered by its resumed 84-case run, the isolated audio cases and
four Chromium follow-ups on Metal. Underfall's full Metal/native-WebKit run passed.
The Swiss tunnel-label case and Local / Express tooltip case passed on retry;
their flakiness remains visible in the evidence.

Maintenance changes are committed separately from pre-existing local work.
Recorded validation bases, maintenance commits, manifest/lockfile hashes and full
results are retained in
[evidence/dependencies-2026-10-18.json](evidence/dependencies-2026-10-18.json).

## Validation history

All seven original London/Zugunruhe failures reproduced against pre-refresh
application builds with the refreshed Playwright driver. They were existing UI
issues and are now fixed, with unchanged expectations and stronger modal keyboard
coverage. Full London and Zugunruhe suites were rerun after the fixes. London's
full run includes the deliberately skipped desktop copy of the phone-only cadence
case, accounting for the extra skip in the table.

PFAD's checkout includes substantial pre-existing uncommitted work. Its first
browser run stalled in the audio/fake-clock case and was stopped; remaining cases
were run separately without changing source or assertions. Four Chromium cases
subsequently passed on Metal. The isolated audio case also passed on WebKit.
The maintenance-only PFAD patch is additionally checked against clean committed
source, including its 142 unit tests, type/lint/boundary/build/budget checks and
browser suite: 81 cases passed on Metal/native WebKit and the remaining GPU
recovery pixel comparison passed on Chromium's default renderer (Metal produced
a 14-level channel difference against the existing two-level limit). No tolerance
or application assertion was changed. This clean-copy run used two workers, as
configured by PFAD. NORIKAE main is separately checked and passes its 12 browser cases;
the active development branch's 14 cases remain represented in the table above.
These additional clean-copy runs are recorded separately rather than inflating the
active-checkout scenario totals.
