# Motion Studies

Motion Studies is a catalogue of authored works about movement made with one visual instrument. Gleislicht is the Swiss work in that catalogue, not the public name of the engine and not a title future places inherit. The [13 September status register](STUDY-STATUS.md) distinguishes source implementation, public release and the evidence each study contains.

| No. | Work | Place | Status | Repository |
| --- | --- | --- | --- | --- |
| 005 | **Gleislicht** | Switzerland | Released | [Repository](https://github.com/emmettl/gleislicht) |
| 006 | **All Change** | London | Public multimodal study; full bus-catalogue artifact with audited gaps | [Repository](https://github.com/emmettl/allchange) |
| 007 | **Local / Express** | New York | Parked; private proof retained, publication question open | [Repository (private)](https://github.com/emmettl/local-express) |
| 008 | **Correspondances** | Paris | 32-line implementation with eight-line default; served revision tracked separately | [Repository](https://github.com/emmettl/correspondances) |

Each work receives a locally meaningful title and descriptor. The shared series identity appears as a quiet catalogue mark; the work title remains dominant.

## Architecture

The codebase is divided into four layers:

1. **Engine** — timetable models, interpolation, search, playback, selection and recording.
2. **Visual language** — the luminous palette, service-category colours, typography and reusable interface tokens.
3. **Edition** — series number, local title, place identity, timezone, initial clock and the complete catalogue of lazy data assets.
4. **Adapters** — offline source-specific ingestion that compiles large public datasets into the compact browser contracts consumed by the engine.

`packages/core/src/edition.ts` defines the shared edition contract in this repository. Concrete catalogues live in the independent edition repositories: for example, Gleislicht’s `src/editions/switzerland.ts` and All Change’s `src/editions/london.ts`. `packages/web/src/mount-motion-study.tsx` provides the shared browser bootstrap. Each edition owns its root HTML entry and application entry point, and consumes exact published npm versions through public exports. `packages/core/src/theme.ts` and `packages/web/src/tokens.css` hold the common visual grammar.

An edition must provide:

- a stable ID plus a Motion Studies identity: unique catalogue number, local title, place name and descriptor;
- a timezone and initial clock;
- a national or city-scale opening network plus optional progressive day manifest;
- boundary and water geometry appropriate to its scale;
- optional alternate coordinate layouts that preserve stable stop, route and selection identity while changing the work's spatial logic;
- zero or more regional, contrast, hub, air, road and terrain-corridor studies;
- explicit source metadata inside every compiled artifact; and
- a visual theme that preserves the Motion Studies family resemblance without erasing local character.

The engine deliberately does not fetch GTFS, proprietary APIs or GIS services at runtime. Each adapter resolves licensing, identifiers, geometry and service-day semantics offline, then emits the existing edition-neutral snapshot contracts.

Alternate layouts are edition data, not alternate networks. `packages/core/src/domain/spatial-layout.ts` defines their stable identity contract and `packages/three/src/spatial-layout.ts` projects and blends them through the shared renderer. Playback owns one canonical service progress and samples each layout independently before blending positions. This lets an authored work move between geographic and topological space without duplicating journeys or losing time, search, selection and follow-camera state. Layout artifacts stay lazy and optional so editions without a meaningful second spatial language pay no transfer or runtime cost.

## Selection and station labels

Every edition with station, route or service search/selection uses the same label priority, regardless of input method or geographic/diagram layout:

1. The selected station's label has first priority.
2. Selecting a route promotes its terminal labels ahead of intermediate stops, including both directions, branch endpoints and advertised short turns. Selecting a particular service uses that journey's own first and last stops.
3. Other stops on the selected route/service follow, then the edition's normal station hierarchy when no route/service is isolated.

These priorities apply before label retention, editorial rank, distance, zoom admission and collision allocation. A previously visible intermediate stop must not suppress a newly selected terminal. Selected labels bypass ordinary rank/tier admission; viewport clipping and collisions between equally important labels still apply. Clearing selection restores normal density and ranking. Changing the clock or enabled layers must recompute membership without leaving stale selection priorities.

`NationalNetworkScene` implements this policy in `@motionstudies/three`; editions supply selection state and retain ownership of their labels, typography and ordinary ranks. Use the complete enabled infrastructure as `referenceSnapshot` to retain branch endpoints through quiet timetable chunks. Reference and active snapshots may use different stop indexes: membership resolves names from each snapshot separately. Only station markers available in the displayed network can receive labels. No extra fetching or endpoint inference from route-index order or destination text is required.

Regression coverage must include selected stations, branches and reverse directions, selected services, cleared selection, competing retained labels and reference snapshots with reordered stop tables. New edition adapters must preserve this policy. This policy ships in the coordinated alpha.4 release and has been adopted by all six editions using this scene. Consumers must still upgrade exact registry pins explicitly; see the [release and adoption record](RENDERER-ALPHA-4.md).

## Active movement counter

Every edition displaying a trains/vehicles-in-motion or active-journeys count must scope that count to the current station and service category or route selection, within the enabled network layers. Count only journeys active at the displayed clock time, including scheduled dwell and excluding cancelled services. Station selection means active journeys calling at that station, not only vehicles physically at its platforms. Clearing a selection restores the enabled network total; no matching active journeys displays zero.

Resolve station membership against the current snapshot when progressive chunks or layers change. Memoize selection filtering separately from playback counting so the clock does not rebuild station membership on every frame. Keep other metrics, such as total scheduled calls, hub movements, and directional comparison cards, tied to their own explicit labels.

The count is currently rendered by edition-owned shells. Apply this behavior in each consumer without importing sibling source or changing exact package pins merely to share UI code. Regression checks should pause the clock, select and clear a station/category, and verify both the narrowed count and restored total.

## Creating an edition

1. Create an edition repository, install exact coordinated `@motionstudies/*` releases and add its typed catalogue in `src/editions/`.
2. Compile one coherent two-hour opening study and the matching geographic context.
3. Give it a root `index.html` and TypeScript entry; reuse the published engine and renderer while keeping edition-specific chrome in its own study shell.
4. Add progressive 24-hour chunks only after the opening payload remains within budget.
5. Add local modes and authored studies where they reveal something distinctive about the place.

This is configuration-driven reuse, not a generic map skin. Every work should have a reason to exist, a name rooted in its place, and at least one visual study that could only belong there.

The catalogue programme and admission criteria live in [CATALOGUE.md](./CATALOGUE.md). [New York](./NEW-YORK.md) is parked, retaining its private corridor proof and MTA publication question. [Paris](./PARIS.md) implements all Métro/RER lines, nine Transilien lines and T3a/T3b, carrying Licence Mobilité provenance in its artifacts. [Berlin](./BERLIN.md) has a public scheduled and relative interchange study; [Tokyo](./TOKYO.md) is parked, retaining its public synthetic player with real-source acquisition paused; [MANIFEST](./MANIFEST.md) has a public synthetic prototype and local observed regional review. [Bristol](BRISTOL.md) has a local multimodal/tidal research edition, and [Zugunruhe](ZUGUNRUHE.md) has a public radar-derived migration study. Those five investigations remain unnumbered. Their inspected package pins are alpha.9; current implementation and served revisions are recorded separately.

The concrete repository/package split is recorded in [the extraction seam](./EXTRACTION.md). Shared package and edition import boundaries are enforced in their respective CI workflows. The [widget lab](https://emmettl.github.io/motionstudies/lab/) and packed-consumer checks exercise public contracts before a coordinated release.
