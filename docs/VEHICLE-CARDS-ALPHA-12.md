# Vehicle cards · 0.1.0-alpha.12

The coordinated release includes vehicle hero cards, the shared snapshot calling-point adapter, and the merged aggregate-road, source capture, UK service-day and WebTRIS modules from transport PR #6.

`VehicleHeroCard` presents service identity, destination when known, next stop and remaining calls. UK bus, UK rail, yellow bus and SBB treatments share accessible text, selection, error/loading states and compact layouts. `NetworkVehicleHeroCard` resolves the selected train against the current snapshot; call indexes are never read from a stale selected chunk. It follows playback and backward seeks, distinguishes a current dwell from the next arrival, and preserves supplied adjusted times. Frequency-based consumers can hide times. A final available call is labelled as destination only when its name matches the explicit headsign.

All four packages are pinned to `0.1.0-alpha.12`, under the npm `next` tag. Publication uses the existing trusted GitHub workflow and its validated tarballs. Edition-specific data interpretation, labels and release gates remain in their repositories.

## Publication

Published all four packages to npm under `next` on 13 September 2026 from shared commit `3d5f528`. The [trusted publication workflow](https://github.com/emmettl/motionstudies/actions/runs/34752434579) passed verification and publication; all four registry versions were verified independently.

Release verification passed type checking, lint, architecture checks, 246 unit tests, package dry runs and the clean packed-consumer browser suite (86 passed, two touch-inapplicable checks skipped).

## Edition adoption

The user approved the push after local validation. Active remote editions were pushed directly to `main`; Underfall has no remote and was fast-forwarded locally.

| Edition | Adoption commit | Integration |
| --- | --- | --- |
| Gleislicht | `405a3ae` | SBB rail and yellow bus cards, localized labels; frequency services omit clock times. Special-mode cards retain their existing presentation. |
| All Change | `77be0d5` | UK bus/rail cards for network services and National Rail; excludes passing points and preserves combined-board selection. Cards load on demand within existing initial bundle limits. |
| Correspondances | `28ed8c0` | Selected journeys show remaining calls with French labels and scheduled-data notes. |
| Umlauf | `dc22edc` | Selected departures open a journey card with a return to the station board. |
| Underfall | `3feaf4a` | Local integration for timetable bus and rail journeys; unmatched observed reports keep their existing inspector. |
| Manifest | `bc4b6eb` | Dependency upgrade; maritime views do not consume bus/rail cards. |
| Zugunruhe | `f49e837` | Dependency upgrade; migration views do not consume bus/rail cards. |

The seven editions passed their applicable type, lint, boundary/architecture, unit, build and budget checks. Unit-test counts were 1,410 / 280 / 25 / 17 / 79 / 70 / 58 respectively. Focused desktop/phone browser checks passed for all five card consumers: Gleislicht 2, All Change 6, Correspondances 2, Umlauf 2 and Underfall 4. All Change's initial JavaScript remains within its original 345 KiB gzip limit (344.1 KiB).

Local / Express and NORIKAE were subsequently confirmed parked. Their prepared commits remain local and were not pushed: Local / Express `23c94fb`; NORIKAE `7a06b1c` (and `68c1c7b` on the synthetic-player-based preparation branch).

Edition work was isolated from existing uncommitted changes, including Gleislicht's desktop layout work and the shared repository's ongoing national-study documentation.
