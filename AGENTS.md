# Working agreements

These defaults synthesise the owner's working notes of 5 November 2026 with lessons
from Motion Studies and its editions. Apply them to work in this repository; each
independent edition owns its implementation and adoption. Read
[the project vision](docs/VISION.md) before substantial creative work. The
[working principles](docs/WORKING-PRINCIPLES.md) explain the reasoning and examples.

## Intent and scope

- Start with what the work should show and what the visitor should understand or
  enjoy. Correctness supports that experience; protect the meaning of the data.
- Give each work a particular visual claim and a bounded, coherent opening before
  expanding its scope. Extra modes, layers and data must strengthen that claim.
  Catalogue admission, titles and numbering remain authorial decisions; keep stable
  technical IDs independent of them. A paused study stays paused until resumed.
- Keep implementations simple. Reuse established widgets and patterns consistently,
  without forcing unlike experiences into a shared abstraction.
- Explore broadly, then curate strictly. Question every element, control and empty
  area: does it improve the page? Remove experiments that do not earn their place.
- Before research or performance experiments, state the question, the time/compute
  budget, and the result that would change a decision. Stop when it is answered or
  the budget is reached; report remaining uncertainty. Tiny numerical gains alone
  do not justify long GPU runs.
- When parallel exploration is authorized, bound each task's question, files and
  stopping point so the work does not collide.

## Evidence and time

- Keep scheduled, observed, estimated, reconstructed, propagated and synthetic
  movement distinct. Geometry, particles and smooth fields must not imply evidence
  the source does not contain. Expose support, gaps, exclusions, comparison
  denominators and authored scales.
- Let inspection lead from the whole through meaningful groups to the smallest
  actual evidence, then back with context intact. Counts do not create tracked
  individuals; model resolution does not create measurement resolution.
- Preserve source identity, dates, licence/terms, hashes and transformation methods.
  Keep acquisition time, source epoch, service day and study time distinct. Declare
  units, timezones, coordinate frames, interval boundaries and missing-value rules.
- Missing is not zero. Preserve native interval meaning and known acquisition gaps;
  interpolate only where the source/model contract supports it. Civil/service days
  and after-midnight events must survive DST and seeking without silent wrapping.

See [data readiness](docs/DATA-READINESS.md) and
[shared field contracts](docs/SHARED-FIELDS.md).

## Ownership and shared code

- Give loading, playback, inspection and presentation clear owners. Derive display
  values from canonical state. Promote local helpers only when another real consumer
  demonstrates compatible semantics; keep unlike data models and cache policies apart.
- Preserve the four package boundaries: core domain logic, Three.js rendering,
  browser UI/loading, and offline preparation. Editions own composition and sources.
  Use exact published versions through public exports; avoid sibling source imports,
  copied implementations and renderer source rewrites. Add a supported policy when
  a demonstrated edition need requires one.
- Keep frame-loop work, listeners, requests, workers and GPU resources under explicit
  lifecycle ownership. Reuse geometry/buffers where appropriate, invalidate on their
  actual inputs, and clean up on replacement or unmount. Policies borrow resources;
  the owning renderer disposes them. Do not introduce a competing clock or frame loop.

See [package contracts](packages/README.md) and
[state and module boundaries](docs/ARCHITECTURE-CONSOLIDATION.md).

## Toolchain and verification

- Prefer Vite, TypeScript, React, React Three Fiber where 3D is needed, Vitest,
  Playwright and Oxc tooling. Preserve simple static pages where they suffice.
- Put pure logic in unit tests. Use browser tests for behaviour that needs a browser:
  rendering, interaction, accessibility, loading and integration.
- Match verification to the changed behaviour and its dependants. As suites grow,
  select CI paths conservatively: documentation-only changes should not run GPU
  checks, while code/configuration changes must cover the consumers they can affect.
  Preserve explicit full verification for releases and a manual full-run path.
- Run independent desktop and mobile browser checks in parallel where isolation and
  GPU capacity permit. Measure contention before increasing worker counts.
- Protect real contracts with reference/differential tests and representative built
  artifacts. Exercise request races, seeking, cancellation and teardown where affected.
  Numerical agreement, physical validation and artistic success are separate judgments.
  Fix failure causes rather than weakening data-quality gates or correctness checks.
- Benchmark production builds with matched data, clock, viewport and renderer; record
  device/backend and instrumentation. Compare repeated matched runs. CPU timings,
  callback FPS, buffer accounting and browser emulation prove different things;
  none alone establishes physical-phone performance. Retain only repeatable benefits
  that preserve the intended appearance and behaviour.

## Page and interaction review

- Decide whether the page is a viewport canvas or a chapter to read. A canvas should
  use the available viewport, with its primary subject and essential controls visible
  at phone and desktop sizes. Let reading pages scroll naturally.
- Revisit the layout after meaningful UI changes: what is above the fold, what
  competes with the subject, and whether dead space helps the composition.
- Keep controls compact and few. Each button or slider should reveal something
  informative, rewarding or beautiful. Prefer progressive disclosure for detail.
- Provide clear navigation, a way back from inspection, and a way to restore the
  default view and settings. Deep inspection needs breadcrumbs or equivalent context.
- Preserve stable identities, intended time and selection through view changes.
  Keep requested and displayed time explicit during asynchronous seeks; scene and
  readings must use one accepted snapshot. Stale responses cannot replace a newer
  source or override a later pause. Optional loading/failure should preserve the
  usable scene and provide a clear retry path.
- Support keyboard operation of search, filters and inputs, with visible focus.
  Make touch targets generous even when their visible elements are small; avoid
  overlapping hit areas. Use the existing shared control/layout styles where suitable.
- Consider light and dark presentation. A deliberate fixed look is valid; check its
  legibility and surrounding browser/page chrome in either system preference.
- Use transitions to preserve the connection between states when useful. Respect
  reduced motion and keep interactions responsive. Authored journeys must yield to
  direct exploration; reduced-motion paths should reach equivalent useful states.

See [shared panel layout](docs/PANEL-LAYOUT.md) and
[spatial morph policy](docs/SPATIAL-MORPH-POLICY.md).

## Browser data and loading

- Preprocess data before sending it to the browser. Send only fields and precision
  needed for display or computation; keep raw sources and build intermediates offline.
- Set explicit initial-transfer budgets for the affected application, including code
  and opening data. Measure the first useful frame as well as transferred bytes.
  Bound decoded RAM, persistent caches and preparation peaks separately; compressed
  transfer size does not describe them. Account for the actual opening dependency
  closure, and verify optional chunks are deferred in a built browser run.
- Load optional modules and data progressively through clean boundaries. Use lazy
  loading and Suspense where appropriate, and avoid accidental serial waterfalls.
  Introduce chunking when the payload/use pattern warrants its complexity.
- Use dictionaries for materially repeated values. Put dictionary definitions or
  references in versioned manifests and keep chunk/dictionary versions consistent.
  Use Zod schemas for new JSON manifest contracts, with runtime boundary validation;
  preserve existing readers and compatibility during deliberate migrations.

See [first view on a phone](docs/FIRST-VIEW.md) and
[release contracts](docs/RELEASE-CONTRACT.md).

## Publication

- Establish the intended acquisition, retention, transformation and publication
  rights from the applicable source terms. Code licensing does not relicense data.
  Keep unresolved publication paths private; a working proof does not clear them.
- Test isolated packed consumers before a shared release. Publish the tested tarballs,
  verify registry bytes, and let editions adopt and validate exact versions explicitly.
  Deploy the verified site artifact. Report local, CI, registry and live evidence
  separately; repository HEAD and old green reports do not prove the served state.
- Every public site needs a favicon, canonical metadata, an intentional Open Graph
  preview image, Twitter card metadata, appropriate JSON-LD, sitemap.xml and robots.txt.
  Verify their built URLs and assets, including on subdomains.
- Check AI reachability as part of publication: crawl access, meaningful readable
  content, discoverable links and accurate metadata. When reporting a reachability
  score, name the tool/method and date; do not invent a score or treat it as proof
  that an AI system has indexed the site.
- Prefer short subdomains when introducing one. Consider Cloudflare's native GitHub
  integration when revisiting hosting; preserve existing artifact verification and
  publication gates when comparing deployment options.
- Keep infrastructure within the approximately US$100/month total series budget.
  Bound collection, processing, retries, retention and metered serving separately;
  caching is not a spending cap. A dated recorded work should remain useful when
  collection pauses. Distinguish source freshness, capture, processing, publication
  and consumer health, aging each against current time before calling it healthy.

See [hosting ownership and publication gates](docs/HOSTING.md),
[cost control](docs/COST-CONTROL.md) and [feed health](docs/FEED-OBSERVABILITY.md).

## Host-only credentials and Git metadata

- Treat authentication, credential, keychain, network, or permission failures from a
  sandboxed command as inconclusive when it depends on host state. Retry the same
  read-only check once with `sandbox_permissions = "require_escalated"` before
  reporting invalid credentials, asking for login, or stopping.
- Where `.git` is read-only in the sandbox, run Git mutations such as staging,
  committing, rebasing, and updating refs with `sandbox_permissions =
  "require_escalated"` on the first attempt. Do not interpret an `index.lock` or
  `.git` permission failure as a repository problem before retrying with host access.
- Keep escalation narrow, using the smallest relevant command prefix and normal
  approval/safety checks. Do not switch the session to `danger-full-access` merely
  to reach credentials or Git metadata.
