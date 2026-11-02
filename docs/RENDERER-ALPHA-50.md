# Stable renderer API release — alpha.50

Published 1 November 2026 from `63853645636cd706303c39ac614c16080e82d3d4`,
after green merges of [#61](https://github.com/emmettl/motionstudies/pull/61) and
[#62](https://github.com/emmettl/motionstudies/pull/62).
[Trusted publication 41356252074](https://github.com/emmettl/motionstudies/actions/runs/41356252074)
completed successfully using OIDC. All four registry archives were downloaded and
verified byte-identical to the retained tested CI tarballs; all four `next` tags
were verified at alpha.50. Registry metadata briefly lagged publication; the
verification waited for visibility without republishing or replacing artifacts.

All four packages use exact `0.1.0-alpha.50`, including internal dependencies and
root/lab pins. The renderer peer remains `@react-three/fiber ^9.8.2`; the workspace
and lab retain exact 9.8.2, React 19.3.1 and Three 0.186.1. Existing shared scenes
retain WebGL. The separate v10 prototype remains experimental.

This release includes the public `three/webgl-study` and `three/frame-state`
boundaries, runtime GLSL renderer guards, camera scheduling regression coverage,
portable luminous sprite/line/texture/output helpers and optional lightweight
renderer counters. It removes the shared r3f-perf/Drei peer chain. See
[stable API preparation](RENDERER-9X-PREPARATION.md) for contracts and limits.

Validation passed typechecking, lint, architecture, build, 557 unit tests,
16 hosting tests, 296 packed browser cases (two existing skips), 40 loader checks
and publication dry-run. Eight strict native-WebGPU checks passed against compiled
archives identical to the published artifacts. Native execution here validates the
shared opt-in paths; it does not change an edition's rendering backend or attest
author/physical-device acceptance.

Umlauf is the first edition pilot. Its adoption branch installs all four exact
registry alpha.50 packages, preserves its WebGL network scene and SVG Ostkreuz view,
and retains all application source and six public data hashes. The corrected
opening budget is 580,478 / 588,800 gzip bytes, 186 bytes below the comparably
accounted alpha.43 baseline. Local checks passed 20 source/model tests and 68
Chromium/WebKit browser cases against both development and production servers.
The adoption PR retains fresh evidence and runs hosted CI against the production
build. [Umlauf PR #2](https://github.com/emmettl/umlauf/pull/2) merged at `4b4fe93` after
both PR checks passed. [Pages run 41505708023](https://github.com/emmettl/umlauf/actions/runs/41505708023)
passed 20 unit and 68 production browser checks and published successfully;
[Cloudflare run 41506812525](https://github.com/emmettl/umlauf/actions/runs/41506812525)
published the same artifact. Live metadata identifies that merge. All 16 files on
both hosts match the CI artifact byte-for-byte, and all eight live Chromium/WebKit
desktop/phone smoke cases pass. The [artifact proof](evidence/umlauf-alpha50-deployment/artifact.json)
and [live browser proof](evidence/umlauf-alpha50-deployment/browser.json) retain
that served-revision evidence. Physical-device and author acceptance remain open.

[Machine-readable release evidence](evidence/renderer-alpha50-release.json)
records fresh registry/archive equality, tag verification and the pilot source.

The broader [adoption plan](RENDERER-ADOPTION.md) follows with Correspondances,
All Change, Underfall and Gleislicht. Independent renderers retain edition-owned
port decisions; parked editions remain maintenance-only.
