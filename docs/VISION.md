# Motion Studies — project goals

Motion Studies is a series of authored works about how places move. Each edition should make a visual argument rooted in its geography, transport culture and evidence. The catalogue brings those works together; shared software supports their common behaviour.

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

Every stage should leave a coherent study that can be viewed and assessed. A new city begins with a local thesis, source audit and bounded proof. Its signature composition and publication path must be defensible before it earns a catalogue number or expands into a larger atlas.

The shared/local boundary is now enforced through four coordinated npm packages. Shared changes are exercised in the [widget lab](https://motionstudies.app/lab/), checked as packed consumers and released explicitly. Each edition chooses when to adopt a version and passes its own build and browser gates before deployment.

See the [roadmap](../ROADMAP.md) for delivery history and outstanding work, the [catalogue programme](CATALOGUE.md) for admission criteria and priorities, and the [study index](README.md) for every place brief. The original Swiss goals are preserved in [Gleislicht](GLEISLICHT.md).
