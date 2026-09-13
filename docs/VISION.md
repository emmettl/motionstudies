# Motion Studies — project goals

Motion Studies is an evolving series of authored works about how the world moves, mediated through technology. Each work develops its own subject through geography, human activity, natural processes and evidence. The catalogue brings those works into relation; shared software supports the technical behaviour they have in common.

## Creative premise

Articulated by the author on 13 September 2026: “a desire to see the world mediated through technology” and “creative engineering unburdened by the human labour of actually doing the engineering”.

The creative act includes specifying an instrument through which the world can be perceived: choosing what it notices, how it treats time, what it brings into relation and what remains unresolved. Engineering is an artistic material. AI-assisted implementation makes unusually particular instruments feasible, including experiments whose value only becomes apparent once they can be seen and used.

The author's attention can move towards curiosity, composition and judgment while the engineering agent carries implementation, verification and routine maintenance. Whether a movement is truthful, a visual relationship reveals anything or an interaction deserves its complexity remains a consequential judgment. Working instruments make those questions available to experience.

The series itself emerged from Gleislicht. Its direction should remain open to further discoveries of that kind. Works have greater or lesser technical overlap: a bird-migration study may develop primarily as an artwork, while Underfall may acquire practical value as a Bristol exploration or planning tool. These possibilities can coexist and evolve; neither fixes a template for the rest of the series.

## The world in miniature

At the level of the gesamtkunstwerk—the whole project as a composed work—the catalogue may become part of the artistic material: “a perversely detailed system”, “a precise cartography of a (somewhat) imagined world”. Numbering, reserved ranges, gaps and relationships between series can carry weight. A distinction between nature studies and cities is one possible organising idea, not an adopted numbering scheme.

This aesthetic discipline is emergent and malleable. A later organising idea can cast existing works into a new light. Titles, numbers and groupings may retrospectively make a relationship legible as that relationship becomes compelling. Such classification is itself an act of authorship. Precise observations can inhabit an imagined arrangement without changing what the observations support.

Catalogue numbering and admission remain artistic and editorial decisions. Their unresolved form does not prevent rigorous engineering, and technical reuse should not determine their eventual shape.

## What this asks of the engineering

Architecture should keep the cost of following curiosity low as the body of work grows. Maintaining yesterday's instruments should leave room to imagine tomorrow's.

The series must also remain financially bounded: approximately **US$100/month in total** for its operating infrastructure. A surge in visitors must not create an open-ended bill, and preserved evidence must fit a finite collection. The [cost-control policy](COST-CONTROL.md) develops this constraint through static publication, bounded collection and processing, and explicit retention allowances. A recorded work should remain encounterable when new collection pauses.

Be exact about data contracts, clocks, state and resource ownership, module boundaries, reproducibility and verification. Let shared libraries follow demonstrated technical relationships. Each work should be able to use the capabilities it needs while retaining its own composition and interpretation.

Keep stable technical identifiers independent of mutable titles, catalogue numbers and groupings. Support rearrangement and reinterpretation without unnecessary code or data migrations. A preserved study should be able to remain fixed while another work evolves into a maintained tool.

The [code and library consolidation proposal](ARCHITECTURE-CONSOLIDATION.md) develops the immediate engineering work. Its priorities and implementation choices can change; this creative purpose is the criterion against which they should be judged.

## What the series should achieve

- **Make movement legible.** Watching and playing with time should reveal a rhythm, spatial relationship or transformation that a static map cannot show.
- **Give each work its own subject.** Gleislicht reveals Swiss clockwork and terrain; All Change transforms physical London into diagram space; Local / Express studies scheduled overtaking; Correspondances connects central Paris to its region.
- **Keep the evidence visible.** Scheduled, observed, estimated and reconstructed movement have distinct meanings. Source dates, licences, gaps and interpolation belong to the work's data contract and presentation.
- **Build an instrument for exploration.** Continuous time, selection and camera behaviour support both deliberate exploration and authored sequences. Recording, reduced motion and accessible fallbacks are part of the experience.
- **Work within an ordinary phone's budget.** Prove a bounded opening composition first, then load optional scales and complete days progressively. Each edition owns its measured transfer and interaction limits.
- **Let real works justify shared code.** Motion Studies owns public package contracts, common rendering and UI behaviour, and a widget lab that exercises them before release. Editions own their identity, composition, data, source adapters and deployment.

## From pattern to evidence

Patterns may emerge from many individual movements while the evidence of each remains reachable. A viewer should be able to move from the whole field, through a meaningful group, to one journey or measurement, and return without losing its relationship to the whole. The national-study image is the sea, the shoal and the individual fish.

This is an artistic and evidential commitment. Framing, light, projection and duration are authored; their influence should be discoverable. Aggregates should explain their measure and constituents. Source records remain representations of the world, and some sources contain only counts: their finest inspectable unit is a measurement, not an invented individual trajectory. Emergence describes the visible pattern without asserting a cause or disguising a designed timetable as spontaneous order.

The proposed [national study](NATIONAL-STUDY.md) develops this principle through England's differing local and long-distance service rhythms. Its [feasibility report](NATIONAL-DATA-FEASIBILITY.md) separates available foundations from the source and engineering proofs still needed.

## The view from altitude — 13 September 2026

The founding image of the series is the first orbital view: the whole of a country seen from a sub-orbital remove, with the knowledge that each point of light is a real bus or train moving at that place, at that minute. The feeling does not come from the pattern. A thousand invented points from the same altitude would look nearly identical and mean nothing. It comes from the pattern being true.

This makes the evidence commitment aesthetic as well as ethical. Provenance, source dates and the distinction between scheduled, observed, estimated and reconstructed motion are what allow a light seen from altitude to be believed. Without that guarantee the view is decoration.

The descent to a single journey matters mostly as a promise. A viewer will almost never choose one bus, but they can, and if they do it must lead into the story of that particular bus and back out again without losing time, place or identity. The capability is largely latent. Its job is to make the whole trustworthy, whether or not anyone descends. This is also why synthetic previews are not partial works: by this measure they are the absence of the work.

Three consequences follow for the instrument:

- **Sharpness encodes evidence.** A hard point of light is a measured thing at a known place. A haze is a value believed to exist somewhere in an area. Interpolated and modelled quantities should look diaphanous, both because it is more beautiful than a step and because it is more honest. Their softness is set by the measurement's resolution and recorded like any other provenance; smoothing for its own sake is a quiet falsehood. A recorded vehicle between two reports is itself an inference and may soften between them.
- **Multiple clocks, not multiple datasets.** Transport is human time laid over a country. A second band earns its place only if it runs on a different period, or on the same period for a different reason, so that laying it beneath the transport figure changes what the pattern means: the solar day, the tide, the electricity demand that is a second witness to the same morning, the synoptic weather that is indifferent to the timetable. A conventional map answers where things are; these works answer what condition the country is in.
- **Figure and ground.** The sharp populations are the subject. Conditions move beneath them and must recede rather than compete.

The shared software is the loom, and the works are the cloth. Building the loom is legitimate engineering interest in itself, and much of the repository records it. It is necessary and not sufficient: the test of the instrument is whether it produces a work that could not exist without it.

## Delivery approach

Every stage should leave a coherent study that can be viewed and assessed. A new investigation begins with a provisional subject, source audit and bounded proof. Its composition can develop through making and encountering the work. Public release needs a defensible evidence and publication path; catalogue placement and numbering follow the emerging artistic discipline of the series.

The shared/local boundary is now enforced through four coordinated npm packages. Shared changes are exercised in the [widget lab](https://motionstudies.app/lab/), checked as packed consumers and released explicitly. Each edition chooses when to adopt a version and passes its own build and browser gates before deployment.

See the [roadmap](../ROADMAP.md) for delivery history and outstanding work, the [catalogue programme](CATALOGUE.md) for admission criteria and priorities, and the [study index](README.md) for every place brief. The original Swiss goals are preserved in [Gleislicht](GLEISLICHT.md).
