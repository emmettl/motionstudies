# KRAFT Swiss passage

[Study brief](KRAFT.md) · [European source audit](KRAFT-SOURCES.md) · [Swiss probe record](evidence/kraft-swiss-2026-11-01.json)

The [extended survey](KRAFT-SURVEY.md) adds workbook reconciliation, verified resource terms, installation geography, weather and comparison days. It establishes quarter-hourly Swiss regional series while preserving the unresolved Energy-Charts differences.

**1 November 2026.** Switzerland offers a concrete first passage for KRAFT: simultaneous exchanges with different neighbours, changing hydro output and a descent into modelled regional solar production. The acquired day supports this relationship at area level. Individual power-station operation and pumping consumption remain unverified.

## A day whose net total hides its movement

In the frozen Energy-Charts responses for **16 September 2026, 00:00–24:00 UTC**, Switzerland imports from France and exports to Italy in every quarter-hour. Integrating the supplied GW interval values gives 47.192 GWh from France and 40.068 GWh to Italy. Yet Switzerland's all-border signed daily balance is only −0.5455 GWh, a small net export. Gross exchanges and net balance tell very different stories.

These are calculations from the [retained six-country captures](evidence/kraft-sources-2026-11-01.json), reproduced by the [Swiss audit](../scripts/research/kraft-swiss-audit.py). They describe simultaneous exchanges, not proof that the French electricity traversed Switzerland to Italy. The schematic bands must stop at the Swiss reporting area rather than suggesting a traced station-to-city journey.

The German border offers a changing relationship within that wider pattern. These are the starts of sign spans at quarter-hour resolution; the first row is the opening state, not an observed reversal:

| Swiss local interval start, CEST | German exchange relative to Switzerland | Power at start |
| --- | --- | ---: |
| 16 September 02:00 | Export | 184 MW |
| 09:00 | Import | 542 MW |
| 17:00 | Export | 206 MW |
| 22:30 | Import | 62 MW |
| 17 September 00:00 | Export | 307 MW |

The UTC composition day spans 02:00 to 02:00 locally. A reversal is resolved only to its source interval; a visual transition must not claim an exact switching instant.

## The proposed descent

Begin with all four Swiss neighbours visible. Hold the French and Italian bands long enough to see their simultaneous movement. Select Germany as its exchange changes sign; keep France and Italy faintly visible so the selected relationship retains context.

Descend into Switzerland's generation history on the same clock. Run-of-river, reservoir hydro and pumped-storage generation have separate source series. They belong in an area-level composition until per-site output is acquired. Plant coordinates can supply infrastructure context, but cannot distribute national output among stations.

Then reveal an Alpine district's solar estimate against daylight. The BFE API returned **24 hourly timestamps for Entremont** inside the UTC day, with model estimates and lower/upper fields. The peak returned estimate is at 09:00 UTC (11:00 CEST): 7,351 kWh, with bounds 5,901–8,801 kWh. The sample also contains a separate Pronovo-based estimate. Keep these fields distinct; interval energy semantics and the meaning of the bounds need confirmation before a power animation or probabilistic label.

The [BFE solar explanation](https://www.dashboardenergie.admin.ch/strom/produktion-pv) identifies regional production as modelled and warns that national aggregation can differ from other statistics. Render the district as a soft supported area, with its estimate visible on selection. A district geometry/date join remains to be acquired and verified.

This passage connects three kinds of evidence: reported border exchange, national generation categories and modelled regional production. Reservoir levels can provide slower seasonal context later; weekly regional storage records cannot establish within-day lake-level changes.

## What the direct BFE probes establish

The [official API guide](https://www.bfe-ogd.ch/apiguide_edb_de_en.pdf) documents catalogue, metadata and data endpoints, time filters, pagination and exact string filters. The tested base is `https://energiedashboard.ch/api/v1/datasets`. The catalogue returned these relevant datasets:

| Dataset ID | Acquired evidence | Consequence |
| --- | --- | --- |
| `stromproduktion-swissgrid` | Six production categories for the date, in daily GWh | Daily context, not a new intraday generation source |
| `stromverbrauch-swissgrid-lv-und-endv` | Dated national and final consumption, in GWh | Distinct consumption populations; revisions must remain identifiable |
| `pv-stromproduktion-estimate` | District records with hourly UTC timestamps and estimate/bound fields in kWh | A plausible regional model layer despite the catalogue's daily label |
| `taegliche-fluesse-strom-schweiz` | Catalogue description only: daily aggregation of ENTSO-E exchanges | Does not improve our quarter-hourly border resolution |

For the three acquired datasets, the metadata includes schema, update timestamp and snapshot identifier. Retain snapshot IDs as strings in future capture tooling to avoid integer precision loss in JavaScript. The inspected day responses have no embedded licence statement.

Time filtering is inclusive in the samples: both 16 and 17 September appear in the daily responses, and the district response includes the following midnight. Filter the exclusive end locally. Responses are not chronologically ordered. The unfiltered PV request reaches the 1,000-row cap and is incomplete; the exact district filter `filters=bezirk===Entremont` returns a bounded, inspectable sample. A full Swiss layer needs pagination, deduplication and coverage checks per district and timestamp.

The consumption description says revisions are appended and the last entry for a date is current. The inspected schema provides no explicit revision timestamp and the query has no demonstrated ordering guarantee. Preserve all records and resolve this before implementing a “latest” selector.

## A discrepancy to preserve

For the date labelled 16 September, BFE returns national consumption of **163 GWh** and final consumption of **145 GWh**. The Energy-Charts load integral for **16 September 00:00–24:00 Europe/Zurich** is **188.3001 GWh**. Aligning the Energy-Charts window to the local day therefore does not remove the difference. The BFE dated schema itself supplies no timezone definition, and scope, revisions and upstream methodology still need checking. This is an unresolved comparison, not proof either source is wrong.

The BFE daily production categories also do not simply reproduce all integrated Energy-Charts categories. Do not merge their daily and intraday numbers into one reconciled ledger. BFE's [methodology](https://www.dashboardenergie.admin.ch/strom/winterproduktion) explains that timely production combines measurements, models and schedule information, with different coverage for large and small generators. “Recorded” refers to frozen published evidence, not a guarantee that every value is a meter observation.

No pumping-consumption series was returned in the acquired Swiss Energy-Charts response. Pumped-storage generation alone cannot establish when electricity was used to lift water, its amount or a particular reservoir's state. Keep the pumping treatment pending.

## Coverage and rights before publication

[Swissgrid's generation page](https://www.swissgrid.ch/en/home/operation/grid-data/generation.html) says submitted records can change for six months. The subsequent [workbook audit](KRAFT-SURVEY.md#swiss-reconciliation) verifies quarter-hourly national and selected regional records and shows that the dated consumption totals round to BFE's figures. A French-border discrepancy remains alongside the load discrepancy. [Swissgrid's general terms](https://www.swissgrid.ch/en/home/footer/legal-information.html) restrict public/commercial reuse without consent; download access alone is insufficient clearance.

The [BFE API service catalogue](https://www.i14y.admin.ch/en/catalog/dataservices/d61f1d8e-4552-470f-a939-cc175f969c03) labels the service public and open-use. The extended survey successfully retrieved CKAN resource metadata after the initial HTTP 403 responses: production and consumption resources link to attribution plus prior permission for commercial use (`terms_by_ask`). That resource condition must travel with any release. The plant register separately links to attribution-only open-use terms (`terms_by`). The [plant-register page](https://opendata.swiss/en/dataset/elektrizitatsproduktionsanlagen) describes registered operating installations, not historical output or a guarantee of every small plant's inclusion. A current register also cannot establish the exact population on the study date.

The first proof can use the already captured Energy-Charts series under their explicit response declarations, subject to the European audit's rights checks. A published regional solar layer waits for its dataset-specific terms, interval definitions, boundary geometry and coverage audit. No new account, external message, paid service or collection schedule was created.

## Next experiment

Build one frozen Swiss passage with four border bands, a persistent German-border selection and native-resolution generation charts. Show the selected source interval and keep the net balance available beside the separate exchanges. Add Entremont as a modelled regional layer once its interval semantics and resource terms are confirmed. Keep source discrepancies accessible in the evidence view and make no claim about individual plants or the reason for a reversal.

The [offline audit](../scripts/research/kraft-swiss-audit.py) verifies interval coverage and reproduces the numerical findings. Raw Swiss samples remain in ignored `work/kraft-source-probe/swiss-2026-11-01/`; the committed summary records hashes and sizes. Exact retrieval instants were not retained for these exploratory calls. Future publication captures must retain them, response headers, query URLs and resource terms together.
