# Renderer adoption paths

Inspected 1 November 2026. This plan follows the
[stable Fiber 9 preparation](RENDERER-9X-PREPARATION.md) in
[PR #60](https://github.com/emmettl/motionstudies/pull/60). Its new public exports
must be published before any edition can consume them. All edition acceptance
gates remain open; this document records a proposed order, not completed rollout.

## Release prerequisite

The workspace still carries coordinated version `0.1.0-alpha.49`. Existing
registry archives cannot gain the new APIs through a merge. Prepare the next
available coordinated version of all four packages, including internal pins,
root/lab dependencies, lockfile and release workflow defaults, following
[the release process](RELEASING.md). Check the registry before choosing the version.
Run the packed-package, release-dry-run and loader gates for that exact release
candidate. Publication is a separate authorized action; merging the preparation
does not publish npm packages.

Edition PRs must consume exact published versions through public exports. Keep
Fiber on the validated `9.8.2` baseline. The initial package update should retain
the edition's current renderer and authored materials, with no forced peer
resolution. Review intervening shared releases for editions several versions
behind; a renderer-motivated update can also contain contract and UI changes.

## Three changes to review separately

1. **Package update.** Record a baseline, update the installed shared packages
   together to the published version, regenerate the lockfile and validate.
2. **Stable API preparation.** Use `webgl-study` for edition-owned Fiber Canvas
   and hooks. Use `frameRenderer` and `frameElapsed` at renderer/presentation-time
   reads. Replace reconciler `onUpdate` work with effects or stable ref callbacks
   where present. Preserve study-owned playback clocks and scheduling order.
   Remove unused perf dependencies only after checking edition imports.
3. **Optional visual port.** Adopt the sprite, texture, luminous material and
   output helpers in a bounded scene. A WebGPU switch needs an actual node-material
   port, backend comparison, recovery checks and authored appearance review.
   It is independent of completing the stable API preparation.

On 9.x, keep supported Canvas configuration and numeric scheduling where needed.
Localize ordered camera work so v10's input phase can replace it later. Do not put
v10 scheduler objects or `/legacy` imports into a 9.x application. For dynamic
shadows, an explicit renderer `shadowMap` update with invalidation is a possible
9.x preparation; test sunlight toggles before replacing the current Canvas prop.

## Proposed edition order

Pins below are remote default-branch manifests inspected today. They differ from
the dated local-checkout inventory in the [readiness register](RENDERER-READINESS.md).
`alpha.N` abbreviates `0.1.0-alpha.N`; it describes the shared packages each
edition installs, not a deployed release. The
[manifest/blob snapshot](evidence/renderer-adoption-remotes-2026-11-01.json)
records exact object identities, dependencies and available check scripts.

| Order / edition | Shared pins | First bounded adoption | Edition acceptance focus |
| --- | --- | --- | --- |
| 1. Umlauf | alpha.43 | Update shared packages with its existing network scene; little edition-owned Fiber migration. | Ring direction filters, geography/circulation morph, picks and labels, shared playback, travel into/out of Ostkreuz. |
| 2. Correspondances | alpha.43 | Adapt `ParisAirportSelection.tsx` from direct `useThree`/`gl` access to the public WebGL/state helpers. | Airport picks after camera/morph changes, diagram transitions, labels and retained rail/air fixtures. |
| 3. All Change | alpha.43 | Adapt `LondonNationalRailLayer.tsx` frame-time reads and review road/label extensions. | Existing trail throttling and cadence, dense buses, rail/road selections, labels and London fixture budgets. |
| 4. Underfall | alpha.48 | Move `RouteEventsLayer.tsx` hooks to the WebGL boundary; inspect the edition's own perf imports. | Route-event presence and emphasis, missing observations, glyph visibility, camera and labels. |
| 5. Gleislicht | alpha.48 | Prepare journey, terrain and orbital Canvas/hooks in small changes; handle clocks, shadows and perf uses explicitly. | Atlas/journey/orbital transitions, terrain readiness, sunlight toggles, camera-dependent picks and authored glows. |
| KRAFT | alpha.48 | Shared package/diagnostic update, then targeted helper use where its independently owned renderers benefit. | Weather validity/support, UTC playback, resource cleanup and renderer diagnostics. |
| Schwall | alpha.49 | Shared API/diagnostic update; compare portable texture/output helpers in its existing opt-in node preview. | Water appearance, context/device reconstruction and numerical regression gates; do not change the solver to satisfy a renderer migration. |
| PFAD | alpha.33 | Review intervening packages and update dependencies first; optional sprite/line experiments remain separate. | Deterministic event cutoffs, Uint32 limits, path ribbon/flash appearance, uploads, seek/replay and recovery. |
| LUFT | alpha.48 | Shared package update; independent Three material and lifecycle work only when justified. | Point sizing, playback, trail appearance, camera and recovery. |
| Zugunruhe | alpha.46 | Shared package update; assess its independent field/trail materials separately. | Field support/missingness, trail semantics, controls and recovery. |
| ZENIT | alpha.31, core/web | Contract/UI update if useful; independent orbit/star renderer owns any future port. | Camera/depth behaviour, stellar glyphs and its retained fixtures. |
| MANIFEST | alpha.31, web only | Shared UI maintenance only for this preparation. Its renderer is raw WebGL. | Buffer/lifecycle behaviour belongs to any later edition-specific renderer project. |
| England | alpha.46 | Selective shared contract/diagnostic maintenance; inspect the active scene before adding renderer work. | The inspected local geography uses SVG. Installed Three packages do not establish a GPU migration requirement. |
| Local / Express | alpha.43 | Maintenance-only package/compatibility validation against retained private fixtures. | Existing publication hold remains in place. |
| NORIKAE | alpha.43 | Maintenance-only preview compatibility, on the branch selected by that edition. | Preserve the synthetic-preview boundary and parked source-acquisition status. |

The ordering is an engineering recommendation, not a committed edition schedule.
The first five share network rendering, so the shared 9.x work benefits them
without replacing their materials. More complex custom extensions follow the
smallest pilot. Independent Three and raw WebGL scenes do not change backend
because Fiber changes its default.

## Targeted source findings

- Umlauf's current `App.tsx` imports `NationalNetworkScene` and lazy-loads
  `OstkreuzScene`. The latter renders SVG with its own playback timer. Test the
  transition between them; wrapping the SVG view in Fiber adds no readiness value.
- Correspondances' `ParisAirportSelection.tsx` reads `scene`, `camera` and `gl`
  from `useThree`. Keep the same renderer/canvas identity when adapting selection.
- All Change's `LondonNationalRailLayer.tsx` reads `clock.elapsedTime` to budget
  trail refreshes. `frameElapsed(frame)` should preserve that origin and cadence;
  the timetable remains the edition's clock.
- Underfall's `RouteEventsLayer.tsx` uses frame/camera/size hooks and owns custom
  sprites and route strips. Hook preparation can precede any material port.
- Gleislicht's `OrbitalView.tsx` has dynamic Canvas shadows and WebGL configuration;
  `MeasuredTerrainScene.tsx` owns another Canvas and presentation readiness. Its
  separately owned timetable timer must not become renderer elapsed time.
- KRAFT and Schwall already initialize shared GPU diagnostics. Updating those
  imports does not require introducing Fiber into their independent scene loops.

The JSON snapshot identifies these inspected remote source blobs. Other renderer
ownership descriptions use the register's local source inspection; fetch current
edition source again before implementing a PR. No served artifact was inspected.

## Validation and adoption record

Use an isolated clean checkout from the selected edition branch; preserve ongoing
local work. Establish its own existing checks before changing pins, then rerun
its declared type, unit, architecture/boundary, build and budget checks. Run its
browser suite, or add focused browser coverage for the changed behaviour where
none exists. Underfall's manifest currently declares no browser suite; do not
infer browser acceptance from its feed tests.

For renderer-facing changes, include Chromium and WebKit; pause, backward seek,
restart, reduced motion, pan/zoom/resize, picks and labels, scene teardown and
resource recovery. Keep data, clocks and fixture provenance stable so appearance
and timing comparisons are meaningful. Track first visible frame, frame pacing,
bundle and memory observations against the edition baseline. Physical-phone
memory/thermal and authored visual review remain separate gates.

Only paths actually implemented by an edition need three-backend comparison.
Where a native WebGPU path is claimed, require native execution and reject
fallback. The shared flat additive-output profile is opt-in and needs its bound
material family; it is not a general colour-management rule for lit/PBR scenes.

Record edition/source commit, exact package version, checks and device/browser,
selected renderer, visual review and remaining limitations in each adoption PR.
Record the served artifact/revision separately if that edition subsequently
publishes. The [v10 prototype](https://github.com/emmettl/motionstudies/pull/59)
remains experimental; rebase and revalidate its release-specific delta after the
stable preparation and before proposing a v10 release.

The upstream [v10 migration guide](https://r3f.docs.pmnd.rs/next/migration/v10)
still labels v10 as alpha at this inspection. Recheck its dependency ranges,
legacy entry and scheduler/Canvas changes when implementing that later upgrade.
