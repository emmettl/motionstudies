# Common-date preparation — 16 September 2026

## Decision

Use **14 September 2026** for the next bounded integration review. National buses already have a verified one-hour recording. This preparation adds same-date Great Britain power aggregates, Portbury levels and regional Bristol aircraft observations. It does not change either app's current default or establish a complete multimodal day.

The first suggested review interval is **12:15–12:30 UTC / 13:15–13:30 BST**. It lies within the bus collection and between two consecutive tide readings. Keep gaps in individual vehicle and aircraft tracks visible.

## Handoff

The [manifest](evidence/common-day-2026-09-14/manifest.json) records artifact hashes, byte lengths, absolute time boundaries and readiness. All four files are in that directory:

| Artifact | What it contains | Limit |
| --- | --- | --- |
| `power-context.json` | 288 five-minute fuel-mix instants, 20 reported fuel/interconnector categories and 48 half-hour initial demand periods | GB national aggregates only; not a station-level `power-day` release |
| `tide.json` | 91 of 96 Portbury 15-minute mean levels, in mAOD | Five readings absent, including 12:00 UTC within the bus hour; no interpolation across missing readings |
| `air.json` | 25 continuous track segments, 20 aircraft identities, 445 regional samples | No confirmed airport endpoints; gaps over 60 seconds break continuity |
| `sources.json` | Nine acquisition records with URLs, retrieval times, sizes, SHA-256 and attribution | Original bytes are retained in the private source store, not served by these artifacts |

The existing England bus release remains unchanged at `england/public/data/bus/2026-09-14`. Its capture interval is **11:42:27.004–12:42:27.004 UTC**. Its earlier observation-time slices include stale last-known reports, not evidence of continuous morning collection. The manifest fingerprints its `release.json`; no bus packs are duplicated here.

Raw captures and adapter outputs are retained under `motionstudies-recorder/work/common-day-2026-09-14`. The three national aircraft slices occupy 70,254,176 bytes. This is a bounded local capture, with no new host loop, remote upload or retention change.

## Power boundary

On retrieval, the Elexon B1610 request for 14 September, settlement period 24, returned `{"data":[]}`. This is a one-period availability probe, not an exhaustive check of all 48 periods. It does not support moving England's per-unit generation/station view from 5 September to 14 September.

Fuel mix and initial demand are available independently. Signed interchange values remain signed; aggregate values are not allocated to stations, buses or consumers. Raw source row indices are preserved for every retained power row. The fuel response contained one preceding-day instant: its 20 rows were excluded by **observation start time** when compiling the half-open civil day. No missing value was replaced with zero.

The full station-level capture remains gated by the recorder's existing settlement-age policy. For 14 September its seven-day guard clears at **21 September 23:00 UTC / 22 September 00:00 BST**, subject to actual provider availability. No retry or automation has been scheduled. The first available settlement run must remain labelled by its run type rather than described as final.

## Clock and evidence conventions

- Power and tide use the Europe/London civil day: **13 September 23:00 UTC to 14 September 23:00 UTC**, end exclusive.
- The bus published day partitions observations by UTC date. The actual capture interval, rather than the date label, determines this integration window.
- Aircraft sample times are seconds since London civil midnight. Three source slices (`23`, `24`, `25`) cover 11:30–13:00 UTC; the compiled crop is limited to the bus capture interval and Bristol bounds.
- At exact gauge timestamps the tide remains a 15-minute mean. Continuous display may interpolate only across adjacent present readings. Portbury levels do not establish water velocity or the Floating Harbour level.
- The air crop retains the existing Underfall decoder, transport filtering and continuity policy. A track segment is not an additional aircraft identity.

## Acquisition and verification

The existing Underfall `feeds.mjs tide --date 2026-09-14` adapter captured and normalized the gauge. Its existing shared source store also retained three public Elexon responses and the three ADSB.lol historical heatmap files. Aircraft decoding used the installed `@motionstudies/data/adsb-heatmap` API and Underfall's existing `continuousAirRecords` function. No new provider client was introduced.

All nine raw captures were checked against recorded byte lengths and SHA-256 before assembly. Compilation checked all 288 fuel instants and all 48 demand periods against the civil clock, rejected duplicate fuel identities, retained source indices, checked gauge coverage totals, and checked every air sample against the time/bounds/continuity policy. The manifest hashes the resulting artifacts.

Run the retained handoff verification from Motion Studies:

```sh
node scripts/verify-common-day.mjs --manifest docs/evidence/common-day-2026-09-14/manifest.json
```

It verifies the handoff, retained raw objects, the existing bus release, and every retained power row against its original source row. It makes no network requests.

## Parallel ownership

- England's GUI task owns bus/map/clock integration. These artifacts are a data handoff, not an App change.
- The existing rail-readiness task owns a 14 September Bristol daytime release, Parkway exclusions and the public/working-time boundary.
- Underfall's current tasks retain roads and stop-location analysis ownership.

Next integration can use the same-date aggregate power context alongside buses, with a distinct presentation from the 5 September per-station view. Rail and these Bristol tide/air artifacts can then be joined for the narrow common interval after their consumer contracts are checked. Full-day coverage and recurring punctuality still require broader recordings.
