# KRAFT provider requests

Prepared and **sent on 1 November 2026**, following Louis's explicit authorisation, for free, non-commercial public use only. Gmail confirmed all three messages in Sent Mail at 14:15–14:16 UTC. All three requests are **awaiting replies**; sending is not permission granted. Recipients come from the captured Energy-Charts API/contact page and BFE CKAN contact records. No commercial rights were requested and no raw captures were attached. The exact sent texts are retained below; delivery receipts and Gmail identifiers remain in the private archive.

## energy-charts

To: leonhard.gandhi@ise.fraunhofer.de

Subject: KRAFT: non-commercial reuse and Swiss source reconciliation, 16 September 2026

Dear Mr Gandhi,

I am developing KRAFT: The flow of power, a free, non-commercial public artwork/study of one recorded European electricity day, alongside weather. The intended release has no advertising, sponsorship, paywall or commercial promotion. It would serve frozen compiled interval data as well as an interactive visualisation, with source and licence credits. This request covers that scope only.

On 1 November 2026 we captured /v2/public_power and /v2/cbpf for AT, CH, DE, FR, IT and NL, using 16 September 00:00 through 17 September 00:00 UTC. All twelve responses explicitly declare CC BY 4.0. We retain original hashes and row links, convert GW to MW where appropriate and preserve nulls/native intervals. UK individual border columns are excluded; the full artifact remains private.

Could you confirm that the response licence permits public redistribution and adaptation of these exact processed public_power series, including generation, storage intake, load, residual load, renewable shares and commercial-exchange categories, with all necessary upstream permissions? ENTSO-E's linked 18 October 2023 reuse list explicitly covers physical flows but does not itself establish the actual-load/generation permission chain. Are any provider sums or other aggregates affected by restricted interconnector inputs, and is any additional attribution required?

Your Swiss sources page describes the post-2025 estimation/synthesis method and says daily load should correspond to BFE consumption. For the aligned Swiss civil day (15 September 22:00 UTC to 16 September 22:00 UTC), the frozen API integrates to 188.3001 GWh load. BFE ogd103 gives 163 GWh national consumption and 145 GWh final consumption; the Swissgrid workbook dated 20 October gives 163.355258393 and 144.538574935 GWh. Which input, revision and consumption population does the API load use?

For the same local day, net physical FR→CH exchange is 47.053 GWh in /v2/cbpf versus 35.944443 GWh in the workbook. Germany is much closer (−6.445250 versus −6.482297 GWh). Italy nearly matches daily (−38.635000 versus −38.636244 GWh), but quarter-hour differences reach 392.680 MW. Is there a known metering boundary, upstream reporting or revision difference? Both sources describe physical flows; we have not substituted commercial schedules or fitted a correction.

Finally, BFE Speicherkraft is 61.2 GWh versus 53.5767 GWh from the candidate sum of API hydro_water_reservoir and hydro_pumped_storage. Are those categories comparable, and is there a separately identified Swiss pumping-consumption series?

We have corrected the Swiss non-nuclear generation/load-derived evidence labels to estimated, while identifying nuclear as EEX-based. A category-specific clarification would help avoid overstating the observations. I can provide the frozen response hashes and a compact interval comparison.

Thank you,
Louis Emmett

## swissgrid

To: info@swissgrid.ch

Subject: KRAFT: permission for free public study and Swiss energy-statistics definitions

Dear Swissgrid team,

I am developing KRAFT: The flow of power, a free, non-commercial public artwork/study of European electricity flows and weather. The intended release has no advertising, sponsorship, paywall or commercial promotion.

May I use your Energy Statistic Switzerland 2026 workbook dated 20 October 2026 to create public visualisations and redistribute selected derived quarter-hour series for 16 September 2026, with Swissgrid attribution, a source link, the workbook vintage and a clear provisional-data notice? This would include conversion from interval kWh to interval-mean MW and daily integration, with no logos or suggestion of endorsement. Your general website terms require prior consent for public reuse; I have therefore kept the workbook and derived interval data private. Please specify any required credit, conditions or limits.

I would also welcome clarification of four definitions:

1. Is the Zeitreihen0h15 timestamp a Europe/Zurich CET/CEST civil interval start? The manual says intervals are left-aligned from 2025; 29 March 2026 has 92 quarter-hours, omitting 02:00–02:45. We need the authoritative timezone and autumn repeated-hour convention.
2. Do the cross-border columns K–R measure physical transmission-line flows for the control block, and are there border-specific exclusions or virtual allocations? We understand that the control block differs from Swiss territory, and that the separate NTC/market-schedule publication is commercial exchange.
3. For 16 September's local-day comparison, your total consumption is 163.355258393 GWh, versus Energy-Charts load 188.3001 GWh. Net import from France is 35.944443 GWh versus Energy-Charts physical flows 47.053 GWh. Italy nearly agrees daily but differs by up to 392.680 MW within a quarter-hour. Is there a known population, metering or revision explanation?
4. Is standalone pumped-storage consumption publicly available for this date? We will not label the 18.816683458 GWh total-minus-end-user difference as pumping: your definitions also include losses and power-station own-use.

The workbook study-day rows are 24767–24862 in Zeitreihen0h15. We preserve the original units and row identities. We do not allocate national output to plants, infer routes through Switzerland or force sources into a balanced ledger.

Please route this to the team responsible for energy statistics and reuse permissions if needed.

Thank you,
Louis Emmett

## bfe

To: digitalisierung@bfe.admin.ch

Subject: KRAFT: regional PV dataset rights, hourly semantics and frozen-day reconciliation

Dear SFOE Digital Innovation team,

I am developing KRAFT: The flow of power, a free, non-commercial public artwork/study of one European electricity day. The intended release has no advertising, sponsorship, paywall or commercial promotion, and would redistribute selected compiled data with source attribution.

The ogd103 consumption and ogd104 production resources in opendata.swiss link to terms_by_ask, which we understand permits attributed non-commercial reuse. Could you identify the dataset-specific reuse terms and required credit for API dataset pv-stromproduktion-estimate (table ogd127_pv_stromproduktion_estimate), including public adaptation and redistribution of district estimates? We have not applied a generic service-catalogue licence to it. The PV page's linked model card https://www.bfe-ogd.ch/pv_segmentation_model_card.pdf returns 404.

For a sample district, Entremont, the API returns hourly datetime_utc records for 16 September 2026, fields in kWh, a separate Pronovo estimate and lower/upper error fields. Please confirm:
- Whether datetime_utc labels an interval start, interval end or an instant, and the duration represented by each kWh value.
- What the lower and upper fields mean: uncertainty method, coverage/probability if any, and which estimate they bound.
- The relationship between the main and Pronovo estimates, their model/input vintages and revision policy.
- The district identifier, boundary vintage and authoritative geometry/join key. Is the displayed name sufficient, or is a BFS district identifier available?

Two related frozen-day questions would help reconciliation:
- The current ogd103 CSV has one record per date, including 163 GWh national and 145 GWh final consumption on 16 September, agreeing with rounded Swissgrid workbook totals. The API metadata says revised records are appended. Is the CSV a latest-revision view, and is an explicit revision timestamp/order or immutable snapshot interface available for the API?
- ogd104 Speicherkraft is 61.2 GWh on that date. Does it include pumped-storage generation, and is it gross/net or modelled? A candidate Energy-Charts reservoir-plus-pumped-generation sum is 53.5767 GWh. We have kept those separate rather than assuming equivalent categories.

No regional PV layer has been publicly released. We want the source definitions and permissions to remain inspectable alongside the artwork.

Thank you,
Louis Emmett

