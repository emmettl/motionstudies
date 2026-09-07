# Istanbul — title to find

**An unnumbered Istanbul motion study**

**Catalogue status:** licence baseline resolved; historical calendar fidelity and current full multimodal motion remain blocked. The 7 September inspection supersedes the earlier historical-proof assessment.

**Data-readiness update — 7 September 2026:** see the [current access/provenance register](DATA-READINESS.md#city-by-city-register) and [focused provider questions](DATA-QUESTIONS.md). Later findings there supersede the corresponding open questions in this dated audit.

**Naming direction — 7 September 2026:** **İki Yaka** is the preferred working candidate for discussion. See [name alternatives, proposed thesis and opening commitment](NAMING.md#istanbul). This is not a catalogue admission or a change to the dated source verdict.

## Calendar correction — 7 September 2026

A fresh inspection of the official agency, route, trip and calendar tables found eight agencies, 499 routes, 14,389 trips and 49 calendar rows. Many calendars span `20221231`–`20241231` despite the catalogue's 2018–2020 component dates. Joining services through trips and routes yields **zero shared active days in 2019 for Şehir Hatları and TCDD** in these tables. No calendar-exception resource was listed; stop times, frequencies and shapes were not re-inspected in this pass. Agency/route/trip CSVs failed UTF-8 decoding and were provisionally read as Windows-1254.

The previous proposal for a coherent 2019 ferry/rail proof is therefore unverified and must not be compiled as history without corrected source evidence. Later calendar dates also do not prove that old timetables describe 2023–2024 service. Ask IBB whether validity dates were extended and obtain a verified common snapshot. See the [inspection and retrieval record](data-access-review-2026-09-07.json) and [IBB questions](DATA-QUESTIONS.md#istanbul). The amended verdict below incorporates this correction; neither the historical nor current full study is cleared.

## Thesis under test

Istanbul is two continents made into one transport space. Ferries repeatedly cross the Bosphorus in the open while Marmaray passes beneath it; bridges carry road traffic above the same water. The local visual sentence is not merely a busy strait, but **one geographic division crossed at three different vertical states**.

The opening composition should make Europe and Asia impossible to read as separate maps. A bounded field from Karakoy and Eminonu through Uskudar and Kadikoy could hold ferries on the surface and the Marmaray alignment structurally beneath them. It must not animate a present-day railway service from an obsolete timetable.

## Feasibility verdict — 6 September, amended 7 September 2026

| Scope | Status | Defensible interpretation |
| --- | --- | --- |
| Historic multimodal network | **Historical fidelity unresolved; licence baseline documented** | IBB's package contains rail and ferry components, but the 7 September table inspection found calendar dates inconsistent with the stated component ages and no shared 2019 Şehir Hatları/TCDD service days. A verified historical snapshot is required before a dated work can be claimed. |
| Current IETT bus motion | **Green / amber for geometry** | IBB publishes a maintained IETT GTFS with calendar, routes, trips, stops and stop times. The catalogue does not list `shapes.txt`, so another authoritative geometry join is required. Buses are not the proposed edition's core. |
| Current rail and ferry motion | **Red as one reproducible feed** | Current rail and ferry timetables exist on operator websites, but this audit found no maintained official machine-readable source covering the defining modes together. Metro Istanbul exposes timetable pages and Sehir Hatlari publishes timetable pages/PDFs; neither is a stable GTFS replacement. |
| Bosphorus section | **Amber** | The water, shores and crossings are straightforward. Exact Marmaray alignment and depth/portal evidence, bridge deck elevation and ferry-course semantics still need source-specific validation. |

Istanbul does not yet pass for a shared historical rail/ferry day or a current full-network study. A smaller ferry reconstruction remains an investigation option if its own retained timetable and terms support it.

## Transport evidence

### Frozen IBB multimodal GTFS

The [IBB Open Data catalogue API](https://data.ibb.gov.tr/api/3/action/package_search?q=gtfs) describes a `Public Transport GTFS Data` package with `agency`, `calendar`, `frequencies`, `routes`, `shapes`, `stop_times`, `stops` and `trips`. The inspected agency table contains Sehir Hatlari, TCDD, Metro Istanbul, Minibus, Taxi Dolmus, IDO, Turyol and Dentur Avrasya. The route table contains 499 records and includes GTFS ferry routes.

The package notes say its components were last updated from January 2018 to July 2020 and **will not be updated**. Preserve those component dates rather than presenting the package's later metadata timestamp as service currency. They conflict with many downloaded calendar dates; neither a coherent historic network nor present-day validity has been established.

The compiler would need to retain:

- ZIP and table checksums, retrieval date and every operator component date;
- `Europe/Istanbul`, source service day and after-midnight interpretation;
- exact timetable events and `frequencies.txt` reconstructions as different event types; and
- a visible historical date in the work, not just in a methodology drawer.

### Current official sources

The IBB catalogue also exposes a maintained `IETT GTFS Data` package. It covers the municipal bus operator rather than the full rail-and-water thesis and should not silently replace the frozen network.

[Metro Istanbul's service-detail page](https://www.metro.istanbul/SeferDurumlari/SeferDetaylari) publishes current operating hours and intervals for metro, tram, funicular and cable-car lines. [Sehir Hatlari's domestic timetable page](https://sehirhatlari.istanbul/en/timetables/domestic-trips) publishes current ferry services and downloadable timetable documents. These are authoritative references, but a scraper would inherit page changes, document formatting and ambiguous version retention. A published proof should use manually retained source documents only after confirming reuse terms and modelling each departure rule explicitly.

No official vehicle-position, trip-update or historical realtime archive suitable for permanent replay was found in this audit. Timetable interpolation would be scheduled motion, not observed vessel or train position.

## Rights and publication gate

**7 September update:** the [IBB Open Data Licence v1.0](https://data.ibb.gov.tr/license) was successfully retrieved and matched to the package licence URL. It expressly permits adaptation and perpetual commercial/non-commercial reuse of covered data with attribution and stated exclusions. The missing licence-text issue is resolved; separate operator resources and third-party material still need their own source conditions.

Before public compilation:

1. retain the full licence text and version that governs each downloaded package;
2. apply the retrieved licence's reuse and attribution conditions to covered IBB artifacts; request clarification only for a specific conflicting resource condition;
3. establish whether operator-hosted timetable PDFs carry separate terms; and
4. keep operator brands, maps, icons and liveries out unless separately permitted.

The baseline licence is now documented. A faithful shared service period remains unresolved following the calendar inspection, so neither a current work nor the previously suggested 2019 proof is cleared.

## Geography and vertical evidence

The opening needs four independent geometry classes: land/water boundary, ferry route, fixed crossings and ground/building context. IBB's open-data catalogue includes municipal geographic layers, but each chosen resource needs its own date, CRS and rights record. A Copernicus or other rights-clean global DEM can provide broad relief if no adequately documented municipal elevation model is available.

Marmaray must be treated conservatively. A schematic project alignment can establish that the rail crossing is below the Bosphorus, but it does not assign exact track depth continuously. Bridge and tunnel state should be compiled as authored segments with source citations and confidence, never inferred merely because a line crosses water.

## Evidence boundaries

| Visual claim | Required evidence | Current position |
| --- | --- | --- |
| A ferry departs at a stated time | Retained current or historic operator timetable and service-day rule | **Possible after period verification.** The downloaded calendar alone does not establish historical fidelity. |
| A vessel follows an exact course | Observed track or authoritative navigational geometry | **Not established.** GTFS shapes are service geometry, not proof of an observed wake. |
| A Marmaray train crosses beneath the strait | Matching timetable plus sourced alignment and tunnel classification | **Unresolved.** A compatible historical source period and current train source are both unverified. |
| Three vertical crossing states coexist | Source-backed ferry surface, bridge deck and tunnel/rail section | **Promising**, with engineering geometry still to acquire. |
| Passenger flows bind two continents | OD, count or fare-gate measurements | **Not established.** Frequency is not demand. |

## Recommended proof

Obtain a verified common source period before building the rail/ferry scene. The previously proposed **2019 Bosphorus hour is withdrawn as a ready proof** following the calendar inspection. A future bounded section can still keep bridges structural and distinguish scheduled ferry/rail movement, once the timetable period and geometry are established. Do not rewrite service dates merely to make the sources overlap.

### Source gate

- [x] Retrieve and review the IBB Open Data Licence v1.0 (7 September).
- [ ] Obtain IBB's explanation of the calendar/component-date mismatch and a verified common historical snapshot.
- [x] Retrieve and hash agency, routes, trips and calendar tables; inspect their joins (7 September).
- [ ] Obtain and validate a source-backed common service date, without assuming 2019.
- [ ] Measure route/shape/stop-time completeness by operator.
- [ ] Source shore, bridge and Marmaray tunnel geometry with explicit vertical semantics.
- [ ] Decide whether the historical date strengthens or compromises the thesis.
- [ ] Obtain a maintained rail/ferry data path before describing the work as present-day Istanbul.

**Exit:** Istanbul advances when verified rail and ferry evidence describes a common source period and the resulting dated proof reads as an intentional work. A current edition requires maintained sources for that current period.
