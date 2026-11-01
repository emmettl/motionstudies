# KRAFT Swiss reconciliation

[Rights register](KRAFT-RIGHTS.md) · [Provider requests](KRAFT-PROVIDER-REQUESTS.md) · [Reproducible audit](../scripts/research/kraft-reconcile.py) · [Results](evidence/kraft-reconciliation-2026-11-01.json)

**1 November 2026.** The comparison now has a tested clock interpretation, an unambiguous frozen BFE consumption snapshot and a category-level source-method explanation. It does **not** establish a single reconciled Swiss energy balance. The remaining load, French-border and reservoir-generation differences require provider clarification. The Italian comparison also fails at quarter-hour resolution despite near-equal daily totals.

## Clock and revision handling

The workbook identifies the post-2025 timestamp as an interval start. Its 29 March 2026 sheet contains **92** quarter-hours: 02:00–02:45 is absent, while the preceding/following dates have 96. This is direct structural evidence of a CET/CEST civil clock, consistent with Europe/Zurich, rather than a continuous UTC clock. It is not a provider-certified timezone statement. For 16 September, the comparison uses **15 September 22:00 UTC through 16 September 22:00 UTC**, exclusive end. The artwork's recorded UTC day remains unchanged.

All 96 workbook intervals are present on the study date, rows **24767–24862** in `Zeitreihen0h15`. kWh per quarter-hour is converted to interval-mean MW by multiplying by four and dividing by 1,000. Hourly Energy-Charts load is compared with the sum of four workbook energy intervals divided by 1,000. No interpolation or duplicated hourly evidence is introduced.

The freshly captured BFE consumption CSV contains **3,560 distinct dates and no duplicate dates**. On the study date it has exactly one row: national consumption **163 GWh**, final consumption **145 GWh**. These equal the earlier API row and the rounded workbook totals **163.355258393 GWh** and **144.538574935 GWh**. This closes the frozen-day revision-selection problem: use the pinned, rights-described CSV and reject duplicate dates if a future snapshot changes its structure. It does not establish ordering semantics for a future API response with appended revisions. All original records and snapshot IDs must be retained; do not implement “last response row wins”.

## National load and generation

Local-day Energy-Charts load is **188.3001 GWh**, exceeding workbook total consumption by **24.944841607 GWh**. Native hourly differences range from about **−299 MW to +2,414 MW**. The difference is neither a constant offset nor removed by the civil-day alignment. No value has been corrected to force agreement.

The [Swiss Energy-Charts source explanation](https://energy-charts.info/sources.html?l=en&c=CH), retrieved in its published page-content bundle, describes a changed method from January 2025 following interrupted Swiss generation reporting to ENTSO-E. It combines EEX reports and BFE daily data; PV uses a prioritised synthesis of Pronovo, Solarlog and ENTSO-E with scaling. Nuclear is based on EEX reports. The page says daily load, wind, thermal/other and run-of-river energies should correspond to BFE. Wind, thermal and run-of-river do agree at BFE's published precision; **load does not** in these frozen captures. A stale revision or different category may be a candidate explanation, but neither has been demonstrated.

| BFE daily category | BFE GWh | Candidate Energy-Charts local-day category | Energy-Charts GWh | BFE minus Energy-Charts GWh |
| --- | ---: | --- | ---: | ---: |
| Flusskraft | 36.0 | Run-of-river | 36.0001 | −0.0001 |
| Kernkraft | 69.5 | Nuclear | 69.1585 | +0.3415 |
| Photovoltaik | 23.7 | Solar | 23.6998 | +0.0002 |
| Speicherkraft | 61.2 | Reservoir + pumped-storage generation | 53.5767 | +7.6233 |
| Thermische | 8.4 | Others | 8.4 | 0 |
| Wind | 0.5 | Onshore wind | 0.5 | 0 |

The reservoir row is a candidate correspondence, not an established definition. Mixed measurement, extrapolation, gross/net conventions and revisions remain relevant. The recorder's method v2 labels the ten Swiss estimation/synthesis-derived series `estimated`, keeps EEX nuclear as a provider report with explicit lineage, and preserves all original numbers, intervals and row links. Physical border reports keep their native evidence labels. The source explanation is a method statement, not proof of the input chosen for every individual interval.

## Physical borders: daily totals and native intervals

Positive values below mean net import into Switzerland. Both sources describe these series as physical flows: the [Swissgrid workbook definition](https://www.swissgrid.ch/en/home/customers/topics/energy-data-ch.html) concerns transmission lines by border. Swissgrid's separate [NTC/market-schedule page](https://www.swissgrid.ch/en/home/operation/grid-data/cross-border-load-flows.html) is commercial exchange and must not be substituted to explain a physical-flow discrepancy.

| Border | Swissgrid GWh | Energy-Charts GWh | EC minus Swissgrid GWh | Maximum absolute quarter-hour difference MW | Matching direction intervals |
| --- | ---: | ---: | ---: | ---: | ---: |
| Austria | −0.980629 | −0.852000 | +0.128629 | 300.084 | 93/96 |
| Germany | −6.482297 | −6.445250 | +0.037047 | 9.336 | 96/96 |
| France | +35.944443 | +47.053000 | +11.108557 | 1,248.592 | 94/96 |
| Italy | −38.636244 | −38.635000 | +0.001244 | 392.680 | 96/96 |

Daily cancellation hides substantial Italian interval differences. Germany offers the strongest within-day agreement in this sample. These findings do not certify either source or make one a correction of the other.

The audit tests ±120 minutes in 15-minute increments against the **same 80 central workbook intervals** for every shift, with no wraparound or extrapolation. Zero shift has the smallest RMSE for Germany, Austria and Italy. France's best tested shift is +15 minutes, but RMSE remains **521.327 MW**, versus **538.240 MW** at zero: a timing shift does not reconcile it. This diagnostic is not permission to move the published data. Each reporting source remains selectable; an average would hide disagreement.

## Scope, pumping and what can close

Swissgrid explicitly distinguishes its control block from Swiss territory: it includes Liechtenstein and some French/German areas and excludes some Swiss distribution grids. This is a documented scope distinction, not a quantified explanation of the observed gaps. It prevents treating a national polygon as the measurement boundary. Swissgrid also describes monthly updates and a six-month correction window; the October workbook's September data remains revisable.

The **18.816683458 GWh** difference between workbook total and end-user consumption combines pumps, grid losses and power-station own-use according to the provider definitions. It cannot supply standalone pumping consumption. No inspected column or Swiss Energy-Charts category supplies that missing measurement. Pumped-storage *generation* cannot stand in for intake. Pumping remains outside the supported first passage until a separately identified series is obtained.

Regional PV remains a separate model question: its model-card link is broken, interval support and bound semantics are unspecified, and district identity has not been joined to a dated geometry. The swissBOUNDARIES3D rights chain is now resolved; the geometry/data join is not. Neither item blocks a border-and-weather composition which excludes regional PV.

The provider requests attach these exact dates, source hashes and comparisons. Completion means a documented answer about population, clock, revision and method, or an explicit choice to keep the sources separate. No fitted balance, inferred storage or unsupported station-to-consumer path is introduced.

To reproduce locally:

```sh
python3 scripts/research/kraft-rights-capture.py /absolute/path/rights-captures
python3 scripts/research/kraft-reconcile.py /absolute/path/kraft-source-probe /absolute/path/rights-captures
```

The first command is an explicit bounded public read with receipts and caching; the second is entirely offline. Digests in committed evidence identify the exact inputs. The full workbook, raw responses and page/PDF receipts stay in the private archive.
