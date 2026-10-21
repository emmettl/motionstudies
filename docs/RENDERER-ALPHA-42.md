# Private renderer layers — alpha.42

21 October 2026

The coordinated public `0.1.0-alpha.42` release publishes the [private rail/context extraction](RENDERER-STATIC-LAYERS.md). Public exports, props and behaviour are unchanged. Ground/water/border and rail/station/route/traffic components retain their existing resource and frame lifetimes in private modules. No batching or transform optimisation is included.

All four packages move together under npm's `next` tag through [trusted run 39668146969](https://github.com/emmettl/motionstudies/actions/runs/39668146969), from source `ee38610`. All four registry metadata records and `next` tags match. Downloaded registry archives match the hosted SHA-512 integrities, and every package file matches the local candidates (93 core, 57 data, 93 three and 97 web files).

The seven affected network editions adopt exact registry pins: London, Paris, Switzerland, Local / Express, NORIKAE, Berlin and Underfall. NORIKAE's main and synthetic-player branches are checked independently. Other editions do not use the refactored scene and retain their pins.

Switzerland's guarded surface and picking adapters now follow the defining private modules. Their replacement-count guards remain active; the basemap compositing regression evaluates the installed context layer. Public policies and the edition's map surface, label anchoring and context-picking rules are preserved. Paris's compatible test harness was prepared before this release. No installed source files are patched.

Shared Node 24 validation passes type/lint/architecture gates, 481 units, 11 hosting checks, 100 packed-consumer browser cases (two existing skips), 36 loader/renderer browser cases and four publication dry runs. The hosted verification job also passes all shared gates. Trusted OIDC publication and subsequent registry verification both pass.

| Checkout | Unit cases | Relevant browser cases |
| --- | ---: | ---: |
| London | 277 | 12 |
| Paris | 29 | 19 (one existing skip) |
| Switzerland | 1,465 | 7 |
| Local / Express | 2 | 17 (one existing skip) |
| NORIKAE player | 28 | 14 |
| NORIKAE main | 28 | 12 |
| Berlin | 20 | 18 |
| Underfall | 131 | 14 |

The edition browser total is 113 passes with two existing platform skips. Browser projects use Chromium and WebKit, except Berlin whose existing phone project uses Chromium.

Initial concurrent London and Swiss runs hit existing test timeouts. All affected files pass with one worker and their original timeout limits: 19 London cases across two files, 128 Swiss cases across nine files. No test assertions or timeout values were relaxed.

Final registry builds pass all applicable payload limits without cap changes: London 365.7 KiB JS / 366, Switzerland 378.3 KiB JS / 380 and 806.1 KiB total / 808, Paris 629.2 KiB opening / 630 and 681.3 KiB ten-line / 682, Local / Express 383.7 KiB first view, and Berlin 584,395 opening bytes / 588,800. All eight empty-cache registry installs pass lock integrity and every installed-file comparison, then pass final type/lint/boundary/build/budget gates. Only the four shared package lock records change; third-party lock records are preserved. The changed Swiss basemap regression also passes against the registry install. Final browser checks exercise these clean installations.

All eight adoptions are pushed; remote heads match the following commits.

| Checkout | Branch | Commit |
| --- | --- | --- |
| allchange | `main` | [`490e7561`](https://github.com/emmettl/allchange/commit/490e75613c58842e97b5feb1ca13f2b4cc93f620) |
| gleislicht | `main` | [`e1988ef3`](https://github.com/emmettl/gleislicht/commit/e1988ef3b3c6247500cedc9957b288ac887f4185) |
| correspondances | `main` | [`73518949`](https://github.com/emmettl/correspondances/commit/735189492175c13f7db67756362d2f1b4e4f311e) |
| local-express | `main` | [`790588bd`](https://github.com/emmettl/local-express/commit/790588bd1a560f9c5c9b8c60fd13af623cef5994) |
| norikae | `codex/synthetic-player` | [`10c1953e`](https://github.com/emmettl/norikae/commit/10c1953e3aeea49151625faa7b487b81ce932261) |
| norikae-main | `main` | [`8ab6cc88`](https://github.com/emmettl/norikae/commit/8ab6cc8868ef7c9de56e3bd90621306f36b689e4) |
| umlauf | `main` | [`57a9fd20`](https://github.com/emmettl/umlauf/commit/57a9fd20cb5b9bc61c6cfa6eaa62e7e945f1bab0) |
| underfall | `main` | [`71afa956`](https://github.com/emmettl/underfall/commit/71afa956cadb1b1adb9e0a0e62ecaaec6ef54640) |

At the recorded post-push snapshot, NORIKAE main validation passes; the edition deployments/checks are otherwise queued or running. The player branch has no matching hosted run. Publication succeeds, but a pushed adoption does not by itself establish a completed hosted deployment. See the [artifact, install and rollout evidence](evidence/renderer-alpha42.json). Existing root, Swiss and Underfall local work is preserved.
