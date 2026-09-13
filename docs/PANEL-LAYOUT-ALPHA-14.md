# Panel styling — alpha.14

This release adds the opt-in [panel and control styling contract](PANEL-LAYOUT.md)
and a compact `AirportHeroCard` density. Editions supply their own clearances,
colours and panel widths; the package owns available-space sizing, overflow,
keyboard focus and touch-control geometry. Existing comfortable cards retain
their default presentation.

All four packages use `0.1.0-alpha.14` with exact internal pins and the npm `next`
tag. Publication uses the main-branch trusted release workflow.

## Adoption scope

- All Change: station, vehicle and airport panel bounds, dismiss controls,
  horizontally scrollable layout controls and compact airport cards.
- Correspondances: station, vehicle and airport bounds, vehicle dismiss control
  and compact airport cards. Its alpha.13 lazy vehicle card remains lazy.
- Gleislicht: compact airport card and airport panel sizing only. Existing
  measured masthead/search/playback clearances remain authoritative.

## Verification

Validation passed 271 unit tests, 90 packed browser checks (two existing skips),
34 loader browser checks, type checking, lint, architecture and npm dry-run.
The packed lab exercises resized containing blocks, evidence access through
scrolling, hidden panels, density switching, desktop keyboard focus and 44px
mobile controls. Edition validation covers production builds, their existing
bundle gates and desktop/mobile panel behaviour. Publication and exact edition
adoption commits are recorded after registry verification.
