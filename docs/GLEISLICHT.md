# 005 — Gleislicht: study goals

[Open Gleislicht](https://motionstudies.app/gleislicht/) · [Edition repository](https://github.com/emmettl/gleislicht) · [Study index](README.md)

This brief retains the original Swiss study goals alongside the current delivery position. Series-wide goals live in [VISION.md](VISION.md); Swiss operational guides remain in the edition repository.

## Current state — 13 September 2026

The original atlas, terrain, regional/city, soundtrack, four-language, aircraft and measured-road scope is implemented. The owner accepted its physical-device performance on 9 September, including the remaining Windows limitations. That acceptance is evidence for the reviewed scope, not a benchmark of every subsequent addition.

The inspected committed baseline is `1a082bf`, with exact alpha.9 package pins. National **AUTO** retains all 1,440 minutes of 8 September 2026 across 718 accepted directional detector sites and 609 sections; its moving particles reconstruct measured flow rather than track cars. The optional national **PostBus** layer contains 32,390 scheduled trips, 821 source route IDs and 21,274 platform stops for 8 September. Its agency-801 scope includes active cross-border branches but excludes the previous day's tail. The road-path audit matches 99.79% of stop movements, retaining 1,010 fallback movements rather than implying perfect geometry. See the [national PostBus record](https://github.com/emmettl/gleislicht/blob/1a082bf/docs/POSTBUS-NATIONAL.md).

Station departure cards are implemented. Prepared two-day timetable releases and the separation of application and immutable data releases replace the earlier manually pinned feed-date arrangement; realtime identity must match the selected release calendar. Live health still needs its own check, and TripUpdates do not establish GPS positions or complete service-alert coverage. The edition's [operations record](https://github.com/emmettl/gleislicht/blob/1a082bf/docs/REALTIME.md) owns those details.

[Public release metadata](https://motionstudies.app/gleislicht/_release.json) serves the earlier `6d2c781`. Additional compact-desktop/interface changes are uncommitted in the local checkout and are not counted as a release. See the [series status record](STUDY-STATUS.md) before equating implementation, owner acceptance and deployment. Further regional, seasonal and vertical-geometry work remains governed by the edition's source audits.

## The idea

**Gleislicht: Switzerland in motion** makes the Swiss railway system feel alive rather than diagrammatic. It is a data visualisation, but its emotional register is a late-night window seat: dark valleys, bright infrastructure, distant signals and trains leaving traces through the landscape.

The experience should work across these scales and layers:

1. **The network breathes.** A national view reveals the timetable as a living system—departures gathering around cities, intercity pulses crossing the plateau, and thinner regional threads reaching into valleys.
2. **A single journey becomes cinema.** Choose a train and the camera descends to follow a luminous, lightly abstracted vehicle through real terrain. The landscape is recognisably Swiss but deliberately low-poly and atmospheric rather than photoreal.
3. **Regional networks reveal exchange.** ZVV, TPG and later regional studies show rail, tram, bus, boat and funicular services feeding one another without crowding the national view.
4. **Cities become electric.** A full-detail city study embraces the hectic texture of Zürich trams and buses, while a synchronized rural study makes the spacious pulse of PostBus services equally tangible.
5. **The sky remains a visitor.** The optional LUFTRAUM study places sparse observed aircraft above the railway without granting them a permanent network or equal visual weight.
6. **The road becomes a measured field.** AUTO turns aggregate motorway flow and speed into warm synthetic streams, clearly distinct from both scheduled trains and observed aircraft.

## Product principles

- **Motion before controls.** Opening the project should immediately show the system moving. Explanatory UI stays quiet until it is useful.
- **Truthful abstraction.** Position, time, route and terrain come from real data; light, scale, colour and camera motion are interpretive.
- **Legible provenance.** Planned, estimated and genuinely observed information must never be visually conflated. Synthetic or missing data is labelled.
- **From atlas to window seat.** Transitions between network, corridor and train views are continuous enough to preserve a sense of place.
- **A visual instrument.** Time, camera and layers can be played. The interface should feel closer to a synthesiser display than a transport planner.
- **A score, not background music.** Each scale has its own composed electronic cue; transitions between map, hub and journey are musical continuations of the same world. Sound remains opt-in.
- **Runs beautifully on an ordinary laptop.** Progressive detail, compact preprocessed data and measured GPU budgets matter more than maximal fidelity.
- **Load only the chosen scale.** National, regional, city and corridor artifacts remain separate so local detail never bloats the opening national study.
- **Swiss by default.** The complete interface speaks English, German, French and Italian, follows the visitor's language when possible, and keeps station and service names authentic.

## Visual thesis

_Night geography drawn by infrastructure._

The base world is deep indigo-black. Terrain is a sparse violet wire mesh with just enough filled surface to hold fog and depth. Rail lines sit above it as cool cyan filaments. Active vehicles carry a warmer magenta core, becoming bright punctuation rather than map pins. Typography is restrained, technical and monospaced where it reports state; the title remains human and quiet.

LUFTRAUM and AUTO extend this grammar without flattening it. Aircraft are dim magenta needles with ephemeral trails and real, compressed altitude. Road traffic is warm white with amber heavy vehicles, bound to physical corridors but explicitly reconstructed from aggregate counters. Rail remains the brightest and densest infrastructure layer.

The reference screenshot suggests the core spectacle: hundreds of journeys reveal the national network simply by moving. Gleislicht adds a more authored camera language and swaps satellite-map realism for low-poly topographic atmosphere.

## First audience

People fascinated by trains, Switzerland, maps, motion graphics or generative art. The first release is exploratory rather than a journey-planning tool: it should reward watching, scrubbing time and following a service.

## SBB-style station hero adoption

The earlier adoption proposal is implemented in the inspected baseline. `src/studies/StationCard.tsx` receives the network snapshot and study clock, selects the edition's `StationDeparturesCard` with `presentation="sbb"`, supplies EN/DE/FR/IT labels and preserves train selection and the connections action. Supported bus stops receive the corresponding bus departure presentation; unsupported cases retain a summary fallback. The edition consumes exact alpha.9 packages.

The shared lab fixture remains synthetic, while the edition's rows come from its network snapshot. Unknown platform sectors or operational fields must remain unknown, and realtime-adjusted calls must not be relabelled as original scheduled times. Implementation here does not establish that local HEAD is the public revision.

Component usage and row fields are documented in [the package guide](../packages/README.md#rail-bus-and-airport-hero-cards). SBB's own [general display guide](https://www.sbb.ch/en/travel-information/stations/services-station/station-customer-information/general-display-board.html) supplies the visual information hierarchy.

## Data stance

Swiss GTFS Static is the source of scheduled services, stops, trips and shapes. GTFS Realtime enriches those schedules with trip updates and service alerts, but the official national feed currently does **not** publish vehicle positions. Consequently, most on-track positions will be an honest interpolation between timed stops and shapes, adjusted by realtime trip updates where available—not a claim of GPS tracking.

Terrain should be derived from swisstopo's swissALTIRegio or swissALTI3D elevation models and shipped as simplified corridor artifacts with the required attribution. Full source rasters should be processed offline, never downloaded or parsed in the browser.

## What this is not—yet

- A passenger information or route-planning product
- A safety-critical realtime display
- A photoreal train simulator
- A generic 3D globe with train markers

## Success signals for the first public study

- The national view is recognisably Switzerland from motion alone.
- A viewer can select a service and reach a follow-camera view in one action.
- A typical laptop holds a smooth frame rate with the representative service count.
- Data age, source and interpolation status are understandable without breaking the atmosphere.
- A one-minute screen recording is interesting even with no narration.
