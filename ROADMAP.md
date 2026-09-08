# Roadmap

[Project goals](docs/VISION.md) · [Study index](docs/README.md) · [Catalogue programme](docs/CATALOGUE.md)

## Repository milestone — 7 September 2026

- [x] Move shared packages, the widget lab and catalogue into Motion Studies.
- [x] Publish all four coordinated npm packages and verify trusted publishing.
- [x] Move each edition into its own repository with exact package pins and independent checks.
- [x] Publish Gleislicht, All Change and Correspondances on their own Pages sites; retain the private Local / Express proof and its publication hold.
- [x] Centralise city briefs, programme goals and this roadmap in Motion Studies.

The stages below retain the delivery history from the first Swiss study through the wider catalogue. Future work follows the source and publication gates in each brief; no calendar dates are implied.

## Current delivery position — 7 September 2026

- **Shared platform:** alpha.3 is now published under `next`; the [trusted release run](https://github.com/emmettl/motionstudies/actions/runs/34155462468) passed verification and publication. Editions still need deliberate exact-pin upgrades to consume the renderer fixes.
- **All Change:** the diagram, interchange and full-day studies are implemented. Full TfL bus-catalogue expansion is work in progress in the edition checkout, not a completed release milestone.
- **Correspondances:** the default remains eight lines; optional Métro 2/6 and 5/7 groups bring the committed study to twelve lines, 1,516 morning journeys and 8,051 full-day journeys. See the [Paris brief](docs/PARIS.md) for payload and device-review limits.
- **Umlauf:** the private, unnumbered Berlin proof implements the Ring, crossings, circulation transformation and relative Ostkreuz interchange. Crossing performance, physical-device review, measured rail elevations and private preview approval remain open.
- **MANIFEST:** a public synthetic fleet prototype and a local observed NOAA sample now exist. Observed-data publication, global source acquisition and the production phone budget remain open.
- **NORIKAE / Fietsen:** Tokyo has a synthetic player and offline importer awaiting the first real Toei archive; Amsterdam still needs counter coverage, sample measurements and their terms validated.

These are repository implementation states, not verification that the latest commits are deployed. Source permissions, publication approval and catalogue admission remain separate gates.

This is an iterative art-and-data project. Each stage should end in a coherent visual study rather than a long period of invisible infrastructure work.

## 0 — Motion language (now)

- [x] Establish the Vite, React, TypeScript, Three.js, oxlint and Vitest baseline.
- [x] Create a full-screen follow-camera prototype with procedural wireframe terrain.
- [x] Separate journey/timetable concepts from Three.js rendering.
- [x] Label synthetic data and add pause, scrub and camera controls.
- [x] Tune camera damping, scale, colour and fog across representative phone, tablet and desktop sizes.
- [x] Set and enforce the first mobile transfer budget; establish frame-time telemetry with the terrain work.

**Exit:** the prototype communicates “night train through luminous Swiss topography” in its first few seconds.

## 1 — Scheduled Switzerland

- [x] Add a repeatable, streaming ingestion script for the current Swiss GTFS Static archive.
- [x] Parse rail routes, trips, stop times, stops and service calendars offline.
- [x] Resolve service-day rules, exceptions, after-midnight times and source/version metadata.
- [x] Produce a compact morning artifact instead of shipping the 232 MB GTFS ZIP.
- [x] Render the Friday morning window in a national view with a deterministic simulation clock.
- [x] Frame the network with a simplified, luminous swissBOUNDARIES3D national outline.
- [x] Ground the network with simplified federal lake polygons and luminous shorelines.
- [x] Replace straight stop-to-stop segments with matched Federal Office of Transport rail geometry; retain explicit fallbacks where the join cannot be made.
- [x] Add a compact full-day artifact for the four hub pulse studies.
- [x] Add a separately loaded full service-day national study while preserving the fast morning load.

**Exit:** thousands of scheduled movements form a recognisable, scrubbable national rail network.

## 2 — Regional and urban pulse

- [x] Generalise GTFS preprocessing across Swiss rail, tram, bus, ferry, cableway, funicular and metro route types.
- [x] Produce a separately loaded Zürich city morning artifact and scale switcher.
- [x] Keep the national page load rail-only and derive the city study on demand.
- [x] Join the official ZVV/VBZ GTFS shapes after validating line, stop and date alignment.
- [x] Add a ZVV overview with zoom-dependent aggregation and regional map hierarchy.
- [x] Add a Genève/TPG study with French labels and carefully handled cross-border services.
- [x] Select Kiental–Griesalp route 220 from measured schedule and terrain criteria.
- [x] Build a synchronized, progressively loaded 24-hour rural PostBus versus Zürich tram contrast mode.

**Exit:** regional connections and urban density read clearly at their own scales, and the rural–urban contrast is compelling without falsifying frequency or position.

See [docs/REGIONAL-STUDIES.md](https://github.com/emmettl/gleislicht/blob/main/docs/REGIONAL-STUDIES.md) for the study and packaging model.
The measured corridor decision is recorded in [docs/POSTBUS-CORRIDOR.md](https://github.com/emmettl/gleislicht/blob/main/docs/POSTBUS-CORRIDOR.md).

## 3 — Real terrain, real corridors

- [x] Establish LV95/WGS84/WebGL coordinate transforms and a single distance model.
- [x] Build an offline swissALTIRegio processing path: crop, resample, quantise and package on demand.
- [x] Create desktop and mobile terrain LODs around the matched Zürich–Chur rail shape.
- [x] Add terrain-integrated lake surfaces and station beacons to the first measured corridor.
- [x] Add a higher-resolution swissALTI3D Alpine corridor crop for Kiental–Griesalp, with road-following route geometry.
- [x] Add tunnel-aware line treatment to the Zürich–Chur rail corridor from SBB infrastructure records.
- [x] Show mandatory `© swisstopo` attribution wherever derived terrain appears.

**Exit:** Zürich–Chur and one Alpine corridor run over recognisable real terrain on laptop and mobile GPUs.

## 4 — Realtime without pretending

- [x] Build a small server-side poller contract with the required API key, redirects, user-agent, 30-second edge cache and restrictive CORS.
- [x] Decode binary protobuf and refuse to combine updates with a different GTFS Static release or service day.
- [x] Apply delays, cancellations and exactly matched skipped stops to scheduled animation.
- [x] Visually distinguish scheduled and realtime-adjusted interpolation, including delayed-train rings and label offsets.
- [x] Surface loading, feed mismatch, stale and offline fallbacks in a compact operations control.
- [x] Ship an explicitly labelled deterministic demo so the complete interaction can be reviewed without credentials.
- [ ] Provision the poller secret and URL, then regenerate current-day static artifacts before enabling LIVE by default.
- [ ] Add service-alert presentation after the Trip Updates path has run reliably in production.

The national GTFS-RT feed supplies trip updates and alerts, not vehicle positions. Unless another properly licensed position source is added, “live” means timetable motion corrected by realtime predictions—not GPS dots.

**Exit:** the current service day changes credibly when operations change, with provenance visible on demand.

See [docs/REALTIME.md](https://github.com/emmettl/gleislicht/blob/main/docs/REALTIME.md) for the trust model, deployment contract and activation checklist.

## 5 — The visual instrument

- [x] Add the first national → selected-train camera descent and route highlight.
- [x] Search and select by train number, service, origin or destination.
- [x] Colour-code motion by service class while preserving night-view legibility.
- [x] Reveal collision-aware station labels progressively with map zoom.
- [x] Add context-aware, switchable labels for moving trains.
- [x] Add a hub-scale Takt pulse for Zürich HB, Bern, Basel SBB and Genève.
- [x] Loop the hub orbit across a full day with four authored playback tempos.
- [x] Add an alternate station-flow view with scheduled GTFS platform assignments.
- [x] Replace the first supported map-level selected-train follow with a terrain-backed corridor transition.
- [x] Add a first-class selector for switching directly between the authored terrain journeys.
- [x] Add time-of-day presets, speed control and a short looping “director mode.”
- [x] Add authored palettes and camera behaviours for plateau, lake and Alpine routes.
- [x] Add three opt-in Driftbox cues with adaptive crossfades between network, hub and journey modes.
- [x] Extend the score with spatial details derived from speed, tunnel state and terrain—never autoplayed.

**Exit:** viewers can explore deliberately or let Gleislicht compose a journey for them.

## 6 — Publish and sustain

- [x] Add reviewed, automated national source refreshes with validation and atomic artifact versions.
- [x] Add regression fixtures for DST changes, midnight rollover and missing shapes; reject mismatched national artifact sets.
- [x] Add opt-in local performance telemetry without personal tracking.
- [x] Add an accessible non-WebGL fallback.
- [x] Publish a source, attribution and methodology page.
- [x] Add a user-initiated recording/export workflow for shareable visual studies.
- [x] Publish the reviewed static build through GitHub Pages; private previews remain non-canonical.

## 7 — LUFTRAUM

- [x] Add a named, optional air study without turning the railway atlas into a generic transport map.
- [x] Prepare one matching historical hour of observed ADS-B positions as a compact static artifact.
- [x] Filter ground traffic, stale tracks and slow low-level light-aircraft noise in preprocessing.
- [x] Replay aircraft deterministically on the shared clock with compressed real altitude.
- [x] Render aircraft as restrained magenta needles with short, ephemeral trails—never a permanent air network.
- [x] Lazy-load the complete study only after the visitor selects **LUFT**.
- [x] Make aircraft selectable and expose callsign, altitude, groundspeed, heading and a tilted follow camera.
- [ ] Judge the visual experiment on real phones before considering a longer window, richer filtering or live polling.

**Exit:** the observed sky reads as a sparse atmospheric stratum above the deliberately built rail lattice, while the opening national study remains railway-first and unchanged in payload.

See [docs/LUFTRAUM.md](https://github.com/emmettl/gleislicht/blob/main/docs/LUFTRAUM.md) for the data contract, filtering and visual grammar.

## 8 — AUTO

- [x] Define road movement as aggregate reconstruction rather than individual vehicle tracking.
- [x] Anchor Road Study 001 to current ASTRA detector sites along the A1 through Zürich.
- [x] Add a deterministic two-hour calibration artifact without increasing the opening payload.
- [x] Reconstruct separate light- and heavy-vehicle streams from flow, speed and corridor length.
- [x] Render warm-white and amber traffic beneath the cyan rail and magenta air layers.
- [x] Make AUTO an optional, isolatable service category with multilingual provenance.
- [x] Add a credential-safe, filtered one-minute ASTRA recorder and a completeness-gated compiler.
- [x] Audit all federal counters against official national-road axes and render the lazy national skeleton.
- [x] Resolve 49 of 59 ambiguous directional matches from neighbouring-counter continuity.
- [x] Build 609 measurement-ready directional sections and searchable A-road corridor focus.
- [x] Resolve the final 10 interchange directions from FEDRO TMC point-to-road identifiers rather than proximity.
- [x] Add a progressive national minute-study compiler, loader and section-flow renderer ready for recorded snapshots.
- [ ] Begin authenticated one-minute snapshot recording and replace calibration values with a complete measured hour.
- [ ] Judge the A1 composition on real phones before adding A2 Gotthard or a recorded full day.

**Exit:** the three layers remain visually and methodologically distinct: scheduled rail journeys, observed aircraft trajectories and synthetic traffic reconstructed from aggregate measurement.

See [docs/AUTO.md](https://github.com/emmettl/gleislicht/blob/main/docs/AUTO.md) for the data contract, reconstruction and recording path.

## 8A — Gleislicht: regional depth, lakes and mountain railways

Planned expansion — 8 September 2026. Build towards a richly explorable Switzerland: each new place should have a recognisable transport character, credible motion and a satisfying journey from overview to detail. The phases below give a preferred sequence, not calendar commitments. Existing completed milestones remain the foundation; unchecked items are future work.

### Starting evidence

Dedicated local-network studies currently cover Zürich city, ZVV and Genève/TPG. National rail and nationwide PostBus provide broader coverage, but do not constitute complete regional multimodal studies. ZVV, Genève and Zürich city use morning artifacts; the separate Zürich tram contrast study already supports 24 hours.

The committed 4 September 2026 national full-day timetable already contains services to Rigi Kulm, Jungfraujoch, Gornergrat, Pilatus Kulm and Rochers-de-Naye. Rigi, Jungfraujoch and Gornergrat services inspected in the 09:00–12:00 chunk are classified as `other`; Pilatus and Rochers-de-Naye appear as `regional`. This establishes a starting point for discovery, not complete mountain-network or geometry coverage. The importer accepts ferry, cableway and funicular modes. The frequency increment below now ingests `frequencies.txt` with explicit exact-versus-illustrative semantics.

### A — Make existing mountain coverage discoverable

- [x] Deliver the first source-type 116 cogwheel filter for the national morning and full-day views, with operator search, matching-feed catalogue validation and a repeatable source audit. The 4 September fixture contains 403 joined services; 14 Monte Generoso segment occurrences remain unresolved. Desktop Chromium and emulated iPhone WebKit checks pass; physical-device review and publication remain open. See [the first increment and coverage limits](https://github.com/emmettl/gleislicht/blob/main/docs/MOUNTAIN-TRANSPORT.md).
- [ ] Audit mountain railway, funicular, cableway and boat coverage by operator, route, operating date and time window; report missing services and geometry separately.
- [ ] Preserve source operator and transport-type evidence through preprocessing, and distinguish cogwheel/mountain services where supported rather than leaving them hidden in `other` or guessing from route names.
- [ ] Add searchable mountain destinations, operator/line discovery and a mountain-service filter with clear category labels in EN / DE / FR / IT.
- [x] Implement and verify `frequencies.txt` semantics, including operating intervals, headways, `exact_times`, calendar exceptions and midnight boundaries. Stable generated identities preserve provenance through clipping and chunks; illustrative motion has distinct EN / DE / FR / IT labels. The first local ZVV fixture includes 29 representative Horgen–Meilen ferry runs. Importer/unit and desktop/emulated-iPhone browser checks pass; publication and physical-device review remain open. Direct ferry interpolation is not yet validated water-route geometry. See [frequency services and limits](https://github.com/emmettl/gleislicht/blob/main/docs/FREQUENCY-SERVICES.md).
- [ ] Audit cableway geometry and vertical motion separately from rail and roads. Preserve continuous-circulation versus shuttle operation where sources establish it; illustrative cabins must not imply tracked vehicles or unsupported exact departures.

**Exit:** visitors can find and isolate the mountain services already present, and the coverage audit explains what is still absent without overstating completeness.

### B — Lake Lucerne–Rigi: the first mountain-and-water composition

- [x] Deliver the first separately loaded, full-day **2D** Lake Lucerne–Rigi map: 190 scheduled movements across lake boats, both cogwheel approaches and the Weggis cableway, with operator search, mode filters and EN / DE / FR / IT labels. All 374 rail segments have FOT matches; the cableway uses exact installation 71.105. Boat paths are explicitly modelled inside the cartographic lake boundary, not validated shipping lanes. The full fixture is 13.1 KiB gzip (25 KiB study budget). Desktop/emulated-iPhone checks pass; publication and physical-device review remain open. See [Rigi study evidence and limits](https://github.com/emmettl/gleislicht/blob/main/docs/RIGI-STUDY.md).
- [ ] Show the two railway approaches converging on the mountain, with selectable piers, valley stations, intermediate connections and summit destinations.
- [ ] Join credible water routes, railway alignments and cableway paths; use explicit mode-appropriate fallbacks. Boat routes must stay on navigable water and must not inherit rail/road shoreline detours.
- [x] Deliver the first measured **Vitznau–Rigi Kulm ascent**: 6.8 km of mapped FOT rail, nine timetable stops, native 10 m swissALTIRegio ground samples, lake context, a compact cogwheel vehicle and a scrubbable elevation profile. The 81.8 KiB terrain artifact loads on entry; desktop/emulated-iPhone checks cover the profile, source-run selection and failure recovery. Ground beneath the railway is explicitly distinguished from surveyed track heights; playback is scenic. See [terrain evidence and reproduction](https://github.com/emmettl/gleislicht/blob/main/docs/RIGI-TERRAIN.md).
- [ ] Extend the measured ascent to the Arth-Goldau approach and source credible rail-height/tunnel details. Complete physical-device review of the first ascent.
- [ ] Add an authored lake-to-summit sequence that follows the study clock through boat, railway and cableway scenes. Show scheduled interchange intervals without claiming guaranteed connections.
- [ ] Keep quiet periods and seasonal non-operation visible as part of the composition; choose an initial service date that actually demonstrates the intended network.

**Exit:** a visitor can explore a coherent lake-to-summit transport system, follow an individual ascent and understand its relationship to the wider Swiss network on both desktop and phone.

### C — Broaden regional Switzerland

Deliver Lausanne/Vaud or Basel/TNW first, choosing between them after a bounded source, geometry and payload audit. Continue through the remaining regions; each needs its own framing and signature scene.

| Region | Intended character | Scope to establish |
| --- | --- | --- |
| Lausanne / Vaud | Métro and local rail connecting the city and its surroundings | tl métro/bus, LEB and regional rail; validate lake-service integration separately. |
| Basel / TNW | A regional network crossing three national borders | BVB/BLT, regional rail and connecting buses; explicitly audit French and German coverage beyond the Swiss feed. |
| Bern and surroundings | The existing national hub pulse spreading into its local network | BERNMOBIL, RBS, S-Bahn and connecting buses, with an authored hub-to-region transition. |
| Ticino | Southern Switzerland and its connections into Italy | TILO, local buses and selected funicular/lake links; establish the Italian extent and source completeness. |
| Graubünden | An Alpine railway network shaped by valleys and passes | RhB-led regional coverage, connecting PostBus services and selected mountain links, with closer terrain journeys. |

- [ ] Produce a coverage matrix and bounded proof for each region before treating it as a complete network.
- [ ] Retain source-language place names and real cross-border branches, with consistent translated controls.
- [ ] Give every region full-day progressive loading, geographic context, search, category/line isolation and zoom-dependent detail.
- [ ] Reuse authoritative national rail paths inside regional artifacts, replacing the current regional straight-stop rail interpolation where a credible match exists.
- [ ] Validate local geometry independently by mode, operator and segment occurrence; expose unresolved fallbacks in provenance.

**Exit:** each region feels authored for its own geography and transport rhythm, with transparent coverage and the same dependable exploration controls.

### D — More Alpine and lake experiences

- [ ] Develop Jungfrau as the next substantial mountain study: valley branches, Wengernalp and Jungfrau railways, and Eiger Express, with measured terrain and route-specific operating semantics.
- [ ] Assess Gornergrat, Pilatus and Rochers-de-Naye as compact follow-camera journeys using the services already found in the national timetable.
- [ ] Assess an Albula/Bernina journey within the Graubünden study, preserving credible curves, elevation, tunnels and international extent where supported.
- [ ] Expand boat studies beyond Rigi to selected Lake Geneva, Lake Zürich and Ticino networks after auditing schedules, water geometry and seasonality.
- [ ] Add a city–lake–mountain comparison on a shared service date and clock, extending the existing urban–rural contrast with distinct daily rhythms.

**Exit:** the additional studies introduce meaningful differences in motion, terrain or connections; each is an independently satisfying experience with validated sources.

### E — Make the growing collection feel complete

- [ ] Expand existing ZVV, Genève and Zürich city multimodal studies to complete service days, retaining their lightweight opening views.
- [ ] Add reproducible weekday/weekend and summer/winter selections using actual service calendars and independently versioned artifacts. Keep comparisons explicit when dates or observation sources differ.
- [ ] Introduce a study browser organised by place and experience—national, regional, city, lake, mountain and journey—with clear names, previews, available dates, modes and time coverage.
- [ ] Preserve orientation, selection and clock deliberately when moving between national, regional and journey views; explain unavailable times rather than silently substituting a different day.
- [ ] Add shareable study links carrying the selected place, service date, time and supported focus state, with useful fallbacks when an artifact is unavailable.
- [ ] Give each new study an authored opening composition and optional guided sequence; extend the adaptive soundtrack where the new setting warrants it.

**Completion standard for every phase:** validate timetable semantics and source/geometry coverage; disclose scheduled, frequency-generated and observed motion accurately; retain attribution; keep EN / DE / FR / IT controls, keyboard/touch operation and reduced-motion behaviour coherent. Load optional studies on demand, preserve the existing 790 KiB compressed national opening budget unless deliberately revised, and establish measured per-study payload and frame-time budgets with desktop and physical-phone review. Mark implementation, device review and publication separately.

**Preferred sequence:** A → B → first region from C → existing regional full-day upgrades from E → remaining regions and Alpine/lake studies. Frequency support and mode-specific geometry precede any study that depends on them; introduce the study browser as the catalogue grows.

Reference sources for implementation audits: [Swiss GTFS and frequency semantics](https://opentransportdata.swiss/en/cookbook/timetable-cookbook/gtfs/), [Rigi timetables](https://www.rigi.ch/en/inform/timetables), [Rigi access connections](https://www.rigi.ch/en/inform/arrival), [Jungfrau / Wengernalp network](https://www.jungfrau.ch/en-gb/corporate/jungfrau-railways/jungfraubahn-holding-ag/wengernalpbahn-ag/), [tl](https://www.t-l.ch/), [TNW](https://www.tnw.ch/en/) and [TILO](https://www.tilo.ch/en/chi-siamo/dati-e-fatti-tilo-new/). Operator pages establish intended network scope; they do not substitute for a validated machine-readable source or route geometry.


## 9 — Motion Studies / All Change

- [x] Separate the visual language and CSS tokens from transport-domain types.
- [x] Define a typed edition contract for identity, time, theme and lazy data assets.
- [x] Move the complete Switzerland asset catalogue behind that contract.
- [x] Generalise boundary and water types without changing existing artifacts.
- [x] Define the first London study, source strategy and staged delivery plan.
- [x] Establish Motion Studies as the catalogue identity: 005 Gleislicht / Switzerland and 006 All Change / London.
- [x] Build the TfL adapter proof from a bounded weekday Bakerloo fixture with NaPTAN stops, route geometry and station intervals.
- [x] Compile the London morning lattice with Greater London and Thames geometry.
- [x] Add a dedicated London entry point once the fixture passes source and payload validation.
- [x] Add a limited-chrome London presentation mode that leaves the timeline available on desktop and iPhone.
- [x] Add an edition-neutral alternate-layout contract and a lazy, deterministic Beck-inspired diagram artifact.
- [x] Animate continuously between London's geographic and diagram spaces without resetting journeys or selection.
- [x] Reshape the logical layout around central-London expansion, compressed outer branches, shared interchange cells and stable two-way bends.
- [x] Add authored interchange/path overrides, a simplified Thames and an optional TfL-echoing line palette to complete the iconic-map composition.
- [x] Make the resolved London diagram read as a line map: collision-free station cells, predominantly direct octilinear runs, cased route ribbons, stop dots and interchange rings, with the aggregate traffic field fully receded.
- [x] Enforce the future package/repository boundary in CI so shared runtime code remains place-neutral.
- [x] Add a separately loaded, integrity-checked 24-hour London timetable in progressive two-hour chunks.
- [x] Add an optional observed-aircraft layer for London with matching two-hour and progressively loaded 24-hour studies, searchable flight codes, airport approach/departure selection and category emphasis.
- [x] Add an optional National Highways motorway study with real detector geometry, recorded flow/speed, progressive 24-hour loading, ROAD isolation and searchable corridor focus.
- [x] Add the first London-specific interchange pulse study across four contrasting hubs.
- [x] Add a separately loaded 24-hour London surface study for scheduled River Bus and cable-car movement.
- [x] Prove surface buses as a separate progressive corridor study with route 26/N26, shared-clock search and category isolation.
- [ ] Complete and validate the in-progress full TfL bus-catalogue expansion, including route coverage, service-day semantics and progressive payloads.

**Exit:** Gleislicht and All Change are independently authored Motion Studies, sharing runtime behaviour and visual grammar without sharing titles or place-specific assumptions.

See [docs/EDITIONS.md](./docs/EDITIONS.md) for the reusable boundary and [docs/LONDON.md](./docs/LONDON.md) for the second-edition plan.

## 9A — All Change: passenger flow and the rhythm of the city

Implemented foundation — 8 September 2026. All Change now has a source-audited passenger-flow pulse at Bank/Monument and Stratford, demand hero cards across validated NUMBAT coverage, and dismissible station departure boards. The study distinguishes typical passenger demand from scheduled services. Live National Rail remains a later operational strand. Unchecked items below remain proposals or unfinished work.

### A — Passenger pulse and wider station coverage

- [x] Audit the NUMBAT 2025 Friday release with source year/day type, terms, input hashes, station identities and interval totals. Validate Bank/Monument and Stratford interchange flows.
- [x] Compile separately loaded station entry, exit and within-area interchange profiles. Ship 432 validated source areas matched to 440 app name variants; exclude 39 tram placeholder rows, retain unavailable metrics and keep separate source areas distinct. Withhold ambiguous changing totals at Clapham Junction and Norwood Junction.
- [x] Build the Bank/Stratford passenger pulse with entering, leaving and changing streams, proportional volume marks, the shared study clock, pause/scrub, reduced motion, and morning/evening comparison controls. Keep the passenger and train-service views explicitly separate; schematic flows are not tracked paths or occupancy.
- [x] Surface available passenger data on station hero cards beyond the initial showcase. Include 15-minute counts, selectable daily profiles, current markers, explicit source-area selectors, provenance and unavailable metrics. Load the catalogue and selected profile on demand, with retry and independent transfer budgets.
- [x] Distinguish autumn 2025 typical Friday demand from the 4 September 2026 timetable, and preserve the 05:00–05:00 source traffic day without wrapping Saturday's tail onto Friday morning.
- [ ] Add preceding-day demand for Friday before 05:00 after auditing the Thursday traffic-day tail.
- [ ] Add directional link loads and boarders/alighters where supported; do not infer origin–destination journeys or attach aggregate loads to individual trains as measured counts.
- [ ] Add an authored “Where does the morning go?” sequence with directional demand along selected tracks in geography and diagram layouts.
- [ ] Complete a physical-phone review of the passenger composition. Desktop Chromium and iPhone WebKit emulation are covered by the integration checks; those are separate from physical-device evidence.

**First milestone implemented:** visitors can compare Bank and Stratford, scrub the day and distinguish entry, exit and interchange rhythms. Other validated station selections expose their supported area profiles. The opening payload budget remains unchanged. Source details, matched/unmatched names, excluded metrics and reproduction live in All Change's `docs/PASSENGER-DEMAND.md` and `fixtures/passenger-demand/audit.json`.

### A1 — Departure boards and dismissible hero cards

- [x] Reuse the shared split-flap widget in TfL station hero cards and the National Rail panel, independently of passenger-demand availability. Retain arrivals/departures, service selection, movement seeking and pulse links.
- [x] Refine line/service labels, row limits, next-hour windows, line filters, long destinations, stable selection, accelerated playback and reduced motion for narrow cards.
- [x] Align boards with the selected study clock, source date and loaded window; distinguish loading, partial coverage, errors/retry, no calls and the study boundary.
- [x] Add top-right close controls and compact restore buttons that preserve map selection, playback and card state, including loading/error cards. Validate desktop and iPhone WebKit keyboard/touch flows.
- [ ] Combine relevant TfL and National Rail calls without duplicates, retaining repeated visits and passenger-call restrictions. The current cards keep these timetable scopes separate.
- [ ] Add platform and operational status fields only where supported; distinguish scheduled/predicted times, cancellations and freshness when live feeds are introduced.
- [ ] Complete shared widget-lab and physical-device review for mixed-operator, terminal and limited-data cases. Keep these reviews separate from the completed London browser integration checks.

**Delivery:** the passenger pulse, wider demand cards and departure-board foundation are implemented. Shared widget changes continue through the normal package release and edition upgrade path.

### B — Cycle hire and movement above ground

- [ ] Audit and compile one complete Santander cycle-hire day, matching the existing study date if available or presenting a separately dated study. Retain recorded start/end stations and times, source coverage and exclusions.
- [ ] Show dock-to-dock connections and net departures/returns to reveal short-distance circulation and neighbourhood imbalances. The records establish journey endpoints and duration, not actual street routes; label any routed reconstruction and do not imply all London cycling is represented.
- [ ] Investigate the City of London's pedestrian, wheeling and cycle surveys for a bounded Square Mile composition. Confirm access to detailed counts, survey times and locations; report repeated crossings as counts rather than unique people and leave unmeasured streets unfilled.
- [ ] Use published TfL bus speed, reliability and excess-waiting summaries to compare selected surface corridors. Keep reporting-period summaries separate from a particular day's motion; recorded observations are required before showing actual bus bunching or dated delays.

**Exit:** the study connects railway interchange to evidenced surface movement, with each source's geographic and temporal coverage visible.

### C — Distance, crossings and the city after midnight

- [ ] Build “How far away is this place, really?”: from a selected station, reveal 15-, 30- and 45-minute reachable areas and how they change with departure time. Start with existing timetables plus validated walking links and interchange times; audit routing completeness before making door-to-door claims. TfL WebCAT/TIM is a reference and potential source subject to access and reuse checks; PTAL measures access to transport, not destination travel times.
- [ ] Build “How does the Thames divide the city?” around selected crossings, comparing directional rail demand, scheduled buses, cycle-hire connections and pedestrian counts only where supported. Show differences in source dates and semantics; dock endpoints alone do not establish which bridge a cyclist used.
- [ ] Build “What stays connected after midnight?” from existing full-day services: last departures, remaining night routes and widening service gaps. Preserve originating service days across midnight and add passenger demand only for supported periods. This can proceed without acquiring a new feed.
- [ ] Assess PLA tidal information as a slower rhythm for the Thames composition after validating historical coverage, machine-readable access and reuse terms. Keep predicted tides, observed water levels and current direction distinct.
- [ ] Assess London Air Quality Network readings as optional environmental context on a matching day. Distinguish measured locations from modelled surfaces and do not infer traffic causation from coincident concentration changes.

### Source boundaries and delivery order

The GLA High Streets Data Service's richer partnership footfall tools are restricted to subscribed boroughs and Business Improvement Districts; public reports and boundaries do not establish a reusable citywide hourly feed. Census 2021 commuting flows reflect pandemic conditions and must not stand in for contemporary daily demand. Broader pedestrian, mobile-location or event-driven flow studies remain dependent on suitable evidence and reuse rights.

**Preferred sequence:** completed NUMBAT audit, Bank/Stratford passenger pulse and wider demand cards → one cycle-hire day → selected street/crossing studies and richer directional demand. Travel-time and after-midnight studies can build on existing timetable data after their routing and calendar checks. Continue Darwin as a separate live-operations phase after the first passenger-flow milestone.

**Completion standard:** each addition answers a specific question about London; preserves selection, clock and the geography/diagram relationship where applicable; exposes dates, provenance, missing coverage and scheduled/observed/modelled distinctions; loads optional data progressively; and passes relevant source, aggregation, accessibility, reduced-motion, payload and device checks. Record implementation, physical-device review and publication separately.

Reference sources for implementation audits: [TfL NUMBAT and open-data catalogue](https://tfl.gov.uk/info-for/open-data-users/our-open-data?intcmp=3671), [NUMBAT files](https://crowding.data.tfl.gov.uk/), [Santander journey files](https://cycling.data.tfl.gov.uk/), [City of London transport surveys](https://www.cityoflondon.gov.uk/services/streets/strategies-and-resources/transport-strategy), [TfL bus performance](https://tfl.gov.uk/corporate/publications-and-reports/buses-performance-data?intcmp=3089), [WebCAT](https://tfl.gov.uk/info-for/urban-planning-and-construction/planning-applications/planning-with-webcat?intcmp=25861), [PLA tidal information guide](https://pla.co.uk/sites/default/files/2024-04/PLA-%20Port-Information-Guide-2024.pdf), [London Air API](https://londonair.org.uk/LondonAir/API/), [GLA partnership access](https://data.london.gov.uk/high-street-data-service/hsds-partnership-data) and [ONS commuting-data limitations](https://blog.ons.gov.uk/2022/12/08/understanding-commuting-patterns-from-census-2021/).


## 10 — Catalogue programme

- [x] Fix the first four-work catalogue: 005 Gleislicht, 006 All Change, 007 Local / Express and 008 Correspondances.
- [x] Give New York and Paris distinct visual theses, signature studies and edition-level exit criteria.
- [x] Define admission criteria that prevent Motion Studies becoming one renderer with interchangeable bounding boxes.
- [x] Finish All Change's authored diagram overrides, interchange pulse studies and mobile frame-time gate.
- [x] Audit licensing, service-day semantics, identifiers, geometry and historical reproducibility for New York and Paris before ingesting complete feeds; keep New York unpublished while its application terms remain unresolved.
- [x] Prove one bounded New York local/express corridor through the current edition contract.
- [x] Turn that proof into an independent Local / Express entry point with Manhattan shoreline context, a lazy directional diagram, pattern isolation, search and a scheduled-overtake director.
- [x] Make the overtake director isolate both journeys, preserve local/express route identity and frame the completed order reversal.
- [x] Add an integrity-checked authored diagram layer for station rhythm, direction gaps, bends and schematic rivers.
- [x] Complete the 007 publication review and keep its page/data out of Pages until MTA clarifies transformation and application licensing.
- [x] Compile the bounded 007 service day into twelve lazy two-hour chunks while preserving the fast opening study.
- [x] Enforce a 390 KiB compressed first-view budget and desktop/iPhone browser gates for the New York foundation.
- [x] Use the third viable edition as the extraction trigger for private `@motionstudies/core`, `@motionstudies/three` and `@motionstudies/web` workspaces with real package imports.
- [x] Split shared packages and edition shells into repositories; publish coordinated npm releases after validating their public contracts and packed consumers.
- [ ] Hold further 007 Local / Express expansion and public release at the MTA licensing gate; retain its bounded proof as technical evidence.
- [x] Build 008 Correspondances through a Métro/RER opening study, a continuous centre–periphery scale study and three source-backed interchange compositions.
- [x] Give Correspondances an independent source-pinned shell, exact transfer evidence, official Seine/city context and a lazy 24-hour two-line study within a phone-first payload gate.
- [x] Extend Correspondances to an eight-line default and optional Métro 2/6 and 5/7 groups, retaining independent morning/day loading and the continuous Cœur/Région transition.
- [ ] Review the next bounded Paris Métro group against source, density and payload gates; obtain physical-phone and Windows Edge frame evidence before claiming performance on those devices.
- [x] Begin the source and feasibility audit for **NORIKAE — A Tokyo motion study**: separate the durable Toei proof, conditional Tokyo Metro path and Challenge 2026-only Yamanote/private-railway coverage.
- [x] Build NORIKAE's labelled synthetic player and offline GTFS audit/compiler against authored fixtures.
- [ ] Acquire and inspect the first Toei archive through authorized ODPT access, retain its terms and compile a real 07:00–09:00 loop-and-crossings proof; resolve the broader Metro/JR/private-operator publication and historical-use gates separately.
- [x] Begin San Francisco's source and feasibility audit: separate 511's strong historical/observed technical path from the unresolved 511/SFMTA public-artifact terms, and keep the title open until the vertical signature study is proven.
- [ ] Resolve 511 browser-artifact, historical-use and sublicensing terms with MTC and SFMTA, then compile a bounded 08:00–10:00 hills-to-Bay proof over DataSF terrain.
- [x] Begin Hong Kong's source and feasibility audit: separate exact ferry schedules, reconstructed surface headways, live MTR station forecasts and measured 3D station structure instead of presenting them as one kind of motion evidence.
- [ ] Compile a bounded 18:00–20:00 Victoria Harbour proof with exact Star Ferry departures, labelled headway-generated trams and structural-only MTR; keep the rail-led edition gated on an authoritative timetable or trajectory source.
- [x] Capture the wider city-thesis pipeline—without implying feasibility—for Istanbul, Mumbai, Venice, Amsterdam, Chicago, Singapore, Mexico City, Johannesburg, Sydney and Lisbon alongside the existing Tokyo, Hong Kong, Berlin and San Francisco candidates.
- [x] Complete source, rights, motion-semantics, geography and bounded-proof feasibility studies for all ten wider city candidates.
- [x] Complete Berlin's feasibility audit: verify VBB's current/archived schedule and realtime paths, distinguish replacement buses from same-named Ringbahn rail records, and isolate the remaining vertical-structure work.
- [x] Build Berlin's source-pinned scheduled proof, geographic-to-circulation transition and relative Ostkreuz interchange with official bridge and water context.
- [ ] Improve Berlin crossing performance, review physical devices, obtain measured rail elevations and complete the pending private preview approval; retain its unnumbered status until catalogue admission.
- [ ] Advance Venice after retaining its exact feed licence and Sydney after validating a matching historical export; retain Singapore, Lisbon, Amsterdam and Chicago behind their stated access, coverage or publication gates.
- [ ] Do not prototype Mumbai or Johannesburg until the missing authoritative movement evidence and, for Johannesburg, locally governed representation process exist.
- [x] Audit **MANIFEST — World trade in motion**: distinguish observed AIS movement from self-reported vessel data, inferred port-to-port voyages and aggregate commodity evidence; gate global individual tracks on written derived-publication rights.
- [x] Build MANIFEST's explicitly synthetic 60,000-vessel public prototype, progressive 30-day playback, port context and local 72-hour NOAA observation review.
- [ ] Secure MANIFEST's observed-data publication path and review one selected regional voyage; meet the production phone budget before treating the workload prototype as a finished edition.
- [ ] Acquire non-commercial hourly global vessel presence and compare identical commercial AIS evaluation slices at China/Gulf/choke-point coverage before global procurement. Prepared provider requests remain unsent.
- [ ] Keep every second-wave city and MANIFEST unnumbered until each has passed the catalogue admission test.

**Exit:** every announced edition has a local argument, a defensible source model, an authored signature image and an independent payload budget; shared packages exist because three real works proved the seam.

See [docs/CATALOGUE.md](./docs/CATALOGUE.md), [docs/NEW-YORK.md](./docs/NEW-YORK.md), [docs/PARIS.md](./docs/PARIS.md), [docs/TOKYO.md](./docs/TOKYO.md), [docs/SAN-FRANCISCO.md](./docs/SAN-FRANCISCO.md), [docs/HONG-KONG.md](./docs/HONG-KONG.md), [docs/ISTANBUL.md](./docs/ISTANBUL.md), [docs/MUMBAI.md](./docs/MUMBAI.md), [docs/VENICE.md](./docs/VENICE.md), [docs/AMSTERDAM.md](./docs/AMSTERDAM.md), [docs/CHICAGO.md](./docs/CHICAGO.md), [docs/SINGAPORE.md](./docs/SINGAPORE.md), [docs/MEXICO-CITY.md](./docs/MEXICO-CITY.md), [docs/JOHANNESBURG.md](./docs/JOHANNESBURG.md), [docs/SYDNEY.md](./docs/SYDNEY.md), [docs/LISBON.md](./docs/LISBON.md), [docs/BERLIN.md](./docs/BERLIN.md) and [docs/MANIFEST.md](./docs/MANIFEST.md).

## Data sources to validate in implementation

- [Swiss GTFS Static cookbook](https://opentransportdata.swiss/en/cookbook/timetable-cookbook/gtfs/) and the current timetable-year dataset
- [Swiss GTFS Realtime cookbook](https://opentransportdata.swiss/en/cookbook/realtime-prediction-cookbook/gtfs-rt/) and paired GTFS-RT dataset
- [swissALTIRegio](https://www.swisstopo.admin.ch/en/height-model-swissaltiregio) for wide-area terrain, [swissALTI3D](https://www.swisstopo.admin.ch/en/height-model-swissalti3d) for tighter future crops, plus the applicable [open-geodata terms](https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices)
- [swissBOUNDARIES3D](https://www.swisstopo.admin.ch/en/landscape-model-swissboundaries3d) for the national outline
- [FOEN Swiss hydrographic network](https://www.bafu.admin.ch/en/the-swiss-hydrographic-network) for named lake surfaces
- [Federal Office of Transport rail network](https://map.geo.admin.ch/#/map?lang=en&center=2660000,1190000&z=1&topic=ech&layers=ch.bav.schienennetz) for national infrastructure geometry
- [SBB railway tunnels](https://data.sbb.ch/explore/dataset/tunnel/) for named tunnel portals and published lengths on measured rail journeys
- [ZVV/VBZ tram and bus GTFS](https://data.stadt-zuerich.ch/dataset/vbz_fahrplandaten_gtfs) for shape-aware Zürich regional geometry
- [ZVV network plans](https://www.zvv.ch/en/timetable-and-information/network.html) for regional information hierarchy, not as geographic source data
- [TPG line geometry from SITG](https://sitg.ge.ch/donnees/tpg-lignes) for Genève tram, trolleybus and bus paths, including cross-border branches
- [Kiental–Griesalp route 220](https://www.postauto.ch/en/leisure-offers/excursion-tips/kiental-griesalp-route) for the first measured rural PostBus and terrain study
- [ADSB.lol historical data](https://www.adsb.lol/docs/open-data/historical/) for the optional observed-aircraft study, distributed under ODbL 1.0
- [ASTRA / FEDRO road traffic counters](https://opentransportdata.swiss/en/cookbook/road-traffic-cookbook/rt-road-traffic-counters/) and the [Measurement Site Table](https://data.opentransportdata.swiss/en/dataset/trafficcounters) for directional aggregate flow, speed and detector geography

## Early technical decisions

- Preprocess large source datasets in Node; serve small versioned binary/JSON assets to the client.
- Keep schedule/realtime/topography adapters independent of the renderer.
- Treat source timestamps, coordinate reference systems and attribution as data, not prose added at the end.
- Prefer a few measured levels of detail over runtime-heavy general GIS machinery.
- Keep the visual client statically deployable; add a minimal server component only for secrets and realtime polling.
