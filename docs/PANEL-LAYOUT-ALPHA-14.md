# Panel styling — alpha.14

This release adds the opt-in [panel and control styling contract](PANEL-LAYOUT.md)
and a compact `AirportHeroCard` density. Editions supply their own clearances,
colours and panel widths; the package owns available-space sizing, overflow,
keyboard focus and touch-control geometry. Existing comfortable cards retain
their default presentation.

All four packages use `0.1.0-alpha.14` with exact internal pins and the npm `next`
tag. [Trusted publication run 34756816317](https://github.com/emmettl/motionstudies/actions/runs/34756816317)
succeeded from source commit `cecf50b470de7c3ff54c86e445a3dc058e15c2c7`.
All four registry tarballs were downloaded and checked byte-for-byte against the
workflow artifacts and [SHA512 release manifest](evidence/panel-layout-alpha-14-release.json).
The earlier alpha.14 run was cancelled before publication while the coordinated
alpha.13 CI-runtime budget fixes were completed.

## Adoption scope

- All Change: station, vehicle and airport panel bounds, dismiss controls,
  horizontally scrollable layout controls and compact airport cards.
- Correspondances: station, vehicle and airport bounds, vehicle dismiss control
  and compact airport cards. Station and vehicle cards load only after selection,
  with independent static-dependency budgets.
- Gleislicht: compact airport card and airport panel sizing only. Existing
  measured masthead/search/playback clearances remain authoritative. Playback
  measurement waits until footer inset changes have settled in the next frame,
  fixing the compact-desktop clearance race.

## Verification

Validation passed 271 unit tests, 90 packed browser checks (two existing skips),
34 loader browser checks, type checking, lint, architecture and npm dry-run.
The packed lab exercises resized containing blocks, evidence access through
scrolling, hidden panels, density switching, desktop keyboard focus and 44px
mobile controls. Edition validation covers production builds, their existing
bundle gates and desktop/mobile panel behaviour.

Edition builds and size gates were checked with the exact CI runtime, Node
24.20.0. Its gzip output differs from Node 26; no existing limits were raised.
Swiss verification also reproduced the generated two-day calendar, immutable data
release URL and enabled realtime endpoint from the failed hosted build. A fixture
build without those settings understated the production JavaScript cost.

| Edition | Opening JS gzip | Existing JS limit | Local validation |
| --- | ---: | ---: | --- |
| All Change | 344.4 KiB | 345 KiB | 277 unit tests; panel and station-board production checks |
| Correspondances | 335.2 KiB | 340 KiB | 25 unit tests; desktop/iPhone panel, airport and card-loading checks |
| Gleislicht | 359.7 KiB (full production configuration) | 360 KiB | 1,413 unit tests; desktop/iPhone measured-panel checks |

Paris's eight-line opening is 607.3 KiB against 625 KiB. London and Switzerland
also pass their unchanged CSS, data, total-transfer and optional-module gates.
Each edition lockfile pins all four registry packages to alpha.14 and matches
the tested release hashes. All three editions passed complete CI and both hosting
workflows. Their [live release manifests](evidence/panel-layout-alpha-14-editions.json)
were checked against the exact successful source commits and Pages artifacts.

## Edition release evidence

| Edition | Final source | Pages / complete CI | Cloudflare / live provenance |
| --- | --- | --- | --- |
| All Change | `f56c43ccb39b989f7d287a7e81d11331e4123a1f` | [34757733539](https://github.com/emmettl/allchange/actions/runs/34757733539), passed | [34758107122](https://github.com/emmettl/allchange/actions/runs/34758107122), passed; live `_release.json` matches source and Pages run |
| Correspondances | `cc9983c49db9acc38ec28c87032d5eed3023dfd5` | [34758185400](https://github.com/emmettl/correspondances/actions/runs/34758185400), passed | [34760173282](https://github.com/emmettl/correspondances/actions/runs/34760173282), passed; live `_release.json` matches source and Pages run |
| Gleislicht | `7e275c24ca1de879a26ac3beb7abd61e098a785c` | [34758697375](https://github.com/emmettl/gleislicht/actions/runs/34758697375), passed | [34759953211](https://github.com/emmettl/gleislicht/actions/runs/34759953211), passed; live `_release.json` matches source and Pages run; [freshness 34759997594](https://github.com/emmettl/gleislicht/actions/runs/34759997594), passed |

Paris follow-up `cc9983c` preserves the authored correspondence description and
published minimum-transfer evidence when a hub is selected, displays the searched
mission code in the vehicle card, and keeps airport graphics mounted but hidden
during the heart morph. The existing allocation and hidden-landmark picking
checks both pass; 18 focused desktop/iPhone cases passed. The keyboard route
search test parks its pointer outside the new results to avoid incidental hover
selection. The obsolete run with the reproduced regressions was cancelled.

Swiss follow-up `7e275c2` keeps cogwheel catalogue validation/filtering and terrain
journey calculation outside the national opening. Each helper loads alongside
its selected study's data, retains existing loading/error behavior, and has a
separately checked 3 KiB dependency budget. The exact two-day production build is
359.7 KiB JavaScript and 786.1 KiB total. All 1,413 unit cases passed in hosted CI; four cogwheel/panel browser
cases and five terrain cases passed, with one desktop-only layout skip. Existing
realtime compatibility, freshness and recovery tests remain passing. The obsolete
run carrying the reproduced production budget failure was cancelled.

Swiss hosted validation passed 102 browser cases directly, with one iPhone
aircraft-picking case passing on its configured retry and 11 existing skips.
All four final production browser checks passed on their first attempt. The
production gate reproduced 359.7 KiB JavaScript and 786.1 KiB total, and both
national/regional timetables for 13 and 14 September passed. Live content SHA-256:
`4d726bc874b5ef7a02c917a366f9ebdcac31b9797d22302d3692cbc61574dd02`.

Paris hosted validation passed all 238 browser cases on their first attempt, with
two existing skips. Type, lint, boundary, unit, build and all original bundle gates
passed. The final eight-line opening remains 607.3 KiB against 625 KiB. Its Pages
and Cloudflare runs succeeded, and public metadata matches `cc9983c` and source
run `34758185400`.
