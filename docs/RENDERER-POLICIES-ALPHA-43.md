# Renderer policies and private scene boundaries

25 October 2026

This change replaces Switzerland's four Vite source-rewrite plugins with supported map and road policies, then separates label and selection components from the shared scene. The main scene falls from 3,302 to 1,816 lines. Private label textures, frame budgets, selection geometry and their disposal remain owned by the same components; shared path context and layer order have explicit private modules. Public defaults retain elevated geometry and the previous label placement.

Switzerland uses the public coplanar surface, marker pixel caps, train label screen offsets and independent regional detail scale. Its road wrapper supplies matched official topology paths and its existing linear curve and labels. Unresolved roads stay absent. Mainline road IDs use public picking metadata, and decorative context rails no longer publish incompatible active indexes. Airport labels have stable audit names. Air/road modules are lazy, with separate suspension boundaries so they cannot replace an already mounted network.

The Swiss train-label callback preserves its drawn placement below vehicles and comparison stacking. Collision boxes now use that same screen placement; the old source patch drew below the vehicle while admitting collisions above it. Open corridor heading samples clamp at their endpoints instead of wrapping to the opposite end.

London, Paris and Local / Express budget scripts previously traversed every dynamic import as opening code. The newly deferred shared road closure now has a separate 5 KiB gzip cap and must remain a dynamic entry outside the opening closure. Browser checks verify it is not fetched on opening. Existing opening and composition limits are unchanged; air remains counted conservatively. Production measurements use the pinned Node 24 toolchain because its gzip sizes differ from host Node 26.

A bounded static-transform prototype disabled local matrix recomputation at 30 JSX object sites in the private context/rail modules and used stable update callbacks. Five matched production pairs alternated baseline/trial order, with identical three opening-data hashes, 1,440 × 900 Chromium/Metal rendering and five-second paused/playing samples after warmup. Draw counts remained about 36 per frame. Only two of five pairs improved in either phase. Median script time was 0.242 → 0.245 ms/frame paused and 0.598 → 0.574 ms/frame playing; paired changes ranged from −22.8% to +12.4% paused and −16.8% to +5.9% playing. That variation does not establish a repeatable benefit. Screenshot review also showed a difference in ground-grid coverage, so the prototype is not visually equivalent. The prototype is excluded; default transforms and batching remain unchanged. See [raw measurements and source/data hashes](evidence/renderer-transform-trial-2026-10-25.json). These are desktop host observations, not phone or GPU benchmarks.

Shared validation passes 488 unit tests, 11 hosting checks, public declarations, architecture checks, packed consumer checks and Chromium/WebKit renderer/loader checks. Switzerland passes 1,466 unit tests. The edition browser runs cover picking, labels, lazy road loading, regional tram selection, camera/morph transitions and paused buffer reuse. Underfall's three default Chromium failures (screenshot capture and timeouts) all pass with the host Metal renderer and original timeouts.

All four public `0.1.0-alpha.43` packages are published under `next` from `f999fe5` through [trusted release 40226379338](https://github.com/emmettl/motionstudies/actions/runs/40226379338). Hosted verification and OIDC publication pass. The registry metadata, `next` tags, SHA-512 integrities and downloaded archives match the hosted artifacts. Every package file matches the local checked candidate: 93 core, 57 data, 107 three and 97 web files.

Eight empty-cache registry installs pass every installed-file comparison (354 files per checkout), then all applicable type, lint, boundary, build and payload checks. Third-party lock records are unchanged. Final registry measurements retain all existing caps: London 365.9 KiB JS / 366; Paris 629.2 KiB opening / 630 and 681.3 KiB ten-line / 682; Switzerland 378.9 KiB JS / 380 and 806.7 KiB total / 808 with its old pinned data, or 798.0 KiB total with the actual 25–26 October production calendar; Local / Express 383.9 KiB opening; Berlin 577,088 / 588,800 bytes. Final Swiss Chromium/WebKit registry checks pass six airport/road cases and four production R2 cases. The Swiss policy factory moved to a pure module, and its internal road resolver ceased exporting from a component file, removing both newly introduced Fast Refresh warnings; the three existing Date-purity warnings remain.

All eight registry adoptions are pushed:

| Checkout | Branch | Commit |
| --- | --- | --- |
| gleislicht | `main` | [`4faf824d`](https://github.com/emmettl/gleislicht/commit/4faf824d2ddef9a66c8c602c5f2d9e0103a10448) |
| allchange | `main` | [`f0192cac`](https://github.com/emmettl/allchange/commit/f0192cac891a94f5c8fe432ff02d77742461df18) |
| correspondances | `main` | [`c274a004`](https://github.com/emmettl/correspondances/commit/c274a00465629eeb5dd6d68b136e8fcb184e0a67) |
| local-express | `main` | [`cd81be66`](https://github.com/emmettl/local-express/commit/cd81be66e24589de985708cfe84550fdbb2f6c21) |
| norikae | `codex/synthetic-player` | [`2d635b5c`](https://github.com/emmettl/norikae/commit/2d635b5c24805cefc528c85711f46168d2528b48) |
| umlauf | `main` | [`5bcada0d`](https://github.com/emmettl/umlauf/commit/5bcada0dbdad03dfad91db28bd094f65ee7badb1) |
| underfall | `main` | [`532dbe34`](https://github.com/emmettl/underfall/commit/532dbe342366a7eedb260db4d507e34ece785c53) |
| norikae-main | `main` | [`0b695314`](https://github.com/emmettl/norikae/commit/0b695314924d63527ef5b87fcb9a7f71ecaa94fe) |

Switzerland's follow-up `c33819f` separates pure policies from component exports without changing its renderer behaviour. Existing root, Swiss and Underfall local work is preserved. The [release and rollout evidence](evidence/renderer-alpha43.json) distinguishes verified local/registry checks from hosted deployment state.

At the recorded hosted snapshot, London, Berlin and NORIKAE main validation/Pages/Cloudflare succeed. Switzerland's main adoption, Cloudflare publication and public freshness succeed; its pure-policy lint follow-up is running. Paris's complete hosted regression suite is running. Local / Express's 25 browser cases pass (three skips), and Underfall's code checks pass; their required site-artifact uploads remain blocked by the private-storage quota. No deployment guard was bypassed. See the [failure-check record](FAILURE-CHECKS-2026-10-25.md).

26 October follow-up: Paris's [complete hosted regression/build](https://github.com/emmettl/correspondances/actions/runs/40227237517) and [Cloudflare publication](https://github.com/emmettl/correspondances/actions/runs/40230870668) succeed. Switzerland's [pure-policy cleanup pipeline](https://github.com/emmettl/gleislicht/actions/runs/40227632424) also succeeds. The alpha.43 rollout gates described above are complete apart from the two private artifact-upload blocks. A later scheduled Swiss data-refresh incident is recorded separately in the failure checks.
