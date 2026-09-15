# Helsinki — Railo (working title)

**An unnumbered Helsinki motion study**

**Catalogue status:** candidate added 8 September 2026 after a first source audit; scheduled harbour proof technically ready; the defining winter evidence must be recorded before the full thesis can be shown.

**Naming direction — 8 September 2026:** **Railo** is the preferred working candidate for discussion. See [name alternatives, proposed thesis and opening commitment](NAMING.md#helsinki). This is not a catalogue admission.

**Programme reconciliation — 15 September 2026:** source findings below keep their 8 September date and were not re-retrieved. Retrieval URLs, timestamps and hashes are in the [evidence record](evidence/city-candidate-sources-2026-09-08.json). The relation to the series and the recording plan were revised against [Underfall](BRISTOL.md), the [cost-control policy](COST-CONTROL.md) and the [series vision](VISION.md) as they stood on 15 September.

## Thesis under test

The sea freezes and the streets on it keep running. Helsinki's public network changes its medium with the season: the Suomenlinna ferry sails the same scheduled line through open water in September and through a broken channel in February, while the ice around it grows and retreats. The local sentence is **seasonality as the work's time axis** — a year, not a morning — with a scheduled service as the constant against which the sea changes state.

No other candidate in the slate has this axis. Venice's water is a network; Sydney's water is an interruption; Istanbul's water is a boundary. Helsinki's water becomes ground.

## Relation to the series

[Underfall](BRISTOL.md) already compares human schedules with a natural rhythm: buses and trains against the Avon's tide at one gauge. Helsinki belongs to that family, and it differs in three ways. The sea changes **state**, not level. The clock is the **season**, not the day. And the evidence that the two rhythms meet is a **recorded track diverging from its scheduled line**, which a gauge reading cannot supply. Whether the two works should be read as a pair is an authorial question the [vision](VISION.md#the-world-in-miniature) leaves open; this brief does not assume it.

The smallest supported units are a scheduled trip, a timestamped vessel position report and a dated ice observation at a station. Ice between observations is a chart or an estimate, never a measurement.

## Feasibility verdict — 8 September 2026

| Scope | Status | Defensible interpretation |
| --- | --- | --- |
| Scheduled ferry motion | **Green** | HSL's GTFS is CC BY 4.0. The archive inspected today contains three `route_type=4` routes (19 Kauppatori–Suomenlinna, 19E Katajanokka–Suomenlinna, 17 Meritullintori–Kruunuvuorenranta), all with shapes. |
| Observed ferry motion | **Green source / amber archive** | HSL's high-frequency positioning (HFP) API carries `transport_mode=ferry` with vessel-name labels, and Fintraffic's Digitraffic AIS endpoint returns vessel locations by MMSI and time interval; both are CC BY 4.0. Neither documents a public historical archive, so a winter must be recorded by us as it happens. |
| Ice state | **Green technical** | FMI open data is CC BY 4.0. The WFS lists a `fmi::observations::seaice::manual` stored query; Baltic ice charts are published as PDF twice weekly, daily during ice growth. Whether chart geometry is available as data rather than PDF is unverified. |
| Scheduled tram, metro and bus context | **Green** | Same HSL feed; 2,507 tram and 622 metro trips are active on the sample weekday. |
| Land, water and shore geometry | **Green** | National Land Survey topographic data is CC BY 4.0. |
| The full winter thesis | **Amber by calendar** | The earliest complete evidence is the 2026–27 ice season. A publication showing recorded winter motion cannot exist before spring 2027. |

Helsinki passes the technical admission test for a scheduled harbour proof now, and has an unusually clean rights position: all four sources are explicit CC BY 4.0 releases and none requires a provider interpretation. The open questions are retention and history, not permission.

## Inspected HSL feed

The [Helsinki Region Infoshare record](https://hri.fi/data/en_GB/dataset/hsl-reittiopas-api) names HSL as maintainer and states Creative Commons Attribution 4.0. The `hsl.zip` retrieved today:

- URL: `https://dev.hsl.fi/gtfs/hsl.zip` (301 to `https://infopalvelut.storage.hsldev.com/gtfs/hsl.zip`);
- SHA-256: `930dc6048b3815efdaf5efa51bc054fc22c285fc0d4d99328baf6fcbbabeaf4f`; 72,861,231 bytes; server `Last-Modified` 5 September 2026 04:00 UTC; `feed_version` `2026-09-05 06:32:39`;
- seventeen tables including non-standard `trips2.txt`, `emissions.txt`, `areas.txt`, `stop_areas.txt` and `translations.txt`; no `frequencies.txt`, `attributions.txt`, `pathways.txt` or `levels.txt`;
- 465 routes, 8,344 stops, 367,833 trips, 10,260,579 stop-time rows, 484,017 shape points; calendar 4 September–2 November 2026 across 7,276 service IDs (HSL issues one service per trip pattern) with 111 exception rows;
- route types: 356 bus (701), 46 regional bus (704), 28 tram, 14 (702), 13 rail (109), 4 metro, 3 ferry, 1 (900).

On Wednesday 9 September 2026 the three water routes run 149 trips (19: 94; 17: 39; 19E: 16) between 06:00 and 02:20 the next morning across six landing stages (Kauppatori, Suomenlinna main quay, Meritullintori, Kruunuvuorenranta, Katajanokka, Suomenlinna service quay). Every water trip is two stops with a uniform 15-minute duration, and the six ferry shapes hold only 147 points in total. The published geometry is therefore a coarse service line, not a fairway. That is acceptable for the scheduled proof and is exactly what the observed track should later be compared against.

## Motion semantics

Three evidence classes must remain visibly distinct:

- **Scheduled**: interpolation along the published shape between the two stop times. This is what the September proof shows.
- **Observed**: HFP (once per second, `transport_mode=ferry`, vessel label, proof-of-concept passenger occupancy) or AIS positions. Note that HFP stop events are not produced for ferries; only vehicle positions.
- **Ice**: FMI observations and charts describe conditions at a time and place; they do not say where the vessel went. The gap between the published shape and the recorded track in February is the visual argument, and it must come from a recorded track.

Only services active under `Europe/Helsinki` calendar rules are animated; after-midnight departures (up to 26:20) belong to the previous service day.

## Rights and publication

| Source | Terms retrieved | Attribution and conditions |
| --- | --- | --- |
| HSL GTFS | HRI dataset record states CC BY 4.0. The hsl.fi open-data pages answered the audit client with a JavaScript challenge (HTTP 403), so HSL's own page text is unretrieved. | Source: HSL Journey Planner API / Helsingin seudun liikenne. |
| HFP and Digitransit APIs | [Digitransit terms of use](https://digitransit.fi/en/developers/apis/7-terms-of-use/): data is released under CC BY 4.0 "now and in the past"; registration and a subscription key are required; OpenStreetMap-derived routing/geocoding/map data is ODbL and must be kept separate. | "© Digitransit YYYY" plus the date and time the data was received. Keys stay outside the artifact. |
| Digitraffic AIS | [Fintraffic terms](https://www.digitraffic.fi/en/terms-of-service/): CC BY 4.0, expressly including remixing and commercial use. | Credit Fintraffic as source. |
| FMI ice and sea-level data | [FMI licence](https://en.ilmatieteenlaitos.fi/open-data-licence): CC BY 4.0 for the open data service. | Credit the Finnish Meteorological Institute. |
| NLS topographic data | [NLS licence](https://www.maanmittauslaitos.fi/en/opendata-licence-cc40): CC BY 4.0; name the licensor, dataset and retrieval time. | Credit the National Land Survey of Finland. |

No provider permission request is needed. The work must keep ODbL map data out of the CC BY artifact and must not present a recorded track as the vessel's legal or navigational path.

## Evidence boundaries

| Visual claim | Evidence required | Present feasibility |
| --- | --- | --- |
| A ferry is scheduled between Kauppatori and Suomenlinna | Active HSL trip and calendar | **Yes.** |
| It follows the displayed line | Published shape | **Yes as a coarse service line.** |
| In February it followed a different, broken channel | Recorded HFP or AIS track for that day | **Not yet; record the 2026–27 winter.** |
| The sea around it was frozen | FMI ice observation or chart for that day | **Yes as a dated condition, after retrieval.** |
| The ferry broke the ice or was assisted | Operator or Digitraffic winter-navigation record | **Not claimed from motion alone.** |
| Passengers were aboard | HFP occupancy (proof-of-concept) | **Label as experimental if used.** |

## Recommended proof

Compile a weekday **06:00–09:00 harbour study** from the inspected feed: routes 19, 19E and 17 with the shore trams as context, scheduled only, pinned to the 5 September release. This can be built now with the existing engine.

In parallel, prepare to **record the winter**. This is continuous collection, so it follows the [cost-control policy](COST-CONTROL.md#bound-retention-by-age-and-bytes): a ledgered collector on the CI Mac with finite request, byte and retry limits, a 30-day rolling window, and ice days saved out of that window into the selected-evidence allocation as authored decisions. Subscribe only to ferry HFP topics, poll Digitraffic AIS only for the Suomenlinna vessels, and retain FMI daily ice observations and each published chart with hashes. Measure bytes per day with a bounded smoke recording before admitting the collector.

The signature scene — the same scheduled line drawn over the sea as its recorded winter track diverges and the ice extent changes — depends entirely on this recording existing, and on the right days being saved before they expire.

### Source gate

- [x] Retrieve and hash the current HSL GTFS; inspect tables, calendar, water routes and shapes.
- [x] Retrieve HRI, Digitransit, Digitraffic, FMI and NLS licence statements.
- [ ] Register a Digitransit API key and verify a live HFP ferry message; retain the subscription terms.
- [ ] Verify how far back `/api/ais/v1/locations` returns positions, and whether any HFP history is offered.
- [ ] Verify whether FMI ice-chart geometry exists as data; otherwise retain PDFs and the `seaice::manual` observations.
- [ ] Retrieve an NLS land/water crop of the inner harbour with source CRS and date.
- [ ] Run a bounded ferry-only smoke recording on the CI Mac; record bytes per day in the capacity ledger before starting a season collector.
- [ ] Set phone transfer and frame-time budgets for the harbour opening.
- [ ] Have a Finnish reader test *Railo* and its alternatives for register.

**Exit:** a source-pinned September harbour morning, plus a running winter recording whose first complete month proves the observed–scheduled comparison is legible.
