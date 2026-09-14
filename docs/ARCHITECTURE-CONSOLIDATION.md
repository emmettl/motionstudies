# Code and library consolidation proposal

13 September 2026 · Revised proposal for discussion; implementation has not started.

## Objective and scope

The [creative premise in the project vision](VISION.md#creative-premise) gives this work its purpose: keep the cost of following curiosity low as the series grows, with implementation and maintenance supported by engineering agents.

Motion Studies is a loosely evolving series with varying technical overlap. Catalogue numbering, admission and the aesthetic discipline of the series remain editorial matters. They do not need to be formalised to improve the software.

The engineering objective is to make changes local, shared behaviour dependable, dependencies explicit and new applications inexpensive to assemble. Keep the independent repositories and existing four-package structure. Different works can adopt different subsets of the libraries.

This milestone concerns application modules, renderer internals, data boundaries and package consumption. A release inventory may be useful operational work later; it is not the architectural starting point. A starter should follow a proven composition of modules rather than freeze today's application structure into a template.

## Existing foundation

The shared package dependency graph is already enforced:

- `core`: domain contracts and algorithms, without browser or Node dependencies.
- `three`: rendering and its interaction interfaces, depending on core.
- `web`: browser loading, interface components and lifecycle helpers, depending on core.
- `data`: offline Node preparation, depending on core.

Explicit exports, exact package pins and packed-consumer tests are valuable existing protections. The [alpha.13 work](FOUNDATIONS-ALPHA-13.md) removed sibling railway dependencies and compiled-renderer patching. Extend these foundations rather than introduce another framework or package hierarchy.

During the preceding assessment, 271 unit tests, typechecking, lint, architecture checks and 14 hosting tests passed. Browser suites and public deployments were not rechecked for this proposal. Those results are a dated baseline, not validation of future changes.

## 1. Application composition and state ownership

The larger applications still combine data loading, playback, selection, camera requests and panel state. Switzerland's root application is approximately 4,000 lines, London's 2,400 and Paris's 1,100. Size identifies places to inspect; responsibility and coupling determine what to change.

Use Bristol's existing dated recording for a bounded first refactor. Trace three interactions through its current implementation:

1. Seek into an unloaded window, then pause before it arrives.
2. Change recordings while a request is pending.
3. Switch between Study and Explore with an active selection.

For each, identify the authoritative state, commands, derived values, effects and teardown. Compare the relevant loading/playback behaviour with London or Paris before proposing shared code.

Separate the responsibilities where the trace justifies it:

| Responsibility | Owns | Receives or emits |
| --- | --- | --- |
| Data loading | Source identity, loaded windows, request lifecycle and failures | Requested time; available data and coverage |
| Playback | Displayed time and explicit play/pause/seek intent | Availability; clock updates |
| Inspection | Stable selected identities and user actions | Current dataset; selection and camera commands |
| Presentation | Scene composition, panels and local visual decisions | State and callbacks |

Data availability must not silently override a later user pause. A stale request must not replace the current recording. View changes must preserve the intended time and selection. Keep one owner for each state; derive counts, labels and other display values where possible.

Start with local functions, hooks or reducers using the current stack. The existing `useProgressiveChunks`, domain-specific progressive loaders and `useJsonAsset` already handle substantial request lifecycle work. Check their fit before implementing another loader; preserve meaningful differences in verification, caching and replay semantics.

**Deliverable:** a smaller Bristol composition root, explicit transition behaviour and focused regression checks. No shared controller is presumed. Promote a helper only after a second real consumer establishes compatible semantics and a useful API.

## 2. Renderer internals behind a stable public interface

`NationalNetworkScene.tsx` is 4,487 lines, despite useful existing helpers for labels, picking, geometry, trails and performance. Its public extension interfaces now provide a better boundary for consumers. The next question is whether internal components have similarly clear boundaries.

Inspect one coherent area, such as station labels and selection, before moving code. Identify its inputs, caches, frame updates, picking registrations and Three.js resource ownership. Extract implementation into private modules with explicit dependencies, preserving the public scene entry point and supported extension interfaces.

Moving a component into another file while passing the whole scene state through an implicit dependency does not establish a useful boundary. Avoid broad context subscriptions that make unrelated UI changes invalidate rendering work.

**Deliverable:** one bounded internal extraction with unchanged consumer API and verified selection, picking, teardown and rendering behaviour. Preserve existing bundle gates and compare representative frame behaviour. A whole-renderer rewrite is not required.

## 3. Data contracts at actual boundaries

TypeScript types describe expected data but do not establish that a downloaded artifact is valid. Validation belongs where source input becomes a compiled artifact and where external artifacts enter the browser. Check existing readers and validators before adding new machinery.

For the pilot's data path, make these contracts explicit:

- Schema/version and supported compatibility.
- Source and recording identity, including what invalidates caches and selections.
- Time coordinates, coverage and gap semantics.
- Units and the meaning of observations, schedules or estimates.
- Integrity checks and behaviour for missing or unsupported data.

Package release version, data schema version and a particular recording's identity are separate facts. Reuse established domain contracts where they fit. Bird density fields, recorded vehicle positions and scheduled journeys can share mechanical helpers without sharing one motion model.

The [archive and processing options](ARCHIVE-AND-PROCESSING.md) extend these boundaries from source capture through analytical storage and published artifacts. Object archives, tabular observations, gridded fields and an optional query database have different responsibilities. Evaluate them through a bounded recording, with source-specific retention and redistribution, rather than making one database or storage format a prerequisite for every edition.

**Deliverable:** a documented and checked producer-to-consumer contract for Bristol's recording path, using its existing manifests. Corrupt, unsupported or mismatched data fails clearly; absent observations remain distinct from zero activity. Reference fixtures and replay checks protect meaning as well as shape.

## 4. Library ergonomics and independent consumption

Use the refactors to test whether a consumer can import only the behaviour it needs. Check public export clarity, optional CSS, browser/Node separation, lazy imports and unnecessary dependencies. Keep internal renderer components private unless an actual consumer requires a supported extension.

One concrete coupling is that `mountMotionStudy` accepts the full transport-oriented edition type although its implementation uses the edition ID and theme. Inspect whether it can accept those narrower structural inputs while remaining compatible with existing callers. Bootstrap should require the values it actually uses. This is a small library API question; it does not require redefining catalogue identity.

Public API changes need a real consumer example, compatibility notes and packed-consumer checks. Shared runtime and resource lifetimes should be documented where callers must act: stable inputs, cancellation, disposal and ownership of clocks or buffers.

**Deliverable:** demonstrated independent consumption from a clean application, with exact published pins and no source aliases or compiled-package patches. After the modules have proved useful, derive a minimal runnable example that can become a starter. Keep ongoing build/deployment mechanics in maintained tooling rather than distributing fixes through copied applications.

## Sharing and validation rules

A candidate belongs in a shared library when multiple consumers need the same semantics, its inputs and ownership can be stated clearly, and its benefit exceeds the options and coupling it introduces. Pure, well-defined infrastructure may justify extraction sooner; an application's workflow usually needs the second-consumer proof.

Share mechanisms such as decoding, verified loading, interpolation or resource lifecycle. Keep local source policy, selection meaning and visual composition with the work unless common behaviour is demonstrated. Independent compositions with similar-looking code are acceptable.

For each change:

1. State the behaviour and boundary being improved.
2. Establish the relevant current behaviour and performance baseline.
3. Make a bounded refactor without changing unrelated product behaviour.
4. Run focused lifecycle/contract checks and applicable existing build, browser and payload gates.
5. If published, verify a clean package consumer and adopt through the normal exact-version release process.

Avoid repeated full-suite runs without new changes or unresolved risk. File-count reduction, abstractions added and percentage of shared code are not success measures.

## Recommended first delivery

Begin with **Bristol's loading/playback coordination**, covering the three interactions above. Produce a short dependency and state-ownership map, then implement the local refactor with focused behavioural verification. Use existing shared loaders wherever their contracts fit. Assess the second-consumer opportunity from actual code, not from a desire to make everything reusable.

The renderer extraction and broader data/API follow-ups are subsequent bounded changes, selected by the coupling this work exposes. They do not all need to become one large milestone.

Success means a loading fix has one clear home, a new view composes existing state without duplicating it, and a consumer can reuse a capability without adopting unrelated application machinery. A starter and simpler deployment should emerge from those boundaries.
