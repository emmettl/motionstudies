# ZENIT

[Study repository](https://github.com/emmettl/zenit) · [Public edition](https://zenit.motionstudies.app/) · [Study index](README.md) · [Source audit](ZENIT-SOURCES.md) · [Series vision](VISION.md) · [Kickoff conversation](https://chatgpt.com/share/6ac6a662-d598-83ed-9c18-f9f1c6087cdc)

**Working brief — 7 October 2026.** ZENIT studies humanity's occupation of Earth orbit through the relationship between individual objects, orbital structures and the sky above an observer. The author's preferred stellar field is the visible, naked-eye sky. The signature sequence descends dramatically to Earth's surface and turns upward to satellites streaking across the stars. The title is the author's current preference. This is an unnumbered research proposal; the composition and limits below are proposed choices for a first proof.

**Implementation boundary — 8 October.** The edition now opens bounded station, GNSS and active geosynchronous families: 635 retained independent movers, 616 eligible at the opening instant, plus 12 inspectable attachments. Family filters preserve overlapping memberships without duplicate lights; source age eligibility changes with the shared dated clock. Wide / near-Earth framing keeps distance linear, and a 600× overview makes orbital rhythms legible. The original Sydney ISS element set, 5,070-record HYG field and twelve-second descent remain intact; the pass cue uses 10× playback. The study is 7 October, 11:58:49–23:58:49 UTC, with ISS culmination at 17:58:49 and 44.9° elevation. Direct background propagation supplies a timestamp shared by every light and the sky. The subdomain remains canonical, with the same artifact at `/zenit/` and GitHub Pages; see [hosting](HOSTING.md#zenit-hosting).

The orbital camera supports drag-to-orbit, scroll-to-zoom, keyboard navigation and touch-accessible zoom buttons. Clicking a satellite selects and follows it; attachments follow their parent station. Follow uses the shared displayed timestamp and ends when the selection is hidden or outside its eligible window. Camera movement preserves the clock and physical distances. The globe uses pinned Natural Earth land polygons for geographic reference. A reversible twelve-second descent captures the current orbital viewpoint, reaches Sydney at 7.68 seconds, holds a two-degree horizon gaze until 9.36 seconds, then lifts toward the retained ISS pass. An analytic WGS84 horizon replaces the coarse globe near the 58 m observer; its colour is authored, with no local terrain or weather model. The full panels recede into a compact clock, identity and pause/return view; Show panels restores inspection at the same instant and pose.

Visible, non-reduced-motion sessions start a repeating sixty-second camera journey once sources settle and the first population packet is ready: sixteen seconds on the whole-orbit shells, with four seconds each for stations, navigation, geosynchronous members and the ISS; twelve seconds descending to Sydney, holding the horizon and looking up with the clock frozen; twenty seconds watching the retained ISS pass at 10×; twelve seconds returning along the camera path with the clock frozen. A one-second fade on each side of the orbital seam conceals the reset of the dated pass. Pause holds both camera and clock; exploration preserves the displayed pose and UTC timestamp, and Replay journey restores the composition. Source controls and orbital gestures hand over to paused exploration. Reduced motion opens paused; enabling it mid-journey freezes the current view, and removing it does not restart motion. Hidden tabs pause without restarting on return. Free exploration retains forward/reverse looping within the twelve-hour interval and the independent Sydney cue.

The orbital opening crossfades visual emphasis through the three source families while keeping the full population present. Shared memberships retain one glyph. Captions report median WGS84 model height from the displayed packet and median mean period from retained mean motion; attachments are excluded and numbers are rounded for reading. The first twelve seconds run at 600×; the final four-second ISS introduction holds the initial pass UTC and labels the station before following it down to Sydney. Manual exploration clears authored emphasis at the displayed pose and date. The sky hold still includes culmination nine seconds after its start.

The user reports smooth playback on their iPhone; device model, browser and measured frame rate are not recorded. Browser viewport tests remain separate evidence.

Manual scrubbing retains the last complete satellite packet while the latest requested instant is calculated. The slider follows the requested time immediately, while orbital geometry, the stellar clock and selection readings switch together to the accepted packet. Superseded seek results are discarded; data replacement, failure and retry clear the retained packet.

The surface sky has a small Sydney horizon compass, showing the camera's azimuth from true north and a bearing strip. It fades in from arrival through the horizon hold and away during ascent. Bright-star names use the retained HYG catalogue (V ≤ 2.0, altitude above 5°), projected with the displayed stellar transform and camera. Up to four names appear on desktop and three on phones, with fewer where clipping, panel spacing or the selected satellite needs room. Labels share the stellar daylight fade, disappear with Show stars, and avoid each other and visible controls. Paused panel changes and scrolling update their placement. The compass uses fixed-observer geometry rather than device orientation and remains available if stellar data is missing.

The share card uses the production-rendered Sydney ISS culmination and HYG field, with authored typography and framing at 1200×630. Its content-addressed PNG retains HYG attribution and CC BY-SA 4.0 artwork terms. Static HTML supplies the canonical subdomain, current description, complete Open Graph/Twitter image tags and alt text, CreativeWork JSON-LD, and matching SVG/PNG/touch icons. Social crawlers receive this metadata without running the application. The artwork is generated manually from pinned local assets; builds and visitors do not fetch providers.

## Thesis

Earth is surrounded by an infrastructure whose motion is mostly invisible from its surface. Seen together, the objects describe shells, planes and rings. Seen individually, each belongs to a particular launch, purpose and history. ZENIT makes that structure encounterable while preserving the evidence behind each moving light.

The defining transition is from the whole Earth to the sky above one place, keeping the same object and clock throughout. An abstract orbital arrangement becomes a relationship to an observer. This extends the series' sea, shoal and fish: the orbital population, a meaningful family, and one identifiable object. The smallest unit is a catalogued object with a modelled position; it is not a live position report.

Orbital mechanics supplies the rhythm. Human choices supply the population and its arrangement. The work can expose their relationship without claiming to explain an operator's decisions or reconstruct unrecorded manoeuvres.

## First composition

Begin with a dark globe, a restrained geographical reference, a catalogue-derived stellar field and three dated orbital cohorts: stations, navigation satellites and the provider's active geosynchronous group. Their contrasting periods and inclinations should make the structure legible before a dense constellation is added. These are overlapping source groups, not a complete inventory or a partition into low, medium and high orbit.

The [initial probe](evidence/zenit-sources-2026-10-07.json) found 716 distinct IDs across those groups, before age, attachment and propagation exclusions. A first proof should accept at most 1,000 independent movers. Publish the input, eligible and displayed counts per group; any further selection must use a recorded rule. Keep an excluded-record ledger. A later constellation chapter can test the dense-shell image on its own measured budget.

Proposed sequence:

1. **Earth and its periods.** Open in an oblique orbital view. A single clock accelerates the movement; the globe's rotation remains coupled to that clock. Pause and reverse should reveal repeatable geometry.
2. **One family.** Isolate navigation or geosynchronous objects. Brief traces reveal orbital orientation and repetition. Shared group membership remains inspectable.
3. **One object.** Select a light to see its name, catalogue ID, source group, element epoch, time offset and available launch metadata. A sampled orbit guide and the recent trail have separate labels.
4. **Down to Earth and looking up.** Dive towards a chosen place on the night side, settle at the surface and turn the camera upward. The orbital population becomes moving lights and short streaks against the familiar stellar field. Carry the selection and clock through the entire descent. Begin with one declared observer preset and an eligible propagated pass; a manually chosen place can follow. The calculation can stay on the device.

The first composed proof should join the orbital view to one surface landing. The camera movement is central to the work's argument: the viewer comes to inhabit a place within the system they have just seen from outside.

## Descent to the surface

Propose a ten-to-fifteen-second authored movement. Earth swells to fill the view as the camera approaches a fixed place, slows near the surface and rolls smoothly into a local upright orientation. The horizon briefly establishes arrival before the gaze tilts into the sky. A restrained ground silhouette is sufficient for the first composition; detailed terrain can follow if it earns its transfer cost. The stars keep their celestial directions as nearby satellites acquire the observer's perspective.

On arrival, retain the accelerated study clock so satellite passes draw short streaks across the sky. Show the clock multiplier; derive trails from a bounded duration in study seconds. A slower or real-time setting should shorten the perceived action through time control. The trail follows the propagated sky path and must be recomputed correctly when seeking or reversing. Keep it separate from any camera-motion blur during descent.

Use a declared night-side preset for the first landing. Clip stars and satellites against Earth and the local horizon, and keep the landing outside the ground mesh. Offer a reversible return to orbit without losing object identity or study time. Reduced motion should switch directly to the same surface viewpoint; the descent can be interrupted and playback paused independently.

The surface composition is a modelled satellite overlay on an idealised naked-eye stellar field. Its satellite brightness and streak treatment express motion. An optically filtered satellite view would need a separate brightness model and should remain a later investigation.

## Stellar catalogue

Include a catalogue of bright stars as an idealised naked-eye field in the first proof. Its slow celestial reference makes the nearby orbital motion easier to read; in the observer view, Earth's rotation carries that field across the horizon. Render only the directions above the local horizon and inside the camera's field of view. Selection should also reach a star's own record: its designation or available name, catalogue identity, apparent visual magnitude, colour index, source position and reference epoch. Preserve distance and spectral information where available for inspection.

The first acquired source is **HYG 4.4**, a compilation of Hipparcos, Yale Bright Star and Gliese records. The [source audit](ZENIT-SOURCES.md#stellar-catalogue-sources) records its pinned input, fields, licence and compiled release. The apparent visual magnitude limit is **V ≤ 6.0**, excluding the Sun, with a deterministic **10,000-record** ceiling. The current release has **5,070 records**, 428 named, and a roughly 334 KB gzip payload. The cutoff represents an authored dark-sky reference, with actual visibility dependent on observing conditions. A deeper stellar field is outside the current composition.

Draw stars as directions on a celestial sphere. Its display radius supplies a rendering surface, not stellar distance; moving the orbital camera around Earth must not create artificial stellar parallax. Genuine catalogue distance belongs to the record, with unavailable or dubious values left unavailable.

Catalogue position epoch and coordinate frame must survive compilation. Transform the stellar field and satellite positions into a common declared viewing frame: J2000 catalogue directions cannot simply be overlaid on TEME output. Preserve proper motion and document how positions are advanced to study time, or quantify the error of a fixed-epoch approximation. Earth rotation, horizon clipping and any precession treatment must agree across both views.

Apparent visual magnitude should govern relative stellar brightness through a declared, bounded display mapping. Colour may be estimated from the catalogue's B−V index with a recorded conversion; missing indices receive a neutral treatment. These are authored screen encodings. A magnitude cutoff does not claim a star will be visible from a particular place, and catalogue magnitudes do not supply a live light curve. Keep star and satellite glyphs distinguishable, offer a stellar-layer toggle, and reserve labels for selection or a few orientation anchors.

## Time and evidence

Use one frozen acquisition with a declared UTC study interval. For the first proof, propose twelve hours centred on a chosen reference instant, with each object eligible only while its element epoch lies within 24 hours of study time. This is a conservative editorial cutoff, not an accuracy guarantee; the propagation audit may require a shorter interval or different cohorts. Show unavailable objects as unavailable, and report changing eligibility instead of making disappearance resemble reentry.

Call the movement **propagated from dated orbital elements**. The inputs are fitted mean elements; the browser computes positions with SGP4. Acquisition time, element epoch and study time are three different times. An element published after an instant may reconstruct that instant, but cannot be described as information known then. A freely reversible clock reproduces a model, not a recovered stream of observations.

Keep physical distance linear in the orbital view and show scale. Point sizes and trail brightness are authored display choices. A later compressed-radius view would need a persistent scale explanation. A geosynchronous group must not be presented as an entirely stationary equatorial ring: inclination and eccentricity matter, and apparent motion depends on the reference frame.

Treat docked objects as attachments to a parent in the first proof, with separate identities available in selection. Do not multiply a station's apparent orbital movement because several catalogued pieces share it. Missing metadata stays unknown; object type and operating status are separate fields.

## Visual language

The first image should reveal structure through motion and selective traces. Keep terrain imagery, clouds and atmospheric effects subordinate. The stellar field supplies orientation with restrained brightness; selecting a star can bring its record forward. Show all eligible orbital points, but bound trail length and the number of traced objects independently. A sampled guide describes the modelled orbit; a recent trail describes elapsed study time. Neither is an observed track.

Position glyphs must read as modelled estimates and expose their epoch when inspected. Do not turn age into a numerical confidence score or invent an uncertainty volume from it. A plane surface, if useful later, is an illustrative orientation rather than a measured surface occupied by objects.

Earth shadow could add a second rhythm after the frame and solar calculations pass verification. Illumination still would not establish visibility: brightness, attitude, atmosphere and local conditions are additional questions. Sound remains an optional authored strand after the motion earns it.

## Later chapters

**Historical accumulation** could compare dated populations and orbital structures across the space age. It requires historical membership, launch and decay evidence, appropriately dated elements and explicit gaps. Launch-date filtering of today's surviving objects can only show the launch-age distribution of today's population. A 1957 opening remains a hypothesis until usable early records are established.

**Debris evolution** could examine the changing catalogued population associated with an event. It must distinguish breakup time, first detection, catalogue entry and element epoch. Subsequent element sets cannot by themselves reconstruct the fragmentation instant. Any illustrative breakup would need a visibly separate modelling treatment.

These chapters should have their own bounded source and composition proofs. They do not depend on collecting a complete historical archive before the first work can be encountered.

### Optional stellar depth and time

**Very long-term possibility, suggested by the author on 7 October.** A Gaia-based composition could let the visible sky open into depth: infer stellar distances from parallax, then explore how the arrangement changes over stellar timescales using proper motion and, where available, radial velocity. The apparent celestial sphere would become a population at different distances with its own movement. This remains a distant optional idea, outside the active Earth-orbit proof and its acquisition, architecture and release requirements.

If pursued, give this composition an explicit change of spatial scale and clock. It would need its own distance-inference method, uncertainty treatment, treatment of missing velocity components and justified extrapolation interval. Parallax supplies distance evidence; motion needs additional measurements. Long-time paths would be labelled as modelled extrapolations, with their assumptions visible. The present naked-eye field and surface descent can stand as a complete work while this possibility remains open.

## Ownership and operating limits

Motion Studies owns this brief and the source decisions. The independent ZENIT edition should own identity, cohort rules, orbital adapters, propagation worker, camera composition and publication. Reuse shared clocks, controls and resource patterns where they fit; existing ground-transport positions do not supply a three-dimensional orbital coordinate contract. Extract shared orbital capabilities only when a working edition demonstrates the need.

Acquisition should happen offline or on a controlled recorder, with immutable hashes and a finite archive. The browser should load a compiled snapshot from the edition's hosting rather than query providers per visitor. A paused collector should leave a dated work usable. Apply the [series cost policy](COST-CONTROL.md); the proof needs no recurring capture or paid service.

Proposed opening budgets are **2 MB compressed** for application, first orbital cohort and initial stellar subset, **1,000 independent orbital movers**, **10,000 stellar records**, and a sustained **30 fps** during playback on a named ordinary phone. Allow at most **500 KB compressed** of that opening budget for stellar positions and selection metadata. Record actual transfer, worker cost, frame times and seek latency; desktop emulation cannot establish physical-phone performance. These are targets, not measured results. Reduced motion should open paused, with accessible selection, clock controls and a text account of both populations.

## Proof and admission

The next implementation should leave one reviewable local composition and a retained evidence release. Its acceptance checks are:

- Reconcile every displayed identity, group count, metadata join and exclusion to captured inputs. Preserve source rights and attribution per field.
- Compare propagation and coordinate transforms to independent reference cases, including low and deep-space orbits, epoch boundaries and invalid/decayed results. Document tolerances and constants before accepting the output.
- Confirm that direct seeking, forward play and reverse seeking produce the same positions and trails at the same instant. Quantify any sample interpolation error against direct propagation.
- Show one inspectable object and demonstrate the frame difference between orbital and Earth-fixed views. Keep identity and time through the observer transition when it is introduced.
- Demonstrate the complete descent and upward reveal at one declared night-side preset, including reversible camera movement, horizon/ground clipping, a real propagated pass and trails measured in study time. Verify interruption and the reduced-motion jump to the same viewpoint.
- Reconcile stellar selection and the magnitude cutoff to the captured catalogue; validate known star directions and horizon positions against an independent astronomy reference at several places and times. Check frame alignment, epoch handling, Earth occlusion and the absence of artificial parallax when the orbital camera translates.
- Measure the opening and interaction budgets on the declared device, and show source age, limitations and exclusions in the composition.

Technical feasibility does not settle artistic admission. ZENIT earns its place when the motion reveals a structure worth watching, and the transition overhead changes how that structure is understood. No catalogue number or public release follows from this brief alone.
