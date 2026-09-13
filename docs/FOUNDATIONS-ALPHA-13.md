# Foundations — alpha.13

Status: published on 13 September 2026; all seven active editions have adopted the registry packages. See the deployment record below for rollout status.

All four packages (`@motionstudies/core`, `data`, `three`, `web`) were published at `0.1.0-alpha.13`, with exact internal pins and the npm `next` tag. Subsequent releases can advance that tag; consumers pin the exact version.

## What shipped

1. Typed Node railway readers for WTT grids, public calls, calendars and journeys, plus connected railway routing and geometry. Underfall no longer depends on a hash-pinned sibling Python bridge; All Change uses the same public modules.
2. A compact timetable pattern codec and bounded, verified progressive loader, adopted by London's bus-day feed.
3. Source-aware station calls, including repeated visits, arrival/departure restrictions, source windows and independent source status.
4. Public renderer picking, infrastructure, diagram and style interfaces. All Change's compiled-package rewriting plugins were removed; compatible public interfaces were adopted in Paris and Switzerland. Swiss edition-specific geometry transforms remain outside this extraction.
5. A bounded observation-window compiler preserving timestamps, conflicts, gaps and source evidence, adopted by London.

Contracts and evidence: [All Change foundations](ALLCHANGE-FOUNDATIONS.md), [renderer interfaces](RENDERER-INTERFACES.md), [railway readers and parity](SHARED-RAIL-READERS.md). The earlier [ground-transport modules](SHARED-GROUND-TRANSPORT.md) shipped in alpha.12; Bristol's wrappers adopt them alongside this release.

## Runtime boundary

npm does not require a TypeScript rewrite. Browser modules are authored in TypeScript; the shared data runtime is Node ESM JavaScript with `.d.mts` declarations, checked through packed TypeScript consumers. It ships no Python runtime or install-time Python bootstrap. Edition-specific Python research and reference compilers remain outside this contract.

The railway tools require Node 24+ and host `unzip`; acquisition of public passenger PDFs additionally needs `pdftotext` in the edition. These are explicit tool requirements, not bundled runtimes.

## Publication evidence

[PR #8](https://github.com/emmettl/motionstudies/pull/8) merged the foundations. [Trusted release run 34754854498](https://github.com/emmettl/motionstudies/actions/runs/34754854498) successfully published the tested artifacts from `a6f3d455903f85cd1b0162b7c06ca510e20319a0`. Each registry SHA-512 integrity value was independently matched to its CI tarball; the exact manifest is retained in [release evidence](evidence/foundations-alpha-13-release.json).

Validation passed: 271 shared unit tests; type, lint and architecture checks; 14 hosting tests; 88 packed-consumer browser checks (two existing skips); and 34 additional loader/extension browser checks. Release dry-run and site build passed. Edition checks used registry installs, not workspace links or local tarballs.

## Edition adoption

| Edition | Adoption commit | Validation |
| --- | --- | --- |
| All Change | `ddef445`, budget follow-up `9bcce69`, board-preview fix `7cd9618` | All five foundations; 277 unit tests, type/lint/boundary, fixture/worker checks, 35 broad browser passes plus eight focused station/observed-mode passes; one existing desktop frame-cadence skip |
| Underfall | `15417e6` (local; no Git remote) | Railway and source-store/service-day/WebTRIS wrappers; 80 tests, build/lint and complete retained fixture parity |
| Gleislicht | `f9c931b` | Exact pins, public picking/style interfaces; 1,410 unit tests, build/lint/architecture, airport/map/road and lazy road-search browser checks |
| Correspondances | `385952c` | Exact pins and public renderer interfaces; 25 unit tests, build/lint/boundary/budgets and production airport/vehicle-card checks |
| Umlauf | `058465e` | Exact pins; 17 tests, build/lint/boundary/budget |
| Manifest | `be261ba` | Exact pins; 70 tests, type/build/boundary/budget |
| Zugunruhe | `6d4026b`, browser-readiness follow-up `5348469` | Exact pins on the current soundtrack/cloud work; 66 tests and build; Chromium 17 passes; WebKit 15 passes and two expected skips; both hosts verified |

CI runs Node 24, whose gzip output differs from local Node 26. Final London and Swiss payload checks were repeated using the exact Node 24.20.0 runtime. Existing limits were retained: London's opening JavaScript is 344.4/345 KiB and its station board 7.9/8 KiB; Swiss opening JavaScript is 359.9/360 KiB. Optional bus-board, observation and road helper code now loads on demand and has separately enforced bounds and browser fetch checks.

Deployment status at this update: Umlauf, Manifest and Zugunruhe passed both Pages and Cloudflare publication. Gleislicht's [Cloudflare publication](https://github.com/emmettl/gleislicht/actions/runs/34756977575) and [public-freshness check](https://github.com/emmettl/gleislicht/actions/runs/34757024447) passed, but the live release metadata identifies their source artifact as `caf48f0` from Pages run `34755823330`. The workflow-run event's newer head SHA was not the published artifact SHA. The alpha.13 run for `f9c931b` subsequently passed browser/data checks but failed its final production JavaScript budget; the alpha.14 follow-up fixes that gate. Underfall is a local study with no remote to publish.

London's alpha.13 full CI passed both desktop shards, the build/compiler/budget checks and mobile frame cadence. One iPhone interaction exposed a vehicle card overlapping the combined board's movement button. The fix keeps a call preview in the board until movement is requested, with explicit absence/visibility assertions; 12 repeated desktop/phone checks passed. It landed as `7cd9618`, followed by alpha.14 adoption `f56c43c`.

The separately authorized [alpha.14 panel-layout rollout](PANEL-LAYOUT-ALPHA-14.md) now carries the same foundations into London (`f56c43c`), Paris (`cc9983c`) and Switzerland (`7e275c2`). London passed complete CI, Pages and Cloudflare, with live provenance matching `f56c43c` and Pages run `34757733539`. Swiss subsequently passed complete CI, Pages, Cloudflare and public freshness for `7e275c2`; live metadata matches Pages run `34758697375`. Paris passed all 238 browser cases without retries (two existing skips), its original budgets, Pages and Cloudflare for `cc9983c`; live metadata matches Pages run `34758185400`. The **Find shared refactoring candidates** session verified all three final public artifacts. Their final source fixes, publication workflows and captured live artifact manifests are recorded in the alpha.14 release record. The release record above describes the verified alpha.13 registry adoption, even where the coordinating session subsequently advances exact pins to alpha.14.

**Zugunruhe publication completed:** [Pages run 34757013660](https://github.com/emmettl/zugunruhe/actions/runs/34757013660) and [Cloudflare run 34758294102](https://github.com/emmettl/zugunruhe/actions/runs/34758294102) passed for `5348469db3efa87ff7fc2fd2c646f8e3a1c50989`, retaining exact core/web alpha.13 pins. The coordinating session verified the live release metadata against that SHA and source run; published content SHA-256 is `fa038825857bdd4061f49d66222593a0f6d6ec2cee01645cfd03ebe72b55e7ab`. Night HTML on both hosts matched the local build (`f562149ae0d1ff288b6687504941ae08cdbb95394718cbb235e783b67aaa381e`), and the cloud motif asset returned HTTP 200 with an audio content type on both. A live browser check started the four-stem Night audio with Aquatic and Total cloud, showed Cloud veil without console errors, then turned sound off. The reduced-motion regression and all soundtrack/cloud browser tests passed.

Local / Express and NORIKAE remain parked and are excluded from this rollout. Existing unrelated Swiss and Zugunruhe work was preserved.

## Evidence limits

Package publication does not establish national coverage, acquire a complete Bristol weekday, or turn London's timetable/prediction data into observed trajectories. Railway parity covers identical retained inputs, including 31 London WTT grids, 3,138 public calls, 8,681 joined journeys, 1,051 public supplements and 474 connected paths. The complete historical London OSM cache was unavailable; composed identical geometry inputs establish implementation parity, not a full reproduction of the historical publication. See the [railway evidence](SHARED-RAIL-READERS.md) for supported service-day limits and unavailable-path results.
