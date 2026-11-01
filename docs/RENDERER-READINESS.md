# Renderer readiness register

Inspected 1 November 2026. This register separates **source inventory**, **R3F v10
compatibility**, **native WebGPU verification** and **deployed backend**. A clean
inventory is not a runtime pass. Local edition checkouts can be behind their
remote repositories or contain uncommitted work; no edition was updated here.

[Machine-readable inventory](evidence/renderer-readiness-2026-11-01.json) records
full local HEADs, package pins, dirty-entry counts, public renderer imports and
source locations for audit prompts, plus source/manifest SHA-256 fingerprints. It is an AST/module scan plus targeted source
inspection, not an exhaustive material or dependency compatibility proof.
Deployment state was not inspected. All edition v10/native acceptance gates below
remain open; Schwall's existing preview evidence is recorded separately in
[WebGPU support](WEBGPU-SUPPORT.md).

## Edition inventory

The version column is the local manifest's coordinated shared package pin (some
editions use only a subset). “Dirty” counts local status entries, not changed lines.

| Edition | Local HEAD | Shared pin | Dirty | Renderer ownership / next readiness work |
| --- | --- | --- | ---: | --- |
| Gleislicht | `c33819f` | alpha.44 | 11 | Shared network/hub/station scenes plus journey, terrain, orbital and road layers. Audit local clocks, GLSL and glyphs after shared compatibility. |
| All Change | `f0192ca` | alpha.43 | 2 | Shared network/hub scenes with rail/road extensions. Migrate extension clocks; verify picking and labels. |
| Correspondances | `c274a00` | alpha.43 | 0 | Shared network with policy/morph extensions. Verify diagram transitions, labels and selection against the candidate. |
| LUFT | `d45d898` | alpha.31 | 0 | Independent Three WebGL scene. Own material, point-size and recovery port; Fiber's default does not change it. |
| Local / Express | `cd81be6` | alpha.43 | 0 | Shared network scene. Validate retained private fixtures; publication hold remains separate. |
| NORIKAE | `93b4f05` | alpha.43 | 2 | Shared network scene, synthetic preview. Validate preview without resuming parked source work. |
| MANIFEST | `a539f15` | alpha.31 | 0 | Independent raw WebGL maritime renderer. Own GLSL/buffer/lifecycle migration; no shared-scene substitution assumed. |
| Umlauf | `5bcada0` | alpha.43 | 2 | Shared network scene. Validate selection, playback and interchange presentation. |
| Zugunruhe | `d3fd0bd` | alpha.31 | 5 | Independent Three WebGL shaders and controls. Field/trail/material port remains edition-owned. |
| Underfall | `2dfa884` | alpha.43 | 1 | Shared network plus route-event and custom glyph layers. Validate extension timing and evidence visibility. |
| ZENIT | `39b0e72` | alpha.31 | 0 | Independent Three scene with orbital/star shaders. Verify point glyphs, camera and depth behaviour separately. |
| PFAD | `492236d` | alpha.33 | 64 | Independent Three WebGL replay. Preserve Uint32 event cutoffs, route ribbon, flash, deferred uploads and recovery. |
| England | `45d4b72` | alpha.31 | 0 | Inspected geography uses SVG; installed renderer dependencies alone do not create a WebGPU migration. Audit any new GPU scene when introduced. |
| KRAFT | `91e39f2` | alpha.48 | 0 | Independent Three WebGL/weather composition and shared diagnostics. Audit custom materials and optional perf dependencies. |
| Schwall | `749d70a` | alpha.49 | 485 | Independent WebGL and opt-in node-fluid preview. Existing node diagnostics/motion adopter; numerical and water appearance validation remain local. |

Reproduce the working-tree inventory without changing edition repositories:

```sh
node scripts/audit-renderer-readiness.mjs --projects-root /path/to/edition/checkouts > readiness.json
```

## Compatibility branch

`codex/v10-readiness` starts at shared `main` commit `a6d8e6f`. It pins
`@react-three/fiber` **10.0.0-alpha.6** in the workspace, lab and shared three peer
contract, retaining React 19.3.1 and Three 0.186.1. This is an isolated compatibility
candidate, not a published shared release or an edition rollout.

Existing shared scene components explicitly import Fiber's `/legacy` entry. Their
GLSL motion and terrain materials continue to use WebGLRenderer. Frame scheduling
uses v10's `elapsed` and `delta`; the camera runs in the `input` phase before
ordinary updates, replacing v9's negative numeric priority. Application clocks
still own study time. Renderer
access uses `renderer`; the legacy Canvas's `gl` configuration remains intentional.
No shared scene silently changes its renderer, point sizing or study-time contract.

Optional `r3f-perf` 7.2.3 brings in Drei, whose stable release requires Fiber 9;
Drei 11.0.0-alpha.7 excludes the current React 19.3 baseline. The candidate removes
that dependency chain and supplies a lightweight opt-in `debug-performance` panel.
It reports CPU frame cadence and Three counters, creates no extra canvas, and does
not claim GPU timings. Spector capture remains available on WebGL. Node diagnostics
retain their separate public entry. A future compatible perf package needs its own
validation before reintroduction.

The candidate's peer contract deliberately does not claim v9 support: `/legacy`
imports and v10 frame state are real requirements. A release and explicit edition
pin updates must precede adoption. Do not widen ranges or install with forced peer
resolution to bypass these boundaries.

## Shared primitives and comparison coverage

The opt-in primitives and reproducible browser matrix are documented in
[WebGPU support](WEBGPU-SUPPORT.md#readiness-primitives-and-composed-scene). These
are building blocks for edition and shared-scene ports. An explicit, tested output binding preserves legacy display-space additive glow
in the flat comparison scene; ordinary node output retains linear compositing.
Complete national, hub,
station, air, road and terrain compositions still need their own node adoption and
appearance review. Custom extension materials must declare the renderer they need.

Acceptance gates for each edition are:

1. Its exact candidate packages install and typecheck without peer overrides.
2. Playback, seeking, evidence gaps, picking, labels and camera behaviour pass on
   its retained data and custom layers.
3. Legacy WebGL, node WebGL 2 and explicitly required native WebGPU are compared
   where the edition implements those paths. Auto fallback alone is not native proof.
4. Authored glyphs, trails, halos, palettes, transparency and geography receive
   visual review, with bounded raster differences rather than assumed bit identity.
5. First-frame latency, frame pacing, memory behaviour and resource recovery are
   checked on representative physical phones. Desktop mobile viewports are not
   phone memory or thermal evidence.
6. The edition records its source/package version, selected production renderer
   and deployed revision when it independently chooses to switch.

Shared validation results for this branch are recorded in
[evidence/renderer-v10-validation.json](evidence/renderer-v10-validation.json).

## Candidate validation

On 1 November: typechecking, architecture checks, build and 544 unit tests plus
16 hosting tests passed. Lint passes with the existing unused `extname` import
warning in `scripts/check-edition-boundaries.mjs`.

The final frozen-tarball run passes 71 affected renderer, scene, lifecycle and
diagnostics checks across Chromium, desktop WebKit and mobile WebKit. Together
with the unaffected cases from the full run, the recorded acceptance set is
296 passed, two existing skips and no unresolved failures. The initial full run
read live tests after copying its app and therefore produced 12 fixture-version
failures; the packed harness now freezes both, and all 12 pass in the final run.
The validation JSON retains both outcomes rather than hiding the initial run.

The fresh-server loader/extension suite passes all 40 cases; strict native WebGPU
passes all nine checks and rejects fallback. Native canvas images are retained
for [legacy](evidence/renderer-v10-legacy-scene.png),
[node WebGL 2](evidence/renderer-v10-webgl2-scene.png) and
[native WebGPU](evidence/renderer-v10-webgpu-scene.png). The
[bundle report](evidence/renderer-v10-bundles.json) records static entry dependency
sizes, with its exclusions explicit. These are shared-candidate results, not
edition adoption, physical-phone budgets or publication approval.
