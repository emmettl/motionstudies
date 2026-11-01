# KRAFT source audit

[Study brief](KRAFT.md) · [Machine-readable probe](evidence/kraft-sources-2026-11-01.json) · [England power sources](POWER.md) · [Cost controls](COST-CONTROL.md)

[Swiss follow-up](KRAFT-SWITZERLAND.md): direct BFE day and district-solar probes, a German-border reversal sequence, consumption discrepancies and remaining rights checks.

[Extended survey](KRAFT-SURVEY.md): Swissgrid quarter-hourly reconciliation, resource-specific rights, plant geography, historical weather probes, Nordic coverage and weekday/weekend comparisons. This follow-up narrows or supersedes the initial open questions below; it does not grant blanket publication clearance.

**1 November 2026.** A six-country recorded-day proof is technically feasible through Energy-Charts. Twelve anonymous requests returned usable series for 16 September 2026. The main issues are mixed temporal resolution, missing Italian storage values, reporting-area definitions and source-specific redistribution terms. This audit supports an offline composition experiment; it does not clear an entire European data product for publication.

## Sources and roles

| Source | Role | Evidence and decision |
| --- | --- | --- |
| Fraunhofer ISE Energy-Charts | First proof's generation/load and physical exchanges | OpenAPI inspected; twelve actual responses audited. Preferred bounded acquisition route. |
| ENTSO-E Transparency Platform | Direct European source and future validation | Official access documentation, area list, terms and reuse list inspected; authenticated extraction not tested. |
| Bundesnetzagentur SMARD | German validation and possible later unit detail | Official download and reuse documentation inspected; no day acquired. |
| RTE éCO2mix / ODRÉ | French validation and revision semantics | Official dataset and historical-download documentation inspected; no comparison acquired. |
| Natural Earth | Coastlines and country context | Public-domain terms verified. Geometry is not an electrical network. |
| Existing daylight calculation | Solar context | Computed astronomical context; no weather observation implied. |

## Energy-Charts access and meaning

The [API schema](https://api.energy-charts.info/openapi.json) specifies anonymous public endpoints, explicit interval metadata and a default CC BY 4.0 licence subject to exceptions. Cache responses and honour `Retry-After`; the documented default is two requests per minute per endpoint with a burst of four, dynamically adjustable. The two endpoints supply public net generation in MW (`/v2/public_power`) and physical border exchanges in GW (`/v2/cbpf`), positive for imports into the requested country. Public supply excludes industrial self-supply; `/total_power` is Germany-only. Dates without offsets use local time, so requests use explicit UTC bounds. Response timestamps mark interval starts. The schema advertises more countries than this probe tests; membership in that list establishes neither dated completeness nor rights for every series.

The frozen responses identify their licence as CC BY 4.0 with attribution to energy-charts.info. Preserve this declaration per capture and check exceptions before expansion. The provider's [API documentation](https://api.energy-charts.info/) is the entry point for current limits and formats.

## Recorded-day coverage

The requested window is **2026-09-16T00:00:00Z ≤ t < 2026-09-17T00:00:00Z**. The API includes an extra row at the requested end; the audit excludes it. Each series has a unique, regular timestamp sequence covering the window. Counts below mean present response values, not independently verified meters or complete national generation coverage.

| Area | Generation/load rows | Physical-flow rows | Missing values inside the window |
| --- | ---: | ---: | --- |
| Netherlands | 96 quarter-hours | 96 quarter-hours | None among returned series |
| Germany | 96 quarter-hours | 96 quarter-hours | None among returned series |
| France | 96 quarter-hours | 96 quarter-hours | None among returned series |
| Switzerland | 24 hours | 96 quarter-hours | None among returned series |
| Austria | 96 quarter-hours | 96 quarter-hours | None among returned series |
| Italy | 96 quarter-hours | 96 quarter-hours | Pumped-storage generation and consumption: 33 each; battery generation and consumption: 53 each |

The twelve bodies total **367,244 bytes**, excluding the separately captured schema. They contain generation types alongside load, residual load, trading and percentage series. A compiler must classify these explicitly; summing every returned series would produce meaningless generation totals. All returned flow series are complete, including exchanges with neighbours outside the six-country frame. An absent production type is not automatically zero.

Nine selected internal borders were compared from both endpoints: DE–FR, DE–CH, FR–CH, DE–AT, DE–NL, CH–IT, FR–IT, AT–IT and AT–CH. All 96 paired intervals per border have exactly opposite signed values at returned precision. This is internal consistency within one provider, not independent corroboration. Store one canonical edge rather than adding the two views.

The German view of Switzerland ranges from −0.959 to +1.955 GW; its Netherlands series from −2.766 to +2.191 GW. Both cross zero, giving the first proof actual direction changes to examine. These ranges do not explain the changes or identify the generation supplying them.

Raw responses and the OpenAPI schema are retained locally under ignored `work/kraft-source-probe/2026-11-01/`. The committed [probe record](evidence/kraft-sources-2026-11-01.json) stores request URLs, hashes, response sizes, provider generation timestamps, licence declarations, per-series missingness/ranges and border checks. Provider generation timestamps are not retrieval timestamps or settlement-finality claims. This initial probe did not retain HTTP headers or exact retrieval instants; a production evidence release must add both. Raw cross-border responses include UK-related series whose upstream terms need review, so raw bodies are not committed or approved for redistribution.

Reproduce the summary offline against the retained bodies:

```sh
python3 scripts/research/kraft-source-audit.py
```

## Direct ENTSO-E route and reuse limits

The official [token procedure](https://transparencyplatform.zendesk.com/hc/en-us/articles/12845911031188-How-to-get-security-token) requires registration, an API-access email and generation of a security token after approval. No account was created, email sent or credential assumed. Use the documented API rather than automated extraction from the graphical interface. The [EIC area list](https://transparencyplatform.zendesk.com/hc/en-us/articles/15885757676308-Area-List-with-Energy-Identification-Code-EIC) supplies reporting identities; country, control-area and bidding-zone scopes must be distinguished in any direct adapter.

ENTSO-E's [free-reuse list, modified 18 October 2023](https://transparencyplatform.zendesk.com/hc/article_attachments/40921869379729), grants CC BY 4.0 for listed data, including physical flows (item 18, article 12.1.g). Actual load (6.1.a), generation by type (16.1.b/c), per-unit actual generation (16.1.a) and day-ahead prices (12.1.d) are absent. Exclusions include Moldova and Turkey, all data from IFA and Nemo Link, and specified balancing items from Ukraine and BritNed. The [terms effective 1 November 2023](https://transparencyplatform.zendesk.com/hc/article_attachments/40921869376401) require source acknowledgement, respect for primary-owner rights and checking the reuse list before each reuse. Absence from the list does not prove a blanket prohibition; it leaves permission unresolved for our intended redistribution.

For the first publication, retain a dataset-and-area rights matrix. Energy-Charts' explicit response licences provide a promising separate route for the acquired series, but do not automatically resolve upstream exclusions or grant rights to every original source record. Leave UK links and other excluded origins out of the initial released edge set until clarified; do not republish an aggregate `sum` containing excluded components. Recheck current terms before release and record any permission or exception alongside the artifact.

## National checks and geography

[SMARD's download guide](https://www.smard.de/en/all-about-our-data-download-section-210130) describes market-series exports and individual generation-unit time series for units of at least 100 MW. Its published data are under CC BY 4.0; the [reuse page](https://www.smard.de/home/datennutzung) specifies the credit “Bundesnetzagentur | SMARD.de”. A German day comparison would help verify units and interval handling; common upstream reporting would still limit its independence.

[RTE's historical download page](https://www.rte-france.com/donnees-publications/eco2mix-donnees-temps-reel/telecharger-indicateurs) offers dated power files. The [ODRÉ dataset](https://odre.opendatasoft.com/explore/dataset/eco2mix-national-tr/) describes telemetry supplemented by estimates, quarter-hourly physical exchanges and half-hourly commercial exchanges. Monthly records progress through consolidated and later definitive versions. Its metadata identifies Licence Ouverte v2.0 (Etalab). A capture must preserve the revision/status and attribution rather than calling all French figures settled actuals.

[Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/) place its map data in the public domain. Use it for country context, with authored schematic area anchors. Real line routes, station coordinates and electrical-zone boundaries would need separate geometry and rights checks. Italy, Norway and Denmark cannot be represented as single bidding zones merely because a country-level API returns totals. The acquired Italy series supports national context; northern-Italy detail is a subsequent source task.

## Compilation and publication gates

1. Freeze an explicit list of reporting areas, generation categories and canonical borders. Record internal and external membership; preserve area identifiers and source definitions. A six-country subtotal is not Europe.
2. Preserve native intervals and nulls. Convert GW to MW explicitly; integrate power over documented interval durations for MWh. Percentages and trade series never enter generation totals. Review storage signs and missing Italian values before deriving any mix total.
3. Use UTC for the shared day with local-time inspection. Hold hourly evidence at its native interval or show a labelled visual transition. Never upsample it into claimed measurements. Handle 23/25-hour local days when adding them later.
4. Compare Germany and France against national exports and document disagreements and revision dates. Check what load includes, the generation population and storage accounting before interpreting a balance residual. Do not force generation plus net imports to equal load.
5. Complete the rights matrix for each displayed and downloadable series, including external borders and aggregate sums. Carry source names, licence links and changes into the browser, compiled artifact and evidence extracts. Do not infer that a derived visual has no source obligations.
6. Produce a versioned release manifest with exact retrieval/as-of times, hashes, bytes, schema and method versions, interval coverage and exclusions. Test that every displayed value resolves to a frozen record and that border sums count each edge once.

Start with the acquired date rather than scanning for a dramatic event. Expand the geography after the six-country replay works; compare a second weekday and weekend before describing recurring behaviour. Additional North Sea/Nordic areas, individual plants, weather and carbon attribution each require their own coverage and rights decision. Carbon intensity and causal supply tracing are outside the first proof.

Acquisition stays bounded and cached: one selected day, offline rebuilds and static browser artifacts. The retained probe is below 0.5 MB of response bodies plus schema. Use the recorder's storage admission and [series cost policy](COST-CONTROL.md) before any broader archive or schedule. This investigation enabled no ongoing collection, paid service or deployment.
