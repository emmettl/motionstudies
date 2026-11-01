# React Compiler evaluation — 31 October 2026

Adopt the native compiler for **the two shared timeline components in the widget
lab, `StudyView` in GRID/84, and application code in NORIKAE, Underfall and
Manifest**. Keep the remaining studies and published npm packages on their
existing builds. No npm release is warranted.

The lab's 120-step timeline interaction used a median **117.69 ms → 107.31 ms**
of JavaScript CPU time (−8.8%). All three compiled samples were faster than their
paired baseline. Component render counts stayed at 480. This is a small CPU
saving, not an FPS claim. The emitted JavaScript grows from 383,912 to 386,423
gzipped bytes: **+2,511 bytes (+0.65%)** across all lab chunks.

The lab configuration's production JavaScript matches the measured two-module
package prototype byte for byte. The broader native setup grew the lab by 9.1%
and provided inconsistent scene-performance gains, so it is not adopted.

GRID/84's targeted study-view compilation reduces median seek CPU from
**1,756.57 ms → 1,682.54 ms (−4.2%)** and render counts from **854 → 497 (−41.8%)**
over 120 input steps. All three candidate CPU samples beat their paired baseline.
It adds **3,308 gzipped bytes (+0.35%)** across all emitted JavaScript. The broad
GRID/84 compiler added 35,201 bytes, so the one-file setting is preferable. Its
opening sample is paused; no playback-speed improvement is claimed.

A separate confirmation round reproduced NORIKAE, Underfall and Manifest's
initial seek improvements. Their adopted app settings compile their own React
code, keeping installed shared packages excluded. The confirmed median seek CPU
changes are **−5.7%, −8.3% and −10.8%**, respectively. Their added emitted gzip is
4,123 / 17,984 / 7,765 bytes. Each app's seek CPU was lower in every paired sample
across both rounds. Underfall also improved playback CPU by 6.9% in confirmation;
NORIKAE and Manifest have no convincing playback gain.

## Vite 8.3.5 follow-up

The pending lab and Underfall rollouts now use exact Vite 8.3.5; GRID/84 was
already measured on that version. The original results above remain historical
8.3.4 measurements for the other applications. Vite 8.3.5 includes build import-map
hashing and HMR fixes; it does not change the React plugin's native compiler
peer requirement, so compiler 0.152 and Underfall's explicit opt-out remain.

Three new paired runs on 8.3.5 retained the compiler benefit: lab timeline seek
CPU −15.8%; Underfall playback and seek CPU both −8.9%. These compare compiler
on/off within the new toolchain, not Vite 8.3.5 against 8.3.4. They do not establish
an additional runtime speedup caused by the Vite patch itself.

[Lab follow-up](evidence/react-compiler/vite-835-lab-summary.json) and
[Underfall follow-up](evidence/react-compiler/vite-835-underfall-summary.json)
include absolute timings and matching compressed raw samples.

## What changed

`lab/vite.config.mjs` enables `react({ compiler: { sources: ... } })` for the two
measured source files listed in `lab/react-compiler.mjs`. The `sources` option
limits compilation while retaining the React plugin's normal file coverage for
Fast Refresh. Three.js scenes, other components, existing manual memoization and
the production package build remain unchanged. GRID/84 selects only
`/src/studies/StudyView.tsx` through the same `compiler.sources` option. NORIKAE, Underfall and Manifest use
`react({ compiler: true })` with the same exact native compiler dependency. The exact native compiler version
is `oxc-transform-react@0.152.0`, matching the optional peer required by
`@vitejs/plugin-react@6.1.2`.

The package-compilation helper is an **experimental benchmark utility**. It is
not called by the production package build. Its tests establish that the prototype
compiles before JSX lowering, preserves public declarations, rewrites static and
dynamic relative module extensions, respects explicit opt-outs and file selection,
and fails on fatal compiler errors. Compiling TypeScript's already-lowered JSX
misses pure components and is not an equivalent experiment.

## Measurement method

- Production builds, Playwright Chromium, 1280 × 800 desktop viewport, ANGLE Metal,
  and 4× CDP CPU throttling on an Apple M4 Max host. These are desktop measurements,
  not physical-phone measurements.
- Three samples per variant, with baseline/compiler order reversed on alternating
  runs. Each playback sample lasts 3.5 seconds after startup; seeking dispatches
  120 consecutive range-input steps, one per animation frame.
- CDP measures JavaScript and main-thread task duration. A small React DevTools
  hook counts commits and fibers carrying `PerformedWork`. The same instrumentation
  is installed in both variants. Animation-frame intervals and page errors are
  retained in the raw evidence.
- The native survey compiles each app's React code. Installed packages remain
  excluded by the native compiler's default source policy; the workspace lab also
  exposes shared source directly. No hook-rule suppressions or bailout checks are
  disabled to increase compiler coverage.
- The package follow-up compares the same shared source in both variants, with
  only the two timeline modules compiled in the candidate. App code stays
  uncompiled. React is deduplicated to each study's installed instance. Playback
  is paused before its seek sample, and ZENIT enters manual exploration so the
  timeline stays visible. This differs from the exploratory native survey, which
  allowed ongoing playback during seeking.
- Public assets are served from each checkout without copying or modifying them.
  The runner disables build-plugin `closeBundle` hooks so exploratory builds do
  not overwrite original artifacts or perform publication cleanup. It measures
  Vite builds rather than complete data-generation/publication pipelines.
- Bundle figures sum independently gzipped emitted JavaScript chunks, including
  lazy chunks. They are not initial-page transfer sizes. Build durations are
  single observations and do not support build-speed claims.

There was other GPU/CPU work on the host during parts of the survey. Three short
samples cannot establish small differences as statistically significant. Small or inconsistent
results are treated as insufficient evidence for rollout, rather than as proof
that every positive or negative timing delta is a regression. App adoption is
limited to the repeated improvements described above.
Schwall's opening sample was also idle, so its small idle CPU difference is not
a solver-playback claim. The initial GRID/84 homepage sample was idle and is excluded from study-performance
claims; its actual study route is measured separately.

## Native compiler exception

Underfall's `FeedHistoryStudy` explicitly opts out with `use no memo`. Its browser
tests caught native 0.152 evaluating `pinnedLink()`'s guarded `data.resultId` access
before data loaded, leaving the page blank. The directive retains the existing
loading/integrity/retry behavior without changing the measured main study. Keep
this exception until a compiler upgrade passes the existing feed-history tests.

## Results

The tables below use signed median CPU changes: negative means less JavaScript
CPU time. Page errors and raw samples are retained alongside the summaries.

| Target | App compiler: seek CPU | App compiler: gzip | Two-module package: seek CPU |
| --- | ---: | ---: | ---: |
| lab | -6.1% | +9.1% | — |
| lab:timeline | -14.4% | +9.1% | -8.8% |
| lab:hub | -6.4% | +9.1% | — |
| allchange | -1.5% | +3.3% | +4.4% |
| correspondances | -0.9% | +2.2% | +4.6% |
| gleislicht | -0.1% | +6.5% | +2.3% |
| luft | +4.0% | +2.1% | +9.1% |
| norikae | -8.5% | +1.2% | — |
| pfad | +2.6% | +0.4% | +1.3% |
| umlauf | -0.7% | +1.9% | — |
| underfall | -7.8% | +4.2% | -0.7% |
| zenit | — | +0.1% | +9.8% |
| manifest | -8.6% | +7.5% | — |
| grid84 | -5.2% | +3.7% | — |
| schwall | — | — | -8.2% |

The broad app-column timings are exploratory. GRID/84's adopted targeted result
is the separate −4.2% / +0.35% result above. A dash means that phase or candidate
was not measured; it does not mean zero cost. NORIKAE, Umlauf, Manifest and
GRID/84 do not use the two selected shared timeline modules in their opening
views. The package follow-up does not justify changing package publication. The
separate native confirmation is retained below; its scope differs from the
unadopted package candidate.

[Native survey summary](evidence/react-compiler/native-survey-summary.json),
[timeline-package summary](evidence/react-compiler/timeline-package-summary.json),
[GRID/84 actual-study summary](evidence/react-compiler/grid-study-summary.json),
and [GRID/84 targeted summary](evidence/react-compiler/grid-targeted-summary.json)
retain absolute timings, render counts, frame intervals and errors. Compressed
raw samples and [environment metadata](evidence/react-compiler/environment.json)
are in the same directory.


[Native confirmation summary](evidence/react-compiler/native-confirmation-summary.json)
contains the repeated NORIKAE, Underfall and Manifest samples.

## Packed-consumer configuration

The compiler source policy lives inside `lab/`, and the lab declares its own
exact compiler dev dependency. The packed-consumer verifier copies that lab into
an isolated directory; it must not depend on configuration files elsewhere in
the workspace. Published package source remains uncompiled and ordinary JS.

## Validation

The lab passed typechecking, the repository unit tests (505), hosting tests (16),
architecture checks, its production build, and four production timeline tests
covering Chromium and iPhone WebKit. GRID/84 passed typechecking, lint, 366 unit
tests, build/prerender, and all eight production-browser tests. NORIKAE passed 28 data tests and 14 production-browser tests in Chromium and
iPhone WebKit (and 12 browser checks on the isolated main-based publication patch); Manifest passed 145 unit tests and 35 public/local-review browser
tests. Their required check/build commands also passed. Underfall passed its
131 data tests and production build; its final browser suite passed 43 tests with one existing skipped case after
the feed-history opt-out. Repository lint retains its
pre-existing unused `extname` import warning in `check-edition-boundaries.mjs`.
The final isolated release check also passed 100 packed-consumer browser tests
(two skipped cases), the npm publication dry run, and all 40 loader browser tests.

## Reproducing the experiments

Run from the repository root after `npm ci`:

```sh
COMPILER_RUNS=3 COMPILER_EVIDENCE=/tmp/compiler-native \
  node scripts/profile-react-compiler.mjs lab lab:timeline lab:hub \
  allchange correspondances gleislicht luft norikae pfad umlauf underfall zenit manifest grid84
node scripts/summarize-react-compiler.mjs /tmp/compiler-native/results.json

COMPILER_SCOPE=package COMPILER_RUNS=3 COMPILER_EVIDENCE=/tmp/compiler-package \
  node scripts/profile-react-compiler.mjs lab:timeline luft pfad zenit \
  underfall allchange correspondances gleislicht schwall
node scripts/summarize-react-compiler.mjs /tmp/compiler-package/results.json

COMPILER_SCOPE=study COMPILER_RUNS=3 COMPILER_EVIDENCE=/tmp/compiler-grid \
  node scripts/profile-react-compiler.mjs grid84
COMPILER_RUNS=3 COMPILER_EVIDENCE=/tmp/compiler-confirm \
  node scripts/profile-react-compiler.mjs norikae underfall manifest
```

Package scope builds baseline packages and creates temporary compiled copies; it
does not change study checkouts or production package-build policy. Optional
`COMPILER_WEB_BASELINE_DIR` / `COMPILER_WEB_DIR` paths select prebuilt variants.
`COMPILER_STUDIES_ROOT` selects the directory containing the study repositories
when running from an isolated worktree. The current runner opens GRID/84's
`#/study/siop62-alert/2` route, rather than its homepage.

Expand the lab's source list, enable app-wide compilation, or publish compiled
packages only after new production-study measurements justify the added code.
Keep existing memoization and compiler bailouts until separate evidence supports
changing them.

## References

- [Vite React plugin native-compiler release](https://github.com/vitejs/vite-plugin-react/releases/tag/plugin-react@6.1.0)
- [React Compiler introduction and existing-memoization guidance](https://react.dev/learn/react-compiler/introduction)
- [The article that prompted this evaluation](https://blog.master.dev/react-now-rusted-all-the-way-out/)

The article's large build-speed gains compare a native compiler with an existing
Babel compiler. This repository previously ran neither, so those gains do not
apply to enabling the compiler here.
