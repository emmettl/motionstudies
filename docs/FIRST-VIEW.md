# First view on a phone

**15 September 2026 — measured guidance for every edition.** A work's first impression is the moment its map moves, not the moment its page paints. This document records how to measure that moment, what the public editions currently do, which changes were tested against live Gleislicht, and which practices follow. Each edition still owns its budgets and adoption; nothing here changes an edition, a package or a deployment. Medians and per-run values are in the [evidence file](evidence/first-view-2026-09-15.json).

## Two moments

- **First paint** (first contentful paint): the page shows anything with text. For these works that is usually interface chrome.
- **First map frame**: the first WebGL draw of the opening network. Standard metrics do not see it: largest contentful paint ignores canvas content. Measure it directly.

Byte budgets remain the CI gate because they are deterministic. They stand in for time; they do not measure it. On a throttled phone, the order in which an edition requests its opening files decided more of the first map frame than any single dependency's size.

## Method

`npm run profile:first-view -- --runs 3 <slug>` loads a public edition cold in Playwright's Chromium with a Pixel 7 profile and Lighthouse's DevTools mobile throttling: 562.5 ms added request latency, 1.47 Mbps down, 675 kbps up and 4× CPU slowdown. It records paint entries, long tasks, main-thread script time, the resource waterfall and WebGL draw calls per animation frame. The first frame with draw calls is the first map frame.

Read results as comparisons, not device predictions:

- The measurement host was an Apple M4 Max using ANGLE over Metal. A 4× slowdown of that CPU is still faster than a mid-range Android phone, and its GPU is far faster, so script and scene-start times are optimistic.
- DevTools throttling applies latency per request, not per connection, and shares throughput across concurrent requests.
- Resource Timing omitted the Google font files in every throttled profile, although a separate probe confirmed that browsers download them. Cross-origin data responses without `Timing-Allow-Origin` also hide their sizes. Measure those separately.
- Counterfactual variants serve the document through Playwright so every variant, including the control, takes the same HTML path. Absolute times therefore start about 0.5 s earlier than a normal load; differences between variants are the result.
- Interleave variants run by run so network and host drift spread across all of them, and check the release metadata before each run. The first Gleislicht experiment was discarded because the edition deployed during it.

## Baseline

Throttled cold loads on 15 September, medians of three runs; Gleislicht is five runs of release `654e764`. Times are milliseconds from navigation.

| Edition | First paint | First data request | First map frame | Paint → map | Opening waterfall |
| --- | ---: | ---: | ---: | ---: | --- |
| Gleislicht | 2,136 | 2,125 | 8,655 | 6,519 | entry → render → data (3.95 s) → scene chunk (2.0 s) → draw |
| All Change | 2,164 | 2,159 | 6,621 | 4,457 | entry → render → data (1.9 s) → scene chunk (2.1 s) → draw |
| Correspondances | 2,088 | 2,081 | 6,558 | 4,470 | entry → render → morning data (1.9 s) → scene chunk (2.1 s) → draw |
| NORIKAE | 1,812 | 1,806 | 4,684 | 2,872 | entry → render → 4.6 KB data → scene chunk (2.0 s) → draw |
| Umlauf | 3,212 | 3,209 | 4,822 | 1,610 | 336 KB entry including the renderer → render → data → draw |
| Zugunruhe | 2,960 | — | 2,953 | — | preloaded modules in parallel; draws before text paints |
| MANIFEST | 2,060 | 2,050 | 13,275 | 11,215 | entry → render → study → vessels → 1.43 MB day chunk → draw |

Every inspected edition's `index.html` has an empty `<div id="root"></div>`. None preloads data. Gleislicht, All Change, Correspondances and MANIFEST load their typefaces through a Google Fonts `@import` inside their render-blocking stylesheet.

## Patterns

### Data waits for React

Editions request their opening data from an effect, so the request cannot start before the entry script has downloaded, executed and committed. In Gleislicht the data request began 1.5 s after the HTML finished.

### The renderer waits for data

Gleislicht, All Change, Correspondances and NORIKAE render their lazy network scene only once the opening snapshot exists. The scene chunk, about 240–275 KB of Brotli-compressed React Three Fiber and Three.js, is therefore requested after the data arrives and downloads alone. Code splitting kept those bytes out of the entry; it also made them sequential.

### Paint waits for a third-party stylesheet

A CSS `@import` of `fonts.googleapis.com` makes first paint wait for the local stylesheet, then a new connection and Google's stylesheet. `display=swap` applies to the font files, not to the stylesheet that declares them. In Gleislicht the chain ended about 20 ms before first paint, so an HTML skeleton alone barely moved it. The font files then download during the opening: about 66 KB for Gleislicht's DM Mono and Inter, sharing the link with the timetable.

### Optional live data competes with the opening

Gleislicht's `realtime.json` is 151 KB of Brotli, 16% of first-view transfer, and downloads alongside the opening timetable although timetable motion draws without it.

## Gleislicht experiments

Live release `6b84f2c`, unchanged before and after the runs; five interleaved throttled runs per variant. Every run of every variant fell within about 110 ms of its median. Preloads used the URLs the default opening requested that day.

| Variant | First paint | Change | First map frame | Change |
| --- | ---: | ---: | ---: | ---: |
| Control | 1,668 | — | 8,180 | — |
| HTML skeleton | 1,520 | −148 | 8,219 | +39 |
| HTML skeleton, Google Fonts import blocked | 880 | −788 | 7,752 | −427 |
| Defer `realtime.json` until the first map frame | 1,672 | +4 | 7,399 | −780 |
| Preload opening data | 2,444 | +776 | 7,172 | −1,007 |
| Preload scene chunks | 2,376 | +708 | 7,129 | −1,051 |
| Preload data and scene | 3,212 | +1,544 | 7,053 | −1,126 |
| Preload data and scene, defer `realtime.json` | 3,220 | +1,552 | 6,272 | −1,907 |
| Skeleton, preload data and scene, defer `realtime.json` | 1,768 | +100 | 6,251 | −1,929 |

What the experiments show:

- **Preloads do not add up on a constrained link.** Data alone and scene alone each save about a second; both together save 1.1 s. Starting requests together removes waiting between requests and idle gaps, but the same bytes still share the same throughput.
- **Early requests take bandwidth from the entry script.** With data and scene preloaded, the entry script finished at about 3.1 s instead of 1.4 s, so a page that paints from JavaScript painted 1.5 s later. The skeleton recovered almost all of that: the combined variant brought the map 1.9 s sooner for 0.1 s of first paint.
- **Fewer opening bytes help as much as better ordering.** Deferring 151 KB of live data saved 0.78 s with no paint cost. Blocking the font import made the timetable finish 0.44 s sooner while its request started only 80 ms earlier, because the font files no longer shared the link.
- **A skeleton needs a clear path to paint.** Behind the Google Fonts chain it saved 0.15 s; without the chain, first paint moved to 0.88 s.

Blocking the font import showed fallback typefaces and removed the font files' bytes, so it overstates self-hosting. A later run replacing the import with equivalent local `@font-face` rules, without a skeleton, changed neither first paint (2,092 → 2,080 ms) nor the first map frame (8,701 → 8,704 ms). With the HTML skeleton, the same replacement moved first paint from 764 to 132 ms and left the map unchanged; see [self-hosted typefaces](SELF-HOSTED-FONTS.md). A variant combining local fonts with preloads and deferral was not measured.

## Practices

Apply these where an edition's own profile shows the same waterfall, and record before-and-after medians with the change.

1. **Measure the first map frame**, not only first paint or bytes.
2. **Keep render-blocking CSS local.** Do not `@import` remote stylesheets. Self-host `woff2` subsets with `font-display: swap`, and preload only the faces the first view uses. For Inter and DM Mono, import `@motionstudies/web/fonts.css` once it is released. Canvas text drawn with a web font must wait for `document.fonts.load()`: a rasterised texture does not redraw when the font arrives. `AirTrafficLayer` currently draws DM Mono labels without waiting.
3. **Defer optional live feeds** until after the first map frame unless the first frame depends on them.
4. **Paint a skeleton from the HTML.** Inline the theme background, title and a minimal frame inside `#root`; React replaces it on first commit. Pair it with any early-request change, which otherwise delays JavaScript-driven paint.
5. **Start opening requests from the document, not from an effect.** A static `<link rel="preload" as="fetch" crossorigin>` is correct only when the URL is certain at HTML time. When the opening depends on the clock or query parameters, as Gleislicht's Swiss service date, `?date=`, `?study=` and `?view=` do, use a small inline head script that applies the same selection rule and adds the preload only for the default opening. A wrong preload costs a phone the whole file.
6. **Let the opening scene download alongside its data.** Emit `modulepreload` links for the scene chunk and its imports, or start its `import()` with the data request. Budget scripts should count it as opening transfer, as Gleislicht's already does.
7. **Then reduce opening bytes.** Once requests overlap, throughput is the limit: Gleislicht's first view is about 940 KB, roughly five seconds at this profile whatever the order.
8. **Keep downloads bounded on metered connections.** Prefetch only what playback can reach and consider `navigator.connection.saveData` where available. MANIFEST's playback requested consecutive 1.43 MB day chunks throughout a two-minute throttled profile.

## Shared opportunities

- `@motionstudies/web`'s `tokens.css` and `shell.css` name Inter and DM Mono but leave loading them to each edition. [Self-hosted typefaces](SELF-HOSTED-FONTS.md) are prepared as `@motionstudies/web/fonts.css` for the next coordinated release; each edition still adopts them by replacing its Google Fonts import.
- `mountMotionStudy` could accept an opening-requests hook so an edition's data and scene requests begin before first render without each shell reinventing the pattern.
- `scripts/profile-first-view.mjs` could run against each deployed release and record medians beside the byte budget.

These are proposals. Each needs its own implementation, release and adoption record.
