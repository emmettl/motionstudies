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
