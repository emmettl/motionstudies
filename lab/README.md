# Motion Studies Lab

Run `npm run lab` from the repository root, then open the printed local URL.
The lab is a consumer of public package exports with invented, local fixtures.

## Recent component exercises

**Power + weather** puts reporting-area power and GPU weather on one UTC clock.
It preserves native quarter-hour/hourly intervals, zero and negative exchanges,
missing samples, source rows, partial integration coverage and exclusive ends.
The public lab uses synthetic fixtures; the dated European evidence release is
verified privately by the recorder.

**Terrain** compares CPU terrain geometry with GPU texture displacement. The
asymmetric peak makes row flips visible. Swap between two caller-owned textures
without rebuilding the GPU geometry; enable the south-first adapter to change
storage order while preserving the landscape. Change exaggeration and wireframe,
scrub the terrain-following path through its covered section, then unmount and
remount with the same controls. Width and depth span the first to last vertex:
17 samples at 10 m spacing cover 160 m. Surface cleanup leaves texture disposal to
the consumer.

**Network policies** collects label, material, selection, camera and morph
experiments. Start paused so a policy change must update the current frame.

- Enable dense traffic, vary the ambient label budget (including zero), height,
  screen offset and viewport padding. Inspect both portrait and wide canvases;
  selected and comparison services can take priority over ambient labels.
- Select a station or service, focus the junction and vary the selection radius
  cap. Compare elevated and coplanar surfaces at close range.
- Vary material opacity with the grid, lake and border visible. Inspect selections
  at geography, midpoint and diagram layouts.
- Toggle authored viewport framing while morphing. Disabling it should restore
  the standard camera projection. Change the local-detail scale and zoom through
  the bus detail threshold.
- Scrub before, during and after the junction dwell at 110–130 s. The authored
  branching diagram retains intermediate bends. Toggle topology-preserving morph
  to use a continuous warp of source geometry instead. Vehicles should remain on
  their routes and dwell at the junction in either mode.

**Power days** uses the validated power-day contract on ordinary, spring and
autumn civil days (48, 46 and 50 half-hour periods). Compare interval energy in
MWh with interval-average MW and interpolated planned MW. Inspect signed storage,
measured zero, missing contributors, plan gaps, expired fuel samples and the
exclusive day-end boundary. The autumn shortcuts at 3600 and 7200 seconds show
01:00 twice, with different UTC offsets. Aggregate membership is explicit.

## Verification

`npm run test:lab -- recent-components` runs the new browser checks on desktop
Chromium and mobile WebKit. `npm run test:lab` runs all specimens. The checks cover
live texture rebinding, row-adapter rendering equivalence, masks/remounts, paused
label/material updates, camera projection reset, junction alignment through a
continuous morph, energy semantics and daylight-saving boundaries.

Canvas screenshot baselines live next to the browser tests. Review changes
visually before updating them with `npm run test:lab -- recent-components
--update-snapshots`. Baselines are shared across operating systems for each browser
project, with a small allowance for rasterization differences. The screenshots
cover initial/swapped terrain, branching geography and dense portrait framing.

## Isolated component validation

Choose **Validate in isolation** on any specimen. The component runs in
`host.html`, a separate document that never imports the gallery stylesheet.
Each study is loaded on demand, so unrelated board and hero styles do not
silently supply dependencies. The host supplies the documented shared tokens,
fonts and picker styles, plus layout rules for the specimen wrappers. Controls
inside the specimen remain consumer-owned. This is a minimal consumer, not a
stylesheet-free rendering.

The toolbar offers a light host, inherited large serif text, a restrictive
280 px container, configurable iframe dimensions and 200% base text. These
settings are independent of the outer browser viewport. Two instances share the
same document and package modules, but have independent controlled values.

Select a named scenario to apply its props without remounting the component.
Changes to scalar controls and supported selection identities are recorded in
the query string. Use **Reproduction link** to reopen the configuration, or
**Open bare specimen** to remove the outer workbench. For example:

- `?study=terrain&validate=1&scenario=terrain-adapter&width=320`
- `?study=network-policies&validate=1&scenario=dense-paused`
- `?study=power-days&validate=1&scenario=power-repeat`
- `?study=data&validate=1&scenario=polling&instances=2`

Explicit `v.<study>.<control>` values override scenario defaults. The second
instance uses `v1.<study>.<control>`. Browser Back restores the selected study.
Fetched responses, transient open menus, pointer camera poses and browser
permissions are not serialized. Now intentionally follows the actual wall clock;
use the paused network specimens for deterministic scene comparisons.

**Unmount specimen** removes the component while keeping the iframe alive, so
page destruction cannot conceal a polling leak. **Replace instance** creates a
fresh component with the current URL controls. **Cycle mount ×10** repeats that
lifecycle. Hide/show exercises layout recovery without an unmount. Every
specimen includes a short expected-behavior contract; the browser checks cover
independence, focus restoration, polling cleanup, late responses and URL replay.

Lifecycle observations report instrumented consumer callbacks, fetch requests,
active function timers, animation-frame callbacks, React commits and errors.
Counts include framework activity: take a settled baseline before interpreting
a delta. Renderer probes in Network, Network policies and Terrain additionally
report submitted frames and current geometry/texture allocations. These counts
are observations, not a proof that browser or GPU memory has been reclaimed.

**Measure 5 seconds** resets activity counters and produces a downloadable JSON
sample containing dimensions, scenario, host, browser, device pixel ratio and
observations. Use a paused named scenario at a fixed size and repeat on the same
engine. Long-task counts are reported only where the browser supports them.
The automated idle budget for the paused power specimen allows no requests,
consumer callbacks or errors, and at most one React commit during the sample.

`npm run test:lab -- validation-host` checks the workbench on desktop Chromium,
desktop WebKit and iPhone WebKit. The desktop WebKit project targets these new
host checks; existing gallery tests retain their original two-project matrix.
The suite also runs axe WCAG A/AA checks on the isolated Controls, Timeline and
Bus boards specimens, and exercises narrow widths, enlarged text and reduced
motion. Automated accessibility checks complement the existing keyboard tests;
they do not substitute for assistive-technology review.

The shared `stress-fixtures.ts` supplies stable Unicode and unbroken text cases.
Named scenarios in `scenarios.ts` are shared by the workbench and browser tests.
New specimens should register their lazy loader and expectations in `studies.ts`,
import their own component styles, and use named scenario state for controls
that need to survive reloads. Keep network fault injection and measured budgets
in browser tests, with the expected invariant stated in the test name.

During playback the controls update immediately while address-bar writes are
batched. This avoids browser History rate limits. Reproduction links carry the
latest control state even during that short address-bar delay.
React commit counts are unavailable (`null`) in production builds that omit
React profiling. Request, callback and renderer counters remain available.

## Component audit · 1 November 2026

The production audit covers all 18 specimens plus seven additional hero
presentations in five conditions: bare, light, a 280 px viewport container,
a 280 px container inside a wide viewport, and enlarged inherited serif text.
Desktop Chromium, desktop WebKit and iPhone WebKit provide 375 conditions.
Each condition checks runtime errors, component/page containment and axe rules
with tags `wcag2a`, `wcag2aa` and `wcag21aa`. Narrow and enlarged-text screenshots
are retained as test artifacts for visual review.

The audit found and corrected:

- AirportBoard availability and selected-flight detail text used a pale fixed
  color outside the dark card. The shared stylesheet now uses the host's muted
  token, falling back to inherited text color. This shared package fix requires
  the normal release/adoption process before registry-pinned editions receive it.
- The dark panel fixture overrode its surface without supplying matching ink.
  Its own control palette now stays readable in a light host.
- The settlement table's horizontal scroll region was not keyboard reachable.
  It now has a named focus target and explicit Left/Right scrolling, including
  on WebKit where focusing the region alone did not enable arrow scrolling.
- The merged Power + weather fixture now wraps its UTC timestamp and expanded
  source evidence at enlarged text sizes.
- The serif host used fixed pixels, defeating the 200% setting. It now uses rems;
  the audit verifies a computed 40 px body font. Consumer controls and the bus
  footer also wrap at enlarged sizes.

`airport-unavailable`, `panel-dark-controls` and `power-table` reproduce the
findings through the existing Scenario selector. For example, open
`?study=airports&validate=1&scenario=airport-unavailable&host=light`.
The unavailable airport uses a local, versioned capabilities fixture; it does
not depend on the live service being down. Healthy selected-flight details use
controlled API responses in the contrast regression.

GPU checks now observe retired WebGL contexts as well as active allocations.
Network and Terrain survive ten component mount cycles and hide/show recovery;
retired contexts report context loss while the document remains alive. Terrain
texture swaps and row adapters remain within a settled, warmed allocation
baseline. These checks bring the canvas into view before expecting a redraw,
so WebKit's offscreen rendering suspension is not mistaken for a component bug.
Physical driver-memory reclamation is not inferred from these observations.

Three fixed scenarios were sampled three times per browser, without concurrent
benchmark workers. Each capture is approximately 5.25 seconds with a 250 ms
telemetry interval and a fully visible 760 × 720 host. The raw samples record
actual drawing-buffer dimensions and adaptive pixel ratios, browser version,
platform and renderer allocations. Production React commit counts and unsupported
long-task observations remain null.

| Scenario | Submitted frames per capture | WebGL allocations during captures |
| --- | --- | --- |
| Paused Network | 284–306 across the three engines | 15 geometries, 12 textures |
| Paused Terrain adapter | 0 | 3 geometries, 3 textures |
| SBB vehicle hero | No WebGL renderer | None |

All samples emitted no instrumented consumer callbacks or `window.fetch`
requests. This does not count browser-native font/module loading. Network still
submits frames while paused; that is the next performance investigation, not a
new FPS budget. Compare samples on the same engine and drawing-buffer conditions.

Evidence and initial findings are in
[`docs/evidence/lab-audit-2026-11-01`](../docs/evidence/lab-audit-2026-11-01/summary.json).
The summary records source hashes and rejects incomplete matrices or unresolved
findings. Reproduce a production audit with `npm run build:lab`, serve it with
`npx vite preview --config lab/vite.config.mjs --port 4176`, then run:

```sh
MOTION_LAB_URL=http://localhost:4176 MOTION_LAB_AUDIT_CAPTURE=1 npm run test:lab -- component-audit gpu-lifecycle airport-contrast audit-regressions
MOTION_LAB_URL=http://localhost:4176 MOTION_LAB_AUDIT_CAPTURE=1 npm run test:lab -- performance-baseline --workers=1
node scripts/summarize-lab-audit.mjs
```

Keep baseline captures serial and keep the host fully in view. The regular
browser suite includes these regressions; evidence files are rewritten only
when `MOTION_LAB_AUDIT_CAPTURE=1` is explicitly set.

### Opt-in GPU diagnostics

From **Validate in isolation**, choose **Open GPU diagnostics**. This opens a fresh host document with `diagnostics=1`, preserving the selected scenario, host and component state. Normal hosts do not load Spector or r3f-perf. Close the diagnostics tab or use **Exit diagnostics (reload)** before collecting an ordinary performance baseline.

- **Capture WebGL frame** captures the selected observed canvas through Spector.js. The selector distinguishes independent instances and drops unmounted renderers. Capture requests also invalidate demand-rendered Terrain or redraw the raw Three Weather specimen, so an idle scene produces a frame. Network, Network policies, Terrain, Weather and Power + weather expose their actual specimen renderers.
- **Inspect capture** opens Spector's command/state/shader viewer. **Download capture JSON** saves a native Spector capture with an extra `lab` field containing the reproduction URL and capture time; it can be imported into Spector.
- **Enable r3f-perf (reload)** adds the live overlay inside the Network or Terrain Fiber canvas (`perf=1`). This switches to one specimen instance because the profiler uses shared state. Perf mode explicitly runs Terrain continuously so live statistics update; ordinary Terrain validation retains demand rendering. The overlay adds its own rendering work. Unsupported GPU timing is not evidence of zero GPU cost. Disable/reload to remove instrumentation completely.

Useful starting points:

```text
/host.html?study=network&scenario=network-paused&diagnostics=1
/host.html?study=terrain&diagnostics=1
/host.html?study=weather&diagnostics=1
```

Capture the paused Network, then compare layer toggles and draw commands. For Terrain, compare height-texture swaps and adapter changes, checking bound textures, shaders and geometry. Use the existing lifecycle tests and uninstrumented baselines for regression assertions; captured timings are diagnostic evidence rather than portable performance budgets.

The lab pins `r3f-perf` and `spectorjs` as development dependencies. A scoped root npm override selects Drei 10.7.9 for r3f-perf's React 19/Fiber 9 compatibility; the packed-consumer checker carries this override into its isolated install.

```sh
MOTION_LAB_URL=http://127.0.0.1:4177 npx playwright test --config playwright.lab.config.ts gpu-diagnostics
# Repeat against installed package tarballs, including host/lifecycle/weather regressions:
npm run check:packed -- gpu-diagnostics.spec.ts validation-host.spec.ts gpu-lifecycle.spec.ts weather.spec.ts
```
