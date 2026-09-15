# Los Angeles — Backup (working title)

**An unnumbered Los Angeles motion study**

**Catalogue status:** candidate added 8 September 2026 after a first source audit; freeway measurement source is public domain but account-gated; Metro's developer terms block a transformed artifact as written.

**Naming direction — 8 September 2026:** **Backup** is the preferred working candidate for discussion. See [name alternatives, proposed thesis and opening commitment](NAMING.md#los-angeles). This is not a catalogue admission.

**Programme reconciliation — 15 September 2026:** source findings below keep their 8 September date and were not re-retrieved. Retrieval URLs, timestamps and hashes are in the [evidence record](evidence/city-candidate-sources-2026-09-08.json). The relation to the series was revised against [Underfall](BRISTOL.md), the [shared ground-transport contracts](SHARED-GROUND-TRANSPORT.md), [shared fields](SHARED-FIELDS.md) and the [national study](NATIONAL-STUDY.md) as they stood on 15 September.

## Thesis under test

The freeway is Los Angeles's public network, and its rhythm is a wave that travels backwards against the traffic. Nobody schedules it and no vehicle in it has an identity; what exists is density measured at fixed points every five minutes. When a freeway fills, the queue's tail moves upstream while every car in it moves downstream. The local sentence is **movement without vehicles**: the mark on the screen is a condition of the road, not a thing travelling along it.

This is the only candidate city about the car. It is not the series' first detector study, and it must not present itself as one.

## Relation to the series

[Underfall's M32 proof](BRISTOL.md#implemented-study) already treats measured passages and mean speeds as evidence without inferring cars, in a full-day site-by-time matrix with illustrative section geometry. The [national study](NATIONAL-STUDY.md) states the same limit: a road field descends to a detector and a measured interval, and no further. Los Angeles would make that evidence the whole subject rather than one clock among a city's several, over a corridor long enough for a queue to travel.

The signature therefore has to be more than the M32 matrix at larger scale. It is the continuous rotation of a real corridor into its time–space diagram, with the backward-moving front as the event the viewer follows. If a pinned day does not show a legible front on the chosen corridor, the thesis fails and this brief should say so.

The engine case is concrete. The shared [aggregate-road contract](SHARED-GROUND-TRANSPORT.md#public-modules) and WebTRIS normaliser came from Underfall. A PeMS normaliser would be that contract's second provider, testing whether per-lane measurements, provider-slot intervals and observed-percentage imputation fit without special cases. The `supported-field` module prepared from Zugunruhe describes support fading with distance from a station, which is what the gap between detectors needs; its use along a one-dimensional corridor is untested.

The smallest supported unit is one station's five-minute interval, per lane, marked measured or imputed.

## Feasibility verdict — 8 September 2026

| Scope | Status | Defensible interpretation |
| --- | --- | --- |
| Freeway flow, occupancy and speed | **Green source / amber access** | Caltrans PeMS: nearly 40,000 detectors statewide, 5-minute station aggregates, and more than ten years of archive as an Archived Data User Service. The site's Conditions of Use state that information "unless otherwise indicated, is considered in the public domain". An account is required and approved within one to two business days. |
| Freeway geometry | **Amber** | The Caltrans GIS State Highway Network page returned only an application shell; its terms are unverified. PeMS station metadata (coordinates, postmiles) comes with the clearinghouse. |
| Metro rail and bus as scheduled context | **Green feed / red terms** | Both GTFS archives were retrieved and inspected; `feed_license` is empty. The developer terms require licensees not to "change, tamper, dismantle, augment, misrepresent or otherwise modify" the data and to reproduce it "only in the form provided", prohibit unauthorised redistribution, and require removal on termination. A compiled browser artifact modifies and redistributes. |
| Terrain | **Green** | USGS 3DEP elevation is public domain (not retrieved in this pass). |
| Signature transformation | **Green conceptually** | Geographic freeway → time–space diagram (distance along the corridor against time of day). Traffic engineering's own picture becomes the diagram space, as Beck's map does for London. |

Los Angeles passes the local-sentence and signature tests strongly. The source path is defensible for a **freeway-only opening**; Metro context waits on a written answer, exactly as San Francisco's does.

## Inspected sources

### PeMS

The [PeMS home](https://pems.dot.ca.gov/) and [clearinghouse](https://pems.dot.ca.gov/?dnode=Clearinghouse) pages state the account requirement; the [Conditions of Use](https://pems.dot.ca.gov/?view=tou) carry the public-domain ownership statement with the caveat that copyrighted material such as photographs may be marked otherwise. The Caltrans [source](https://dot.ca.gov/programs/traffic-operations/mpr/pems-source) and [data-table](https://dot.ca.gov/programs/traffic-operations/mpr/pems-data) pages describe the detector population, the ten-year archive, and the sensitivity adjustments that affect early-period comparability. Secondary sources report that programmatic download is disallowed; this was not confirmed from a Caltrans page and must be checked after registration.

District 7 covers Los Angeles and Ventura counties. Station 5-minute files carry per-lane flow, occupancy and speed, plus an observed-percentage field distinguishing measured from imputed values. Imputation must be rendered as imputation.

### Metro GTFS

Retrieved from Metro's GitLab evergreen links:

- `gtfs_rail.zip`: SHA-256 `fb7af59a72e2060b2b7a51048835e35770570714195ee1e4c1af38cba757bfc0`; 1,318,257 bytes; README dated 5 September 2026; 6 routes (A, B, C, D, E, K), 463 stops, 7,796 trips, 154,890 stop-time rows, 17,590 shape points; calendar 5–19 September 2026 (24 services); `feed_info` gives `feed_id` `us_ca_lacmta_rail`, no version, no licence.
- `gtfs_bus.zip`: SHA-256 `93275d4b50eb22afcfe64f3fe8fd918dfb5fa43600be2e267658e5f2719eda33`; 22,244,988 bytes; 114 routes, 11,892 stops, 33,614 trips, 2,106,179 stop-time rows, 344,948 shape points; calendar 7 June–12 December 2026 (129 services) with 7,064 exception rows; `feed_id` `us_ca_lacmta_bus`, no licence.

Metro publishes rail daily and bus at each "shakeup"; the [GTFS page](https://developer.metro.net/gtfs-schedule-data/) documents master/current/next branches. None of this resolves the [terms](https://developer.metro.net/terms-conditions/) above.

## Motion semantics

A PeMS station reports what passed a point in five minutes. Between stations nothing is measured. The renderer must therefore:

- draw each station as the site of a measurement, and let the corridor between stations carry interpolation that is styled as interpolation;
- treat congestion as a field (density, speed) and never as particles with continuity between stations — a particle implies a vehicle that the source cannot identify;
- preserve the observed-percentage field so imputed intervals read differently from measured ones;
- state that the backward-moving wave is a property computed from successive station states, with its speed reported from the data rather than asserted from the literature;
- keep missing intervals distinct from measured zero, as the aggregate-road contract already does for WebTRIS;
- keep any Metro service, if terms allow it, as a scheduled layer with a different visual grammar.

## Evidence boundaries

| Visual claim | Evidence required | Present feasibility |
| --- | --- | --- |
| At 07:35 this segment was congested | PeMS 5-minute station record, measured | **Yes after account access.** |
| The congestion tail moved upstream at a given speed | Successive station records along the corridor | **Yes as a derived quantity.** |
| A car travelled from A to B | Vehicle identity | **No; never drawn.** |
| The condition between two stations | Measurement | **No; interpolation, styled as such.** |
| An incident caused this | CHP/Caltrans incident record | **Not in the station data; separate source.** |
| Metro trains ran alongside | Metro GTFS | **Feed yes; publication blocked by terms.** |

## Recommended proof

Compile one weekday **05:00–10:00 corridor study** from a pinned historical date on a single freeway with dense detector coverage — I-405 through the Sepulveda Pass or I-10 between Santa Monica and downtown — using District 7 station 5-minute data. Open in plan, then rotate the corridor into a time–space diagram while the same station states persist. No transit layer in the opening. A pinned historical corridor-day is a one-off download rather than continuous collection; if the day is kept, its retained bytes count against the [selected-evidence allocation](COST-CONTROL.md#bound-retention-by-age-and-bytes).

### Source gate

- [x] Retrieve PeMS Conditions of Use, home and clearinghouse pages and Caltrans source descriptions.
- [x] Retrieve and hash Metro rail and bus GTFS; inspect tables and calendars.
- [x] Retrieve Metro developer terms and identify the modification, redistribution and termination clauses.
- [ ] Register a PeMS account; retain the registration terms and confirm the download policy from a Caltrans page.
- [ ] Download one corridor-day of station 5-minute data and station metadata; record file names, hashes and observed-percentage distribution.
- [ ] Obtain freeway centreline geometry with verified terms (Caltrans GIS or PeMS postmile geometry).
- [ ] Send the [Metro questions](DATA-QUESTIONS.md#los-angeles) before any transit layer.
- [ ] Write a PeMS normaliser against the shared aggregate-road contract and record every field that does not fit it.
- [ ] Set phone transfer and frame-time budgets for a field-style corridor renderer.
- [ ] Test *Backup* and its alternatives with a Los Angeles reader.

**Exit:** a source-pinned morning on one corridor in which the queue visibly grows against the direction of travel, with measured and imputed intervals distinguishable and no invented vehicles.
