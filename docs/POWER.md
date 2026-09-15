# Power — the national study's second axis

[National study](NATIONAL-STUDY.md#a-second-axis-power-weather-and-light) · [Feasibility](NATIONAL-DATA-FEASIBILITY.md) · [Readiness register](DATA-READINESS.md) · [Shared fields](SHARED-FIELDS.md) · [Series vision](VISION.md#the-view-from-altitude--13-september-2026)

**Updated 15 September 2026 — recorded power view implemented in England; partial placement and shared reader released.** Initial source counts come from the 13 September [probe record](evidence/power-sources-2026-09-13.json), which retained only aggregate findings. The subsequent capture and placement of the 5 September day are recorded below. Acquisition and the private evidence handoff live in the recorder; placement and the first power composition now live in England. Core supplies the shared power-day reader.

## Why power, in one paragraph

Electricity has the same three-scale structure as transport and runs on the same clock for a different reason. National demand is the sea and is spatially flat. Generation per balancing-mechanism unit is the fish: a named station, wind farm or interconnector at a place, reporting output through the day. Great Britain's grid is an electrical island whose morning is increasingly met by North Sea wind and continental cables. Laid beneath the transport figure, it is a second witness to the country waking up that was not derived from where the buses are.

## The evidence, and what kind it is

The series distinguishes scheduled, observed, estimated and reconstructed movement. Electricity offers the same kinds, with one reversal of transport's timing: the live sources are aggregate, and the per-unit truth arrives about a week later.

| Kind | Source | Resolution | When available | Reading |
| --- | --- | --- | --- | --- |
| **Scheduled** | Elexon Insights `datasets/PN`, physical notifications | Per unit, output profile within each half hour (about 2,700 rows per period) | Ahead of real time, revised until gate closure | The unit's declared plan: the timetable of the power station. |
| **Observed, live, aggregate** | Elexon Insights `datasets/FUELINST` | National, by twenty fuel types including eleven interconnectors | Every five minutes | Where the country's power is coming from now. Not per station. |
| **Observed, settled, per unit** | Elexon Insights `datasets/B1610`, actual generation output per unit | Per unit, half-hourly (about 9,150 rows per period) | About a week after the day: on 13 September, 5 September was available and 7 September was not | The metered actual for each station: the fish. |
| **Observed, demand** | Elexon Insights `demand/outturn` | National, half-hourly (INDO and transmission system demand) | Shortly after each period | The sea, spatially flat. |
| **Observed, demand by grid supply point** | Elexon Open Settlement Data, GSP period data | Per GSP, half-hourly | Settled, lagged; not yet verified | The measured demand at a few hundred points. NESO's GSP boundaries carry the Elexon GSP identifiers for this join. |
| **Estimated** | Demand spread below a GSP by built volume | Grid | Compiled | The haze, rendered with the shared supported-field support channel; never drawn as a point. |

Two consequences follow. A live power axis can only show fuel-type aggregates and declared plans per unit; the settled per-unit actual belongs to a recorded day compiled at least a week afterwards, which is the study's intended form anyway. And the scheduled/observed contrast that transport draws between a timetable and a vehicle report exists here between a physical notification and a settlement quantity, so a unit's light can be drawn in the same two treatments.

## Registers and geometry

- **Balancing-mechanism unit register**, Elexon Insights `reference/bmunits/all`, open, 3,071 units. Gives identity, name, lead party, unit type, generation and demand capacity, GSP group, and a fuel type for 587 units: 284 wind, 65 CCGT, 36 hydro, 26 OCGT, 18 biomass, 16 pumped storage, 16 nuclear, 10 coal, 103 other, plus interconnector units. It carries no coordinates.
- **Grid supply point lookup**, NESO data portal, 380 rows with latitude and longitude for each GSP and its grid node, its region name and GSP group. This is the coordinate backbone of the axis.
- **GSP boundaries**, NESO, 333 regions in the 2022 GeoJSON (13 MB), each tagged with its GSP identifier and group. NESO describes them as approximate Thiessen-derived regions built from the lowest asset with a topological path to a GSP; newer 2025 versions are published as shapefiles. Use them as the catchment of a demand measurement, not as a territory.
- **Transmission entry capacity register**, NESO, 2,198 projects of which 375 are built, totalling about 81.8 GW connected. Names each project's connection site and plant type, without coordinates. A rough string join places about half the built sites at a named GSP or grid node.
- **Renewable energy planning database**, Department for Energy Security and Net Zero, Open Government Licence v3.0, quarterly, latest extract July 2026. Renewable projects over 150 kW with x/y coordinates since 2021. Not yet retrieved.

## Placing a unit

A unit's position is evidence with a method, recorded per unit and shown in its provenance card:

1. **Site coordinate.** Join the unit's name and lead party to the renewable planning database for wind, solar, hydro and biomass. This is the only source that places a site rather than a connection.
2. **Connection point.** Join to the transmission entry capacity register and place the unit at its connection site's GSP or grid-node coordinate from the lookup. Label it as the connection point, not the station.
3. **Curated.** The remaining large thermal, nuclear and pumped-storage sites number in the low hundreds. Place them from the Department's power station list under the Open Government Licence, one recorded source per site.
4. **Unplaced.** A unit that fails all three stays in the ledger and the totals, and does not appear on the map. The count of unplaced capacity is shown beside the field.

**First placement run, 14 September 2026, on the 5 September day** ([audit](evidence/power-placement-2026-09-05.json)): 267 of 451 generation units placed, 46.1 of 83.3 GW of registered capacity. By method: 195 sites from the planning database, 72 connection points from the TEC register, none curated. By fuel: wind 160 of 232 units and 22.3 of 30.5 GW; biomass 8 of 12; pumped storage 12 of 16; nuclear 6 of 14; CCGT 18 of 58 and 10.5 of 31.6 GW. The matcher uses a technology gate, number disambiguation, a four-letter prefix rule for code-like names, a lead-party fallback and a capacity plausibility test; each placement carries its score and matched record. The unplaced remainder is 184 units, of which 95 matched a TEC project whose connection site is a transmission substation absent from the supply-point lookup, and 89 matched nothing confidently. The largest are the CCGT fleet and the nuclear stations. That is the curated list this section anticipated, and it should be compiled from an Open Government Licence source with a citation per site rather than from memory. Interconnector landing points are in the same position.

Interconnectors are literal flows across borders. Their eleven landing points are curated the same way, and their direction of flow in each period is the sign of the quantity.

## Licences

Generation, plans and demand outturn are BMRS data under Elexon's open licence, with the fixed statement “Contains BMRS data © Elexon Limited copyright and database right [year]”, the year being the data's, and a link to the licence. Geometry and registers are under the NESO Open Data Licence v1.0, with the statement “Supported by National Energy SO Open Data”, third-party components excluded and throttling reserved. The planning database is Open Government Licence v3.0. Both energy statements travel together wherever generation and demand share a view, and into any compiled artifact that redistributes the data. See the [readiness register](DATA-READINESS.md#questions-we-can-close-or-narrow-now).

## Capture plan for a dated day

For a chosen study day, at least eight days later:

- Retrieve the 48 settlement periods of actual generation per unit, the day's physical notifications, the day's five-minute fuel mix and the day's demand outturn from the Insights API, one bounded request each, with dates, hashes and byte counts recorded through the shared source store.
- Retrieve the unit register, the GSP lookup and boundaries, the transmission entry capacity register and the planning database extract as dated captures with the same provenance, since all four change.
- Compile a compact per-unit day: for each placed unit, 48 settled quantities and the declared profile; for the country, the fuel mix at five minutes and demand at thirty. The settled day is roughly 440,000 rows before compilation and a few megabytes after.

The Insights API needs no key and is open; requests should still be few, dated and cached. The NESO portal reserves throttling.

**Implemented 13 September 2026** as Underfall's `data:power:day` command, subsequently extracted into `motionstudies-recorder`: one bounded request per settlement period for settled generation and for physical notifications, one each for the fuel mix and demand, and the unit register, supply-point lookup, boundaries and current TEC register. Every response is a dated, hashed object served from the store on rerun; an unsettled period fails without being cached; `--offline` replays. The compiled day carries settled quantities with their run types, declared profiles, register fields, national aggregates, both attribution statements with the data year, an audit and the source records. This stage marks units `unplaced`; the separate placement command produced the first placement run above.

**First settled day, 5 September 2026, compiled 14 September.** 103 dated sources; 439,296 settlement rows from the initial interim run; 9,152 settled units, of which 2,594 are in the unit register and 481 carry a fuel type. The remaining units are supplier and demand-side balancing units with small or negative quantities: the per-period sum across all units is near zero, so the settlement set is a balanced ledger, not a list of stations, and the generation field must be the fuel-typed subset. The eight largest units by day energy are the four nuclear stations' generators, two Drax biomass units and a CCGT, at 11,000 to 15,800 MWh each, consistent with their capacities. National demand ran from 14.8 to 26.9 GW and wind from 2.4 to 14.4 GW across 289 five-minute instants. 2,466 units carried declared profiles, 105 of them without settlement. The compiled day is 13.5 MB, 743 KB compressed. It lives in Underfall's work store, not in this repository.

## What this axis can and cannot say

It can show which stations were running, at what output, when the country's morning demand rose, and how much of that morning came from wind, gas, nuclear and cables. It can place that beside the bus and rail field on the same clock. It cannot show consumption below a grid supply point except as an estimate, cannot attribute any unit's output to any place's demand, and cannot say why a unit ran. The demand haze must never corroborate a transport reading, because both would then be drawn from settlement density.

## Ownership and handoff

**15 September 2026 — first migration implemented.** Split the power work between [the recorder](https://github.com/emmettl/motionstudies-recorder), [England](https://github.com/emmettl/england) and small public contracts in Motion Studies. The recorder preserves and normalizes evidence; England decides how it becomes a work; core lets producer and consumer agree on its meaning.

| Owner | Responsibility | Boundary |
| --- | --- | --- |
| `motionstudies-recorder` | Elexon/NESO/DESNZ requests, source registers, bounded retries, hashed captures, offline replay, settlement revisions, source normalization and dated evidence releases | No scene, geographic composition, station-matching policy or browser-triggered collection |
| `england` | Unit-to-site matching, curated coordinates and citations, connection-point treatment, generation subset, grouping, England/GB scope, demand-estimation method, compact publication and the power composition | Reads explicit dated releases; no imports from the recorder's source or dependence on its private work-directory layout |
| `@motionstudies/core` | Browser-safe types, validation and readers for the shared power-day contract; pure interval lookup and aggregation where demonstrated; reuse existing field and daylight primitives | No provider calls, filesystem access, capture scheduling, curated British station lists or artistic choices |
| `@motionstudies/data`, if justified | Reusable offline parsing or compilation helpers proven useful beyond one local adapter | Provider-specific capture stays in the recorder initially; do not put Node-only tooling in core or extract every helper just because it exists |

The reader/writer contract is already a shared need even with one artwork: the recorder and England must agree on units, clocks, revisions and provenance. `core/domain/power-day` is implemented and published in `0.1.0-alpha.21`, exercised by the recorder writer and England reader against the retained 5 September day. It should preserve explicit value units and interval boundaries, missing values, signed quantities, source identity, settlement run/as-of information and evidence references. Keep energy over an interval distinct from power at an instant or an interval average; do not silently interpolate one into another. Preserve 46/48/50-period civil days and distinguish planned from settled values.

Keep the provider ledger and the study's generation population separate. Supplier/demand-side units and unplaced generation remain in the evidence release and its audit; England states which records contribute to each measure. Registered capacity is not output, and a national fuel-mix total must not be presented as the sum of the placed stations unless that reconciliation is actually established.

Core already has `supported-field`, `gridded-series` and `daylight`. Reuse them where their semantics fit. GSP demand needs a justified spatial allocation method; the existence of a station-weighted field kernel does not settle that choice. A reusable renderer belongs in `@motionstudies/three`, and reusable controls in `@motionstudies/web`, only when extraction is justified. Start the power layer and its authored treatments in England.

The artifact path should be:

```text
Recorder: private captured objects + normalized dated evidence release
    → England build: placement + declared measures + composition compiler
    → permitted static power-day artifacts + evidence extracts
    → England browser: core reader + local power layer on the study clock
```

Capture dates, register versions, input hashes, schema/method versions, placement citations and source rights must survive each handoff. The browser loads published artifacts; it does not query Elexon or the private archive. Apply the [series cost controls](COST-CONTROL.md) to every retained copy and processing job.

### First migration

Before migration, `scripts/feeds/power.mjs` combined acquisition with compilation, while `scripts/place-power-units.mjs` both captured REPD and placed units. Acquisition/normalization remain in the recorder; `data:power:release` now captures the register separately and emits a versioned, verified evidence handoff. England owns `scripts/power/placement.mjs`, the curated list and `data:power:compile`. The old recorder placement command reports its replacement and leaves stored evidence unchanged.

The first implementation keeps the acquisition path working, replays retained sources offline and reproduces the 451 generation units / 267 placed result. England renders national demand, fuel mix, explicit fuel groups and one selected unit on a recorded clock, with on-demand original JSON record extracts. Tests reconcile every displayed settlement quantity and all 48 group totals to the retained records. The main day artifact is 1,038,840 bytes (199,445 bytes gzip); all evidence extracts and release metadata total 27,888,058 bytes. The private handoff is 171,107,725 bytes. No new cloud collection or production hosting route was enabled. See [England's implementation record](https://github.com/emmettl/england/blob/main/docs/POWER-DAY.md) and [the recorder handoff](https://github.com/emmettl/motionstudies-recorder/blob/main/docs/POWER-RELEASE.md).

## Open questions

- Elexon's GSP period data: format, lag and access. The Elexon website blocks automated retrieval, so this is a manual check.
- Improve the measured unit-placement coverage, especially large gas/nuclear stations and interconnectors, using cited curated locations and reviewing ambiguous matches.
- Third-party components inside the NESO boundaries and registers.
- Whether the shared field modules' support channel, tuned for radar sites, needs a different kernel for grid supply points, whose catchments are polygons rather than ranges.

## Alpha.21 validation and remaining work

The [trusted publication run](https://github.com/emmettl/motionstudies/actions/runs/35025364632) publishes the four coordinated shared packages. The new power reader is opt-in; England and the recorder adopt exact registry pins. Local shared checks passed 331 tests and 96 packed-consumer browser checks. England's real-day check resolves every displayed settlement value to its source and verifies all aggregate intervals; browser checks cover grouping, station selection, scrubbing and changing source evidence. The parallel geography work supplies boundaries, rivers and lakes.

Curated missing locations, interconnector treatment, per-GSP demand and a matching transport day remain subsequent work. The first screen does not imply complete generation coverage or a settled geographic title. Elexon's [current API definition](https://data.elexon.co.uk/swagger/v1/swagger.json) specifies B1610 as interval MWh and describes the initial II run five days after delivery, revised by later runs. The earlier probe found a longer availability gap; the recorder's seven-day guard remains a conservative acquisition policy, not a guarantee of publication.
