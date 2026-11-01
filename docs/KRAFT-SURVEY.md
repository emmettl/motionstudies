# KRAFT extended data survey

[Study brief](KRAFT.md) · [Initial source audit](KRAFT-SOURCES.md) · [Swiss passage](KRAFT-SWITZERLAND.md) · [Survey evidence](evidence/kraft-survey-2026-11-01.json)

The [rights register](KRAFT-RIGHTS.md) now resolves the non-commercial BFE resource terms and the swissBOUNDARIES3D terms chain. The [reconciliation follow-up](KRAFT-RECONCILIATION.md) adds DST evidence, pinned CSV revision handling, native border comparisons and the post-2025 Swiss estimation method. Its explicit findings supersede the corresponding open questions in this earlier survey.

**Infrastructure follow-up:** the [shared foundations](KRAFT-INFRASTRUCTURE.md) now include a complete 1° ERA5 research grid and verified combined UTC-day release. The earlier four-point probe and remaining source questions below retain their survey date.

**1 November 2026.** The bounded survey now covers Swiss reconciliation, weather, resource rights, plant geography, Nordic expansion and two comparison days. It establishes enough source access for visual experiments. A reconciled Swiss energy balance, standalone pumping consumption, regional solar permissions and a publication-ready continental weather grid remain open. These are specific limits on the composition, not reasons to defer experiments with the frozen evidence.

## Decisions after the survey

| Question | Finding | Decision for the first proof |
| --- | --- | --- |
| Can Swiss demand be resolved below national level? | Swissgrid's workbook has quarter-hourly national and regional series. Sampled GR, VS and TI columns are populated. | Test regional detail locally; settle rights and clock interpretation before publishing. |
| Does BFE agree with Swissgrid? | The workbook's dated national/end-user totals round to BFE's 163/145 GWh. | Treat this as a verified relationship between the two captures. |
| Is Energy-Charts reconciled to those sources? | No. Load and especially the French-border aggregate differ. | Keep providers separate; do not derive a balanced Swiss composition by combining them. |
| Can pumping be animated? | No standalone pumping-consumption column in the inspected workbook or Swiss Energy-Charts captures. | Keep pumping pending. Total minus final consumption also contains losses and plant own-use. |
| Are wind and radiation available for the day? | Four pinned ERA5 location probes and an observed MeteoSwiss station day are complete. | Use a labelled reanalysis field and separate station observations. Acquire a bounded grid before continental field rendering. |
| Can plant geography support descent? | A dated register has coordinates for most records, technology catalogues and stable source IDs. | Show registered infrastructure; no individual output inferred from national totals. |
| Can the frame extend north? | Denmark, Norway and Sweden have complete quarter-hourly border series; generation has specified gaps. | A nine-country technical frame is plausible, with external edges visible. |
| Does one day's reversal pattern recur? | Germany reverses four times on Wednesday, six on Friday and never on Sunday in the Swiss view. | The relationship changes across days; do not author a fixed reversal narrative as a typical rhythm. |

## Swiss reconciliation

The retained Swissgrid workbook is dated 20 October 2026. The `Zeitreihen0h15` sheet has 96 rows labelled 16 September at rows 24767–24862. Its manual states that timestamps have labelled interval starts since 2025. Units are kWh per quarter-hour; multiply by four and divide by 1,000 for interval-average MW. The inspected cells do not explicitly define the timezone, so comparisons with local-clock data remain provisional.

| Dated quantity | Swissgrid workbook, GWh | BFE date row, GWh | Energy-Charts local-day integral, GWh |
| --- | ---: | ---: | ---: |
| End-user consumption | 144.538575 | 145 | No equivalent separately acquired |
| Total consumption | 163.355258 | 163 | Load: 188.300100 |
| Production | 173.672371 | Six categories, mixed monitoring basis | Public net categories, different population |

The close rounded consumption agreement narrows the problem: the BFE figures have support in the workbook, while the Energy-Charts difference survives a local-day alignment. It does not establish interchangeable definitions. The workbook's production description includes installations with load-profile metering. Its regional columns include grouped cantons, cross-canton records and foreign territories in the Swiss control area. A control area is not simply the Swiss national polygon.

The direct border comparison isolates another material difference:

| Border, net imports into Switzerland | Swissgrid dated rows, GWh | Energy-Charts local day, GWh | Difference, GWh |
| --- | ---: | ---: | ---: |
| Austria | −0.980629 | −0.852000 | +0.128629 |
| Germany | −6.482297 | −6.445250 | +0.037047 |
| France | +35.944443 | +47.053000 | +11.108557 |
| Italy | −38.636244 | −38.635000 | +0.001244 |

Italy is close at daily precision while France differs substantially. The earlier exact opposite-sign checks were within Energy-Charts and therefore did not establish independent agreement. Possible scope, revision, aggregation and source differences need an authoritative explanation. Do not correct the French series by scaling it or infer that the residual represents storage. Swissgrid publishes general [measurement and revision context](https://www.swissgrid.ch/en/home/operation/grid-data/generation.html); its file remains provisional within the stated six-month correction period.

The next source questions are precise: what timezone does the workbook use; what upstream definition and adjustments produce Energy-Charts Swiss load; what accounts for the French-border difference; and where is a separately defined pumping-consumption series available? The [Energy-Charts Swiss chart](https://energy-charts.info/charts/power/chart.htm?c=CH&l=en) names ENTSO-E, BFE and EEX as sources without resolving series-level lineage. No provider was contacted during this survey.

## Wind, radiation and light

The first weather route is **ERA5**, not an automatically changing best-match model. Copernicus describes a global hourly reanalysis on a 0.25° atmospheric grid. Reanalysis combines observations and modelling; recent ERA5T data can be revised by the final release two to three months later. The candidate September day may still be preliminary on 1 November. [Copernicus dataset](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview)

The Open-Meteo archive probe requests `models=era5`, UTC, nearest cells, no elevation downscaling, 100 m wind speed/direction, shortwave radiation and cloud cover. Four cells—North Sea (54°N, 6°E), Alps (46.5°N, 8°E), France (48°N, 2°E) and Germany (52°N, 10°E)—returned complete hourly values. This proves access and variable availability, not a complete European grid or local terrain accuracy. The response does not itself echo the requested model; the preserved URL is essential provenance.

Radiation is a mean over the preceding hour, while wind is selected at its reference times. The aligned probe includes the following midnight: radiation endpoints 01:00 through next-day 00:00 cover the UTC day. Treating these as interval starts would shift illumination by an hour. Units are m/s, degrees, W/m² and percent. [Open-Meteo historical documentation](https://open-meteo.com/en/docs/historical-weather-api)

For a first field, acquire eastward/northward wind components, radiation and optionally cloud on one explicit grid and clock. If deriving vectors from wind-from direction, use `u = −speed × sin(direction)` and `v = −speed × cos(direction)`, then account for the map projection. Interpolate components rather than averaging directions across north. State whether wind is at 10 m or 100 m; neither is station-specific turbine output. Radiation is not PV electricity, and daylight is a separate astronomical calculation.

A proposed crop of 15°W–30°E and 35–70°N at 0.25° contains 25,521 grid points. Twenty-five hourly samples of three float32 fields would occupy about 7.66 MB before metadata/compression; four fields about 10.21 MB. These are calculated payload estimates, not measured download sizes. A direct CDS subset needs authenticated access and was not acquired. Open-Meteo's point probes offer a smaller route for local visual studies; freeze model, grid, interpolation and attribution before a full field.

### An observed Swiss counterpoint

MeteoSwiss station ABO, Adelboden, supplies all 24 hourly endpoints covering the UTC day for scalar wind speed, wind direction and global radiation. The station series and parameter catalogue are retained. These are local observations, not a continental wind field or a validation at the same location/height as the coarse Alpine ERA5 cell.

Its CSVs use semicolons and Windows-1252. Timestamps are UTC interval ends; for the day select endpoints after midnight through the following midnight. Empty fields mean missing observations. Use provider hourly aggregates rather than rebuilding them from ten-minute records. [MeteoSwiss download conventions](https://opendatadocs.meteoswiss.ch/general/download)

An additional radiation option is MeteoSwiss's satellite-derived radiation/cloud grid. Preliminary daily files persist for 41 days; corrected monthly products are the appropriate route for this older day, with hourly monthly files up to about 45 MB. September's corrected monthly product is a candidate, not an acquired raster in this survey. [Product documentation](https://opendatadocs.meteoswiss.ch/c-climate-data/c4-satellite-based-climate-data)

## Geography and the depth of descent

The [BFE plant collection](https://data.geo.admin.ch/api/stac/v1/collections/ch.bfe.elektrizitaetsproduktionsanlagen) advertises an August 2026 snapshot with assets updated on 16 September. Its CSV ZIP was downloaded once with a 32 MiB cap and verified against the provider's checksum: **19,195,387 bytes**, **339,499 distinct installation IDs**, **2,514 without coordinates**. Every record has an operation date at or before the study date. The main categories include 1,325 hydro records and four nuclear records. These are register entries, not necessarily generation units or complete sites.

Coordinates are in **EPSG:2056** and must be transformed, never read as longitude/latitude. Technology catalogues include storage and pumped storage. The record population is registered operating installations; a dated snapshot and commissioning dates do not prove every included plant operated on the selected day or supply historical per-unit output. Keep missing coordinates in the audit rather than assigning approximate positions.

This supports a spatial installation layer. The next stage is a reviewed site/unit crosswalk and a source of actual unit output; direct ENTSO-E unit retrieval still requires API access and source rights. No plant-to-time-series join is claimed here. For reporting areas use the national/country aggregations actually acquired. Nordic national records cannot be split into bidding zones by drawing internal boundaries. Administrative district geometry, solar-name joins and electrical-zone geometry remain separate acquisition tasks.

## Resource rights matrix

| Resource | Verified terms | Release consequence |
| --- | --- | --- |
| Energy-Charts acquired electricity responses | Each declares CC BY 4.0, credit energy-charts.info | Preserve declarations; upstream exceptions remain as in the initial audit. |
| BFE `ogd104` production and `ogd103` consumption resources | CKAN rights link to `terms_by_ask` | Attribute; commercial use requires prior permission. Generic API openness does not override this. |
| Swissgrid workbook | General website terms reserve public/commercial reuse | Local source comparison; do not redistribute as an openly licensed artifact. |
| BFE installation register | STAC generic value `proprietary`, with explicit licence link to `terms_by` | Follow the linked open-use attribution terms and retain both metadata fields. |
| BFE regional PV model | No matching resource terms found; targeted search returned national production instead. Linked model card returned 404. | Keep sample exploratory; permissions, interval semantics and bound definitions unresolved. |
| MeteoSwiss station and satellite open data | CC BY 4.0, “Source: MeteoSwiss” | Clear reuse path with attribution and stated transformations. |
| Open-Meteo weather | Data CC BY 4.0; free service restricted to non-commercial use | Distinguish data rights from access terms; select a suitable acquisition route before commercial use. |
| ERA5 direct CDS | Dataset lists a CC-BY licence; authenticated subset not tested | Pin the applicable agreement/version and attribution when acquiring a direct release. |

The BFE resource rights were retrieved successfully from CKAN in this pass, resolving the earlier HTTP 403 access limitation. The [Swiss terms page](https://opendata.swiss/en/terms-of-use) distinguishes attribution-only use from commercial-permission use. [MeteoSwiss terms](https://opendatadocs.meteoswiss.ch/general/terms-of-use) and [Open-Meteo access terms](https://open-meteo.com/en/terms) establish the weather conditions above. The Swiss boundary collection's generic licence field alone did not clear its assets; geometry has no inferred blanket licence. No permission request or external message has been sent.

## Nordic coverage and comparison days

| Country, 16 September UTC | Production/load | Physical exchanges | Missing returned values |
| --- | --- | --- | --- |
| Denmark | 96 quarter-hours | 96 quarter-hours | Solar: 5 |
| Norway | 96 quarter-hours | 96 quarter-hours | Pumped-storage generation and consumption: 74 each; renewable generation share: 39 |
| Sweden | 96 quarter-hours | 96 quarter-hours | None |

All returned Nordic border values are present. Their neighbours include countries beyond the nine-country viewing area, and Norway/Denmark include UK exchanges. These edges require their own scope and rights checks; never inherit the initial UK exclusions indiscriminately or clear all links by country name alone. Retain the provider's national aggregation and declare external exchanges explicitly.

Swiss comparison days use the same UTC window, provider and native intervals. All returned generation/load and border values are present; no pumping-consumption series appears on either additional day.

| Swiss day | Load integral, GWh | Net imports, GWh | German-border nonzero sign changes |
| --- | ---: | ---: | ---: |
| Wednesday 16 September | 189.1125 | −0.5455 | 4 |
| Friday 18 September | 171.8795 | +2.5440 | 6 |
| Sunday 20 September | 154.3109 | −7.96625 | 0 |

These three days show variation, not typical weekday/weekend behaviour. The visual grammar must also accommodate a border that does not reverse. Keep date choice explicit rather than selecting only a day with dramatic changes.

## Evidence and remaining gates

The [capture tool](../scripts/research/kraft-survey-capture.py) runs only on explicit invocation, reuses successful files, records failed attempts, and spaces Energy-Charts requests by endpoint. Captures now include exact retrieval start/end times, URLs, response headers, status, bytes and SHA-256 hashes. Raw files remain in ignored `work/kraft-source-probe/survey-2026-11-01/`. The plant register uses a specific 32 MiB cap; other responses have an 8 MiB cap. The workbook retains its earlier hash and capture limitations rather than receiving invented retrieval metadata.

The [offline audit](../scripts/research/kraft-survey-audit.py) checks every retained capture hash, provider plant checksum, interval coverage, missingness and the calculations reported here. It produces the committed machine-readable evidence. These checks establish reproducibility of the frozen samples, not independent truth or publication clearance.

Before a publication release: resolve provider scope/clock discrepancies and standalone pumping; obtain any required permission; confirm regional PV semantics/terms; acquire and audit the selected weather grid; and verify geometry joins and source versions. The survey is sufficient to begin abstract, spatial and transitional experiments with separately identified sources. It does not select the final visual grammar or enable collection, hosting or paid services.
