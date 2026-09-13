# Power — the national study's second axis

[National study](NATIONAL-STUDY.md#a-second-axis-power-weather-and-light) · [Feasibility](NATIONAL-DATA-FEASIBILITY.md) · [Readiness register](DATA-READINESS.md) · [Shared fields](SHARED-FIELDS.md) · [Series vision](VISION.md#the-view-from-altitude--13-september-2026)

**13 September 2026 — sources probed, nothing acquired.** This brief records what the electricity sources actually contain, how their evidence maps onto the series' scheduled/observed/estimated distinctions, and how a generating unit can be placed on the map. Counts come from unauthenticated requests made on 13 September and are kept in the [probe record](evidence/power-sources-2026-09-13.json). No dataset was retained beyond aggregate counts; no capture policy has run.

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

Interconnectors are literal flows across borders. Their eleven landing points are curated the same way, and their direction of flow in each period is the sign of the quantity.

## Licences

Generation, plans and demand outturn are BMRS data under Elexon's open licence, with the fixed statement “Contains BMRS data © Elexon Limited copyright and database right [year]”, the year being the data's, and a link to the licence. Geometry and registers are under the NESO Open Data Licence v1.0, with the statement “Supported by National Energy SO Open Data”, third-party components excluded and throttling reserved. The planning database is Open Government Licence v3.0. Both energy statements travel together wherever generation and demand share a view, and into any compiled artifact that redistributes the data. See the [readiness register](DATA-READINESS.md#questions-we-can-close-or-narrow-now).

## Capture plan for a dated day

For a chosen study day, at least eight days later:

- Retrieve the 48 settlement periods of actual generation per unit, the day's physical notifications, the day's five-minute fuel mix and the day's demand outturn from the Insights API, one bounded request each, with dates, hashes and byte counts recorded through the shared source store.
- Retrieve the unit register, the GSP lookup and boundaries, the transmission entry capacity register and the planning database extract as dated captures with the same provenance, since all four change.
- Compile a compact per-unit day: for each placed unit, 48 settled quantities and the declared profile; for the country, the fuel mix at five minutes and demand at thirty. The settled day is roughly 440,000 rows before compilation and a few megabytes after.

The Insights API needs no key and is open; requests should still be few, dated and cached. The NESO portal reserves throttling.

## What this axis can and cannot say

It can show which stations were running, at what output, when the country's morning demand rose, and how much of that morning came from wind, gas, nuclear and cables. It can place that beside the bus and rail field on the same clock. It cannot show consumption below a grid supply point except as an estimate, cannot attribute any unit's output to any place's demand, and cannot say why a unit ran. The demand haze must never corroborate a transport reading, because both would then be drawn from settlement density.

## Open questions

- Elexon's GSP period data: format, lag and access. The Elexon website blocks automated retrieval, so this is a manual check.
- The join rate from the unit register to the planning database, measured on the actual extract.
- Third-party components inside the NESO boundaries and registers.
- Whether the shared field modules' support channel, tuned for radar sites, needs a different kernel for grid supply points, whose catchments are polygons rather than ranges.
