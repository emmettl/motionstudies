# Deferred button help alpha.18

`0.1.0-alpha.18` loads desktop button help after the first view. `mountMotionStudy` previously rendered `ButtonTooltips` in the opening bundle of every edition. It now renders `LazyButtonTooltips`, which loads the component inside its own Suspense boundary, so the application renders immediately and help attaches a moment later.

## Why

Adopting alpha.17 took Gleislicht's opening JavaScript to 360.6 KiB on CI's Node 24, against a 360 KiB limit that the edition keeps fixed; earlier overruns there were resolved by deferring code rather than raising the limit. The shared tooltip module is 1.9 KiB compressed on its own and is not needed to draw the first view.

## Behaviour

- The application mounts without waiting for the tooltip chunk.
- Until the chunk arrives, controls show no custom help. It then behaves exactly as before, including hover, focus, Escape and the touch rules that keep tooltips off phones.
- Editions that mount `ButtonTooltips` directly are unaffected; only `mountMotionStudy` changes.

## Validation

Shared gates: 322 unit tests, typecheck, lint and architecture checks, 34 loader browser checks and the packed consumer with 94 browser specimens (2 existing skips). The published build rewrites the lazy import to `./ButtonTooltips.js`.

Against the alpha.18 package build, locally on Node 26:

| Edition | Opening JavaScript before → after | Limit |
| --- | --- | --- |
| Gleislicht | 359.6 → 358.4 KiB | 360 KiB |
| All Change | 346.8 → 347.4 KiB | 348 KiB |

Gleislicht's budget counts the entry and its opening scene, so the deferred chunk leaves its total; CI's Node 24 measured 360.6 KiB before, so about 359.4 KiB is expected there. Gleislicht's tooltip, label and map-selection browser checks pass on desktop Chromium and iPhone WebKit.

All Change's budget counts every dynamic import that is not on its list of optional features, so the new tooltip chunk is counted and splitting adds a little overhead. Its adoption should classify the chunk as optional with its own small budget, as it does for other lazy features. All Change's tooltip and London browser checks pass.

## Publication and adoption

All four packages were published as `0.1.0-alpha.18` on the `next` dist-tag from `602fd69` through [the trusted release workflow](https://github.com/emmettl/motionstudies/actions/runs/34997874755). Registry integrity, run links and live results are retained in [the rollout evidence](evidence/tooltips-alpha-18-rollout.json).

| Downstream | Mount | Commit | Result |
| --- | --- | --- | --- |
| Gleislicht · Switzerland | Shared | `6b84f2c` | Deployed. Node 24 CI measures 359.5 KiB in the fixtures check and 359.8 KiB in the production build, within the unchanged 360 KiB limit (360.6 KiB on alpha.17). Button help loads as a separate chunk |
| All Change · London | Shared | `334307e` | Deployed. The budget check classifies the tooltip chunk as an optional feature with a 3 KiB limit (1.4 KiB); opening JavaScript 345.9 KiB locally against 348 KiB. Button help loads as a separate chunk |
| Umlauf | Shared | `c58702f` | Deployed. Button help loads as a separate chunk |
| Correspondances · Paris | Shared | `91ca7b4` | Pending |
| Local / Express | Shared | `0b99495` | Validated; no deployment workflow |
| NORIKAE | Own root | `5830492` main, `aeee069` feature branch | Deployed from main; bundle unchanged by this release |
| Manifest | Own root | `b4707cc` | Deployed; bundle unchanged by this release |
| Zugunruhe | Own root | `0d0aaab` | Deployed; bundle unchanged by this release, with the same hashed assets as the alpha.17 deploy. The hosted WebKit job failed a sound check and then a Night chapter check before passing on its third attempt; both checks pass locally, and the job has failed intermittently on other checks since 13 September |
| Underfall · Bristol | Shared | `6d0600d` | Local gates and the hosted Check pass on main of the private `emmettl/underfall` repository. It was adopted through a separate worktree; the checked-out `recorder-extraction` branch belonged to other work and has since been rebased onto this commit by its owner |

Every deployed edition that renders the national scene still serves the alpha.17 windowed motion program.

With a margin of 0.2 KiB on Gleislicht's production build, any later shared change on its opening path needs a Node 24 CI measurement before adoption; local Node 26 reads about 1 KiB lower.
