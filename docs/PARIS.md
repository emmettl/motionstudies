# 008 — Correspondances

[Open Correspondances](https://emmettl.github.io/correspondances/) · [Edition repository](https://github.com/emmettl/correspondances) · [Study index](README.md)

Implementation paths and commands below belong to the edition repository. This brief retains its source audits and staged delivery history.

**A Paris motion study**

*Le centre respire; la région répond.*

## Current state — 13 September 2026

The inspected edition at `4e06d7a` now implements **32 lines: all sixteen Métro lines, RER A–E, nine Transilien lines and T3a/T3b**. The pinned 4 September 2026 service day contains **3,141 morning journeys and 17,088 full-day journeys** across the complete selectable ground network. The eight-line default remains at 977 morning journeys; further groups load independently with their own morning/day artifacts. Shared package pins are alpha.9.

The progression is now concrete: Métro/RER supplies 2,503 morning and 13,878 daily journeys; Transilien brings that to 2,967 / 16,147; T3a/T3b brings it to 3,141 / 17,088. See the edition's [complete Métro record](https://github.com/emmettl/correspondances/blob/4e06d7a/docs/METRO-COMPLETE.md), [Transilien](https://github.com/emmettl/correspondances/blob/4e06d7a/docs/TRANSILIEN.md) and [tram study](https://github.com/emmettl/correspondances/blob/4e06d7a/docs/TRAM.md).

The continuous **Cœur / Région** scale and correspondence director remain the authored centre of the work. Optional AIR adds 4,385 observed track segments and 211,089 samples across the day, with 501 morning segments; these are ADS-B observations, not flight plans. Ground services remain scheduled motion, and interchange opportunities do not prove passenger transfers.

[Public release metadata](https://motionstudies.app/correspondances/_release.json) identifies `75a501f`, earlier than inspected HEAD. This brief records implementation; it does not imply that the latest package upgrade is deployed. The older payload/frame figures below remain dated measurements. Physical-phone and Windows Edge performance evidence, other tram lines, buses and operational rail observations remain separate work. See the [series status record](STUDY-STATUS.md).

## Thesis

Paris is an illuminated nervous system at two scales. Inside the périphérique, Métro circulation is dense, repetitive and almost cellular. RER services pass through that core and erupt into the banlieues, making the regional city suddenly enormous. The defining act is not another map morph for its own sake, but a continuous change of scale in which interchange binds centre and periphery.

**Correspondances** means transfers, but also correspondences between systems, maps and perceived cities. The work should use French first in its authored voice while retaining the Motion Studies fallback-language contract.

## Signature study: interchange waves

A selected central interchange should emit timed transfer waves rather than a generic radial pulse. Incoming Métro and RER movements contract into the complex; plausible transfer intervals delay the outgoing wave; branches then expand at radically different spatial scales. The visualization may model scheduled opportunity, but must not claim individual passenger movement without passenger-flow evidence.

The companion composition is a breathing scale transition: the Métro core remains active as the camera withdraws and the RER network unfolds across Île-de-France. Density is not solved by hiding the centre; it changes representation from individual movement to pulse and corridor intensity.

## Visual grammar

- Métro motion is fine-grained, bright and dense inside a restrained périphérique ring;
- RER movement uses longer strokes that remain legible far beyond the centre;
- the Seine provides geographic continuity across scales without becoming a decorative basemap;
- interchange halos encode scheduled connections or measured flow only when the source supports them;
- stations aggregate progressively by complex, line and regional node as scale changes;
- line/operator colour is locally authored and source-aware, never a casual copy of operator branding;
- typography should feel unmistakably Parisian while remaining readable over luminous density.

## AIR — the observed sky

An optional AIR layer now replays aircraft from the same 4 September 2026 service day as the railway: 501 morning flight segments and a 4,385-segment day index with twelve lazy two-hour chunks. Aircraft stay on the shared clock and can be searched, selected and followed. CDG, Orly and Le Bourget provide airport context, with approach-envelope associations explicitly labelled as inferred. The dated ADSB.lol/ODbL observations remain distinct from scheduled IDFM trains; aircraft data loads only after activation. The [edition AIR guide](https://github.com/emmettl/correspondances/blob/main/docs/AIR.md) records provenance, filters, source hashes, payload gates and regeneration commands.

## Source audit and delivery history — 4–7 September 2026

Île-de-France Mobilités' PRIM portal is the authoritative first source. Its GTFS Datahub export describes the next 30 days across Métro, RER, train, tram, bus and coach services from 75 operators and is regenerated three times daily. It includes routes, stops, trips, calendars and stop times, plus `stop_extensions.txt` for stop / stop-area / interchange-zone identity, `pathways.txt` for walking links inside stations and `transfers.txt` for walking correspondence times. That is unusually well aligned with this edition's thesis: scheduled connection opportunity can be modelled without pretending to observe passenger movement.

The timetable export is governed by the **Licence Mobilité**. PRIM presents catalogue export as an authenticated operation, while the canonical archive URL currently resolves directly; the compiler therefore accepts an explicit local archive and never depends on ambient browser authentication. PRIM describes the licence as ODbL-derived, allowing reuse while adding user-identification, derived-database sharing and public-interest mobility conditions. Reference datasets such as lines, stops and rail alignments may instead use Licence Ouverte or ODbL; PRIM maps and plans use separate, more restrictive terms and must not become source artwork. Every compiled Paris artifact records the exact licence, source URL, retrieval time and archive digest.

The first technical proof is the complete published Métro 1 / RER A pattern active from 07:00–09:00 on Friday 4 September 2026. It puts dense central circulation and RER regional branches on one clock without loading the full network. The pinned archive (`sha256:c29fa6124744…`) compiles to 283 journeys, 96 source stops and 99 source-shaped segments; its 251.6 KiB JSON is 67.9 KiB gzip. RER mission codes remain searchable while displayed destinations come from the final scheduled stop.

The same artifact carries the relevant `transfers.txt` evidence for five shared complexes: La Défense, Charles de Gaulle–Étoile, Châtelet–Les Halles, Gare de Lyon and Nation. Each directional link retains its published minimum transfer time. The first correspondence director finds a feasible pair of scheduled calls after the current clock, pauses on the inbound arrival, isolates both movements and reveals the complex. It describes scheduled opportunity only; it does not infer that a passenger actually transferred.

The opening scene now carries a separately sourced geographic context: the official commune 75056 contour from the French government's API Découpage administratif, 60 Seine/canal polygons from the City of Paris Plan de voirie and the nine-part Boulevard Périphérique axis from the City's Filaire de voies. Their source hashes and publishers remain separate in the compiled 6.4 KiB-gzip artifact; both City layers retain their ODbL attribution. The outline is context, not an assertion that Paris ends at the visible central boundary while the RER continues into the region.

The same two-line source proof is available across the complete Friday service day: 1,461 journeys split into twelve lazy two-hour chunks. The manifest is 19.5 KiB gzip and the largest rush-hour chunk is 52.3 KiB gzip, so the default 07:00–09:00 view remains fast and the 24-hour clock incurs only the current and adjacent chunks.

A source-pinned scope audit now measures the complete Métro/RER morning before any larger artifact is shipped. The same Friday feed contains 2,503 active journeys across 21 lines and 1,044 directional stop records during 07:00–09:00. Loading that whole nervous system into the opening view would swamp the existing 283-journey composition. The first independently loaded layer is therefore **Métro 4 + Métro 14 + RER B**: 372 journeys and 147 stops, chosen because its north–south crossing complements the opening east–west pair. Its 91.5 KiB-gzip artifact is fetched independently and composes with the running base network in the browser. It is now enabled by default. When both N–S and 24H are active, its complete 2,100-journey day is drawn from a separate manifest and twelve progressive chunks; the largest compressed chunk remains below 82 KiB.

The second additional layer adds **RER C + RER D + RER E**, taking the default regional composition to eight lines and 977 morning journeys. Its 322-journey opening artifact is 101.1 KiB gzip; the complete 1,422-journey day again uses twelve independent chunks, all below 65 KiB. Both layers start enabled. The compact Couches menu lets viewers turn either layer off. The base view can render before the additional layers finish, and a failed layer leaves the base usable. The default opening budget includes both layers, with a 625 KiB gzip ceiling; full-day manifests and chunks still load only after selecting 24H.

**Historical milestone — 7 September 2026:** the eight-line density review and continuous scale tuning were complete. **Arcs du Métro** added lines 2/6 (248 morning and 1,495 full-day journeys), and **Traversées du Métro** added lines 5/7, including both southern branches of line 7 (291 morning and 1,573 full-day journeys). Each group loaded, retried and followed the 24-hour clock independently. With both enabled, twelve lines carried 1,516 morning and 8,051 full-day journeys. The nine Métro lines outside that milestone have since been implemented, as recorded above.

At edition commit `da5678d`, the recorded default opening is 592.2 KiB gzip against its 625 KiB gate; activating both optional groups brings the initial composition to 709.8 KiB against 750 KiB. The twelve-line review records 65 passing Chromium/WebKit browser checks and local M4 Max Chrome samples around 60 fps. These do not establish Windows Edge or physical-phone performance, or verify deployment of that commit. See the edition's [density review](https://github.com/emmettl/correspondances/blob/main/docs/DENSITY.md), [Métro arcs](https://github.com/emmettl/correspondances/blob/main/docs/METRO-ARCS.md) and [Métro crossings](https://github.com/emmettl/correspondances/blob/main/docs/METRO-CROSSINGS.md).

An authored **Cœur / Région** scale control now moves the same running scene between a close Châtelet-centred reading and the complete RER branch structure. It does not replace the network or reset the clock. The region view strengthens aggregate edge frequency; the close view lets individual vehicles and labels take over, retains the Seine and périphérique, and removes the enlarged administrative outline before it becomes visual architecture.

Sources:

- [PRIM GTFS Datahub dataset](https://prim.iledefrance-mobilites.fr/jeux-de-donnees/offre-horaires-tc-gtfs-idfm)
- [PRIM GTFS structure guide](https://prim.iledefrance-mobilites.fr/en/reutilisations/reutilisation/gtfs)
- [Licences used by PRIM](https://prim.iledefrance-mobilites.fr/en/licences)
- [Licence Mobilité text](https://www.iledefrance-mobilites.fr/medias/portail-idfm/4dc136f7-df23-449b-9670-24bc5254a706_RAA138.pdf)
- [API Découpage administratif — communes](https://geo.api.gouv.fr/decoupage-administratif/communes)
- [Ville de Paris — Plan de voirie, voies d’eau](https://opendata.paris.fr/explore/dataset/plan-de-voirie-voies-deau/)
- [Ville de Paris — Filaire de voies](https://opendata.paris.fr/explore/dataset/voie/)

### PAR 0 — Source and rights audit

- [x] Identify the authoritative PRIM timetable, service-calendar, route-geometry and interchange schema for Métro and RER.
- [x] Record the Licence Mobilité access and attribution/share conditions separately from open reference data and protected map artwork.
- [x] Confirm that GTFS interchange zones, pathways and transfer times can support scheduled connection opportunity; platform and passenger-flow claims remain out of scope until fixture evidence says otherwise.
- [x] Inspect the current canonical archive, freeze Friday 4 September 2026 by SHA-256 and validate the Métro 1 / RER A line pair before ingestion.

### PAR 1 — Centre / periphery proof

- [x] Compile Métro 1 and RER A on a shared deterministic 07:00–09:00 clock.
- [x] Add the Seine, an official Paris boundary and the published Boulevard Périphérique axis as a minimal geographic frame.
- [x] Prove that close individual motion can become aggregated pulse/corridor intensity as the same running scene moves between centre and region.
- [x] Establish phone and desktop density budgets before adding more lines (402.7 KiB gzip first view; 67.9 KiB timetable and 6.4 KiB geography).
- [x] Add an independent `index.html` shell in the Correspondances repository with route/station/mission search, touch station selection, route isolation, playback and limited chrome.

### PAR 2 — Correspondances

- [x] Model the five shared Métro 1 / RER A interchange complexes separately from their constituent stops.
- [x] Derive connection opportunities from timetable and directional transfer evidence without inventing passenger journeys.
- [x] Author three contrasting hub compositions: Châtelet–Les Halles as central Métro density, Gare de Lyon as cross-city RER interchange and La Défense as the regional threshold. Repeated correspondence direction cycles through the three without replacing the network.
- [x] Make station selection explain which routes touch the selected stop or complex at the current scale.

### PAR 3 — Full nervous system

- [x] Add the complete two-line Friday as twelve progressive two-hour chunks behind an explicit 24-hour control.
- [x] Audit the complete 21-line morning from the pinned archive and define the next independently loaded layer as Métro 4 + Métro 14 + RER B rather than adding 2,503 journeys to the opening scene at once.
- [x] Compile and ship the 372-journey central-cross layer with an independent 110 KiB compressed payload gate; retain its layer control after enabling it by default.
- [x] Carry each enabled layer through the 24-hour clock with its own twelve progressive chunks rather than replacing or eagerly bundling it.
- [x] Open all eight implemented lines by default, counting both additional morning layers in the opening transfer budget.
- [x] Proceed past the five-line gate by explicit direction, adding RER C/D/E as a second independently selectable morning and 24-hour layer.
- [x] Review the eight-line regional density and tune the continuous Cœur/Région transition before extending the network.
- [x] Add optional Métro 2/6 arcs and Métro 5/7 crossings, each with independent morning/day loading, retry, source and payload checks.
- [x] Add scale-aware station and mission label tiers, with place names leading the centre view and vehicle labels reserved for closer zoom.
- [x] Add the remaining nine Métro lines as independently loaded groups, completing all sixteen Métro lines and five RER lines.
- [x] Add nine Transilien lines and T3a/T3b with independent loading, source audits and full-day playback; complete selectable scope is 32 lines.
- [ ] Capture Windows Edge and physical-phone frame measurements; local desktop and phone-viewport checks do not certify those devices.
- [ ] Assess further tram and bus additions against the centre–periphery argument and their own coverage and payload gates.

### PAR 4 — Observed city

- Add realtime or historical operational variation only after static identities are stable.
- Consider road flow at the périphérique as a contrasting ring study, not as a requirement for modal completeness.
- Keep aviation, buses and other strata optional and justified by a specific composition.

## Exit criterion

The viewer should feel Paris change scale—from cellular Métro rhythm to regional RER expansion—while correspondence remains visible as a timed relationship rather than a station symbol.
