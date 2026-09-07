# Fietsen — Amsterdam

**An Amsterdam motion study**

*Countless individual movements. A city taking shape.*

**Catalogue status:** medium delivery confidence; aggregate reconstruction is a candidate method, with actual counter coverage, measurement quality and publication terms still unverified.

**Data-readiness update — 7 September 2026:** see the [current access/provenance register](DATA-READINESS.md#city-by-city-register) and [focused provider questions](DATA-QUESTIONS.md). Later findings there supersede the corresponding open questions in this dated audit.

**Naming direction — 7 September 2026:** **Fietsen** is the author's selected working title. See [name alternatives, proposed thesis and opening commitment](NAMING.md#amsterdam). The study remains unnumbered and its source gates remain open.

## Thesis under test

Fietsen names both bicycles and the act of cycling. The local sentence is **everyday cycling makes Amsterdam take shape**: countless small movements across bridges, along canals and through crossings accumulate into the city's rhythm, with trams and metros moving inside that field. The composition should reveal the structure of that everyday activity through the paths and connections that sustain it, including pauses and crossing constraints.

The source problem is identity. Public bicycle counters observe directional volume, not named riders or complete trajectories. A responsible study can reconstruct count-conserving flows over the cycling graph; it cannot replay individual bicycles that were measured moving from origin to destination.

## Feasibility verdict — 6 September, amended 7 September 2026

| Scope | Status | Defensible interpretation |
| --- | --- | --- |
| Bicycle network geometry | **Green** | Amsterdam publishes a topologically consistent walking/cycling network with bridge, tunnel and relative-height fields through unauthenticated REST, WFS and vector-tile endpoints. |
| Bicycle motion | **Amber pending coverage / red as trajectories** | NDW documents directional bicycle counts and an hourly aggregate Bicycle API. Actual Amsterdam measurements have not been acquired or inspected. Counts may support synthetic flow with explicit uncertainty; they do not identify individual routes. |
| Current public transport | **Green technically / amber on feed terms** | Dutch national public-transport data is distributed through NDOV Loket, including current GTFS. The exact operator release, retention terms and GVB coverage must be pinned before compilation. |
| Modal hierarchy claim | **Amber** | A bounded area with adequate bicycle counter coverage can compare reconstructed bicycle volume with scheduled transit. Citywide gaps must not be filled with plausible-looking traffic. |

Amsterdam's source gate remains open. If the coverage test passes, every bicycle should read as one particle of an aggregate model, not one observed person.

## Bicycle geometry

The City of Amsterdam's [Loopfietsnetwerk API](https://api.data.amsterdam.nl/v1/docs/datasets/loopfietsnetwerk%40v1.html) describes a public, unauthenticated, topologically consistent graph available as REST, WFS, MVT and full exports. Relevant edge fields include:

- whether an edge supports walking/cycling;
- relative height (`hoogteniveau`);
- bridge and tunnel indicators;
- street class/name; and
- curve geometry, with EPSG:28992 as the source CRS.

Some classifications and names derive from OpenStreetMap, IMGeo and Amsterdam-specific sources. The compiler must retain field-level lineage and any database attribution that follows from those inputs rather than treating “publisher: Amsterdam” as the whole provenance story.

This graph can constrain synthetic bicycles to real links and keep bridge/tunnel state explicit. It says nothing about how many riders used an edge at a particular time.

## Bicycle counts and reconstruction

[NDW Open Data](https://opendata.ndw.nu/) exposes current and historical bicycle-count access through Dexter and links the [Bicycle API documentation](https://docs.ndw.nu/data-uitwisseling/interface-beschrijvingen/fiets-api/). The API supplies measurement-site geography and hourly aggregate bicycle measurements; account/service credentials may be required for direct API use. Dexter exports provide directional intensity, interval and quality/completeness fields rather than tracks.

The opening compiler should implement a transparent flow model:

1. select a compact subgraph and all NDW counters within or immediately across its boundary;
2. retain measured interval, direction, completeness and exclusion flags;
3. create deterministic particles proportional to observed counts at each detector;
4. route particles only through plausible graph continuations while conserving boundary counts; and
5. render unobserved branches with lower confidence or not at all.

Particles must not keep persistent identities across counters. Matching two count sites does not prove that the same rider travelled between them. Model seed, routing weights and uncertainty should be visible in methodology.

## Public transport

[NDOV Loket's data directory](https://data.ndovloket.nl/) distributes national public-transport data and a current `gtfs` collection. Before using it, identify the feed producer and release that contains GVB, inspect `agency`, `routes`, `trips`, `shapes`, calendars and attribution, and retain its applicable terms.

Scheduled trams, buses and metro can share the clock with aggregate bicycle flow, but the event classes must remain separate. Public-transport vehicles are scheduled trip interpolation unless a matched realtime archive is added; bicycles are synthetic particles generated from counts. Colour and trail language should make that distinction legible without opening prose.

## Rights and privacy

**7 September clarification:** the [national government catalogue](https://data.overheid.nl/dataset/7hgzsrxqwsgqhw) identifies the same cycling-network API and explicitly assigns CC BY 4.0. This resolves the missing baseline licence statement; retain it with the chosen release and field lineage. NDW counter-data terms, historical export and measurement-site coverage remain separate checks.

Only aggregate counter values are needed. Do not use camera footage, device identifiers, Bluetooth/Wi-Fi detections or person-level trip records. Low counts may need coarser time bands even when the source is formally open, particularly if a location and period could make a person's movement unusually identifiable.

## Evidence boundaries

| Intended claim | Evidence required | Present feasibility |
| --- | --- | --- |
| This edge is cyclable and crosses a bridge/tunnel | Amsterdam graph field and geometry | **Yes.** |
| N bicycles passed a detector in one direction | NDW measurement, interval and quality flags | **Yes after coverage/access validation.** |
| A bicycle travelled from A to B | Individual trajectory or defensible OD | **No.** Synthetic paths cannot be described as observed trips. |
| Bicycles dominate the local transport field | Comparable spatial/time scope across bicycle counts and transit | **Possible in a bounded proof**, not yet demonstrated citywide. |
| A tram occupied an exact location | Matched realtime vehicle position | **Not from static GTFS.** Scheduled interpolation only. |

## Recommended proof

Choose a **07:00–09:00 bridge-and-canal cell** only after plotting NDW counter coverage. No neighbourhood has yet been justified by measurements. Render measured boundary pulses and deterministic, count-conserving bicycle flow over the Loopfietsnetwerk. Add scheduled GVB motion as a visibly different stratum. The proof fails if too few counters constrain the interior or if inferred particles dominate the image.

### Delivery confidence and resumption plan — 7 September 2026

**Overall confidence: medium, not a calibrated probability.** Network access and the graph's reuse baseline are strong. Shared rendering infrastructure reduces implementation uncertainty, but it does not validate the bicycle-flow model. Actual Amsterdam counter coverage, completeness, between-counter ambiguity and the selected measurements' publication terms remain the decisive unknowns. No detector inventory or count sample has been obtained, and no provider has been contacted.

Resume with a small data feasibility study producing a coverage map, an inspected sample morning, a provenance record and a scope decision:

1. **Try the public download route first.** NDW's [bicycle product documentation](https://docs.ndw.nu/producten/fietsdata/) links the [Dexter bicycle open-data portal](https://dexter.ndw.nu/opendata/bicycle) and describes downloadable data. The portal returned only an application shell to the text browser in this review; its downloads and Amsterdam coverage have not been tested. For programmatic access, the [API instructions](https://docs.ndw.nu/data-uitwisseling/interface-beschrijvingen/fiets-api/) require OAuth and recommend requesting a bicycle-data service account from `mail@servicedeskndw.nu`. An account is not yet established as necessary for the initial download test.
2. **Map the detector inventory.** Inspect locations, directions, active dates, permanent versus temporary installations and source ownership. Match sites to graph edges, recording ambiguous matches before choosing a boundary.
3. **Inspect one week, then select one morning.** Quantify available versus expected intervals, quality flags, missing versus measured zero, revisions and timezone handling. The documented API aggregates to hours; finer animation would be modelled within those totals, not observed second-by-second motion. NDW describes mixed source aggregation and temporary installations, so do not assume uniform resolution or continuous coverage.
4. **Test sensitivity between counters.** Compare plausible route allocations, including unknown entries/exits and storage within the boundary. Count conservation alone does not identify interior flow. Define acceptable uncertainty and suppression rules before judging the result; narrow the area or show measured crossings if plausible assumptions produce materially different pictures.
5. **Preserve the evidence and decide.** Retain source files, dates, hashes, transformations, exact applicable terms and attribution, including conditions for lasting derived publication. A connected field advances only if coverage and sensitivity support it. Sparse coverage may justify a focused crossing study; that is a scope decision, not proof of the original wider field. If GVB is included, its feed gate must also pass.

If the public export is insufficient, use the [prepared NDW questions](DATA-QUESTIONS.md#amsterdam) to request Amsterdam detector metadata, a sample week of directional counts, quality documentation and the governing reuse terms. These questions remain unsent.

### Source gate

- [ ] Export current Amsterdam cycle edges and retain source/terms metadata.
- [ ] Map NDW bicycle counter coverage, directions and completeness for candidate mornings.
- [ ] Retain NDW reuse and credential terms; choose an archiveable measurement slice.
- [ ] Pin and inspect the GVB-containing GTFS release from NDOV Loket.
- [ ] Define quantitative uncertainty and suppression rules for reconstructed flow.
- [ ] Pass a visual test in which aggregate reconstruction cannot be mistaken for rider tracking.

**Exit:** Amsterdam advances when one bounded morning is constrained by enough measured counts to make bicycles genuinely primary without inventing individual journeys.
