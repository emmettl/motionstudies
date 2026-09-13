# Roadmap

[Project goals](docs/VISION.md) · [Study index](docs/README.md) · [Catalogue programme](docs/CATALOGUE.md)

## Current delivery position — 13 September 2026

The [study-status register](docs/STUDY-STATUS.md) reconciles nine edition checkouts with public release metadata. All inspected editions consume exact alpha.9 packages; deployment is tracked separately from local source. The older dated milestones below remain history, not a current release inventory.

- **Gleislicht:** original scope accepted; national PostBus, station departures and prepared two-day timetable releases now implemented. Latest committed and uncommitted interface work is ahead of the served revision.
- **All Change:** full bus-catalogue artifact implemented with audited gaps, alongside London National Rail, combined boards, Eurostar, passenger-demand/link-flow studies, four cycle-hire days and early-Friday after-midnight coverage. Current source revision is served.
- **Correspondances:** complete Métro/RER, nine Transilien lines and T3a/T3b now provide 32 selectable lines and 17,088 daily journeys, retaining the eight-line default. Served revision precedes the latest package upgrade.
- **Umlauf:** source and study public; inspected alpha.9 revision served. Measured absolute heights, device evidence and catalogue admission remain open.
- **Local / Express and NORIKAE:** parked at the author’s request on 13 September. Existing implementations and source questions are retained; development, acquisition and provider follow-up are paused. Local / Express keeps number 007 and its private proof; NORIKAE remains an unnumbered synthetic preview.
- **MANIFEST:** software has advanced to alpha.9; observed-data publication review remains a separate gate.
- **Underfall / Bristol:** local buses, rail/air, tides, bounded recording/replay and M32 detector study now have a [central brief](docs/BRISTOL.md). A full weekday recording remains to be acquired.
- **Zugunruhe:** radar altitude, archipelago and continental-field studies now have a [central brief](docs/ZUGUNRUHE.md). The latest three-night increment is ahead of the served release.

The [national-study thesis](docs/NATIONAL-STUDY.md) and [technical feasibility research](docs/NATIONAL-DATA-FEASIBILITY.md) are research artifacts. London's reusable data tooling and the other studies' evidence practices give that proposal a stronger starting point; no national edition has been implemented by this update.

## Repository milestone — 7 September 2026

- [x] Move shared packages, the widget lab and catalogue into Motion Studies.
- [x] Publish all four coordinated npm packages and verify trusted publishing.
- [x] Move each edition into its own repository with exact package pins and independent checks.
- [x] Publish Gleislicht, All Change and Correspondances on their own Pages sites; retain the private Local / Express proof and its publication hold.
- [x] Centralise city briefs, programme goals and this roadmap in Motion Studies.

The stages below retain the delivery history from the first Swiss study through the wider catalogue. Future work follows the source and publication gates in each brief; no calendar dates are implied.

## Gleislicht delivery update — 9 September 2026

The Swiss edition has fulfilled the original atlas, terrain, regional/city, sound,
language, aircraft and measured-road brief. Its public home is
[https://motionstudies.app/gleislicht/](https://motionstudies.app/gleislicht/);
GitHub Pages remains the validated artifact source and a public mirror.
National AUTO already includes all 1,440 minutes of 8 September. Daily private
road archiving is implemented separately from curated browser publication.

Physical-device performance review is complete by owner acceptance: iPhone 17 Pro
satisfactory, Fairphone 6 acceptable, the main Mac described as perfect and
MacBook Neo smooth. Remaining Windows laptop limitations are accepted; substantial
further optimisation is deferred. These are qualitative reports, not a measured
benchmark of every study. Earlier Swiss device-review requests below are historical
notes and do not remain release blockers.

At this milestone, the realtime poller and credentials were provisioned and its
static-feed declaration was corrected to `20260905`. The later prepared two-day
release/calendar work supersedes that manually pinned arrangement. LIVE releases
still require matching identities, dates/versions and a fresh health check. Service
alerts remain a separate increment. See the edition's
[current operations record](https://github.com/emmettl/gleislicht/blob/main/docs/REALTIME.md)
and [release provenance](https://motionstudies.app/gleislicht/_release.json) for
verification of the deployed release rather than assuming repository HEAD is live.

Luzern, Zug, Thurgau and Fribourg join the existing selectable regions. Aargau's
222 flagged directed bus pairs and St Gallen's vector redistribution restrictions
remain release gates. Eleven additional cantons have scoped opportunities;
further coverage is optional expansion, not unfinished original scope. Seasonal,
geometry and data-source exclusions still apply. The detailed stage notes below
retain delivery history; current regional decisions live in
[the edition integration record](https://github.com/emmettl/gleislicht/blob/main/docs/REGIONAL-FEED-INTEGRATION.md).

## Historical delivery position — 7 September 2026

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
- [x] Provision the poller secret and URL and generate current-day static artifacts; gate default LIVE on a fresh, exactly matching feed/date. The September 9 feed-version correction and release verification are recorded in the edition operations guide.
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
- [x] Complete release-level phone review by owner acceptance on iPhone 17 Pro and Fairphone 6. Full-day historical aircraft playback is implemented; live aircraft polling is a separate optional expansion.

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
- [x] Record authenticated one-minute snapshots and publish all 1,440 minutes of 8 September across the accepted national-road topology; retain calibration as the disclosed fallback.
- [x] Accept release-level phone performance; the recorded national full day is implemented. No separate per-road device benchmark is claimed.

**Exit:** the three layers remain visually and methodologically distinct: scheduled rail journeys, observed aircraft trajectories and synthetic traffic reconstructed from aggregate measurement.

See [docs/AUTO.md](https://github.com/emmettl/gleislicht/blob/main/docs/AUTO.md) for the data contract, reconstruction and recording path.

## 8A — Gleislicht: regional depth, lakes and mountain railways

Expansion plan and delivery history — initially 8 September 2026. The September 9 delivery update above supersedes stale device-review and publication assumptions in the historical notes. Build towards a richly explorable Switzerland: each new place should have a recognisable transport character, credible motion and a satisfying journey from overview to detail. The phases below give a preferred sequence, not calendar commitments. Existing completed milestones remain the foundation; unchecked items are future work.

### Starting evidence

Dedicated selectable studies now include Zürich city, ZVV, Genève/TPG, Lausanne, Basel, Bern, Solothurn, Nyon, Ticino, Valais, Graubünden, Riviera, Luzern, Zug, Thurgau and Fribourg. ZVV, Genève and Zürich city have progressively loaded full days alongside their morning views. National rail and nationwide PostBus provide broader coverage but do not establish complete cantonal multimodal coverage. Regional source inventories retain explicit admission/exclusion accounting.

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
- [x] Add a **selectable Rigi connections guide** showing both railway approaches through Staffel to Kulm, lake piers, the Weggis valley/cableway and distinct Kaltbad interchanges. Eleven source-identified stops select their map services without changing time or playback; twelve evidence-backed schematic links distinguish transport from walking interchanges. The optional EN / DE / FR / IT dialog supports keyboard navigation, Escape and focus return, with desktop/emulated-iPhone checks. Intermediate stops are omitted and schematic lines do not claim geographic, walking or track geometry. See [connection evidence](https://github.com/emmettl/gleislicht/blob/main/docs/RIGI-STUDY.md#selectable-rigi-connections).
- [ ] Join credible water routes, railway alignments and cableway paths; use explicit mode-appropriate fallbacks. Boat routes must stay on navigable water and must not inherit rail/road shoreline detours.
- [x] Deliver the first measured **Vitznau–Rigi Kulm ascent**: 6.8 km of mapped FOT rail, nine timetable stops, native 10 m swissALTIRegio ground samples, lake context, a compact cogwheel vehicle and a scrubbable elevation profile. The 81.8 KiB terrain artifact loads on entry; desktop/emulated-iPhone checks cover the profile, source-run selection and failure recovery. Ground beneath the railway is explicitly distinguished from surveyed track heights; playback is scenic. See [terrain evidence and reproduction](https://github.com/emmettl/gleislicht/blob/main/docs/RIGI-TERRAIN.md).
- [x] Add the **Arth-Goldau RB–Rigi Kulm ascent** alongside Vitznau: 8.5 km of mapped railway, eight source stops, a native-ground profile and southern Lake Zug context. Each approach loads separately, retains its own selected-service timetable and reaches the shared Rigi Staffel/Kulm stops. The Arth-Goldau terrain is 63.0 KiB gzip; both approaches pass desktop/emulated-iPhone entry, profile, switching and failure checks.
- [ ] Source credible rail-height/tunnel details and complete physical-device review of both measured Rigi ascents.
- [x] Deliver the first **Luzern boat → Vitznau interchange → Rigi Kulm cogwheel** sequence on the shared map clock: ten daytime pairs, a six-minute scheduled interchange, departure choice, reversible scrubbing and automatic service handoff. The retained GTFS rule gives a 60-second minimum; the operator describes a 50 m walk. Vitznau uses one shared source timetable stop, without an invented walking animation or guaranteed connection. Code, styling and evidence load on entry. See [sequence evidence and reproduction](https://github.com/emmettl/gleislicht/blob/main/docs/RIGI-STUDY.md#first-lake-to-summit-sequence).
- [x] Add the alternate **Luzern → Weggis → Rigi Kaltbad cableway → Rigi Kulm cogwheel** sequence: ten daytime chains on the shared clock, exact intermediate railway boarding and reversible handoffs across five stages. Retain the directional 20-minute uphill Weggis rule (15 minutes in reverse) and five-minute Kaltbad rule. The default journey honestly includes 47- and 45-minute walk/wait intervals; stage controls skip ahead. Walking geometry and vertical cable behaviour are not invented.
- [x] Connect both ascent sequences to **measured terrain on the same timetable clock**. Enter/leave terrain without resetting the selected service, time or playback rate; interpolate between mapped station fractions with scheduled dwell holds. The Weggis sequence enters the railway at Kaltbad. Scrubbing into another mode restores the map, summit arrival pauses playback, and failed or incompatible terrain leaves a retryable map view. Independent scenic ascents remain available.
- [ ] Validate pedestrian geometry and additional interchanges before extending the chain; source surveyed track/tunnel details before claiming vertical railway accuracy.
- [x] Make the dated Rigi **day rhythm and quiet periods** explorable: separate activity bands for boats, both railway approaches and the cableway; next-origin-departure jumps; scheduled dwell-aware counts; early partial Vitznau services; explicit 24:00 study boundary and return to first departure. All 190 trips reconcile, code loads on entry, and desktop/emulated-iPhone checks pass. See [day rhythm evidence](https://github.com/emmettl/gleislicht/blob/main/docs/RIGI-STUDY.md#quiet-periods-and-the-day-rhythm).
- [ ] Add audited operating-date comparisons and seasonal non-operation; quiet gaps in the current 4 September fixture do not establish closures on other dates.

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

- [x] Deliver the first separately loaded **Jungfrau full-day 2D map**: BOB valley branches, Wengernalpbahn, Jungfraubahn and Eiger Express, with 1,563 source timetable records and 46 stops. All 2,564 segment occurrences have mapped FOT paths after guarded Matten/Terminal projections and Interlaken platform resolution. Exact Eiger Express installation 75.014 retains disclosed 213 m / 136 m shared-stop offsets; timetable records do not claim tracked cabins. The 48.4 KiB optional artifact includes search, mode filters, approach entry points, dated links, retry and EN / DE / FR / IT disclosures. Desktop/emulated-iPhone checks pass; physical-device review and publication remain separate. See [Jungfrau evidence and reproduction](https://github.com/emmettl/gleislicht/blob/main/docs/JUNGFRAU-STUDY.md).
- [x] Add the Jungfrau approach guide and first dated ascent via Lauterbrunnen/Wengen: three selectable approach diagrams and 17 three-train compositions reconciled to 69 upward source trips. Preserve both timetable waits, distinguish the editorial Lauterbrunnen allowance from the Kleine Scheidegg GTFS minimum plus advance boarding lead, and support shared-clock following, replay, arrival pause and manual-selection exit in four languages. Retain source evidence and desktop/iPhone browser checks in Gleislicht.
- [x] Add optional measured outdoor terrain to all 17 Wengen ascent compositions: swissALTIRegio landscape with separately sourced swissTLM3D rail elevations at equal horizontal/vertical scale. Source structure classes and alignment-offset gates keep tunnels, galleries, covered sections and uncertain matches on the map, preserving the shared clock, dwells and transfer waits. Retain reproducible source hashes, station-height comparisons, four-language disclosures, retry and compact phone controls; the 108.7 KiB terrain artifact loads only on request. Physical-device review remains separate.
- [ ] Audit Grindelwald and Eiger Express ascent compositions, cabin behaviour, additional branches and operating dates separately before expanding Jungfrau playback or adding further 3D motion.
- [x] Add the first Gornergrat full-day 2D study and dated summit ascent: 54 exact-source services, seven stops and all 281 segment occurrences mapped; 26 public summit departures retain actual calls, including the additional stop on selected services. Preserve the shorter Riffelalp workings on the map, shared-clock following, station seeking, arrival pause, replay, source checks, retry, dated links and four-language controls. The optional map is 4.2 KiB gzip. See [Gornergrat evidence](https://github.com/emmettl/gleislicht/blob/main/docs/GORNERGRAT-STUDY.md).
- [x] Add optional measured outdoor terrain to all 26 Gornergrat summit ascents: audit actual swissTLM3D railway XYZ against both six- and seven-call patterns; combine it with a 44 m swissALTIRegio landscape at equal horizontal/vertical scale. Four conservative tunnel/gallery masks retain map playback through covered sections; clock continuity, exact calls, station seeks, arrival pause, replay, four-language evidence, compact phone controls and failure retry remain available. The 78.0 KiB terrain artifact loads only on request and shares the tested outdoor renderer with Jungfrau. Physical-device review remains separate.
- [x] Add all 26 dated Gornergrat descents to the journey selector, preserving actual downhill calls, direction changes, station seeks, replay and arrival pause. Independently verify every descent against the reversed source XYZ railway and structure classes; reuse measured terrain only for explicitly audited downhill trip IDs. Six/seven-call patterns, tunnel/gallery map transitions and older-artifact retry remain supported in four languages. The shared terrain artifact is 78.1 KiB gzip.
- [ ] Audit further Gornergrat operating dates and seasonal variation separately.
- [x] Add the dedicated Pilatus cogwheel day and playable journeys in both directions: 34 source-reconciled trains, three stops and all 68 segment occurrences mapped on FOT geometry. Preserve exact downhill/uphill calls, departure selection, station seeks, arrival pause, replay, request retry and dated links in four languages. Explain the operator’s Ämsigen request-stop qualification separately from ordinary GTFS flags. The optional 2D map is 2.1 KiB gzip.
- [x] Add optional measured outdoor terrain to all 34 dated Pilatus journeys in both directions: independently audit 299 railway XYZ samples against the pinned complete swissTLM3D extract, require explicit uphill/downhill trip identities, and preserve all three source calls. Four conservative tunnel/covered masks continue on the map with clock continuity; the approximately 36 m swissALTIRegio landscape uses equal horizontal/vertical scale. The 62.2 KiB optional artifact supports source evidence, compact phone controls, direction changes, station seeks, arrival pause, replay and failure retry. Desktop/iPhone browser checks pass; physical-device review remains separate.
- [ ] Assess Pilatus Kriens cableways, connecting boats and further operating dates separately.
- [x] Add the dedicated Rochers-de-Naye day and summit journeys in both directions: 37 source-reconciled R37 services, 16 stops and all 452 scheduled segment occurrences mapped. A pinned FOT MVR alignment repairs the Montreux/intermediate-station mismatch without altering GTFS calls or inventing connecting lines. Ten complete departures each way retain actual dwell times, direction changes, station seeks, arrival pause, replay, retry and dated links in four languages; 17 shorter workings remain on the day map. The optional 2D map is 5.8 KiB gzip. Preserve source route type 106 separately from the operator’s cogwheel classification, and distinguish the imported date from later works and winter restrictions. See [Rochers-de-Naye evidence](https://github.com/emmettl/gleislicht/blob/main/docs/ROCHERS-STUDY.md).
- [x] Add optional measured outdoor terrain to all 20 complete Rochers-de-Naye summit journeys in both directions: independently audit 728 railway XYZ samples against the pinned complete swissTLM3D extract and retain explicit uphill/downhill trip identities and all 16 actual calls. Twelve conservative tunnel/gallery/underpass masks continue on the map with clock continuity; the approximately 42 m swissALTIRegio landscape uses equal horizontal/vertical scale. The 69.2 KiB optional artifact preserves direction changes, source dwells, station seeking, arrival pause, replay, four-language evidence, compact phone controls and failure retry. Desktop/iPhone browser checks pass; physical-device review remains separate.
- [ ] Assess further Rochers-de-Naye operating dates and seasonal variation separately.
- [x] Add a dated Territet–Glion funicular study: 140 source-reconciled services, 70 each way, with all three original stops and 280 scheduled segment occurrences mapped on pinned FOT installation 61.046. Preserve the different uphill/downhill Collonge times, 70-departure selectors, station seeking, arrival pause, replay, retry, dated links and four-language compact phone controls. The optional map is approximately 4.6 KiB gzip; its 2D centreline does not claim passing-loop track assignment or cable mechanics. See [Territet–Glion evidence](https://github.com/emmettl/gleislicht/blob/main/docs/TERRITET-STUDY.md).
- [x] Audit the distinct Glion funicular/railway interchange: the pinned GTFS explicitly supplies 60-second minimums in both directions; all ten summit ascents and ten descents have qualifying funicular connections with original calls and boarding flags preserved. Closest pairs allow 4 minutes uphill (13 for the first) and 9 downhill. Retain separate stop families and distinguish scheduled intervals from waiting guarantees; no walking geometry is supplied. See [Glion interchange evidence](https://github.com/emmettl/gleislicht/blob/main/docs/GLION-INTERCHANGE.md).
- [x] Add combined Territet–Glion–Rochers-de-Naye playback in both directions: ten checked pairs each way retain two vehicle IDs, 15 source stop entries and 13 mapped segments, with a separate Glion interchange phase and no invented walking edge. Preserve actual dwells, departure selection, station seeking, arrival pause, replay, retry, exact dated links and four-language compact phone controls. Source minimums and operator access context remain visible in the journey evidence; desktop/iPhone checks pass.
- [x] Reuse measured Rochers terrain within all 20 combined railway legs: validate the complete original train and its directional terrain authorisation, retain the 12 Glion–summit calls, and clip outdoor windows to the actual railway endpoints without changing XYZ progress or masks. Funicular travel, the Glion interchange and covered railway sections continue on the shared map clock. Optional loading, retry, elevation/source evidence, direction changes, seeking, replay and station inspection pass desktop/iPhone checks; physical-device review remains separate.
- [x] Audit measured Territet–Glion funicular geometry: retain 12 pinned swissTLM3D features and both complete XYZ passing-loop alternatives; check exact graph joins, all three station attachments (maximum 3.4 m), FOT corridor consistency and conservative map-fallback intervals for all 140 dated services. Preserve source structure/date evidence and leave vehicle branch assignment unresolved. See [measured funicular geometry evidence](https://github.com/emmettl/gleislicht/blob/main/docs/TERRITET-TERRAIN.md).
- [x] Add optional standalone Territet–Glion terrain for all 140 dated services: checksum-verified 2 m swissALTI3D tiles provide a 5 m landscape; original XYZ rail heights and both loop branches remain preserved. Conservative map fallbacks cover the unresolved passing loop and rail/ground discrepancies. Directional bindings, exact Collonge calls, retry, seeking, toggles, arrival pause, replay and compact four-language controls pass 34 focused tests and 16 desktop/iPhone browser cases, including existing Glion/Rochers regressions. Optional terrain is 94.0 KiB gzip; physical-device review remains separate.
- [x] Reuse both measured terrain sources in all 20 combined Territet–Glion–Rochers journeys: retain the funicular’s 5 m grid, both loop branches and clearance masks, and the railway’s original 42 m grid, progress and tunnel/gallery masks. Switch bindings only during the active vehicle leg; the Glion interchange stays on the map. Independent opt-in loading, caching and retry keep a failed asset from disabling the other leg. Source-specific evidence, both directions, shared links, seeking, replay and cleanup pass 26 focused tests and 18 desktop/iPhone browser cases. No new raster or geometry is introduced; physical-device review remains separate.
- [ ] Investigate other funicular operating dates separately.
- [ ] Assess an Albula/Bernina journey within the Graubünden study, preserving credible curves, elevation, tunnels and international extent where supported.
- [ ] Expand boat studies beyond Rigi to selected Lake Geneva, Lake Zürich and Ticino networks after auditing schedules, water geometry and seasonality.
- [ ] Add a city–lake–mountain comparison on a shared service date and clock, extending the existing urban–rural contrast with distinct daily rhythms.

**Exit:** the additional studies introduce meaningful differences in motion, terrain or connections; each is an independently satisfying experience with validated sources.

### E — Make the growing collection feel complete

- [x] Expand existing ZVV, Genève and Zürich city multimodal studies to complete service days, retaining their lightweight opening views.
- [ ] Add reproducible weekday/weekend and summer/winter selections using actual service calendars and independently versioned artifacts. Keep comparisons explicit when dates or observation sources differ.
- [x] Introduce a study browser with places and experiences, translated names/descriptions, available date and time controls, and independently loaded study data.
- [ ] Preserve orientation, selection and clock deliberately when moving between national, regional and journey views; explain unavailable times rather than silently substituting a different day.
- [x] Add shareable study links carrying the selected place, service date, time and supported focus state, with useful fallbacks when an artifact is unavailable.
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
- [x] Compile and validate the full TfL bus-catalogue artifact with service-day semantics and progressive payloads: 103,117 journeys across 670 active routes, with explicit remaining branch/coverage gaps.
- [ ] Resolve the remaining audited bus gaps before making a complete-network claim.

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
- [x] Add Friday 00:00–05:00 demand for all 432 supported areas from the audited NUMBAT 2025 Tuesday–Thursday workbook’s Thursday tail. Independently loaded profiles, explicit day-type labels, source hashes and 05:00 boundaries are shared by station cards and Bank/Stratford pulses. See All Change’s `docs/PASSENGER-DEMAND.md`.
- [x] Add the first directional link loads and boarders/alighters on the Central line between St Paul’s and Leyton: 12 directional links, seven stations and 40 independently reconciled NUMBAT source rows. Do not infer origin–destination journeys, sum adjacent links as unique people, or attach aggregate loads to individual trains. Additional corridors remain future work.
- [x] Add “Where does the morning go?” through the People control, with 07:30/08:30/17:30 chapters, a fixed dot scale, selected-station boarding/alighting, shared playback and geography/diagram continuity. The first Central line study loads independently within the unchanged opening budget. Source joins and validation are recorded in All Change’s `docs/MORNING-FLOW.md`; physical-device review and publication remain separate.
- [ ] Complete a physical-phone review of the passenger composition. Desktop Chromium and iPhone WebKit emulation are covered by the integration checks; those are separate from physical-device evidence.

**First milestone implemented:** visitors can compare Bank and Stratford, scrub the day and distinguish entry, exit and interchange rhythms. Other validated station selections expose their supported area profiles. The opening payload budget remains unchanged. Source details, matched/unmatched names, excluded metrics and reproduction live in All Change's `docs/PASSENGER-DEMAND.md` and `fixtures/passenger-demand/audit.json`.

### A1 — Departure boards and dismissible hero cards

- [x] Reuse the shared split-flap widget in TfL station hero cards and the National Rail panel, independently of passenger-demand availability. Retain arrivals/departures, service selection, movement seeking and pulse links.
- [x] Refine line/service labels, row limits, next-hour windows, line filters, long destinations, stable selection, accelerated playback and reduced motion for narrow cards.
- [x] Align boards with the selected study clock, source date and loaded window; distinguish loading, partial coverage, errors/retry, no calls and the study boundary.
- [x] Add top-right close controls and compact restore buttons that preserve map selection, playback and card state, including loading/error cards. Validate desktop and iPhone WebKit keyboard/touch flows.
- [x] Combine TfL and National Rail calls at Stratford, Liverpool Street and Clapham Junction through either station entry point. Audited source IDs, service ownership and visit identities preserve repeated visits and passenger-call restrictions. Each source retains its loaded time range and independent retry; movement selection reaches the correct renderer. The board loads on selection within the unchanged opening budget. See All Change's `docs/COMBINED-STATION-BOARDS.md` for identities, source-call reconciliation and desktop/iPhone browser checks.
- [x] Extend combined boards to Paddington, Waterloo, Victoria, London Bridge and Euston after auditing source identities and full-day calls. Include Paddington’s Hammersmith & City area and Elizabeth line aliases; keep Waterloo East, Euston Square and Royal Victoria separate. Reconcile the eight interchanges using committed delivery artifacts, and compare both entry points in desktop/iPhone browser checks.
- [x] Add separate King’s Cross, St Pancras domestic mainline/high-speed and St Pancras Thameslink boards. The shared Tube hero offers an explicit rail-area selector; exact rail entries retain their own source IDs. Area changes preserve the station and clock, dismissal preserves the area, and movement seeking opens the selected rail service. Document shared Tube counts and the separate international scope.
- [x] Add a separate St Pancras Eurostar board using the retained 4 September 2026 official GTFS archive (Open Licence 2.0). Reconcile 55 public calls, agency-to-London timezone conversion and UIC station identity; show 40 uniquely matched London HS1 movements with the existing boundary fade, and label 15 other services timetable only. Preserve arrivals/departures, public service numbers, independent retry, dismissal and mobile behavior; distinguish departure from boarding/check-in guidance. See All Change’s `docs/EUROSTAR.md` for provenance and per-service audit.
- [ ] Extend Eurostar movement coverage only when a dated authoritative London timing source resolves the 15 unmatched or conflicting services; retain the published passenger times and explicit source limits.
- [ ] Audit further combined interchanges before extending the source join; keep distinct terminals and source areas explicit.
- [ ] Add platform and operational status fields only where supported; distinguish scheduled/predicted times, cancellations and freshness when live feeds are introduced.
- [ ] Complete shared widget-lab and physical-device review for mixed-operator, terminal and limited-data cases. Keep these reviews separate from the completed London browser integration checks.

**Delivery:** the passenger pulse, wider demand cards and departure-board foundation are implemented. Shared widget changes continue through the normal package release and edition upgrade path.

### B — Cycle hire and movement above ground

- [x] Audit and compile Friday **29 May 2026**, the latest complete Friday in the published cycle-hire extract as of 8 September. The matching September date is unavailable. Retain pinned source hashes, a frozen station-coordinate snapshot, endpoint identities, minute timestamps and explicit exclusions: 31,247 included journeys across 792 matched docks.
- [x] Show a separately dated cycle-hire replay with straight dock connections, departures/returns, net balance and daily dock profiles. Add shared-clock morning/evening comparison, keyboard/map dock selection, zoom, dismissible hero cards, reduced motion and nearby rail-interchange context. Connections are schematic and net returns do not imply bike availability.
- [x] Add a weekday/weekend cycle-hire selector comparing Thursday 28, Friday 29, Saturday 30 and Sunday 31 May 2026. All four dates are independently audited and loaded on demand. Switching days pauses playback and preserves time, validated dock selection, zoom and card dismissal; map bounds and profile scales stay fixed across dates. A selected dock without included records remains selected with unavailable counts. Source identities, exclusions, midnight carry-in/out, reproducible artifacts and eight desktop/mobile browser checks are documented in All Change’s `docs/CYCLE-HIRE.md`.
- [ ] Complete physical-phone review of the cycle view. Desktop Chromium and iPhone WebKit checks cover interaction and payload budgets separately from physical-device evidence.
- [x] Add guided dock comparisons at Waterloo Station 3, Queen Street 1 (Bank) and Hyde Park Corner, with dated morning/evening and weekday/weekend evidence. Every validated dock offers four profiles on its fixed scale, independently loaded from small per-dock artifacts. Preserve the clock when selecting a comparison day, retain unavailable coverage and provide dismissible desktop/mobile cards. All 792 profiles reconcile against the audited journeys; authored claims and twelve browser checks are documented in All Change’s `docs/CYCLE-HIRE.md`.
- [ ] Recover historical coordinates for unmatched/reused dock identities, and audit a matching September journey day when published. Extend dock examples to neighbourhood aggregates after defining and auditing their coverage.
- [ ] Investigate the City of London's pedestrian, wheeling and cycle surveys for a bounded Square Mile composition. Confirm access to detailed counts, survey times and locations; report repeated crossings as counts rather than unique people and leave unmeasured streets unfilled.
- [ ] Use published TfL bus speed, reliability and excess-waiting summaries to compare selected surface corridors. Keep reporting-period summaries separate from a particular day's motion; recorded observations are required before showing actual bus bunching or dated delays.

**Exit:** the study connects railway interchange to evidenced surface movement, with each source's geographic and temporal coverage visible.

### C — Distance, crossings and the city after midnight

- [ ] Build “How far away is this place, really?”: from a selected station, reveal 15-, 30- and 45-minute reachable areas and how they change with departure time. Start with existing timetables plus validated walking links and interchange times; audit routing completeness before making door-to-door claims. TfL WebCAT/TIM is a reference and potential source subject to access and reuse checks; PTAL measures access to transport, not destination travel times.
- [ ] Build “How does the Thames divide the city?” around selected crossings, comparing directional rail demand, scheduled buses, cycle-hire connections and pedestrian counts only where supported. Show differences in source dates and semantics; dock endpoints alone do not establish which bridge a cyclist used.
- [x] Add the first “What stays connected after midnight?” preset for Thursday night into Friday 4 September, 00:00–05:00. Use existing scheduled rail and bus data, 00:30/02:30/04:30 checkpoints, Waterloo/Bank/Upminster comparisons and station context with next/previous retained rail departures beyond the active map chunk. Bound seeking and playback, preserve dismissal and distinguish timetable gaps from absent service. Audit Thursday bus/WTT carry-in, label the incomplete Thursday TfL rail tail, and omit unsupported pre-05:00 passenger demand. See All Change’s `docs/AFTER-MIDNIGHT.md` for source hashes, coverage and desktop/iPhone checks.
- [x] Establish the Thursday TfL rail tail within the audited recurring API and shared-weekday PDF scope: 493 additional journeys, including 302 crossing midnight, after the Elizabeth line source correction. Preserve the reviewed Friday daytime chunks and opening study; retain source branch exclusions and qualified gap wording. Thursday NUMBAT demand is now available separately. See All Change’s `docs/AFTER-MIDNIGHT.md`.
- [ ] Complete Friday-night/Saturday coverage after the separate API audit: the captured Piccadilly responses omit Friday/Saturday schedules, and Saturday PDF branches, buses and mainline service still need a combined calendar audit. Keep physical-phone review separate from browser emulation.
- [ ] Assess PLA tidal information as a slower rhythm for the Thames composition after validating historical coverage, machine-readable access and reuse terms. Keep predicted tides, observed water levels and current direction distinct.
- [ ] Assess London Air Quality Network readings as optional environmental context on a matching day. Distinguish measured locations from modelled surfaces and do not infer traffic causation from coincident concentration changes.

### Source boundaries and delivery order

The GLA High Streets Data Service's richer partnership footfall tools are restricted to subscribed boroughs and Business Improvement Districts; public reports and boundaries do not establish a reusable citywide hourly feed. Census 2021 commuting flows reflect pandemic conditions and must not stand in for contemporary daily demand. Broader pedestrian, mobile-location or event-driven flow studies remain dependent on suitable evidence and reuse rights.

**Preferred sequence:** completed NUMBAT audit, Bank/Stratford passenger pulse, wider demand cards and one audited cycle-hire day → selected street/crossing studies, authored neighbourhood comparisons and richer directional demand. Travel-time and after-midnight studies can build on existing timetable data after their routing and calendar checks. Continue Darwin as a separate live-operations phase after the first passenger-flow milestone.

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
- **Parked:** 007 Local / Express development and publication follow-up; retain the private proof and MTA question for a possible return.
- [x] Build 008 Correspondances through a Métro/RER opening study, a continuous centre–periphery scale study and three source-backed interchange compositions.
- [x] Give Correspondances an independent source-pinned shell, exact transfer evidence, official Seine/city context and a lazy 24-hour two-line study within a phone-first payload gate.
- [x] Extend Correspondances to an eight-line default and optional Métro 2/6 and 5/7 groups, retaining independent morning/day loading and the continuous Cœur/Région transition.
- [x] Complete all sixteen Paris Métro lines and five RER lines, then add nine Transilien lines and T3a/T3b through independent source-audited layers; retain the eight-line default.
- [ ] Obtain physical-phone and Windows Edge frame evidence for the expanded Paris study before claiming performance on those devices.
- [x] Begin the source and feasibility audit for **NORIKAE — A Tokyo motion study**: separate the durable Toei proof, conditional Tokyo Metro path and Challenge 2026-only Yamanote/private-railway coverage.
- [x] Build NORIKAE's labelled synthetic player and offline GTFS audit/compiler against authored fixtures.
- **Parked:** NORIKAE development, first Toei acquisition and broader operator follow-up. Retain the synthetic proof and source-gate checklist for a possible return.
- [x] Begin San Francisco's source and feasibility audit: separate 511's strong historical/observed technical path from the unresolved 511/SFMTA public-artifact terms, and keep the title open until the vertical signature study is proven.
- [ ] Resolve 511 browser-artifact, historical-use and sublicensing terms with MTC and SFMTA, then compile a bounded 08:00–10:00 hills-to-Bay proof over DataSF terrain.
- [x] Begin Hong Kong's source and feasibility audit: separate exact ferry schedules, reconstructed surface headways, live MTR station forecasts and measured 3D station structure instead of presenting them as one kind of motion evidence.
- [ ] Compile a bounded 18:00–20:00 Victoria Harbour proof with exact Star Ferry departures, labelled headway-generated trams and structural-only MTR; keep the rail-led edition gated on an authoritative timetable or trajectory source.
- [x] Capture the wider city-thesis pipeline—without implying feasibility—for Istanbul, Mumbai, Venice, Amsterdam, Chicago, Singapore, Mexico City, Johannesburg, Sydney and Lisbon alongside the existing Tokyo, Hong Kong, Berlin and San Francisco candidates.
- [x] Complete source, rights, motion-semantics, geography and bounded-proof feasibility studies for all ten wider city candidates.
- [x] Complete Berlin's feasibility audit: verify VBB's current/archived schedule and realtime paths, distinguish replacement buses from same-named Ringbahn rail records, and isolate the remaining vertical-structure work.
- [x] Build Berlin's source-pinned scheduled proof, geographic-to-circulation transition and relative Ostkreuz interchange with official bridge and water context.
- [x] Publish the approved Berlin source and study; the inspected alpha.9 revision is served as of 13 September.
- [ ] Review Berlin crossing performance on physical devices and obtain measured rail elevations; retain its unnumbered status until catalogue admission.
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
