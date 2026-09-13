# Study status — 13 September 2026

[Study briefs](README.md) · [Catalogue programme](CATALOGUE.md) · [Roadmap](../ROADMAP.md)

This reconciliation records what the edition checkouts actually contain, what their public release metadata serves, and what remains a proposal. It supersedes the 7 September implementation summaries. The older source and rights audits retain their own dates: this is not a fresh provider-terms review.

**Later same-day package update:** the [alpha.10 publication and adoption record](RENDERER-EXTENSIONS-ALPHA-10.md) was added after this inspection. It supersedes the package/adoption state below where it records newer evidence. The commit and deployment table remains the retained inspection snapshot, not a continuously refreshed release inventory.

The series now extends beyond transport. Bristol tests human schedules against tidal rhythms; Zugunruhe tests migration and atmospheric fields. The common artistic question is becoming clearer: how can an aggregate remain connected to the evidence from which it was made? Each study must name its smallest supported unit. A scheduled journey, a recorded vehicle report, a detector interval and a radar density estimate are different kinds of evidence.

## Programme status

**Programme decision — 13 September 2026:** Local / Express and NORIKAE are parked at the author’s request. Development, source acquisition and provider follow-up are paused. Existing work and open questions are retained for a possible return; they are outside the active programme. Local / Express keeps number 007 and its private proof; NORIKAE remains unnumbered with its existing synthetic preview.

## Implementation and publication

Counts below describe retained study artifacts, not current traffic or complete coverage of a place. “Served” means the commit reported by the public `/_release.json` endpoint during this review; it does not establish live-feed health, successful interaction or physical-device performance.

| Study | Inspected local revision | Implemented scope | Served revision / publication boundary |
| --- | --- | --- | --- |
| [005 Gleislicht](GLEISLICHT.md) | `1a082bf`, main; additional uncommitted interface work | National rail, terrain, regions/cities, sound, four languages, aircraft and measured road flow; national PostBus and station departures | [`6d2c781`](https://motionstudies.app/gleislicht/_release.json), earlier than local HEAD; uncommitted compact-desktop work is not a release |
| [006 All Change](LONDON.md) | `da94953`, main | TfL rail and full bus-catalogue artifact; London National Rail; river/cable; air/road; demand, cycle hire, combined boards and after-midnight study | [`da94953`](https://motionstudies.app/allchange/_release.json), matches inspected HEAD |
| [007 Local / Express — parked](NEW-YORK.md) | `407014f`, main | Full-day Lexington local/express proof and scheduled overtakes; shared station departures and comparison fixes | Private; Pages disabled; existing MTA publication review remains open |
| [008 Correspondances](PARIS.md) | `4e06d7a`, main | All 16 Métro lines, RER A–E, nine Transilien lines and T3a/T3b; 32 lines / 17,088 full-day journeys; observed air | [`75a501f`](https://motionstudies.app/correspondances/_release.json), earlier than local HEAD |
| [Umlauf / Berlin](BERLIN.md) | `16beccf`, main | 585 scheduled journeys across 12 lines; Ring, crossings, circulation and relative Ostkreuz interchange | [`16beccf`](https://motionstudies.app/umlauf/_release.json), matches inspected HEAD; source repository and edition public; unnumbered |
| [NORIKAE / Tokyo — parked](TOKYO.md) | `bd0ec22`, `codex/synthetic-player`; main `a0fd730` | Two fictional lines and offline GTFS audit/compiler; no acquired real Toei dataset | [`a0fd730`](https://motionstudies.app/norikae/_release.json), main rather than the inspected development branch; synthetic and unnumbered |
| [MANIFEST](MANIFEST.md) | `a5ea179`, main | 60,000 synthetic vessels; separate local NOAA observation review | [`a5ea179`](https://motionstudies.app/manifest/_release.json), matches inspected HEAD; public synthetic only, unnumbered and not admitted to the public site catalogue |
| [Zugunruhe](ZUGUNRUHE.md) | `0bf97e2`, main | Radar altitude layers, 37-radar archipelago, estimated continental field, wind/current comparisons and three-night selection | [`58e0806`](https://motionstudies.app/zugunruhe/_release.json), earlier than the latest three-night increment; no central catalogue number allocated |
| [Underfall / Bristol](BRISTOL.md) | `6ef70b3`, main | Recorded buses, scheduled rail, observed air, Portbury levels, bounded recording/replay and M32 detector matrix/geographic sections | Local research checkout; no remote or public deployment established in this review; unnumbered |

The source revisions above were inspected in sibling checkouts under `Developer/Projects`. Edition manifests and implementation records take precedence over stale introductory READMEs. All nine inspected editions now pin the shared packages they use to exact `0.1.0-alpha.9` releases. The [alpha.9 adoption record](REFACTORING-ALPHA-9.md) retains the validation performed for those upgrades; no edition test suite was rerun for this documentation reconciliation. A package pin in local source does not prove that version is served.

## What changes in the briefs

- **London's bus expansion is implemented with audited gaps.** It contains 103,117 scheduled journeys across 670 active routes out of 672 advertised. It is not observed bus running, and “full catalogue” does not mean every branch is complete. London also provides reusable compilers and dated artifacts for the [national investigation](NATIONAL-DATA-FEASIBILITY.md).
- **Paris has passed the twelve-line milestone.** Its eight-line default remains deliberately bounded while additional Métro, Transilien and tram groups load independently. Further network acquisition and hardware performance review are separate questions.
- **Berlin has passed its private-preview stage.** Public source and publication are established. Surveyed interchange elevations, physical-device evidence and catalogue admission remain separate work.
- **Swiss station departures are adopted.** The old wiring proposal is obsolete. National PostBus is also implemented; the 9 September acceptance of the original Swiss scope should not be represented as a new benchmark of every later addition.
- **Bristol and Zugunruhe need canonical briefs.** Their source models, implemented scenes and remaining questions are now recorded here without assigning numbers or promoting new public catalogue cards.

## Remaining decisions

Sustain the implemented works and close their specific evidence gaps: London's incomplete branches and unmatched Eurostar timings; Paris and Berlin device review; Berlin's absolute heights; Bristol's full weekday recording and common-date coverage; Zugunruhe's distinction between measured radar estimates and a spatially reconstructed field. MANIFEST's observed-data publication review remains separate from software readiness. New York's publication question and Tokyo's first real-source acquisition are parked resumption questions.

The other twelve city candidates remain dated research briefs: Amsterdam, Chicago, Hong Kong, Istanbul, Johannesburg, Lisbon, Mexico City, Mumbai, San Francisco, Singapore, Sydney and Venice. No later edition implementation was found in the reviewed workspace. Their 6–7 September source findings have not been revalidated here. The national and European aviation studies remain research rather than newly implemented editions.

This update changes central documentation only. It does not deploy editions, start collectors, change source rights, allocate numbers or alter publication holds. On the next reconciliation, refresh both the source revision and the served revision before changing a status; retain the study date, evidence type and unresolved coverage beside every headline count.
