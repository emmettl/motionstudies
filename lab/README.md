# Motion Studies Lab

Run `npm run lab` from the repository root, then open the printed local URL.
The lab is a consumer of public package exports with invented, local fixtures.

## Recent component exercises

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
