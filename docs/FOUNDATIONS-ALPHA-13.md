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
| All Change | `ddef445`, budget follow-up `9bcce69` | All five foundations; 277 unit tests, type/lint/boundary, fixture/worker checks, 35 broad browser passes plus eight focused station/observed-mode passes; one existing desktop frame-cadence skip |
| Underfall | `15417e6` (local; no Git remote) | Railway and source-store/service-day/WebTRIS wrappers; 80 tests, build/lint and complete retained fixture parity |
| Gleislicht | `f9c931b` | Exact pins, public picking/style interfaces; 1,410 unit tests, build/lint/architecture, airport/map/road and lazy road-search browser checks |
| Correspondances | `385952c` | Exact pins and public renderer interfaces; 25 unit tests, build/lint/boundary/budgets and production airport/vehicle-card checks |
| Umlauf | `058465e` | Exact pins; 17 tests, build/lint/boundary/budget |
| Manifest | `be261ba` | Exact pins; 70 tests, type/build/boundary/budget |
| Zugunruhe | `6d4026b` | Exact pins on the current soundtrack/cloud work; 66 tests and build |

CI runs Node 24, whose gzip output differs from local Node 26. Final London and Swiss payload checks were repeated using the exact Node 24.20.0 runtime. Existing limits were retained: London's opening JavaScript is 344.4/345 KiB and its station board 7.9/8 KiB; Swiss opening JavaScript is 359.9/360 KiB. Optional bus-board, observation and road helper code now loads on demand and has separately enforced bounds and browser fetch checks.

Deployment status at this update: Umlauf and Manifest passed both Pages and Cloudflare publication. London, Paris, Swiss and Zugunruhe rollout checks are being completed by the coordinating sessions. Underfall is a local study with no remote to publish.

Local / Express and NORIKAE remain parked and are excluded from this rollout. Existing unrelated Swiss and Zugunruhe work was preserved.

## Evidence limits

Package publication does not establish national coverage, acquire a complete Bristol weekday, or turn London's timetable/prediction data into observed trajectories. Railway parity covers identical retained inputs, including 31 London WTT grids, 3,138 public calls, 8,681 joined journeys, 1,051 public supplements and 474 connected paths. The complete historical London OSM cache was unavailable; composed identical geometry inputs establish implementation parity, not a full reproduction of the historical publication. See the [railway evidence](SHARED-RAIL-READERS.md) for supported service-day limits and unavailable-path results.
