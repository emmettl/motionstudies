# Zugunruhe

[Study repository](https://github.com/emmettl/zugunruhe) · [Open study](https://motionstudies.app/zugunruhe/) · [Study index](README.md) · [Release snapshot](STUDY-STATUS.md)

**The sky moves as Europe sleeps.** A study of nocturnal bird migration, atmospheric motion and the limits of seeing a continent through scattered instruments. Implementation reviewed at `0bf97e2` on 13 September 2026; public release metadata serves the earlier `58e0806`. No central catalogue number is allocated; the edition README's early “006” label conflicts with All Change and is not adopted here.

## Thesis

Migration can be visible as a field before any individual bird can be seen. Weather radars reveal the changing density, altitude and estimated velocity of nocturnal movement at particular places. Together they suggest a larger passage across Europe, but the space between instruments remains a reconstruction.

The work should let the viewer travel continuously between that continental impression, a group of radar sites and one site's altitude bands. It offers a precise refinement of **sea, shoal and fish**: descent must end at the smallest evidence the source actually contains. Here the “fish” is a radar-derived estimate for a place, height and time, not a recovered bird trajectory.

## Implemented compositions

- **Layers** examines fifteen altitude bands at Memmingen in southern Germany, near Lake Constance. Colour expresses height, brightness expresses density and an illustrative texture follows estimated velocity.
- **Archipelago** brings 37 radar sites into one clock while keeping their separation legible. The original Layers and Archipelago studies are retained as frozen compositions.
- **Continent / Sea** constructs a continuous estimate between sites. **Currents** integrates the estimated velocity field into illustrative trails; **Night** moves from Memmingen through the archipelago to the wider field. Regional **Birds / Air** views compare migration estimates and wind while preserving the original station-level air study.
- The latest local increment adds three nights to **Regional Air**: 9–10 September, 24–25 September and 8–9 October 2018, with 24 September as default. Its visible night is 20:00–04:00 UTC, supported by margins from 19:00–04:30. Earlier compositions retain their own dates and windows. This increment is not established as deployed by the inspected public metadata; see the [three-night audit](https://github.com/emmettl/zugunruhe/blob/0bf97e2/docs/REGIONAL-AIR-NIGHTS.md).

## Sources and evidence boundary

The retained source is Nussbaumer and colleagues' [processed European radar dataset, version 3](https://zenodo.org/records/4587338), under CC BY 4.0. The edition's [first-study record](https://github.com/emmettl/zugunruhe/blob/0bf97e2/docs/FIRST-STUDY.md) retains the acquisition and method audit: a 320,773,053-byte source archive, 37 radars and fifteen 200-metre altitude bands. These are processed density and velocity estimates, not raw radar echoes or tracked animals. There is no Swiss radar in this source collection.

Five-minute frames and a 0.25-degree display grid do not create new observations. The continental reconstruction uses distance-weighted support with a 90 km Gaussian scale and tapered reach; confidence fades away from instruments, and missing source values remain gaps. A smooth surface must still expose where its evidence weakens. The published grid spacing is a rendering/model choice, not measured spatial resolution.

ERA5 wind values sampled at radar sites provide atmospheric context across 37 × 15 site/band combinations. They are not a complete observed wind grid. Wind was also involved in the source's bird/insect separation, so agreement between bird estimates and wind is not wholly independent evidence. The separate cloud context covers 4–5 September 2018 and must retain its own date; it cannot silently become contemporaneous with the three migration nights.

Deterministic particles and integrated trails illustrate an estimated field. They are neither individual birds nor observed air-parcel trajectories. The study cannot establish particular flight paths, destinations, flock membership or the causal effect of wind on behaviour from this field alone.

## Next refinement

Make the evidence descent itself the signature action: continental motion, radar coverage, one site's altitude/time estimate and its method. Compare the three nights on consistent scales and make support, missingness and source dates easy to inspect. Review the latest local increment before describing it as public.

Sound remains an artistic strand to develop: generative music may express flow and altitude, building on the Swiss work's experience, but it should not suggest measured bird calls or a completed sonic implementation. The thesis and title should mature through these comparisons before catalogue admission.
