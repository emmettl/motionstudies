# Stable renderer API release — alpha.50

Prepared 1 November 2026. Publication is authorized; this source candidate still
requires green checks, merge to main and the trusted release workflow. No npm
publication is claimed by this preparation record.

All four packages use exact `0.1.0-alpha.50`, including internal dependencies and
root/lab pins. The renderer peer remains `@react-three/fiber ^9.8.2`; the workspace
and lab retain exact 9.8.2, React 19.3.1 and Three 0.186.1. Existing shared scenes
retain WebGL. The separate v10 prototype remains experimental.

This release includes the public `three/webgl-study` and `three/frame-state`
boundaries, runtime GLSL renderer guards, camera scheduling regression coverage,
portable luminous sprite/line/texture/output helpers and optional lightweight
renderer counters. It removes the shared r3f-perf/Drei peer chain. See
[stable API preparation](RENDERER-9X-PREPARATION.md) for contracts and limits.

The original candidate and review-follow-up evidence retain their exact source
hashes. Versioned release artifacts must receive their own packed-consumer,
loader, release-dry-run and trusted-workflow checks under
[the release procedure](RELEASING.md). Registry bytes, all four `next` tags and
the tested CI tarballs must agree before adoption.

Umlauf is the first planned edition adopter. Establish a clean alpha.43 baseline,
then install all four exact published alpha.50 packages and rerun type, unit,
boundary, build, budget and browser checks. Preserve its shared network scene,
SVG Ostkreuz view, source-pinned fixtures and playback contract. Record edition
source, lockfile/package integrity, browser/device scope and budget delta. A
physical-phone review or a backend switch is not implied by this package update.

The broader [adoption plan](RENDERER-ADOPTION.md) follows with Correspondances,
All Change, Underfall and Gleislicht. Independent renderers retain edition-owned
port decisions; parked editions remain maintenance-only.
