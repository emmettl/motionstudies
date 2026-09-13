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

The initial shared candidate passes 220 unit tests, package/application typechecks, architecture checks, and the packed-consumer suite (72 passed, 2 touch-inapplicable tooltip tests skipped). Four additional Chromium/WebKit controller tests cover lazy resources, cancellation, source replacement, validation, retries, transition reversal and dynamic reduced motion.

Release publication and final edition adoption results are recorded below when complete.
