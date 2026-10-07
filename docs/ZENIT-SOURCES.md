# ZENIT source audit

[Study brief](ZENIT.md) · [Probe record](evidence/zenit-sources-2026-10-07.json) · [Data readiness](DATA-READINESS.md)

**7 October 2026, updated 8 October for the stellar and ISS releases.** Current public orbital elements are a credible foundation for a bounded local proof. Four small CelesTrak requests returned valid JSON, and the stations metadata joined completely. The stellar release uses an acquired and hashed HYG 4.4 subset of 5,070 records. One retained CelesTrak ISS snapshot now supplies the first verified propagation and surface pass. A historical work needs a separate coverage audit. Publication must preserve the distinction between government orbital data, provider enrichment, stellar catalogue measurements and modelled positions.

## Scope and verdicts

The audit combines primary documentation with one request each for stations, GNSS, GEO and stations SATCAT. The retained record contains response dates, hashes, sizes, schema checks and aggregate findings; the raw probe bodies were inspected in temporary local files and are not part of this repository's evidence release. These probes establish access and basic structure, not propagation accuracy or full-catalogue coverage. No authenticated account, historical download or collection schedule was used.

| Source | Proposed role | Evidence level | Verdict |
| --- | --- | --- | --- |
| CelesTrak standard GP JSON | Dated orbital inputs and source groups | Documentation and three live samples | Suitable for a bounded proof; check age and eligibility per object. |
| CelesTrak SATCAT JSON | Identity, type, launch and attachment metadata | Documentation and stations join | Suitable for initial identity work; preserve enrichment provenance. |
| Space-Track GP and GP_HISTORY | Direct source and historical elements | Public documentation | Strong next path; account access and selected historical coverage remain untested. |
| ESA DISCOS | Physical and mission enrichment | Public homepage; API link led to sign-in | Optional later enrichment; account terms and API contract need review. |
| Orbital Data API | Convenient historical queries | Provider documentation only | Secondary candidate; verify upstream records, terms and continuity before dependence. |
| HYG 4.4 | Bright stellar reference and inspectable star records | Pinned author repository, retained gzip, licence and compiled hash | 5,070 records with V ≤ 6.0; first stellar release implemented. |
| Gaia DR3 | Optional stellar distances and long-time motion | ESA release summary and Gaia Collaboration paper | Very long-term research candidate, outside the active orbital proof; distance inference and motion coverage need their own audit. |

## CelesTrak formats and access

[GP documentation](https://celestrak.org/NORAD/documentation/gp-data-formats.php) supports JSON with OMM field names and nine-digit catalogue IDs. It reports five-digit exhaustion on **11 July 2026**. CelesTrak's JSON is OMM-compatible rather than canonical OMM XML; omitted defaults are Earth, TEME, UTC and SGP4. Apply these defaults only to this documented adapter, and reject conflicting values. Explicitly request JSON and retain original epochs; normalize IDs to decimal strings.

The [usage policy](https://celestrak.org/usage-policy.php) calls for needed data only, one download per update, a two-hour GP cadence, and stopping machine queries on non-200 responses. The proof should use frozen files and offline replay. Any later collector needs a shared cache, update-aware requests and bounded retention. Fetching each group from every visitor would make provider traffic depend on audience size.

The [current group directory](https://celestrak.org/NORAD/elements/index.php?FORMAT=json) includes constellations and named debris populations. Its labels are useful source membership, not proof of homogeneous orbit regimes or complete populations. SupGP is a separate product; do not mix it into a standard-GP capture without its own adapter and provenance.

## Live probe findings

All four requests returned HTTP 200 with JSON. Byte counts are uncompressed response bodies. “Older than 24 hours” is calculated at the declared comparison instant **2026-10-07 20:10:22 UTC**, the stations response Date, rather than at each element's epoch.

| Sample | Records | Bytes | Earliest to latest element epoch in UTC | Older than 24 hours |
| --- | ---: | ---: | --- | ---: |
| Stations GP | 23 | 9,729 | 7 October 03:45 to 13:33 | 0 |
| GNSS GP | 172 | 71,036 | 13 September 16:04 to 7 October 15:51 | 57 |
| GEO GP | 567 | 229,294 | 11 September 12:27 to 7 October 16:16 | 70 |
| Stations SATCAT | 23 | 7,642 | Metadata has its own response date | Not applicable |

The three GP samples total 762 rows but **716 distinct IDs**: GNSS and GEO overlap by 46 IDs. Source groups must be many-to-many membership attached to deduplicated identities. Group totals cannot simply be added.

Every station GP ID matched a SATCAT record. Metadata classifies **11 as orbiting and 12 as docked**, with parent IDs in `ORBIT_CENTER`. [SATCAT documentation](https://celestrak.org/satcat/satcat-format.php) distinguishes these states and supplies type, operating status, owner codes, launch/decay dates and data-status fields. A generic Earth-only filter would silently lose the attachments; rendering all 23 as independent movers would misrepresent them. Retain their identities under their parents.

The oldest GNSS and GEO epochs were roughly 24 and 26 days behind the comparison instant. GEO inclinations reached 62.5721 degrees, while GNSS mean motion ranged from 1.00245457 to 2.13103934 revolutions/day. The probe therefore does not support treating GNSS as entirely medium orbit or GEO as entirely geostationary. No universal age-to-position-error conversion follows from these figures.

The initial group probe checked field presence, finite values, basic ranges, epoch parsing, unique IDs and the station join only. It did not validate propagation. The subsequent one-object release below adds retained inputs and independent numerical checks; the broader groups remain unimplemented.

## Space-Track history and publication

[Space-Track documentation](https://www.space-track.org/documentation) distinguishes latest GP from GP_HISTORY and requires a valid account. It requests cached histories rather than repeated retrieval; bulk history should use its archive route. General limits are below 30 requests/minute and 300/hour, with stricter product cadences.

Its basic-SSA section explicitly grants blanket redistribution approval with appropriate citation for TLE/OMM, SATCAT and decay/reentry data, and requires citations for analysis. The general User Agreement's transfer restriction must be read alongside that specific approval. This supports a publication path for those basic products; it does not establish rights for every enrichment or advanced product.

For history, preserve epoch, publication/creation time, launch/decay dates and source identity separately. Establish usable coverage around a small set of dates before proposing a continuous reconstruction from 1957. Analyst IDs can be reused, so historical identity needs scope beyond a bare number.

For CelesTrak publication, cite the provider and upstream source, and distinguish standard government fields from editorial status/group additions. The reviewed usage policy is not a blanket licence for every CelesTrak product. Resolve the chosen enrichment terms before distribution; direct Space-Track basic data is an alternative if needed. No extra redistribution permission should be presumed necessary for products already covered by its explicit approval.

## Other source candidates

[ESA DISCOS](https://discosweb.esoc.esa.int/) offers launch, registration and physical/mission information, not surveillance orbital or attitude ephemerides. Its public page requires source acknowledgement for derived work and redistribution. The API documentation link redirected to Space Debris User Account sign-in during this audit. Full account terms, schema, quotas, identifier matching and missing-field coverage remain unresolved. Metadata enrichment is optional for the first proof; ordinary ESA website terms should not substitute for DISCOS terms.

[Orbital Data API](https://orbital-data-api.davidhsu.cc/) advertises keyed access to Space-Track-derived current and historical elements, including nearest-epoch queries and coverage from 1959. These are provider claims, not tested coverage. Its stated beginning also cannot support a Sputnik-era opening by itself. Verify returned records against an upstream sample, publication rights and service limits before adopting it. Primary sources already provide the first proof's inputs, so convenience alone need not add another dependency.

[CelesTrak's historical request form](https://celestrak.org/NORAD/archives/request.php?FORMAT=json) describes unclassified records from 1957, with email delivery, CAPTCHA and limits of ten requests/day, 100 objects/request and 20,000 records/request. It is a possible narrow research route, not a plan for scripted bulk acquisition. No form was submitted. Archive availability does not prove a usable orbit for every early object or date.

## Propagation and coordinate audit

[Satellite.js](https://github.com/shashwatak/satellite-js) is a plausible MIT-licensed implementation: its documentation supports JSON initialization, propagation, Earth-fixed transforms and observer look angles. Pin a tested release in the edition rather than rely on a moving development branch. Library capability and licence do not validate ZENIT's output or convey dataset rights.

[Vallado and colleagues' reference materials](https://celestrak.org/publications/AIAA/2006-6753/) supply SGP4 code and test cases. The accompanying [technical FAQ](https://celestrak.org/publications/AIAA/2006-6753/faq.php) identifies output as **TEME**, with Earth-fixed conversion preceding geographic or observer coordinates. “ECI” is insufficient as a complete frame label: TEME must not silently become J2000.

The implementation audit should record gravity constants, operation mode, library version, UTC parsing and frame transformations. Verify independent low-orbit and deep-space cases at positive and negative epoch offsets; invalid/decayed records; longitude orientation and units; Earth rotation; observer horizon crossings; and deterministic seeking. Any interpolated worker samples need a measured error against direct propagation. A fixed element set cannot reproduce unmodelled manoeuvres, and epoch proximity alone supplies no covariance or guaranteed positional accuracy.

## First ISS release

The [edition release audit](https://github.com/emmettl/zenit/blob/main/docs/evidence/iss-release-2026-10-08.json) retains one request to CelesTrak standard GP JSON for **NORAD 25544**, captured **7 October 2026, 22:09:38 UTC**. Its 424-byte body has SHA-256 `9b6b872f9c609de40fa76642ba8ea6f4d6c043666e8ba06557b5a1587da6eda3`. The element epoch is **13:30:47.478528 UTC**. The compiled artifact `iss-b1c62cd01d58.json` has SHA-256 `b1c62cd01d58245c95f627911a9b7f366c0efcaf826c1a58fd3540ead1e36734`. Raw response, capture headers and reviewed provider/upstream policy pages remain outside the public artifact in the edition's ignored work store. One input becomes one independent mover with no exclusions or queried attachment records.

Only standard GP/OMM fields are included. Cite **CelesTrak** and **USSPACECOM / 18 SDS via Space-Track** in the artifact and interface. [Space-Track's basic-SSA section](https://www.space-track.org/documentation#/odr) permits basic OMM/TLE redistribution and analysis with appropriate citation. Optional provider enrichment is excluded; the release does not assign MIT or HYG's stellar licence to orbital data. [Provider usage rules](https://celestrak.org/usage-policy.php) govern acquisition: this was one successful request, with offline compilation and no recurring collector or visitor fetches.

The 12-hour study spans **7 October, 11:58:49–23:58:49 UTC**, entirely within the editorial 24-hour epoch-offset rule. A search of Sydney passes in the 18 hours after epoch selects the highest culmination of at least 20° with Sun below −6°. It rises at **17:53:22.867**, peaks at **17:58:49** at **44.9°**, and sets at **18:04:12.677 UTC**. The solar altitude at peak is **−17.9°**. Zurich's eligible passes are in daylight, so Sydney supplies the first night-side composition. Acquisition follows the modelled pass: this is retrospective propagation, not a claim that these inputs were available then, and not an optical visibility prediction.

Satellite.js **7.1.0**, **WGS72** and **AFSPC `a`** produce TEME kilometre positions. GMST rotates them to a PEF Earth-fixed approximation, using UTC for UT1 and omitting polar motion. HYG J2000 directions use Astronomy Engine **2.1.19** for precession, nutation and Earth rotation into the same viewing axes. Earth, camera and observer now use the **WGS84 ellipsoid**, with a declared Sydney height of 58 m. Source sub-millisecond epoch precision is retained in metadata and truncated by the JavaScript library. The clock is dated and bounded; playback, pause, reverse and direct seek reuse one instant across both populations.

The [numerical audit](https://github.com/emmettl/zenit/blob/main/docs/evidence/iss-numerical-2026-10-08.json) records independent Python sgp4 **2.27 / Vallado C++** near/deep-space and decay cases at positive and negative offsets. TEME comparisons pass a **2 cm position / 0.1 mm/s velocity** tolerance. Independent Astropy **8.0.1 / PyERFA 2.0.1.5** observer and horizon checks pass **50 m Earth-fixed / 0.01° look-angle** tolerances, allowing for reference IERS polar motion omitted in the browser. These tolerances concern implementation agreement, not element prediction accuracy.

Every position and each two-second sample of the previous 60 study seconds is evaluated directly from a cloned initial SGP4 record. Seeking and reversing reproduce the same point and trail. The sampled trail's maximum measured midpoint chord error is roughly **4 m** on five-minute-spaced checks across the study, below a 6 m test ceiling. The trail and satellite screen encoding express motion; reflectance, illumination, atmosphere and terrain are not reconstructed. Surface stars use an authored solar-altitude fade, fully bright below −18° and suppressed by −6°, so the shared clock does not retain the naked-eye field in daylight. This is a compositional twilight treatment rather than atmospheric photometry. Complete animation and interruption are tested in Chromium and WebKit phone emulation; sustained physical-phone performance is not yet measured.

## Stellar catalogue sources

The author's [HYG project page](https://www.astronexus.com/projects/hyg) still advertises 4.2, but the authoritative [Codeberg repository](https://codeberg.org/astronexus/hyg) supplies **4.4**, dated 12 July 2026. This release includes merged duplicate Gliese records, naming updates and corrected Beta Phe astrometry. The acquisition is pinned to revision `53e3df311869e813ace5f1ad2ec4ce909f13256c`, path `data/hyg/CURRENT/hyg_v44.csv.gz`, with compressed SHA-256 `00b349893b9a53106dd488d8371e8d2fa586043e500bb3cdb8bff3931682197d`. The 13,636,362-byte gzip, source README and licence are retained outside the public artifact. The [edition release audit](https://github.com/emmettl/zenit/blob/main/docs/evidence/stellar-release-2026-10-07.json) records capture time, input and output hashes, and population accounting.
[HYG field documentation](https://www.astronexus.com/projects/hyg-details) defines positions at epoch/equinox 2000.0, apparent visual magnitude, B−V colour index, proper motion, parsec distances and cross-identifiers. Distances at or above 100,000 parsecs mark unavailable or dubious parallax; normalize those to unavailable. Use its explicit angular-unit fields, such as `rarad` and `decrad`, to avoid ambiguity. Multiple-system components, cross-matches and uncertain spectral or velocity fields need care. Scope the internal identity to the HYG release and keep HIP/HD/HR/Gliese identifiers as cross-references; a proper name is a label.

The offline compilation selects finite directions and visual magnitudes with **V ≤ 6.0**, excludes the Sun, retains release-scoped source IDs, and applies a deterministic 10,000-record ceiling. Of 119,614 input records, one Sun entry and 114,543 fainter entries are excluded; 5,070 remain, with no invalid or cap exclusions. There are 428 named records, 104 missing or dubious distances, 23 missing colours and 778 variability designations. Separate multiple-system components retain their identities and glyphs. The compiled file is 854,727 bytes, about 334 KB gzip, with SHA-256 `d874dfa7da5f030ff1d121dd7711c8ee71eb236f7ef313b2c8ac51b87cd42a0f`. Its hash is checked before build and browser rendering. The surface renderer clips stars to the geometric horizon and camera view.

Catalogue directions remain at J2000. The first stellar release had a fixed orientation at 7 October 2026, 21:00 UTC; the ISS edition now turns the sky with the shared dated study clock. Astronomy Engine 2.1.19 supplies precession, nutation and Earth rotation. Proper motion, annual aberration, parallax and refraction are omitted. The largest supplied proper-motion magnitude corresponds to an approximate 0.0393° displacement over 26.77 years; this is an approximation scale, not a guaranteed error bound. Twelve independent pressure-zero Astropy 8.0.1 / PyERFA 2.0.1.5 reference cases, covering both hemispheres, multiple dates and above/below-horizon stars, agree within one arcminute. Reference annual aberration accounts for part of the allowed difference.
Actual star visibility needs more than a magnitude cutoff. [Cinzano, Falchi and Elvidge's visibility study](https://arxiv.org/abs/astro-ph/0011310) incorporates sky brightness, observer capability, atmospheric extinction and terrain. For the initial night-side landing, declare a clear, dark-sky approximation and a geometric horizon; no local observing conditions are being reconstructed. If daylight or twilight viewpoints are later offered, they need an explicit stellar visibility treatment.

The requested satellite streaks can be built from propagated positions on an accelerated clock. Their screen brightness remains an authored overlay. [Fankhauser, Tyson and Askari's optical-brightness study](https://arxiv.org/abs/2305.11123) depends on satellite reflectance, illumination and viewing geometry, showing why a position feed alone does not establish which satellites a person would see. A future optical mode needs its own validated inputs and model; the first descent can preserve truthful positions while making their movement legible.

HYG 4.4 is published under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Credit David Nash / Astronomy Nexus and the source release, link the licence and indicate selection, normalization and display conversions. Publish an adapted stellar data artifact with the required share-alike terms and preserve the source notice. Give it its own attribution and licence record so distribution retains both stellar and orbital source conditions.

[ESA's Gaia DR3 summary](https://www.cosmos.esa.int/web/gaia/dr3) describes astrometry to about G = 21 with a bright limit around G = 3. It could support a separate deeper-field investigation; the current visible-star composition needs complementary bright-star coverage and does not require that expansion. Gaia G and HYG visual magnitude are different passbands; any join or combined cutoff requires a stated conversion and duplicate policy. Keep Gaia identifiers as strings and include release-specific credits and terms before acquisition or distribution. No Gaia query or cross-match was performed for this addition.

Stellar epoch handling and the J2000-to-view transformation require independent numerical validation alongside the orbital audit. A catalogue direction is not an apparent observed direction at every date and site. State whether proper motion, precession, nutation, aberration, parallax and atmospheric refraction are applied or omitted, and justify the approximation at the display's angular resolution. The observer scene should distinguish geometric horizon position from optical visibility. Preserve variable-star flags without inventing time-varying brightness from a single catalogue magnitude.

For the [distant optional stellar composition](ZENIT.md#optional-stellar-depth-and-time), the [Gaia Collaboration's DR3 paper](https://arxiv.org/abs/2208.00211) confirms parallaxes, proper motions and radial velocities for a subset of sources. These are complementary inputs: parallax supports distance inference, proper motion describes angular movement, and radial velocity supplies the line-of-sight component where measured. A record without radial velocity cannot silently acquire a measured three-dimensional velocity.

[Bailer-Jones' distance-inference study](https://arxiv.org/abs/1507.02105) explains why uncertain parallaxes require statistical inference rather than unconditional inversion. A future audit should retain errors and correlations, state any prior and calibration, and distinguish estimated distances from raw measurements. Its motion model would need a justified time range and assumptions for missing components. No Gaia acquisition or stellar-time model is required for the current orbital composition.

## Next evidence release

Before a local composition is described as verified, retain the actual bounded input bodies with hashes, exact queries, capture times, response metadata, normalized record versions, group memberships, joins and an exclusion ledger. Add the stellar release, source notice, magnitude-selection rule, retained fields, epoch policy and measured subset size. The release should declare its study interval, age rule, attachment policy, frames, units and propagation version. This probe's aggregate record covers the orbital samples only and is not that release.

Before publication, preserve the applicable redistribution statements and field attribution, resolve optional enrichment, pass numerical and phone-budget checks, and show that every moving light can lead back to its dated input. Historical membership and optical visibility remain separate later investigations.
