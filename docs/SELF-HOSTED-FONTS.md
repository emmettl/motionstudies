# Self-hosted typefaces

**Prepared 15 September 2026 for the next coordinated release; publication and adoption are not yet recorded.** `@motionstudies/web/fonts.css` serves Inter and DM Mono from the consuming edition's own origin. The shared `tokens.css` and `shell.css` already name those families; until now each edition loaded them from Google Fonts.

## Why

The [first-view profiles](FIRST-VIEW.md) found that Gleislicht, All Change and Correspondances import `fonts.googleapis.com` from inside their render-blocking stylesheet. Anything the HTML paints must wait for the local stylesheet, a new connection and Google's stylesheet. Self-hosting removes that chain and the third-party requests: visitors' addresses no longer reach Google, and the typography no longer depends on an outside service.

It is not, by itself, a speed change. On 15 September, live Gleislicht (`6b84f2c`) was loaded five times each under the first-view throttling with its stylesheet's Google `@import` replaced by the equivalent `@font-face` rules; the font files still came from Google's servers:

| Stylesheet | First paint | First map frame | Timetable finished |
| --- | ---: | ---: | ---: |
| Google `@import` | 2,092 ms | 8,701 ms | 6,021 ms |
| Local `@font-face` | 2,080 ms | 8,704 ms | 6,012 ms |

Gleislicht paints nothing until its JavaScript renders, which happens after the stylesheet chain has finished, and the browser downloads the same font files either way. The earlier 427 ms map improvement came from blocking fonts entirely, removing their bytes; self-hosting keeps them. DevTools throttling does not model connection setup, so any saving from same-origin files is not captured.

The benefit appears once the HTML can paint before JavaScript, as the first-view practices recommend. With the same inline skeleton in both variants:

| Stylesheet, with HTML skeleton | First paint | First map frame |
| --- | ---: | ---: |
| Google `@import` | 764 ms | 8,097 ms |
| Local `@font-face` | 132 ms | 8,094 ms |

Both variants served the document and stylesheet through Playwright, so absolute first-paint times are earlier than a normal load; the 632 ms difference is the Google stylesheet request. Per-run values are in the [evidence file](evidence/first-view-2026-09-15.json).

## What changed

- **`fonts.css`**: 13 `@font-face` rules with `font-display: swap` and the same `unicode-range` subsets Google serves. DM Mono has static 300, 400 and 500 weights; each Inter subset is one variable file covering 400–600. The stylesheet is 723 bytes gzipped.
- **`fonts/`**: 13 WOFF2 files, 262,028 bytes in the package. A browser downloads only the subsets its text uses: Gleislicht's first view needs DM Mono 400 and 500 latin (8.7 KB each) and Inter latin (48.4 KB), the same files it downloads from Google today.
- **Licences**: `fonts/Inter-OFL.txt` and `fonts/DM-Mono-OFL.txt` carry each project's copyright line and the SIL Open Font License 1.1, which permits bundling and redistribution. Neither font declares a Reserved Font Name.
- **Provenance**: `npm run fonts:vendor` refetches the files from the Google Fonts query editions use, with a Chromium user agent, and records each file's source URL, size and SHA-256 in `fonts/fonts.json`. Google selects formats and hinting by user agent, so these are the WOFF2 files served to Chromium and WebKit. `node scripts/vendor-web-fonts.mjs --check` verifies the vendored files offline.
- **Packaging**: the build ships `.woff2` files and `-OFL.txt` licences. `check:packed` fails if the web tarball lacks a referenced font or licence, or if the packed lab build emits no font files.
- **Lab**: the widget lab imports `fonts.css`. A browser check on desktop Chromium and iPhone WebKit loads each family and weight range and asserts every font request is same-origin, with none to Google.

## Validation

On 15 September: 327 unit tests across 76 files, including the vendoring parser and offline manifest check; typecheck, lint and architecture checks; the lab font check on desktop Chromium and iPhone WebKit; and `check:packed`, whose packed consumer passed 96 browser specimens with 2 existing skips. The packed check first failed because the distribution `files` list omitted fonts and licences even though the build copied them; the new tarball assertion caught it before the fix.

## Adopting in an edition

After upgrading to the release that contains this export:

1. Replace the Google Fonts rule at the top of the edition stylesheet, for example `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Inter:wght@400;500;600&display=swap');`, with `@import '@motionstudies/web/fonts.css';`. Vite resolves and bundles it, so no runtime `@import` remains.
2. Run the edition's CSS budget. The rules add about 0.65 KiB gzipped to opening CSS after removing the old import. Gleislicht recorded 9.9 KiB of its 10 KiB CSS limit on 9 September, so its adoption must measure this rather than assume it fits.
3. Check that the built `dist/assets` contains the WOFF2 files, and that no request goes to `fonts.googleapis.com` or `fonts.gstatic.com`.
4. Profile the first view before and after with `npm run profile:first-view` in this repository, and record the medians with the adoption.

MANIFEST's Barlow Condensed and IBM Plex Mono are outside this export; the same practice applies if it self-hosts them.

## Known limits

- Canvas text does not redraw when a web font arrives. `AirTrafficLayer` in `@motionstudies/three` draws DM Mono labels without waiting for `document.fonts.load()`, so its labels can rasterise with the fallback face. Self-hosting does not change that; it needs its own fix.
- `font-display: swap` shows fallback text first, then swaps. Metric-matched fallback faces (`size-adjust` and ascent overrides) could reduce that shift and are not included.
- Google may update these fonts. Refreshing is a deliberate `fonts:vendor` run reviewed like any other package change.
