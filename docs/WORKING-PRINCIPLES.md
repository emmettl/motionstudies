# Motion Studies working principles

Motion Studies makes particular aspects of the world encounterable through movement,
time and inspection. Engineering should make those experiences easier to create,
understand and sustain. A successful change improves what someone can see or do,
while keeping the evidence believable and the cost of maintaining the work bounded.

These principles bring together the owner's notes of 5 November 2026 and lessons
from the shared instrument and individual editions. [AGENTS.md](../AGENTS.md) holds
the practical defaults for work here. Each independent edition retains its own
composition, source policy and adoption decisions; the linked records retain their
dates and verification scope.

## Begin with a particular experience

A work needs a sentence about its subject that survives close examination. A new
layer earns its place when it changes what the viewer understands. Underfall's
human schedules and tidal clock share a geography while retaining different kinds
of evidence. Paris makes centre and region legible through a continuous change of
scale. These are reasons to compose particular instruments. The
[vision](VISION.md) and [catalogue admission criteria](CATALOGUE.md#admission-test)
keep that judgment with the author.

Start with one coherent passage, corridor or bounded field that works on a phone.
Expand after encountering it. KRAFT's evening experiment moved from readable
exchanges towards a finite passage in which solar withdraws, gas increases and
demand persists. Its checks establish faithful inputs and visible change; artistic
interest still needs judgment. That is a useful distinction between proving a
mechanism and choosing a composition.
[KRAFT visual study 07](https://github.com/emmettl/kraft/blob/main/docs/VISUAL-STUDY-07.md)

Experiment widely, then remove weak ideas. Keep controls compact, use useful
widgets consistently and question empty space as deliberately as visible content.
Decide whether the page is a viewport canvas or a chapter to read. Review its first
screen on short laptops and phones: the subject and essential actions should be
available without the interface consuming the composition. LUFT's consolidated
search and shallower laptop dock show how removing interface can recover the map.
[LUFT mobile and laptop layout](https://github.com/emmettl/luft/blob/main/docs/MOBILE-SELECTION.md)

## Preserve evidence through every representation

The ability to believe a distant point of light is part of the experience. Inspection
should descend from the whole through a meaningful group to the smallest unit the
source contains, and return without losing time, place or identity. That unit may
be a journey, a detector interval or an estimate at a radar site.
[The view from altitude](VISION.md#the-view-from-altitude--13-september-2026)

| Edition or source | Evidence to preserve | Limit on the visual claim |
| --- | --- | --- |
| [Underfall roads](SHARED-GROUND-TRANSPORT.md) | Detector passages and reported interval speeds | Moving marks reconstruct aggregate flow; they do not identify individual cars. |
| [Zugunruhe](ZUGUNRUHE.md) | Radar-derived density and velocity, with spatial support | Smooth fields and trails do not recover individual birds or add observations between instruments. |
| [ZENIT](ZENIT.md#time-and-evidence) | Positions propagated from dated orbital elements | Modelled motion is not a recovered observation stream; element age alone is not a numerical confidence score. |
| [PFAD](https://github.com/emmettl/pfad/blob/main/AGENTS.md) | Actual algorithm events on an identified road graph | Search activity is distinct from vehicle movement, drawing geometry and replay time. |
| [MANIFEST](MANIFEST.md#trade-and-port-context) | Observed vessel movement and separately identified trade statistics | A cargo-vessel track does not establish its contents or their manufacturing origin. |
| [KRAFT](https://github.com/emmettl/kraft/blob/main/docs/VISUAL-STUDY-07.md) | Native generation and load intervals for selected categories | Coexisting changes do not establish a complete energy balance or a causal replacement between sources. |
| [Schwall](https://github.com/emmettl/schwall/blob/main/docs/FLUID-BACKENDS.md) | Measured terrain and a declared illustrative fluid model | A simulated release is not a calibrated or historical flood reconstruction. |

Keep observation, prediction, schedule, reconstruction and synthetic fixtures
distinct in contracts and language. Missing stays missing; a tiny positive value
must not become a claimed zero. Preserve native interval means, acquisition gaps,
units and coordinate frames. Interpolation needs a declared model. A denser display
grid does not improve source resolution, and illustrative geometry does not acquire
physical authority through rendering. Comparisons need explicit scales, denominators
and coverage; separately normalized fields can look equal while describing different
amounts.

Record source dates, acquisition time, model epoch and study time separately.
Civil days, GTFS service time and UTC elapsed time have different rules, especially
after midnight and across daylight-saving changes. Context from another date must
keep its date. Source hashes, compiler parameters, exclusions and coverage make a
composition reproducible and its limits inspectable.
[Data readiness](DATA-READINESS.md) · [Shared fields](SHARED-FIELDS.md) ·
[Observation windows](ALLCHANGE-FOUNDATIONS.md)

## Preserve continuity in state as well as motion

A transition should help someone follow the same thing through a new view. Paris
preserves source vertices and shared moving-path geometry through its lens;
Underfall's Study and Explore modes retain time and selection. Inspection needs a
clear return, and the full experience needs an accessible reset to its defaults.
[Spatial morphs](SPATIAL-MORPH-POLICY.md) · [Underfall](BRISTOL.md)

Give each state an owner. Loading reports availability; playback retains user
intent; inspection owns selected identities; presentation composes them. A completed
request must not resume playback after a later pause or replace another recording.
Optional data should have its own loading boundary so it can fail and retry while
the existing scene remains usable.
[State ownership](ARCHITECTURE-CONSOLIDATION.md#1-application-composition-and-state-ownership)

ZENIT's scrubber follows requested time immediately, while geometry, the stellar
clock and readings switch together to an accepted result. Superseded results are
discarded. LUFT uses one canonical selection across its map, activity, density and
boards. These establish a useful default: every displayed reading should describe
the scene the viewer is actually seeing.
[ZENIT implementation](ZENIT.md) ·
[LUFT selection](https://github.com/emmettl/luft/blob/main/docs/MOBILE-SELECTION.md)

Authored journeys should yield cleanly to gestures and keyboard exploration.
Transitions need interruption, reversal and reduced-motion behaviour, with useful
equivalent destinations. Hidden controls must stop intercepting input or receiving
focus. Touch interactions need real gesture tests: LUFT's history shows why blur,
scroll cancellation, stacking and compatibility clicks cannot all be inferred from
a successful mouse click.
[Camera journeys](CAMERA-JOURNEY-POLICY.md) ·
[LUFT touch activation](https://github.com/emmettl/luft/blob/main/docs/MOBILE-SELECTION.md)

## Share demonstrated behaviour with clear owners

Keep the existing boundaries: core owns domain logic, three owns rendering, web
owns browser loading and UI, and data owns offline preparation. Editions own their
sources, identity and composition. Stable technical IDs should survive changes to
titles, numbering and catalogue relationships.
[Package contracts](../packages/README.md) · [Vision](VISION.md)

Begin locally and compare with a second real consumer before promoting a helper.
The Swiss verified-loading pilot stayed local when LUFT's compressed persistent
cache and ZENIT's size-bound checks exposed materially different policies. Shared
mechanics do not require one universal loader or motion model.
[Consolidation assessment](ARCHITECTURE-CONSOLIDATION.md#current-implementation-status)

Use public exports and exact registry versions. Paris and Switzerland's renderer
source rewrites became supported policies, allowing their local composition to
remain local. Keep private internals private unless a consumer needs a supported
extension. Policies borrow buffers and camera targets; resource owners retain
cleanup. Avoid extra frame loops, duplicate clocks and broad subscriptions that
invalidate unrelated work.
[Renderer policy extraction](RENDERER-POLICIES-ALPHA-43.md) ·
[Camera ownership](CAMERA-JOURNEY-POLICY.md)

## Budget the opening and the lifetime of the work

Preprocess sources into the data required to display or compute the experience.
Use dictionaries for meaningful repetition, version their relationship to chunks,
and validate manifests at runtime. Use Zod for new JSON manifest contracts while
preserving existing readers through explicit migrations. Raw sources and compiler
intermediates belong outside browser payloads.

Measure the first useful frame as well as the opening bytes. The first-view study
showed that lazy modules could create a serial data-to-renderer waterfall, while
optional realtime data competed with the opening. Clean module boundaries and
Suspense help when request ordering also makes sense. Budget the actual initial
dependency closure and verify deferral in the built application.
[First-view measurements](FIRST-VIEW.md) ·
[Deferred renderer modules](RENDERER-POLICIES-ALPHA-43.md)

Transfer bytes, decoded RAM, preparation peaks and persistent storage need separate
limits. LUFT bounds decoded chunks independently of its verified compressed cache.
PFAD's memory work distinguishes retained buffers and cumulative cleanup from
physical-device peak memory. A compact download alone cannot prove a phone-safe
experience.
[LUFT cache](https://github.com/emmettl/luft/blob/main/docs/CHUNK-CACHE.md) ·
[PFAD memory follow-up](https://github.com/emmettl/pfad/blob/main/docs/evidence/balanced-memory-2026-10-02/README.md)

## Test meaning and measure changes proportionately

Use Vite, TypeScript, React, R3F where needed, Vitest, Playwright and Oxc as the
default toolkit. Preserve simple static pages. Pure algorithms, codecs, manifests,
timers and state transitions belong in cheap deterministic tests. Reference
implementations, round trips and replayed source fixtures protect meaning as well
as shape. Browser checks cover actual pixels, loading, storage and input integration.

PFAD demonstrates this division with real national searches in Vitest and browser
checks for worker transfer, WebGL, input and persistence. Its CI builds once and runs
desktop Chromium and touch WebKit on separate runners, with one browser worker on
each to avoid competing national scenes. Its recorded local two-worker improvement
is evidence for that workload, rather than a universal worker-count prescription.
[PFAD testing](https://github.com/emmettl/pfad/blob/main/docs/TESTING.md)

Select CI work conservatively by affected paths as suites grow. Documentation-only
changes should avoid GPU runs; shared or build changes must reach affected consumers.
Retain full release verification and a manual full-run route. Diagnose failures
without weakening acceptance limits: the Swiss geometry repairs restored coverage
while keeping the original thresholds, and the tooltip race was fixed by waiting
for the actual module request before exercising input.
[Failure repairs](FAILURE-CHECKS-2026-10-25.md)

Before a performance experiment, state the question, finite budget and decision it
could change. Compare production builds with matched data, time, viewport and
renderer; repeat matched runs and record the backend and instrumentation. Keep CPU,
GPU, frame pacing, input latency and device-memory claims distinct. A throttled
desktop or emulated phone cannot establish physical-phone performance.
[London weak-hardware study](https://github.com/emmettl/allchange/blob/main/docs/WEAK-HARDWARE-PERFORMANCE.md)

Schwall separates numerical agreement from physical validation: its cross-backend
checks compare actual computations, while its measured-terrain simulator declares
the release illustrative. On slower devices it reports limited playback speed
instead of changing the numerical timestep to catch up. Preserve the model's
meaning when adapting its presentation. Neither numerical agreement nor physical
validation alone decides whether the result is an interesting work.
[Schwall backend and playback contracts](https://github.com/emmettl/schwall/blob/main/docs/FLUID-BACKENDS.md)

Stop when the answer is sufficient. The renderer transform trial was excluded
because gains varied and ground-grid coverage changed. React Compiler adoption
was targeted where paired measurements supported it, with added bundle bytes
included in the decision. Rejecting an optimisation or leaving a helper local is a
successful result when the evidence supports that choice.
[Transform trial](RENDERER-POLICIES-ALPHA-43.md) ·
[Compiler evaluation](REACT-COMPILER.md)

## Publish and operate from evidence

Acquisition, retention, transformation and public redistribution are separate rights.
Apply the relevant source terms to the intended use; a successful download and an
MIT code licence do not resolve them. Local / Express's private proof and KRAFT's
per-series rights decisions show why technical completion and public release have
separate gates. Public implementation and catalogue admission are separate decisions
too. Parked investigations remain parked until the author resumes them.
[New York publication boundary](NEW-YORK-PUBLICATION.md) ·
[KRAFT rights](https://github.com/emmettl/kraft/blob/main/docs/RIGHTS.md) ·
[Catalogue programme](CATALOGUE.md)

Test isolated packed consumers, publish those tested tarballs, verify registry bytes,
and validate edition adoption explicitly. Deploy the successful site artifact.
Report local checks, hosted CI, registry publication and served revision separately.
A repository commit is not proof of deployment. Preserve dated results as dated
results, updating current guidance without rewriting history.
[Release process](RELEASING.md) · [Hosting](HOSTING.md)

Every public site needs its favicon, canonical metadata, intentional social image,
Open Graph and Twitter cards, appropriate JSON-LD, sitemap and robots file. Test
static contracts cheaply and smoke-test actual delivery. Crawlable meaningful
content and working links matter to AI reachability; attach any reported score to
its named method and date. Consider short subdomains and Cloudflare's native GitHub
integration when revisiting hosting, while preserving the verified artifact handoff.

Operate within the approximately US$100 monthly total series budget. Bound traffic
costs, collection, retries, processing, archives, staging and retained CI artifacts.
Caching reduces expected work but does not impose a spending ceiling. A recorded
work should remain encounterable when collection pauses. The cost policy's proposed
allocations are distinct from verified account-wide enforcement.
[Cost policy](COST-CONTROL.md)

Monitor the path from source through capture, normalization, publication and the
consumer. A fresh heartbeat can accompany stale source data; successful capture
does not prove upload or serving. Age evidence against the observer's current time.
Report restored capture and publication recovery independently, keeping missing
observations visible as gaps. Repair the failed stage and its cause
without silently discarding history or relaxing quality gates.
[Feed health](FEED-OBSERVABILITY.md) ·
[Incident and recovery semantics](FEED-INCIDENTS.md)

## Context specific techniques

The Number fast path with a BigInt fallback is an interesting optimisation for
particular integer workloads. Its usefulness depends on the value ranges,
operations and measured workload. Keep it as a technique worth remembering;
the lasting guidance above supplies the general working principles.
