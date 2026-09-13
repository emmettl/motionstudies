# National study — data and technical feasibility

[Artistic brief](NATIONAL-STUDY.md) · [Study index](README.md) · [Data-readiness register](DATA-READINESS.md)

**Research date: 13 September 2026.** This is a documentation and source audit with an explicit capacity model, not a measured national ingest or browser benchmark. Provider documentation, published research, public file metadata and the current shared code were inspected. No provider account was created, private credentials inspected, messages sent or continuous collector started.

## Verdict

**An England rail-and-bus study is technically credible. Its strongest first form is a recorded study with matching schedules, progressive loading and traceable aggregates.** The largest uncertainty is the quality and continuity of joins between sources, services, observations and geometry. Raw national data should be retained outside the browser; the artwork should load only the representation and evidence currently needed.

| Capability | Assessment | Remaining evidence |
| --- | --- | --- |
| National scheduled rail and bus field | Strong source path | Acquire compatible releases, establish calendars, coverage and geometry. |
| Recorded bus trajectories | Feasible source path with national research precedent | Measure missing/stale reports, trip matching, London coverage and actual bytes. |
| Recorded rail operation | Feasible at reporting points | Acquire feed, reconcile schedules and identities, preserve late/corrected events and interpolation. |
| Aggregate → group → journey → source | Feasible architecture; not implemented end to end | Build membership/provenance indexes and demonstrate reconciliation. |
| Smooth national-to-local view on a phone | Plausible with spatial and temporal detail loading | Physical-device memory, frame time and transfer measurements. |
| Complete UK observed public transport | Not established | Separate Scottish, Welsh and Northern Irish coverage and feed audits. |
| Every vehicle, passenger or journey in the country | Unsupported | Available sources do not establish universal coverage or person-level travel. |

## Geographic scope

| Boundary | Practical source composition | Decision |
| --- | --- | --- |
| **England** | Network Rail; BODS; TfL and other local-mode sources where needed. | Recommended multimodal first study. Audit London explicitly. Preserve cross-border continuation where available. |
| **Great Britain** | Add Scottish/Welsh local services through TNDS and regional sources; rail remains a shared source path. | Strong rail-led alternative; scheduled local coverage is more established than uniform observed coverage. |
| **United Kingdom** | Great Britain plus Translink and any other required Northern Irish operators/modes. | Separate expansion, with cross-border Irish services handled deliberately. |

BODS's statutory scope covers local bus services in England outside London, with conditions for cross-border services and exclusions including coaches and closed school services. This is narrower than its headline national description; neither wording proves the contents of a chosen feed. The same guidance describes nationally and regionally packaged GTFS conversions. [DfT implementation guide](https://www.gov.uk/government/publications/bus-open-data-implementation-guide/bus-open-data-implementation-guide)

TNDS covers bus, light rail, tram and ferry timetables in Great Britain, supplied as regional TransXChange ZIPs through registered FTP access. Routine builds run Monday–Thursday overnight. It is a schedule source, not a national position archive. [Traveline TNDS](https://www.travelinedata.org.uk/traveline-open-data/traveline-national-dataset/)

Scotland's digital travel programme describes outgoing open feeds; Welsh timetable files can be requested from TfW. These establish extension paths, not equivalent national AVL coverage. [Transport Scotland](https://www.transport.gov.scot/our-approach/digital-travel-data-services/), [Traveline Cymru/TfW](https://www.traveline.cymru/data-information-for-stakeholders/)

Translink offers a registered JSON journey-planning API with departures, stops and incidents. Its page describes normally weekly core-data updates alongside live system information; it does not establish a bulk position archive or a guaranteed refresh interval for every response. Verify bulk extraction, identities, history and reuse before selecting a UK date. [Translink API](https://www.translink.co.uk/legal-information/freedom-of-information-and-open-data/public-transport-api)

## Sources, timeliness and accuracy

### Buses: schedules and observed positions

Use dated BODS GTFS for an initial schedule compiler, retaining its relationship to the original TransXChange datasets. Preserve the native release when conversion drops useful identifiers or geometry. DfT's catalogue identifies both published timetable and location datasets as OGL data; retain the applicable version, attribution and source notices with acquired files. [Timetable catalogue](https://findtransportdata.dft.gov.uk/dataset/bus-open-data---published-bus-timetables-1833b69a181), [Location catalogue](https://findtransportdata.dft.gov.uk/dataset/bus-open-data---published-bus-locations-1833b6e753a)

The SIRI-VM profile requires position updates at least every 30 seconds, even when stationary. It describes a central national response or filtered subsets, with national ZIP requests no more frequent than five seconds. Timestamps are UTC; the recommended one-second clock accuracy is not a measured location or arrival-time accuracy. Preserve `RecordedAtTime`, response/receipt times, validity and original identifiers. These are provider requirements, not a service-level guarantee that every vehicle is fresh. [DfT SIRI-VM guidance](https://www.gov.uk/government/publications/technical-guidance-publishing-location-data-using-the-bus-open-data-service-siri-vm/technical-guidance-siri-vm)

The practical collection starting point is one central request every 30 seconds: 2,880 requests on a 24-hour day. Polling faster cannot recover reports absent upstream and may mostly copy unchanged records. Confirm current account limits and compare native SIRI with converted GTFS-RT before choosing the archive format.

DfT permits publication after basic validation and does not warrant data quality. Therefore schema validity cannot stand in for correct trip identity, complete coverage or accurate timings. [DfT quality guidance](https://www.gov.uk/government/publications/bus-open-data-implementation-guide/bus-open-data-implementation-guide#quality-assuring-data)

A directly relevant research precedent is Chen and Botta's March 2026 preprint. They report national BODS collection every 30 seconds, daily static snapshots, approximately 50% duplicate observations on a typical day and substantial missing trip IDs. Their account says no historical AVL archive was available from BODS as of early 2026. Their corrected stop times include inference and interpolation; they are not untouched observations. This supports national processing feasibility, while highlighting the joins and missingness we must measure independently. [Research paper, sections 3.1–3.5](https://arxiv.org/html/2603.11477v1)

**Accuracy implication:** preserve the received coordinates even if a displayed path is map-matched. At 50 km/h a vehicle travels about 417 m in 30 seconds; that is sampling distance, not a GPS error estimate. A smooth marker between reports is an inference. Do not promise metre-level accuracy without independent validation. A report near a stop also does not establish door opening, boarding or dwell duration.

### Rail: schedule, reporting events and predictions

Network Rail provides registered operational feeds without a guarantee of availability. Its public page currently describes a 1,000-user access ceiling. A working account and the current feed terms must be established before an ingest is considered ready. Its linked licence URL redirected to the general transparency page during this audit, so that link did not resolve the exact retention/redistribution conditions. [Network Rail open feeds](https://www.networkrail.co.uk/who-we-are/transparency-and-ethics/transparency/open-data-feeds/)

The desired source set is SCHEDULE/CIF, short-notice schedule changes, TRUST movements and location-reference data. Network Rail's service glossary distinguishes schedules, VSTP, TRUST and signalling-berth TD data. Start with schedules and TRUST; add TD only for a bounded corridor whose berth mapping can be validated. [Network Rail service report, glossary](https://www.networkrail.co.uk/wp-content/uploads/2025/11/Open-Data-Service-Report-P05-2025-26.pdf)

The working timetable includes freight, empty stock, depot movements and intermediate passing times. A planned path does not demonstrate that it ran. Separate scheduled availability, activation, movement confirmation, cancellation and unknown operation. [Network Rail working timetable](https://www.networkrail.co.uk/industry-and-commercial/the-timetable/working-timetable/)

Network Rail directs developers to Open Rail Data Wiki for technical documentation. Its TRUST page describes JSON messages batched every five seconds or 32 messages, incomplete reporting-point coverage, late updates and known British Summer Time anomalies in particular timestamp fields. Treat those as adapter-validation cases: compare received samples with a known service before applying any field-specific correction. Do not subtract an hour indiscriminately. [Provider-linked TRUST documentation](https://wiki.openraildata.com/index.php/Train_Movements)

**Accuracy implication:** operational reports anchor a train at particular locations and times. They do not supply a continuous GPS path. Preserve reported, expected and inferred events separately; measure event-to-receipt latency, distances between reports and plausible routing. Track-level or platform-level animation needs stronger geometry than a station-to-station line.

Darwin adds passenger-facing predictions, platforms, cancellations and timetable information through the Rail Data Marketplace. HSP provides historical service performance, described as up to one year, rather than raw continuous trajectories. Its NRE OGL includes amendments; it is not interchangeable with the ordinary OGL. Use Darwin as a separately attributed enrichment, not a second count of the same train. Confirm current subscriptions/interfaces rather than relying on legacy portal examples. [National Rail Darwin feeds and terms](https://www.nationalrail.co.uk/developers/darwin-data-feeds/)

### London, local modes and geometry

**Use All Change as the initial London data contributor.** Its existing acquisition, compiled datasets and observation archive should serve both works through versioned data releases. London is already a substantial regional foundation; the national study should build on that investment. BODS, TfL and national rail may overlap: choose a canonical service with multiple evidence sources rather than rendering duplicates.

#### All Change inventory — local inspection, 13 September 2026

The clean All Change checkout at `da94953` was inspected after the initial research. Its artifacts supersede the older 7 September London brief's bus-expansion status. This inspection establishes local artifact contents and compressed sizes, not current deployment or collector health. [Inspected edition README](https://github.com/emmettl/allchange/blob/da94953/README.md)

| Existing contribution | Evidence inspected | National use |
| --- | --- | --- |
| TfL rail, metro and tram day | Manifest declares 11,177 scheduled journeys and 508 stops for 4 September 2026; twelve two-hour chunks. | Include in the national field, retaining local stop/path identities for the descent. |
| London bus day | Manifest declares 103,117 scheduled journeys, 19,756 stop records and 670 active routes from 672 advertised; coverage is explicitly `audited-with-gaps`. | A substantial local service layer already exists. Preserve the per-route origin/coverage audit; an active route need not have every branch compiled. |
| London-area National Rail | Coverage artifact declares 8,362 journeys in Greater London and a four-kilometre fringe, with eleven corridor families. | Reuse source UID/originating-date reconciliation and local detail; join to national services without truncating them at London's display boundary. |
| River Bus and cable car | Separate dated surface artifact with 26 stops. | Optional local detail using the same service clock. |
| Operational observations | Documented Victoria/Jubilee/Elizabeth collector and recorded-day export/compiler; private R2 archive. | Reuse the collector and retained observations after checking available dates and health. These are prediction-derived records, not GPS fixes. |
| Air and road | Dated ADS-B day and WebTRIS reconstruction. | Reusable optional material, with their existing scope and evidence labels. The road date is 5 September 2025; the rail/bus date is 4 September 2026. |

The measured rail day manifest plus all twelve chunks totals **1,549,685 bytes gzip (1.48 MiB)**; the bus equivalent totals **6,522,400 bytes gzip (6.22 MiB)**. Measurements sum Python `gzip.compress(..., mtime=0)` at its default level for each local file; these are reproducible compression estimates, not observed CDN transfer sizes. The bus manifest alone is **1,883,593 bytes gzip (1.80 MiB)**, so the national opening should consume a smaller aggregate/index rather than eagerly load London's entire local topology. These totals exclude application code, extra layers and source archives. [Rail manifest](https://motionstudies.app/allchange/data/all-change-day-manifest.json), [Bus manifest](https://motionstudies.app/allchange/data/all-change-bus-day-manifest.json), [National Rail completion record](https://github.com/emmettl/allchange/blob/da94953/docs/RAIL-COMPLETION.md), [Collector guide](https://github.com/emmettl/allchange/blob/da94953/docs/CLOUDFLARE.md)

#### Share the acquisition and evidence; compose each work independently

The intended arrangement is one London acquisition/archive producing versioned data releases consumed by All Change and the national study. Shared packages continue to own reusable contracts; All Change initially owns its London adapters and authored geography/diagram work. Consumers should use an explicit artifact interface, without importing a sibling application's source tree or depending on a mutable deployment URL.

The first shared release should declare its service date/timezone, source and geometry versions, hashes, coverage, evidence classes, stable service/stop IDs, chunk formats and source-record access. Pin the release for historical editions. Raw cached TfL responses and rail downloads need a durable, indexed archive if they are to support the full evidence descent: a temporary compiler cache or a source hash alone does not make the raw records retrievable.

Use a national service identity with aliases for the London, BODS and Network Rail records. When the national source covers an Elizabeth line, Overground or mainline service already represented locally, merge its evidence and count the service once. Keep full source journeys separate from London-specific clipping or fading. Apply the same aggregation measure to London's contribution as to other regions; retain the contribution when local vehicle marks become too small to draw.

This lets the national composition reveal London as part of the whole, while All Change remains its own authored work. An eventual transition between the works can carry a pinned date, time and selection when both support them; continuity must not be promised between incompatible dates or identities.

TfL's data service has its own terms, including attribution and usage conditions. Its general government-information policy explicitly excludes open-data-user feeds from the ordinary OGL treatment. London data must carry the applicable service terms through national integration. [TfL data terms](https://tfl.gov.uk/corporate/terms-and-conditions/transport-data-service), [TfL transparency](https://tfl.gov.uk/corporate/transparency/)

NaPTAN supplies stop/access-node references and national or area downloads; it is not route geometry. Preserve stop, platform and interchange identities rather than merging by similar names. [DfT API catalogue](https://www.api.gov.uk/dft/national-public-transport-access-nodes-naptan-and-national-public-transport-gazetteer-nptg-api/)

Prefer source route shapes when valid. OS Open Roads is a downloadable OGL road-network candidate; OpenStreetMap can provide road/rail geometry under ODbL with attribution and applicable database-sharing obligations. Neither source proves which path a particular service used. Pin geometry releases and audit branches, tunnels, loops and diversions. [OS Open Roads](https://osdatahub.os.uk/downloads/open/OpenRoads), [OSM licence](https://www.openstreetmap.org/copyright)

### Roads, air and sea

DfT road statistics include annual estimates and raw count-point measurements. They support contextual totals and sampled flow, not continuous individual cars. WebTRIS offers historical strategic-road sensor data and quality queries; its site warns of a possible three-to-six-month interruption in 2026. Do not assume current archival availability from the existence of the map. [DfT downloads](https://roadtraffic.dft.gov.uk/downloads), [WebTRIS](https://webtris.nationalhighways.co.uk/), [WebTRIS API](https://webtris.highwaysengland.co.uk/api/swagger/ui/index)

Air and shipping have separate existing audits in [European air research](EUROPE-AIR-RESEARCH.md) and [MANIFEST](MANIFEST.md). Defer them until they sharpen the national thesis. They add source coverage, time and rights differences without resolving the rail/bus evidence chain.

## Data volumes: published evidence and planning estimates

### Published scale evidence

The authors' April 2026 research deposit lists five BODS `itm_all_gtfs` timetable ZIPs for 1–5 September 2025 at approximately **1.3 GB each**. Their five corrected England daily GTFS outputs range from **233.8 to 267.8 MB**. These are published file sizes, not downloads measured here; the inputs may contain services across a validity horizon and the outputs contain transformed stop times rather than the raw position archive. They establish that input and full-day analytical artifacts are much larger than an opening web scene. [Research dataset and file inventory](https://zenodo.org/records/19889312)

The official BODS extractor's own illustrative performance table reports memory problems at 16 GB RAM for stop-level extraction across 200 datasets. This is a warning about that extraction path, not a universal hardware requirement. Process partitions and avoid a whole-country in-memory expansion. [DfT extractor performance notes](https://github.com/department-for-transport-BODS/bods-data-extractor#expected-run-times-and-performance)

DfT records **30,558 local buses in England at March 2025**, with 99% equipped for AVL. Fleet size is neither simultaneous active vehicles nor complete BODS reporting. It provides an order-of-magnitude reference for the following scenarios. [DfT annual bus statistics](https://www.gov.uk/government/statistics/annual-bus-statistics-year-ending-march-2025/annual-bus-statistics-year-ending-march-2025#bus-fleet)

### Explicit capacity model

All numbers below are **engineering scenarios**, not measured feed volumes. GB/MB use decimal bytes; proposed browser budgets below use binary MiB.

For an ordinary 24-hour day, with `N` average records returned per snapshot and polling interval `s` seconds:

```text
snapshots/day = 86,400 / s
received records/day = N × snapshots/day
bytes/day = received records/day × bytes/record
```

| Average records/snapshot, at 30 seconds | Received records/day, before deduplication | 24-byte numeric core | 200-byte/record scenario | 1,000-byte/record scenario |
| --- | ---: | ---: | ---: | ---: |
| 10,000 | 28.8 million | 0.691 GB | 5.76 GB | 28.8 GB |
| 20,000 | 57.6 million | 1.382 GB | 11.52 GB | 57.6 GB |
| 30,000 | 86.4 million | 2.074 GB | 17.28 GB | 86.4 GB |

The numeric core assumes six 32-bit fields, for example dictionary IDs, day-relative time, coordinates and quality flags. It excludes strings, dictionaries, provenance, indexes, geometry and compression. The other columns are sensitivity cases for serialized records; neither is a measured XML, protobuf or compressed-wire rate. Actual retention includes original payloads as well as normalized data. Five-second full snapshots would multiply received-record volume by six if the average response population stayed constant, without necessarily adding unique observations.

At the middle scenario, a month contains 41.47 GB of numeric cores or 345.6 GB at 200 bytes per record, before other artifacts. Keeping a fresh 1.3 GB timetable bundle daily adds approximately 39 GB/month if none deduplicate. Store identical releases once by content hash while recording every retrieval. A bounded day is a modest archive project; indefinite raw snapshot retention is an operational commitment.

For a **rail stress scenario**, 25,000 service instances/day × 100 events/instance gives 2.5 million events. At an assumed 300–1,000 bytes/event this is 0.75–2.5 GB/day before compression. These are test inputs, not a count of current services or TRUST throughput; control messages, bursts and TD can materially change them. Measure the actual subscription before sizing production storage.

### Browser representation

Raw archive volume and rendered workload are different quantities. A national aggregate with 5,000 occupied spatial cells, 288 five-minute bins, three channels and 32-bit values occupies **17.28 MB before compression**, excluding metadata and membership indexes. Partition it by time and scale. This example is a sizing exercise, not a selected grid resolution or a substitute for exact contribution records.

A regional 15-minute slice containing 1,000 vehicles at 30-second intervals has 30,000 samples: **0.72 MB** for the same 24-byte core, before dictionaries and geometry. The selected journey can load its full evidence separately. Long observation histories need not remain on the GPU.

Provisional acceptance targets for the first proof:

| Resource | Target to test |
| --- | --- |
| Initial compressed study data | ≤2 MiB; report app code, fonts and total transfer separately. |
| Regional detail request | ≤5 MiB compressed per requested slice. |
| Decoded study buffers | ≤100 MiB; also measure total browser/process memory where available. |
| Interaction | 95th-percentile frame time ≤33 ms during the defined camera/selection sequence on a named physical phone. |
| First motion | ≤5 seconds on a specified cold-cache 10 Mbps / 100 ms-latency profile. |

These targets are proposed, not certified. Data partitioning, label density, trail duration and rendering resolution should respond to measurements. Neither a desktop GPU nor a phone-shaped browser viewport proves phone performance.

## Accuracy is a chain, not a single percentage

The acquisition report should distinguish:

| Dimension | Measurement |
| --- | --- |
| Coverage | Included operators, modes, regions and service periods; scheduled services with matched observations divided by included scheduled services. Also report vehicles with no schedule match. |
| Freshness | Median/p95/max event-to-receipt age and fractions older than 30, 60 and 120 seconds, broken down by source/operator. |
| Continuity | Gaps by duration, duplicate fraction, late corrections, out-of-order reports and identity changes. |
| Identity | Exact joins, ambiguous joins, unmatched observations and cross-feed duplicates, with manual review samples. |
| Geometry | Distance from received positions to proposed route; unresolved branches/diversions; map-matching displacement. This is consistency, not independent position accuracy. |
| Timing | Independent stop/event checks where possible; label inferred arrivals separately and report their method. |
| Aggregate fidelity | Membership counts and weighted contributions reconcile exactly with the canonical records and declared inclusion rules. |

An 80% observation match among acquired schedules would not imply 80% coverage of all transport. Stale repeated positions must not make a depot appear busy indefinitely; a missing feed must not make a district appear motionless. Report observed-only and scheduled fields separately. If a composite is useful, expose its source classes and substitutions.

Use UTC instants internally with Europe/London presentation and explicit operating-day IDs. A UK civil day can have 23 or 25 hours; the volume model's 86,400 seconds applies only to an ordinary day. Preserve services crossing midnight, adjacent-day context and source-specific timestamp corrections. A service's running number or vehicle ID alone is not a globally unique journey key.

## Architecture and reuse

The proposed pipeline is:

```text
dated schedules + received events + dated geometry
    → immutable source archive and retrieval manifests
    → canonical services, observations, gaps and evidence links
    → aggregate contributions + group membership indexes
    → national field / regional slices / selected-journey evidence
```

Collection belongs server-side. Append raw messages or snapshots with source time, receipt time, hash and release/version context. Normalize incrementally into date/operator/time partitions; an embedded analytical database or partitioned columnar files are suitable candidates. Measure peak memory before selecting a particular engine. A persistent rail feed requires a long-running consumer or equivalent durable connection service; a periodic static-site build is not a collector.

Immutable published editions can then use static object storage and a CDN. Precompute the opening composition and common groups. Arbitrary national queries may eventually need a server query layer; they should not require loading the full archive into a phone. Raw evidence can be served through small indexed extracts plus optional full downloadable partitions where licensed.

### What the current shared code provides

**Underfall contribution — 13 September 2026:** [PR #6](https://github.com/emmettl/motionstudies/pull/6) has merged additional evidence infrastructure into Motion Studies at `efe748d`. The [shared transport record](SHARED-GROUND-TRANSPORT.md) documents an isolated Underfall consumer proof and the remaining publication/adoption steps. These modules were subsequently published in `0.1.0-alpha.12`; wrapper adoption and the further [All Change foundations](ALLCHANGE-FOUNDATIONS.md) are tracked separately. The national study now has more of its acquisition and measurement foundations implemented; a national archive, aggregate hierarchy and constituent lookup remain unbuilt.

| Existing code | Reusable foundation | Gap for this study |
| --- | --- | --- |
| [Source store](../packages/data/src/source-store.mjs) | Bounded HTTP/local capture, immutable objects, capture history and hash-checked offline replay. | Capture is bounded in memory, not streaming to disk; national payload sizes and provider-specific request policies still need proof. |
| [UK service-day helpers](../packages/data/src/uk-service-day.mjs) | UK civil-day boundaries, overlapping UTC dates and the separate GTFS noon-based origin, including DST cases. | Does not establish the meaning of provider-local report timestamps or solve every timezone. |
| [WebTRIS normalization](../packages/data/src/webtris.mjs) | Report labels, nullable measurements, length classes and duplicate/conflict audits retained through aggregate conversion. | Pagination and capture orchestration remain edition-owned; London's existing hourly light/heavy conversion requires an explicit migration review. |
| [Aggregate-road evidence](../packages/core/src/domain/aggregate-road.ts) | Provider/dataset/site identities, per-sample source references, explicit interval kinds and separate geometry associations; duplicate slots unavailable. | Detector intervals are the finest evidence here. National spatial delivery, cross-source aggregation and constituent lookup are not implemented by this model. |
| [GTFS helpers](../packages/data/src/gtfs.mjs) | Streaming ZIP-entry rows, service-time parsing and mode helpers. | National calendar/shape validation and bounded-memory joins still need proof. |
| [Network merging](../packages/data/src/merge-network.mjs) | Common-day checks and stop/path remapping. | It preserves journey IDs as supplied and deduplicates stops by source ID; namespace providers first and explicitly reconcile overlaps. |
| [Network chunk compiler](../packages/data/src/network-chunks.mjs) | Temporal chunks and integrity descriptors. | Manifest retains shared stops/paths; whole-country geometry needs spatial/scale partitioning. Journeys overlap chunks, so aggregate counting must deduplicate. |
| [Progressive network loader](../packages/web/src/use-progressive-network-day.ts) | Verified chunks and adjacent-time loading. | A national spatial hierarchy, on-demand evidence and persistent groups need contracts. |
| [Network model](../packages/core/src/domain/network.ts) | Scheduled, realtime-adjusted and prediction-derived service states. | No general bus GPS/rail event provenance graph; do not encode observations as predictions to fit an existing type. |
| [Regional detail rules](../packages/three/src/regional-lod.ts) | Local vehicle visibility by camera scale. | Hiding buses at national scale loses their visible contribution; transition them into an aggregate representation. |

A national field should count a chosen quantity consistently: active services, departures, or vehicle-seconds of presence. Do not count incoming messages as traffic; faster reporting would become brighter movement. Preserve the chosen measure across scale changes, deduplicate shared boundaries, and avoid adding an individual marker's quantitative contribution twice during the aggregate/detail transition. Light and colour remain authored, but the underlying totals must reconcile.

For every aggregate, store its source release, interval, spatial definition, measure, filter and the index needed to retrieve contributing service IDs. For every service, retain the source-record references and transformations. Aggregate cells alone cannot reconstruct individual tracks; lossless access requires retaining the constituents separately.

## Bounded proof and decision gates

1. **Acquire compatible evidence.** Inspect one dated static national release and a 60-minute observed window, plus surrounding schedule/observation context. Use BODS and Network Rail accounts if available through the normal project setup. Inventory TfL overlap and source notices. Obtain actual file sizes, unique counts, source latency and subscription limits.
2. **Audit contrasting places.** Use one busy interchange region and one smaller-town/rural area within that same window. Publish the coverage denominator and unmatched records before selecting the most attractive scene. Keep England's national field explicitly scheduled if national observations are not yet acquired; do not call a local observation sample an observed national day.
3. **Prove the evidence chain.** One national aggregate, one defined group, one service and one original record. Check contributions, duplicate handling, retained identity, source exports and visible gaps. An account-free historical schedule proof remains useful, but cannot validate the observed thesis.
4. **Measure on a phone.** Report input/archive/compiled/transferred/decoded bytes separately, peak compiler memory, first motion, seeking, selection and camera frame time. Verify reduced-motion and keyboard paths.
5. **Expand to a complete day.** Capture it prospectively or obtain a compatible archive; include adjacent-day records. Test outages, delayed events and midnight boundaries. Add another weekday/weekend only when investigating recurrence.

The University of Glasgow UBDC archive offers historical timetable snapshots, with collection described as twice weekly since February 2023. This is a useful dated schedule fallback; it does not establish a matching raw AVL archive for an arbitrary date. [UBDC archive description](https://www.ubdc.ac.uk/news/an-open-access-public-transport-timetable-archive-for-great-britain)

### Specific unresolved acquisition questions

- **BODS:** current national response bytes and identifiers, conversion losses, usable London AVL coverage, current account limits, and any historical raw-location offering beyond the early-2026 research finding.
- **Network Rail:** account access, exact current feed licence, retained/public source-extract rights, current message rate, matching schedule/reference releases, timestamp behaviour and any replay facility.
- **TfL/TNDS:** duplication, complete-day validity, applicable notices and the precise boundary between a source file and a national derived artifact.
- **UK expansion:** Translink bulk/archive terms and identifiers; Scottish/Welsh observed coverage; cross-border continuity and local-mode completeness.

Resolve these from actual releases and supplied terms first. Provider questions should be specific to a missing condition; open-licence sources do not need a generic request for permission to make an artwork.

## Audit limitations and decision

The BODS download-header check, retried with host networking after sandbox DNS failure, returned a login redirect; the subsequent login HEAD response was 403. This establishes that the unauthenticated path did not yield a dataset, not that the user's credentials are invalid. No national payload was downloaded and no empirical completeness, latency or compression claim is made. Published archive sizes and the arithmetic scenarios above are deliberately distinguished.

Proceed to a source-bounded prototype after acquisition checks. The national data scale appears manageable with offline compilation and selective delivery. The distinctive engineering work is maintaining evidence and contribution identity across aggregation, rather than merely drawing more vehicles. The artistic decision remains whether the resulting differences of rhythm sustain the [proposed thesis](NATIONAL-STUDY.md).
