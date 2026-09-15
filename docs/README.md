# Study documents

[Open catalogue](https://emmettl.github.io/motionstudies/) · [Widget lab](https://emmettl.github.io/motionstudies/lab/)

## Programme and shared work

- [Project vision and goals](VISION.md): the creative premise, the world in miniature, and what these ask of the engineering
- [Current study status — 13 September 2026](STUDY-STATUS.md): inspected implementations, served revisions, evidence boundaries and remaining work
- [Overall roadmap and delivery history](../ROADMAP.md)
- [Catalogue programme and admission criteria](CATALOGUE.md)
- [Candidate names and the theses they imply](NAMING.md)
- [Data access and provenance readiness](DATA-READINESS.md) and [provider questions](DATA-QUESTIONS.md); [8 September candidate source audit](evidence/city-candidate-sources-2026-09-08.json)
- [Archive and processing options](ARCHIVE-AND-PROCESSING.md): R2, analytical tables, gridded arrays and optional time-series databases; source-specific retention and redistribution
- [Cost control](COST-CONTROL.md): $100/month series ceiling, traffic-spike protection, finite retention and proposed enforcement; live compliance still needs verification
- [Edition architecture and ownership](EDITIONS.md)
- [Code and library consolidation proposal](ARCHITECTURE-CONSOLIDATION.md): application state ownership, renderer internals, data contracts and independent package consumption
- [Package extraction provenance](EXTRACTION.md) and [release process](RELEASING.md)
- [Underfall's shared ground-transport contribution](SHARED-GROUND-TRANSPORT.md) — capture, UK clocks, WebTRIS interpretation and aggregate-road evidence; publication and adoption tracked separately

- [Shared panel layout and controls](PANEL-LAYOUT.md) — compact airport presentation, responsive clearances and [alpha.14 release record](PANEL-LAYOUT-ALPHA-14.md)
- [All Change foundations](ALLCHANGE-FOUNDATIONS.md) — railway readers, timetable patterns, station calls, renderer interfaces and observation windows
- [Zugunruhe's shared field contribution](SHARED-FIELDS.md) — estimated fields with support, gridded series, illustrative field paths and daylight; prepared for the next coordinated release, adoption tracked separately

## Numbered studies

| No. | Study brief | Live page | Implementation |
| --- | --- | --- | --- |
| 005 | [Gleislicht — Switzerland](GLEISLICHT.md) | [Open study](https://emmettl.github.io/gleislicht/) | [Repository](https://github.com/emmettl/gleislicht) |
| 006 | [All Change — London](LONDON.md) | [Open study](https://emmettl.github.io/allchange/) | [Repository](https://github.com/emmettl/allchange) |
| 007 | [Local / Express — New York](NEW-YORK.md) | Parked; unpublished; [release gate](NEW-YORK-PUBLICATION.md) | [Repository (private)](https://github.com/emmettl/local-express) |
| 008 | [Correspondances — Paris](PARIS.md) | [Open study](https://emmettl.github.io/correspondances/) | [Repository](https://github.com/emmettl/correspondances) |

## Implemented, unnumbered studies

- [Umlauf — Berlin](BERLIN.md) · [Public study](https://motionstudies.app/umlauf/) · [Repository](https://github.com/emmettl/umlauf)
- [NORIKAE — Tokyo](TOKYO.md) — **parked** · [Existing synthetic preview](https://motionstudies.app/norikae/) · [Repository](https://github.com/emmettl/norikae); real-source acquisition paused
- [Underfall — Bristol](BRISTOL.md) — local research edition; recorded buses, rail/air, tides and M32 detector study
- [Zugunruhe — European bird migration](ZUGUNRUHE.md) · [Public study](https://motionstudies.app/zugunruhe/) · [Repository](https://github.com/emmettl/zugunruhe); latest local increment ahead of served revision
- [MANIFEST — World trade in motion](MANIFEST.md) · [Repository](https://github.com/emmettl/manifest); public synthetic prototype, local observed review

Local / Express and NORIKAE are parked as of 13 September; their briefs retain the work and open questions for a possible return.

Implementation does not allocate a catalogue number. The status register distinguishes current source from served releases and keeps source/publication limits explicit.

## Candidate city studies

These briefs retain their dated source audits, proposed compositions and publication gates. Inclusion is not a commitment to build or publish.

- [Fietsen — Amsterdam](AMSTERDAM.md)
- [Chicago](CHICAGO.md)
- [Railo — Helsinki](HELSINKI.md) — added 8 September
- [Hong Kong](HONG-KONG.md)
- [Istanbul](ISTANBUL.md)
- [Johannesburg](JOHANNESBURG.md)
- [Lisbon](LISBON.md)
- [Backup — Los Angeles](LOS-ANGELES.md) — added 8 September
- [Mexico City](MEXICO-CITY.md)
- [Mumbai](MUMBAI.md)
- [San Francisco](SAN-FRANCISCO.md)
- [Singapore](SINGAPORE.md)
- [Sydney](SYDNEY.md)
- [Venice](VENICE.md)

## Research for potential studies

- [A national motion study — England, Great Britain or the UK](NATIONAL-STUDY.md) — refined artistic thesis and composition, with a [technical feasibility report](NATIONAL-DATA-FEASIBILITY.md) covering sources, volumes, timeliness, accuracy and the evidence chain between aggregate and individual records.
- [Power — the national study's second axis](POWER.md) — Elexon and NESO sources probed on 13 September 2026: per-unit plans and settled generation, live fuel mix, national and grid-supply-point demand, geometry, licences and how a unit is placed.
- [Flights over Europe](EUROPE-AIR-RESEARCH.md) — technical evidence, candidate visual theses and bounded experiments; the thesis and decision to build remain open.

## Document ownership and history

Motion Studies owns the series goals, roadmap, city briefs and feasibility/publication decisions. Edition repositories own their implementation guides, source compilers, runtime fixtures and deployment instructions. Paths and commands in an implemented city's brief refer to that edition's checkout.

These planning documents moved from [Gleislicht at d22f67e](https://github.com/emmettl/gleislicht/tree/d22f67ed76882a2765a0cffc9fc763ef90acea0d) on 7 September 2026. Their earlier history remains available there. The original Swiss vision is preserved as `GLEISLICHT.md`; `VISION.md` now states the series goals. Duplicate Paris and New York briefs were removed from the edition repositories so this directory is the canonical planning source.
