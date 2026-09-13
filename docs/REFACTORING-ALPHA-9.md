# Shared refactoring — alpha.9

This release follows alpha.8 without changing its transport board APIs.

- Core: binary train-stop lookup with sequential fallback for unordered observations; inclusive active timetable counters and station/route/category membership selection.
- Three: active buffer upload ranges, paused buffer reuse, adaptive trail and UI cadence, bounded label searches, station-label caching, cached collators and batched hub lines. Custom edition layers can reuse the same helpers through `render-performance`.
- Web: `useJsonAsset` for cancellable, source-keyed optional resources, and `useTransitionValue` for reversible layout transitions with dynamic reduced-motion handling.
- Data: `runNetworkChunkCli` preserves the existing edition chunk command arguments and writes the same manifest/chunk contracts.

Search ranking and complete application shells remain edition-owned. General boundary-check and reporter tooling consolidation is deferred; this release extracts the demonstrated network chunk CLI only.

## Compatibility and adoption

Exact package pins must advance together. Editions that rewrite package code during Vite transforms must remove overlapping optimizations before upgrading. The renderer already performs buffer range updates, interpolation, label scheduling, paused frame gating, hub batching and collator reuse.

Paris removes its performance transform. London retains only bus caching and observed-road sampling. Switzerland retains its trail worker lifecycle and transfer adapter. Their custom picking, cartography and authored layout transforms remain local. Paris's custom morph must invalidate the station-label cache when its mix changes, even if station data is unchanged.

Movement counters default to inclusive timetable intervals, including dwell, and exclude cancellations. `requirePositionable: true` preserves London's existing omission of journeys with fewer than two stops. Edition-authored filters and labels stay local.

## Validation

The final shared release passes 221 unit tests, package/application typechecks, architecture checks, and the packed-consumer suite (72 passed, 2 touch-inapplicable tooltip tests skipped). Four additional Chromium/WebKit controller tests cover lazy resources, cancellation, source replacement, validation, retries, transition reversal and dynamic reduced motion.

## Publication and edition adoption

Published all four packages at exact version `0.1.0-alpha.9` with the `next` npm tag on 13 September 2026, after the coordinated alpha.8 release completed. [Trusted publication workflow](https://github.com/emmettl/motionstudies/actions/runs/34727517544) passed verification and publication, including npm provenance. [Implementation PR #3](https://github.com/emmettl/motionstudies/pull/3) merged as `b6c150b`.

Every edition lockfile below resolves to npm registry tarballs with integrity hashes. Candidate package overlays were replaced by actual registry installations before final adoption. The ordinary local checkouts were fast-forwarded and installed from their lockfiles. Gleislicht's existing compact-desktop changes remain unstaged and were verified unchanged; its local package scripts were preserved while advancing the package pins.

| Edition / branch | Adoption commit | Local validation of the adopted release |
| --- | --- | --- |
| All Change / main | `da94953` | Typecheck, lint, 284 unit tests, build, boundaries, transfer budgets; 8 renderer browser checks |
| Correspondances / main | `4e06d7a` | Typecheck, lint, 25 unit tests, build, boundaries and all transfer budgets; 154 controller/layer browser checks on the candidate plus 12 final registry renderer/airport/card checks |
| Gleislicht / main | `1a082bf` | Typecheck, lint, 1,411 unit tests, build, boundaries and hosted-data transfer budget; 6 final worker/paused geometry/card browser checks |
| Local / Express / main | `407014f` | Typecheck, lint, 2 CLI integration tests, build, boundaries and transfer budgets; 19 browser checks passed, 1 desktop-inapplicable case skipped, then all 4 overtake/card cases passed after the integration fix |
| Norikae / codex/synthetic-player | `bd0ec22` | Typecheck, lint, 28 data tests, build, boundaries; all 14 browser checks |
| Norikae / main | `a0fd730` | Typecheck, lint, 28 data tests, build, boundaries; all 12 browser checks |
| Umlauf / main | `16beccf` | Typecheck, lint, 17 data tests, build, boundaries and transfer budget; 16 composition/station browser checks |
| Underfall / main (local only) | `e73c3a7` | Full check: 56 tests, strict lint and build |
| MANIFEST / main | `a5ea179` | Full check: boundaries, 70 tests, typecheck, build and existing bundle ceiling |
| Zugunruhe / main | `513dddc` | 46 tests and production build, including frozen-study staging |

New York's station card had hidden the selected overtake explanation after alpha.8. The integration now keeps the comparison status for an active overtake and the departure card for a station-only selection. Both desktop Chromium and iPhone WebKit cases pass. Norikae's main branch keeps its route-wide count semantics; its development branch continues narrowing counts by selected station.

The alpha.9 source adoptions are pushed to each edition's existing branch; Underfall has no remote. Existing hosted workflows run automatically. At this record's creation, Norikae and MANIFEST deployments and Zugunruhe's Cloudflare publication had succeeded. London, New York, Berlin and remaining Pages checks were running; Paris and Gleislicht were queued behind alpha.8 publication checks. These asynchronous deployment runs are separate from the completed local adoption gates above.

## Remaining opportunities

Search indexing/ranking and combobox behavior need a separate contract that preserves each edition's language and selection rules. General boundary checker and Playwright reporter consolidation also remains open. Optional loaders and transitions were adopted where their contracts matched (Paris, New York and Tokyo); authored choreography, progressive data loading, edition-specific workers and observed transport semantics remain local.
