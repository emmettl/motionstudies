# Deferred button help alpha.18

`0.1.0-alpha.18` loads desktop button help after the first view. `mountMotionStudy` previously rendered `ButtonTooltips` in the opening bundle of every edition. It now renders `LazyButtonTooltips`, which loads the component inside its own Suspense boundary, so the application renders immediately and help attaches a moment later.

## Why

Adopting alpha.17 took Gleislicht's opening JavaScript to 360.6 KiB on CI's Node 24, against a 360 KiB limit that the edition keeps fixed; earlier overruns there were resolved by deferring code rather than raising the limit. The shared tooltip module is 1.9 KiB compressed on its own and is not needed to draw the first view.

## Behaviour

- The application mounts without waiting for the tooltip chunk.
- Until the chunk arrives, controls show no custom help. It then behaves exactly as before, including hover, focus, Escape and the touch rules that keep tooltips off phones.
- Editions that mount `ButtonTooltips` directly are unaffected; only `mountMotionStudy` changes.

## Validation

Recorded with the release.

## Publication and adoption

Recorded once the trusted release workflow and edition upgrades complete.
