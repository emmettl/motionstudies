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

Recorded once the trusted release workflow and edition upgrades complete.
