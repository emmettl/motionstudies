# Umlauf — Berlin

**An unnumbered Berlin motion study**

**Catalogue status:** source-pinned interactive proof and Ostkreuz relative interchange study implemented in an independent private repository; unnumbered, with measured rail/interchange heights still to source.

**Implementation:** [Umlauf repository (private)](https://github.com/emmettl/umlauf) · [Data contract](https://github.com/emmettl/umlauf/blob/main/docs/DATA.md) · [Validation](https://github.com/emmettl/umlauf/blob/main/docs/VALIDATION.md) · [Next work](https://github.com/emmettl/umlauf/blob/main/docs/ROADMAP.md).

**Data-readiness update — 7 September 2026:** see the [current access/provenance register](DATA-READINESS.md#city-by-city-register) and [focused provider questions](DATA-QUESTIONS.md). Later findings there supersede the corresponding open questions in this dated audit.

**Naming direction — 7 September 2026:** **Umlauf** is the preferred working candidate for discussion. See [name alternatives, proposed thesis and opening commitment](NAMING.md#berlin). This is not a catalogue admission or a change to the dated source verdict.

## Thesis under test

Berlin draws an inside with railway. The Ringbahn is simultaneously a circulating service, a chain of interchanges and a boundary used to describe the inner city; S-Bahn and U-Bahn axes repeatedly pierce it while the tram network enters as a predominantly eastern surface field.

The local sentence is therefore **ring and crossing** rather than generic network density. Clockwise S41 and counter-clockwise S42 services should make a continuous pulse around the centre. At the four cardinal rail hubs and selected U-Bahn/tram intersections, cross-city movement should arrive on distinct vertical planes without becoming an interchangeable stack of coloured lines.

The City of Berlin's [Planwerk Innere Stadt](https://www.berlin.de/sen/stadtentwicklung/planung/planwerk-innere-stadt/) explicitly uses the area inside the S-Bahn Ring as its inner-city field. That makes the ring an urban proposition as well as a route geometry, but the planning boundary must remain contextual: trains do not prove a social, cultural or fare boundary by themselves.

## First implemented proof — 7 September 2026

The independent Umlauf edition consumes exact published `@motionstudies/*` packages at `0.1.0-alpha.2`. It uses the retained, hash-verified 3 September VBB release for Monday 7 September, 07:00–09:00 Europe/Berlin. The opening carries 585 scheduled journeys across twelve selected line names, 397 platform/stop records and 1,170 directed path segments. S41 and S42 each contribute 36 trips overlapping the opening; the four named crossing hubs remain legible in the Ring view.

The first view isolates the Ring. The second adds S1/S2, S3/S5/S7/S9, U2/U6/U8 and M10 within a central bounding box. A continuous geographic-to-circulation transformation makes the Ring approximately circular while keeping the same journey identities and clock. Play/pause, scrubbing, speed, station calls, journey following, labels and camera controls work in desktop and phone layouts. The source panel distinguishes scheduled interpolation from observations and credits VBB under CC BY 4.0.

The importer preserves agency, extended route type, route, service, trip, shape, direction and original call sequence. Replacement buses are excluded explicitly. Retained stops match directed shape segments monotonically, including a return to the starting station; the maximum observed stop-to-shape offset is 27.5 metres. A 223.8-metre S2 mismatch at Lichtenrade is outside the selected field and remains unvalidated for any future southern extension. No selected geometry failure is replaced by an invented straight line. Repeat compilation produced identical artifact hashes.

The third view studies Ostkreuz: upper Ringbahn platforms 11/12 and lower east–west platforms 3–6, scheduled moving trains, selectable platform calls and source pathway links filtered to stairs/escalators or lifts. Level separation is adjustable and explicitly illustrative. Switching views preserves the shared service clock. The compiled station artifact retains 122 family records, twelve platforms, 1,818 directed pathway rows and 201 calls from overlapping journeys (153 arrivals inside the opening). Six platforms carry the selected S-Bahn services. The [edition's station evidence contract](https://github.com/emmettl/umlauf/blob/main/docs/OSTKREUZ.md) distinguishes source endpoints and ordinal levels from authored glyphs and connector strokes.

The official bridge extension passes local validation and [hosted Node 24 CI](https://github.com/emmettl/umlauf/actions/runs/34139406252): thirteen source/model tests, twelve Chromium desktop/phone browser checks, typecheck, lint, the independent-package boundary check and production build. Network and diagram payloads are approximately 123 KB and 49 KB gzip respectively; the station data loads on demand at 27.2 KB gzip. JavaScript including the shared renderer is approximately 327 KB gzip. Repeat station compilation was byte-identical. Phone emulation does not certify physical-device frame or memory budgets.

This proof has no public deployment and assigns no catalogue number. The Ostkreuz view encodes relative ordering, without measured rail heights or approach gradients. The next substantial source gate is metric evidence for the selected interchange and railway approaches. Terrain, water, buildings and realtime remain separate additions.

## Feasibility verdict — 6 September 2026

| Scope | Status | Defensible interpretation |
| --- | --- | --- |
| Current scheduled multimodal motion | **Green** | VBB publishes a twice-weekly GTFS covering S-Bahn, U-Bahn, tram, bus, regional rail and ferry with trips, exact stop times and shapes under CC BY 4.0. The current feed has no frequency-generated services. |
| Historical scheduled replay | **Green** | VBB retains annual GTFS archives from 2010 through 2024. A current 2026 release must still be retained locally until it enters the archive. |
| Realtime adjustment | **Amber** | The unauthenticated GTFS-Realtime feed is CC BY 4.0 and matches static trip IDs, but the inspected snapshot contained trip updates only—no vehicle positions or alerts—and VBB currently warns of limited coverage. |
| Ring pulse | **Green as scheduled/realtime-adjusted motion** | S41 and S42 are explicitly represented as S-Bahn routes and the official timetable identifies their directions and circulation. Replacement-bus records reuse the line names, so mode and route identity must be preserved. |
| Station/interchange structure | **Green for relative topology / amber for measured section** | The GTFS contains levels, pathways, platforms and transfers. These support relative station structure and traversal paths, not absolute platform depth or observed passenger movement. |
| City, buildings and terrain | **Green** | Berlin publishes one-metre bare-earth terrain, citywide LoD2 buildings and ATKIS topography under the permissive Germany Zero licence. |
| Track vertical state | **Amber** | GTFS shapes are two-dimensional. ATKIS and operator/engineering sources must establish elevated, embankment, surface and tunnel segments before the visual layers claim physical height. |

Berlin passes the authoritative source and rights tests more cleanly than most second-wave candidates. It is ready for a source-pinned scheduled proof, but not yet for a metrically accurate section through every rail layer.

## Inspected VBB static feed

The [VBB open-data page](https://unternehmen.vbb.de/digitale-services/datensaetze/) links the current GTFS at `https://unternehmen.vbb.de/gtfs`, says it is refreshed twice weekly and provides annual archives back to 2010. The current ZIP was generated on 3 September 2026 and retrieved on 6 September 2026:

- size: approximately 75 MB compressed / 623 MB uncompressed;
- SHA-256: `be2b1608e038ee1d53b8bfc86974eff37b7af1927a585f5cfcd255a770d84d2b`;
- 37 agencies, 1,255 routes, 42,131 stops and 253,194 trips;
- 5,719,111 stop-time rows and 5,868,553 shape points;
- 52,582 transfers, 127,355 pathways and 360 level records; and
- base calendars from 3 September through 12 December 2026, plus 26,809 exception rows.

Its twelve tables are `agency`, `calendar`, `calendar_dates`, `frequencies`, `levels`, `pathways`, `routes`, `shapes`, `stop_times`, `stops`, `transfers` and `trips`. `frequencies.txt` contains only its header, so this release is an exact scheduled-trip source rather than a headway reconstruction. It has no `feed_info.txt` or `attributions.txt`; acquisition date, checksum, publisher, licence and source URL must live in the Motion Studies manifest.

The opening compiler should crop by used trip/shape/stop identities rather than load the regional archive in the browser. A Ringbahn proof needs only a small fraction of the 623 MB source.

## The route-identity trap

The feed uses extended GTFS route types. In the inspected release, BVG supplies nine U-Bahn route records as type 400, 27 tram records as type 900, 221 bus records as type 700 and six ferry records as type 1000. S-Bahn Berlin supplies 43 rail records as type 109 **and nine bus records as type 700**.

Both `S41` and `S42` appear on type-109 S-Bahn records and type-700 replacement-bus records. A compiler that groups by `route_short_name` would put replacement buses onto railway geometry or classify them as trains. The canonical event identity is the exact route/trip/service tuple; the public line name is only a label. Preserve `agency_id`, extended `route_type`, route ID, shape and trip together, and give replacement transport an explicit visual state.

[S-Bahn Berlin's current line timetables](https://sbahn.berlin/en/plan-a-journey/journey-planner/timetables-by-line/) provide a useful semantic cross-check: S41 is clockwise, S42 counter-clockwise, the ring is approximately 37 km, and a normal circuit is stated as 59 minutes. The operator page describes five-minute weekday peak service, but the pinned GTFS—not prose about usual frequency—must determine which trips move on the chosen date.

## Realtime source and limits

VBB's [production GTFS-Realtime service](https://production.gtfsrt.vbb.de/) is unauthenticated, CC BY 4.0, CORS-enabled and rate-limited to 60 requests per minute. It requires an informative user agent and supports conditional retrieval through `ETag`. The publisher currently warns that the feed has had limited coverage since 4 June 2026.

The snapshot retrieved on 6 September 2026 was 6.4 MB with SHA-256 `97eeaf1e95289703ba9820aa0aa58971826b93c8f58d31cbd3835472407a274e`. It declared GTFS-Realtime 2.0 and `FULL_DATASET`, with:

- 6,411 entities, all of them `TripUpdate`;
- zero `VehiclePosition` and zero `Alert` entities;
- a static `trip_id` on every update; and
- 449 updates joining to route records labelled S41 or S42.

This supports delay, cancellation and predicted stop-event correction after an exact static-release match. It does **not** support GPS dots or an observed continuous trajectory. A train between reported stop events remains timetable interpolation adjusted by predictions. For reproducible replay, build a recorder that saves responses, headers, retrieval timestamps and source-health notices; no official historical realtime archive was found.

## Stations and vertical structure

The GTFS is unusually rich at station scale. Stops carry parent-station, platform and `level_id` fields; pathways describe mode, direction, traversal time and length. The current Ostkreuz family, for example, includes separate public platform records on relative street and elevated levels, and hundreds of pathway rows reference its platform/access nodes.

Those records support an interchange graph and relative visual stacking. They do not establish a platform's absolute elevation, tunnel crown, track gradient, passenger count or the path taken by any rider. A scheduled station pulse may count arrivals/departures; it must not be labelled a passenger pulse without demand measurements.

**7 September implementation follow-up:** an exact parent-station join for `de:11000:900120003` finds 122 Ostkreuz family records and 1,818 pathway rows whose endpoints both belong to that family. Track/platform codes 1–8 use level ID `9` (index `0`, `Straßenebene`); 11–14 use level ID `31` (index `2`, `Bahnsteig`). The station family also includes intermediate level ID `179` (index `1`, `Zwischengeschoss/Übergang`). These are source-relative level indexes, not metre heights. The join deliberately excludes similarly named Beeskow stops and unparented replacement stops. This evidence now drives the interactive relative interchange view. The [official DB station plan](https://www.bahnhof.de/downloads/station-plans/4809.pdf), retained with a checksum in the edition, visually corroborates the platform ordering; its artwork is not reproduced. No measured section or current lift availability is claimed.

**Official geodata follow-up:** the [retained ATKIS audit](https://github.com/emmettl/umlauf/blob/main/docs/ATKIS.md) inspected 103 railway features, two station polygons and 21 transport structures around Ostkreuz. Ringbahn feature `DEBEATKB1bq0000X` explicitly references bridge polygon `DEBEATKB10000iKp` through `hdu`. Its exact footprint is now switchable in the station scene under Germany Zero 2.0; raw responses, schema, rights receipt and hashes are committed in the edition. All inspected coordinates are two-dimensional; no metre rail heights or individual platform boundaries were established. The bridge adds 1.2 KB gzip on demand. A repeat offline compilation was byte-identical.

For the wider line layer, join VBB shapes to Berlin's [ATKIS Basis-DLM WFS](https://daten.berlin.de/datensaetze/atkis-basis-dlm-prasentationsdienst-wfs-d4316e05) and inspect its railway/transport-structure attributes. Any unresolved segment stays `verticalState: unknown`. Bare-earth occlusion is not proof that a line tunnels there.

## Terrain, buildings and water

| Source | Use | Limit |
| --- | --- | --- |
| [ATKIS DGM, one-metre grid](https://daten.berlin.de/datensaetze/atkis-dgm-digitales-gelandemodell-fa02f9e1) | Citywide bare-earth terrain; catalogue updated December 2025 (not a new survey date) | Removes buildings and engineered structures. It gives ground, not rail-deck or platform height. |
| [Berlin LoD2 building model](https://daten.berlin.de/datensaetze/3d-gebaudemodelle-im-level-of-detail-2-lod-2-3c7c49af) | Citywide cadastral footprints and generalised roof forms | Model state is April 2024; roofs are standardised representations, not survey-grade architectural detail. |
| [ATKIS Basis-DLM WFS](https://daten.berlin.de/datensaetze/atkis-basis-dlm-prasentationsdienst-wfs-d4316e05) | Railway, transport structure, land and water context | Ostkreuz rail/bridge schema and footprint inspected; no numeric heights found in the retained slice. Wider coverage remains unvalidated. |

These Berlin sources use the [Datenlizenz Deutschland – Zero 2.0](https://www.govdata.de/dl-de/zero-2-0), providing a clean transformed-publication path. Preserve product date, CRS, height reference and resampling/simplification in the manifest even where attribution is not legally required.

Berlin is comparatively flat. Terrain should remain quiet and metric; the relevant three-dimensional drama comes from built rail structure and stations, not vertical exaggeration.

## Rights and publication

VBB states that its downloadable datasets are provided under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), and the realtime service repeats that licence. This permits public transformed artifacts with attribution and indication of changes. Retain a copy of the licence/source page with each acquisition and credit VBB as the data publisher; individual operator provenance should remain available in the methodology.

The open-data licence does not grant VBB, BVG, S-Bahn or DB trademarks, route-map artwork, icons, vehicle liveries or photographs. The study needs source data and local names, not operator branding. The current line-colour dataset is separately offered under the same VBB dataset licence, but a locally authored palette may produce a more independent work.

## Evidence boundaries

| Intended claim | Evidence required | Present feasibility |
| --- | --- | --- |
| A train is scheduled around the Ring | Pinned type-109 VBB trip, service calendar, stop times and shape | **Yes.** |
| A replacement bus is not a train | Agency, extended route type and exact route/trip identity | **Yes, but easy to mishandle.** |
| A service ran late or was cancelled | Matched, retained GTFS-Realtime trip update | **Yes where feed coverage is present.** |
| A train occupied an exact point | Vehicle position or other observed location | **No.** Current VBB realtime supplies predictions, not positions. |
| A route is elevated, surface or underground | Source-backed infrastructure classification and, for metric section, height/depth | **Partly available; must be compiled.** |
| The Ring pulses with passengers | Time-banded demand/load measurement | **Not established.** The opening pulse is trains, not people. |
| The Ring defines Berlin's inside | City planning context plus authored interpretation | **Supported as an urban-planning frame, not a universal social boundary.** |

## Recommended proof

Compile a weekday **07:00–09:00 Ring and Crossings study** from one retained VBB release:

1. S41 and S42 form the continuous scheduled pulse, filtered strictly to type-109 rail records.
2. Selected S-Bahn and U-Bahn axes cross the ring at the four named rail hubs and a small number of additional interchanges.
3. A bounded tram field enters on the eastern arc, using actual type-900 trips rather than a decorative network layer.
4. Replacement buses remain visible only as their own surface category when active on the chosen service day.
5. The camera moves from the citywide ring to one relative station section after ATKIS/GTFS vertical classification is validated.

Start with scheduled motion. Add recorded trip updates only after completeness for the chosen window is measured; the current publisher warning makes live data an enhancement, not the proof's foundation.

### Source gate

- [x] Download and inspect a current VBB GTFS; record tables, counts, dates and checksum.
- [x] Verify licence, annual archive and unauthenticated realtime availability.
- [x] Decode one realtime snapshot and establish that it contains trip updates, not vehicle positions.
- [x] Compile the selected Berlin agency/mode slice; validate source identities, both full-ring winding directions and replacement-route exclusion for the retained opening.
- [x] Compile and render Ostkreuz relative levels, platform calls and pathway endpoints; retain an official station-plan cross-check and test shared-clock continuity.
- [x] Retain a bounded ATKIS railway/structure slice, verify the Ringbahn-to-bridge reference and render the official bridge footprint.
- [ ] Extend infrastructure classification beyond the reviewed bridge and obtain measured rail/platform heights from engineering or classified survey evidence.
- [ ] Crop DGM/LoD2 context and set a phone-first transfer/frame budget.
- [ ] Record a complete two-hour realtime window only after the VBB coverage warning clears or completeness proves acceptable.
- [ ] Find a durable title after the ring-and-crossing action survives the visual proof.

## Conclusion

Berlin is **green for a scheduled Motion Study and publication**, amber only where the work asks for realtime completeness or metric vertical structure. Its source combination is unusually coherent: one licensed regional timetable, a usable historical archive, trip-level realtime corrections, station pathways and permissive official 3D city data.

The remaining risk is authorship rather than availability. A generic multicolour transit atlas would waste the sources. Berlin advances when the Ring visibly creates an inside, the crossings complicate it, and every apparent vertical layer is supported rather than cosmetically separated.

**Exit:** one retained morning makes clockwise and counter-clockwise Ringbahn motion legible as Berlin's moving boundary while selected rail and tram crossings preserve correct mode, schedule and physical-state semantics.
