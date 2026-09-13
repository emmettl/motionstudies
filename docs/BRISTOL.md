# Underfall — Bristol

[Study index](README.md) · [Implementation and release snapshot](STUDY-STATUS.md)

**Bristol in motion.** Working title chosen on 12 September 2026; thesis provisional and edition unnumbered. This brief records the local `underfall` checkout through `6ef70b3` on 13 September. No public deployment is established.

## Thesis under test

**A city of different clocks:** human schedules and natural rhythms share one geography. Buses stop and start, trains carry a wider regional cadence, aircraft connect the city to elsewhere, and the Avon rises and falls on another clock. The study becomes distinctive when these rhythms can be compared without pretending they describe the same kind of movement.

Two alternatives remain open: **world connection and local access**, and **past routes shaping present movement**. The working port and inherited routes may sharpen the argument. Tidal studies are part of the intended work, but the title does not require every scene to be led by water.

## Implemented study

**Study** gives the map to composition, playback and the tidal clock. **Explore** pauses at the same moment and opens stop search, departures, vehicle reports and aircraft telemetry. Selection and search survive the transition. This is already a useful form of the series' aggregate-to-evidence idea: a whole-city scene can be inspected through the records that support it.

| Layer | Retained scope | What it can say |
| --- | --- | --- |
| Recorded buses | Default 20-minute evening study on 12 September 2026: 40 captures, 399 distinct vehicle IDs, seven operator codes and 248 mapped journeys | BODS vehicle reports with source age and conservative timetable matches; recorded identities are not a complete city census |
| Scheduled buses | 10:00–12:00 BST morning: 949 shaped journeys | Scheduled service and interpolated route progress, separate from observed running |
| Rail | 245 mapped daytime GWR/CrossCountry working-timetable paths and 23 OSM station identities; 35 active in the morning window | A bounded, partial scheduled railway; working times are not public departure times or observations |
| Air | Two observed tracks with 49 and 29 samples, from the same 12 September evening | Sampled flight positions and telemetry; airport live-board capability does not establish an enabled live feed |
| Portbury water level | 82 readings in the 12 September recording library; the separate first Avon study retains 93 of 96 readings on 11 September | Observed level at one gauge; missing readings stay missing, and level does not measure current direction or spatial water flow |
| M32 roads | 5 September 2025: 19 usable detector sites out of 26 requested, with 1,824 quarter-hour values | Measured passages and mean speeds; six sites have blank rows and one has no rows. No individual car tracks or route choices are inferred |

Rail and air have advanced beyond the edition README's earlier “further work” description. The railway reuses three hash-pinned All Change Python modules and a geometry bridge. This is concrete evidence for sharing source tooling between studies, while preserving Bristol's own geography, dates and coverage audit.

The M32 proof is a separate full-day matrix and Explore table with fixed scales, explicit missing cells and valid zero counts. The latest increment also colours 22 geographic mainline sections, seventeen with usable measurements. These are illustrative detector extents, not verified NTIS links or continuous measurements along each road section; four slip-road counters remain inspectable without guessed section geometry. Its historical date stays visible beside the September 2026 transport scene. Detector passages cannot be summed into unique motorway users. The source interval labels have not yet been established as UTC instants.

Replay now loads five-minute windows with a bounded three-window cache. Recording has capture indexes, store health, storage budgets, resumability and a fixed deadline of at most 24 elapsed hours; a 25-hour civil day requires separate captures. These mechanisms are implemented, but the full weekday recording has not yet been acquired.

## Next proof

Acquire and audit a complete weekday before making claims about Bristol's daily rhythm. Reconcile bus freshness, unmatched identities, rail coverage and the dates of the air and water sources. Bristol Parkway and other ambiguous railway mappings need explicit resolution before coverage expands. Public timetable times, broader rail coverage and airport-board activation are separate increments.

Use the resulting day to test one authored comparison: the morning/evening transport cycle against the tidal cycle, with every layer's date visible. Spatial water flow needs an additional model or source; a rising gauge alone cannot animate a defensible moving river. NTIS receiver compatibility and subscriptions also remain to be checked before claiming a shared live road feed.

The current artifact is substantial enough to refine the thesis through observation. It is not yet evidence of a complete Bristol day, a planning-grade network or an approved public edition.

## Implementation evidence

The independent checkout owns the compilers, fixtures and tests. The inspected records are `docs/DUALITY.md`, `docs/OBSERVED-AND-TIDAL.md`, `docs/RAIL-AND-AIR.md`, `docs/RECORDING-WINDOWS.md`, `docs/ROAD-PULSE.md` and `docs/RESEARCH.md` in `underfall`. The whole-day M32 milestone records 76 passing tests; this is not a fresh test run of the later geographic-section increment. Source-specific provenance and exclusions stay with those artifacts.
