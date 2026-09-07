# Sydney — title to find

**An unnumbered Sydney motion study**

**Catalogue status:** strong documented source path and CC BY baseline; account/export validation, matching historical coverage and crossing classification remain open.

**Data-readiness update — 7 September 2026:** see the [current access/provenance register](DATA-READINESS.md#city-by-city-register) and [focused provider questions](DATA-QUESTIONS.md). Later findings there supersede the corresponding open questions in this dated audit.

**Naming direction — 7 September 2026:** **Water Between** is the preferred working candidate for discussion. See [name alternatives, proposed thesis and opening commitment](NAMING.md#sydney). This is not a catalogue admission or a change to the dated source verdict.

## Thesis under test

Sydney is a rail city repeatedly interrupted by water, then connected again by bridges, tunnels and ferries. The local sentence is **water alternately acting as barrier, corridor and seam**. The strongest composition should show rail disappearing into fixed crossings while ferry services occupy the open harbour between them.

Unlike several candidates, Sydney has official static, realtime and historical products across the defining modes. The main risk is not motion data but overstating the physical precision of crossings and vessel paths.

## Feasibility verdict — 6 September 2026

| Scope | Status | Defensible interpretation |
| --- | --- | --- |
| Scheduled multimodal motion | **Green** | Transport for NSW publishes complete GTFS with stops, trips, schedules and shapes across train, metro, bus, ferry and light rail. |
| Observed/adjusted operations | **Green** | Official GTFS-Realtime bundles include trip updates, vehicle positions and alerts for the relevant modes. Feed-specific coverage and update behaviour must be inspected. |
| Historical ferry/metro replay | **Green with account/API workflow** | TfNSW publishes historical GTFS and GTFS-Realtime products under CC BY. Documentation gives ferry and metro coverage from 2019/2020; GTFS Studio offers another bounded historic-access workflow. |
| Harbour and crossing context | **Green / amber classification** | NSW Spatial Services supplies open hydrography and coastal elevation products. Bridge/tunnel/ferry state and exact deck/tunnel elevation still require authored source-backed segments. |
| Publication rights | **Green in principle** | TfNSW identifies relevant datasets as Creative Commons Attribution. Registration/key conditions and exact attribution must be retained. |

Sydney passes the catalogue's authoritative-source-path test. It is one of the few candidates where a bounded observed historical work can be designed before building a custom recorder.

## Transport for NSW source model

The [TfNSW Open Data documentation](https://opendata.transport.nsw.gov.au/developers/documentation) describes complete static GTFS and realtime GTFS bundles for Sydney and NSW operators. Static data supplies schedules, stops and shapes; realtime supplies trip updates, vehicle positions and alerts. Access to APIs and downloads may require a registered account and key.

The [Historical GTFS and GTFS-Realtime dataset](https://opendata.transport.nsw.gov.au/dataset/historical-gtfs-and-gtfs-realtime) is the critical reproducibility source. Its historical API documentation records:

- ferry static timetable availability from 1 December 2019;
- ferry vehicle-position/trip-update availability from 21 December 2019;
- metro static timetable availability from 26 June 2020; and
- metro vehicle-position/trip-update availability from 30 June 2020.

The API documentation describes bounded query windows, while TfNSW's newer GTFS Studio materials describe a rolling historical GTFS-Realtime workspace. Treat these as separate products until actual access, retention window and export format are tested; do not assume their coverage is identical.

TfNSW's [GTFS/GTFS-R implementation specification](https://opendata.transport.nsw.gov.au/sites/default/files/2025-09/TfNSW%20GTFS%20%20GTFS%20R%20Implementation%20Specification%20v2%20June%202025.pdf) and [troubleshooting guidance](https://opendata.transport.nsw.gov.au/developers/troubleshooting) are part of the compiler contract. Sydney Trains trip/service IDs can change with timetable versions and source-specific extensions exist. Pair every realtime record with the exact static release, service date and bundle; never treat a reused public route label as trip identity.

## Historical and realtime semantics

Vehicle positions are the best opening motion source, but they are still operational messages rather than a surveyed continuous track. Preserve source timestamps, trip relationship, occupancy/congestion fields only where documented, and stale/missing intervals. Interpolation bridges short message gaps; it should not smooth a teleport, infer an unreported harbour course or cross an impossible branch.

For ferries, compare vehicle positions with the scheduled trip and shape. A GTFS shape is service geometry; a vehicle position is an observation with update cadence and accuracy limits. The visible trail should distinguish reported points from interpolation.

For trains/metro, a position may be snapped or inferred by the producer. The implementation specification, not generic GTFS assumptions, controls the interpretation.

## Rights and publication

The [TfNSW Open Data FAQ](https://opendata.transport.nsw.gov.au/faqs) states that Creative Commons Attribution datasets can be reused and redistributed with attribution. Retain the licence field and required credit for each dataset, along with account/API terms in force at acquisition.

**7 September clarification:** the [Data Licence page](https://opendata.transport.nsw.gov.au/datalicence) and inspected Hub Terms identify CC BY 4.0 as the dataset baseline. Compliant historical reuse does not require a generic extra permission letter. Retain the actual export terms, provider attribution and modification notice; verify account access and static/realtime overlap. Hub access conditions and third-party assets remain separate.

## Harbour, water and terrain

NSW Spatial Services' foundation framework documents open [hydrography and elevation products](https://www.spatial.nsw.gov.au/__data/assets/pdf_file/0005/232790/Products-and-Services.pdf). Coastal LiDAR-derived DEMs can be one or two metres; product metadata warns that the bare-earth DEM is not hydrologically enforced. Use hydrography/coastline for water boundaries rather than deriving shoreline from the DEM alone.

Compile each transport link with a sourced crossing state: open-water ferry, bridge, tunnel, surface shore or unknown. A route crossing a water polygon does not prove a tunnel; a ferry shape does not prove a navigational channel. Exact Harbour Bridge deck and rail/tunnel vertical values require engineering or authoritative 3D data if the camera uses true section.

## Evidence boundaries

| Intended claim | Evidence required | Present feasibility |
| --- | --- | --- |
| A service was scheduled | Exact static GTFS release and calendar | **Yes.** |
| A ferry/train reported a position | Matched historical GTFS-R vehicle position and timestamp | **Yes for documented coverage.** |
| It travelled continuously along the rendered path | Observations plus conservative interpolation and topology | **Yes with visible gap rules.** |
| Water forced or enabled this crossing | Hydrography and source-backed bridge/tunnel/ferry classification | **Strong, classification still to compile.** |
| A vehicle carried a stated number of people | Validated occupancy/APC data | **Not assumed.** |

## Recommended proof

Use a historical weekday **07:00–09:00 Circular Quay–Harbour Bridge–lower North Shore field**, with ferry vehicle positions and train/metro realtime only where the historical bundles overlap cleanly. Keep Manly or wider harbour branches lazy. Let water shift from dark void to luminous network when ferries are isolated, then back to barrier as fixed rail crossings take focus.

### Source gate

- [ ] Register TfNSW Open Data access and inventory static/realtime/historical bundles.
- [ ] Select one date with complete matching static and GTFS-R coverage; hash all exports.
- [x] Establish the published CC BY 4.0 dataset baseline and attribution requirement.
- [ ] Retain the chosen export's licence and any resource-specific conditions with its hashes.
- [ ] Validate producer-specific trip IDs, extensions, timestamps and stale-message rules.
- [ ] Acquire a simplified NSW hydrography/elevation crop and source crossing states.
- [ ] Pass phone payload/frame gates with observed points and gaps still legible.

**Exit:** Sydney advances when one historical harbour morning remains reproducible and makes every bridge, tunnel, ferry and missing observation semantically explicit.
