# Provider questions for city source readiness

**Prepared 7 September 2026; not sent.** [Readiness register](DATA-READINESS.md)

These are focused question sets for the provider or source custodian. Use the common description with the relevant city questions. Keep written answers with the exact source release and the identity/authority of the respondent. A technical support answer about endpoint availability is not automatically a licence amendment.

**Programme update — 13 September 2026:** Local / Express and NORIKAE are parked. New York and Tokyo questions are retained as drafts for a possible return; provider follow-up is paused.

## Common description

Motion Studies is a series of authored browser artworks about how places move. We want to retain an identified source release privately for reproducibility, compile a bounded dated period into compact timetable/geometry or observation data, and serve that derived artifact from our own static site. Browser users necessarily receive the artifact. The work would identify the provider, date and transformations, distinguish schedules, forecasts and observations, and avoid suggesting official endorsement. We also want to understand the permitted treatment of screenshots, exhibition recordings and source-code publication. Please identify the terms governing those uses and any conditions specific to the requested dataset.

An inquiry should specify whether the proposed exhibition is free, ticketed or commercial before requesting an answer covering that use. Source code and runtime data are separate deliverables; we will not assume that a code licence grants rights to provider data.

## Amsterdam

**Route:** first test the [public bicycle download portal](https://dexter.ndw.nu/opendata/bicycle) linked by NDW's [product documentation](https://docs.ndw.nu/producten/fietsdata/). Downloads have not yet been inspected. If insufficient, contact `mail@servicedeskndw.nu` through the [bicycle API instructions](https://docs.ndw.nu/data-uitwisseling/interface-beschrijvingen/fiets-api/), requesting a bicycle-data service account where needed. The Amsterdam graph's CC BY 4.0 baseline is already documented; do not reopen that generic question.

- Please identify the licence and retention conditions governing Amsterdam bicycle detector locations and hourly directional measurements, including whether they vary by data owner or measurement site.
- Can you provide or point to Amsterdam detector metadata and one sample week of directional counts, including active dates, time resolution, quality/completeness flags and measurement revisions? Can these be exported publicly or through a bicycle-data service account?
- Which timestamps represent measurement time, receipt time and later correction? How are missing intervals distinguished from measured zero counts?

First use the returned detector inventory to choose an opening boundary. Do not request individual rider or device records.

## Chicago

**Route:** CTA's [developer programme](https://www.transitchicago.com/developers/); refer to sections I.1, III.2 and V.3 of its [agreement](https://www.transitchicago.com/developers/terms/).

- Does the described artwork fall within the purpose of assisting riders or promoting public transportation?
- May it retain and publicly replay an explicitly historical GTFS release and transformed browser artifact after the current schedule changes? How should the reasonable-update obligation apply to a dated study?
- What must happen to derived artifacts and already exported recordings if the agreement ends?

Credit is optional under III.6, so there is no mandatory-credit-placement question. We would include a source credit voluntarily.

## Hong Kong

**Routes:** MTR Open Data Technical Enquiry, `opendata@mtr.com.hk`, as listed in the [official dataset](https://data.gov.hk/en-data/dataset/mtr-data2-nexttrain-data); Lands Department through the [indoor-map API documentation](https://portal.csdi.gov.hk/csdi-webpage/apidoc/3d-indoor-mtr-station-map).

For MTR:

- Do DATA.GOV.HK's terms govern the linked MTR-hosted station CSVs and Next Train output, including private retention and permanent transformed replay of recorded predictions? Are there additional resource conditions?
- Is a durable static timetable, trip-pattern dataset or feed with stable train/trip identities available for the proposed harbour corridor? The current arrival forecast interface does not establish a continuous vehicle identity.
- What attribution identifies MTR correctly when its topology/forecasts appear with Government terrain and ferry schedules?

For Lands Department:

- Does the on-map logo and copyright requirement apply to a simplified, precompiled station-section mesh? Please identify the required presentation for that particular output.
- Which supplied heights are venue-display heights, and which, if any, represent surveyed platform or track elevation?

## Istanbul

**Route:** IBB Open Data through its [portal](https://data.ibb.gov.tr/), referencing dataset `121a9892-7945-419a-9b89-49f6083926df` and the four hashes in our retrieval record.

- The catalogue says the multimodal components were last updated in 2018–2020 and will not be updated, but many calendar records retrieved on 7 September 2026 span `20221231`–`20241231`. Were service validity dates extended independently of the underlying timetables?
- Which historical date, if any, is a verified simultaneous snapshot for Şehir Hatları, TCDD/Marmaray and Metro İstanbul? Is the original pre-extension calendar available?
- Is there a maintained rail/ferry successor, and what are its operator coverage and release identifiers?
- What character encoding is intended for agency, route and trip CSVs? These files failed UTF-8 decoding in our inspection; Windows-1254 was used provisionally to read names.

The IBB licence text is now retrieved and expressly covers adaptation and perpetual reuse for covered data. Ask about separate supplier conditions only where a particular resource identifies them; the immediate blocker is historical fidelity.

## Lisbon

**Routes:** Carris city operator and Lisbon municipal open-data staff for the hill study; TML separately for metropolitan additions.

- Which explicit licence governs the current Carris city GTFS endpoint used in the [brief](LISBON.md)? Does an older municipal CC0 catalogue record apply to that same current resource?
- Is there an official mapping from the feed's route IDs and all-bus mode coding to tram, funicular and lift services, with validity dates?
- If ferries join later, which current Transtejo/Soflusa timetable or machine feed can be archived and redistributed under documented terms?

For TML only: the inspected GTFS catalogue entry says its licence is unspecified, while derived route/stop GIS collections state CC BY 4.0. Please identify the licence for the actual GTFS ZIP. Neither answer automatically governs Carris city trams.

## Mexico City

**Route:** SEMOVI through the [official GTFS dataset](https://datos.cdmx.gob.mx/dataset/gtfs).

- Is there a maintained successor to the version described as 31 October 2022? Please supply the exact release, service validity and agency/mode coverage.
- Which concessioned/colectivo services are included, and how should exclusions be described? Can a local source custodian review the terminology and coverage statement?
- Which routes represent exact departures and which represent headway-based service? How are revisions and historical releases identified?

The existing CC BY baseline does not need a generic artwork permission request. Current coverage and trustworthy service semantics are the questions.

## Mumbai

**Routes:** MMRDA/MRVC demand-data custodians and Western/Central Railway timetable teams. Reference the official March 2009 business plan, printed pages 4-32–4-33.

- Can you provide the tables, survey dates and methods underlying the directional peak-period suburban figures, including units, expansion weights, corridor definitions and uncertainty?
- Is there a recent equivalent with time bands and directions for Western, Central and Harbour services? Entries, exits, section loads and OD must be separately identified.
- Can the corresponding railway timetable, stopping patterns and route geometry be supplied for a compatible period?
- What terms allow retention, transformed public artifacts and attributed exhibition use of these specific sources?

A published historical figure is a lead to its custodian, not a current machine feed or permission to redistribute a survey database.

## Johannesburg

**Routes:** City transport/Rea Vaya, Gautrain, GCRO and locally chosen taxi-sector/research collaborators, following the [city brief](JOHANNESBURG.md).

- Which current Rea Vaya and Gautrain sources can be retained, converted and published with provider verification?
- Can a local partnership define a bounded minibus route and aggregate-volume study, with dates, sampling method, coverage, consent and reuse terms?
- Which weighted GCRO variables and geographic aggregations are suitable for contextual travel-time/cost comparisons, and what are their sharing/suppression conditions?
- Who should review the boundaries, terminology and causal claims, and what compensation and review process should the collaboration use?

The partnership should select the corridor. Do not commission person-level tracking or infer an empty transport field from missing open data.

## San Francisco

**Routes:** `developerresources@511.org`, given in the [2026 MTC agreement](https://511.org/sites/default/files/2026-04/511_Data_Agreement_Final_2026.pdf); SFMTA through the [official GTFS page](https://www.sfmta.com/reports/gtfs-transit-data).

For MTC:

- Is delivery of our compact runtime JSON to browser users covered by the application's end-user provision, or treated as a sublicense requiring written acceptance from each viewer?
- How does the current-information requirement apply to explicitly dated artifacts compiled from the historical API? What survives termination or a change of agreement?
- Does 511's agreement govern Muni data acquired through 511, or do SFMTA's separate conditions also apply? May that runtime artifact be hosted in a public repository/CDN?

For SFMTA:

- How should the exclusive-modification wording in clause 10 be reconciled with the derivative versions described in clauses 12–13 for this specific timetable/geometry conversion?
- How does the no-sublicensing clause apply to static browser delivery and historical replay?

We can use the prescribed nearby 511 acknowledgement and submit a live URL plus attribution screenshot within 30 days. Those requirements are already described and need no general inquiry.

## Tokyo

**Route:** ODPT's [developer site](https://developer.odpt.org/), separating permanent Toei CC BY material from the Basic and Challenge licences.

- For Basic-Licence resources, does the described bounded browser artifact count as prohibited reusable derivative data, or an allowed application deliverable? What quantitative or structural test applies?
- May a labelled historical artifact remain available without being replaced whenever the current timetable changes? What raw provenance may be retained?
- Is a permanent source/licence available for Yamanote and participating private railways beyond Challenge 2026? Are there separate rights for already exported recordings?
- Is cross-operator through-running identity available in a durable source, rather than inferred from destination/time similarity?

Toei's catalogue already states CC BY 4.0 and the credit names. Its first practical step is account access and archive inspection, not waiting for all of these broader answers.

## Venice

**Route:** AVM through its [official open-data catalogue](https://avm.avmspa.it/it/content/catalogo-dei-dati-metadati-e-banche-dati), identifying the exact selected navigation ZIP and hash.

- Which licence and version govern that ACTV navigation GTFS, including retained raw provenance and a transformed historical browser artifact?
- What provider credit and modification notice should accompany the artifact and a recording made from it?
- Are dated releases complete snapshots, and is their continued availability guaranteed or should users retain the precise release themselves?

## Sydney and Singapore: validate before asking

These have explicit open-licence baselines. Use the registered account to inspect the requested resources first. Contact support with a specific failed request or conflicting condition, rather than asking for rights already granted in the published licence.

For Sydney, request help identifying a common historical static/realtime window and the provenance of train positions if documentation does not settle it. For Singapore, request clarification only for an endpoint-specific retention condition, undocumented identity or planning geometry. No API keys should be placed in the correspondence archive or public source manifest.

## Existing New York and global-motion requests

Use the existing [New York publication review](NEW-YORK-PUBLICATION.md) and [MANIFEST request drafts](https://github.com/emmettl/manifest/blob/main/docs/AIS-DATA-REQUESTS.md). Preserve their current hold and avoid duplicate or conflicting requests.
