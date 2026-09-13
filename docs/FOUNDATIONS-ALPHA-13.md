# Foundations — alpha.13

Status: prepared for release; npm publication and registry adoption are pending.

All four packages use `0.1.0-alpha.13`, with exact internal pins and the npm `next` tag. This release joins the [All Change foundations](ALLCHANGE-FOUNDATIONS.md), [renderer interfaces](RENDERER-INTERFACES.md) and Underfall's railway migration. The earlier [ground-transport modules](SHARED-GROUND-TRANSPORT.md) were already published in alpha.12; Bristol's new wrappers use them as part of this adoption.

The shared data runtime is JavaScript with declarations. It does not ship a Python runtime. Existing edition-specific Python research and compiler programs are outside that runtime contract.

## Publication and adoption

The release must pass shared type, lint, architecture, unit, packed-consumer and browser checks, then publish the tested tarballs through the main-branch trusted workflow. Edition lockfiles must resolve the published registry artifacts before adoption checks are accepted.

| Edition | Intended adoption | Status |
| --- | --- | --- |
| All Change | Railway tools, pattern loader, station calls, observation compiler and public renderer interfaces | Prepared in isolation |
| Underfall | Railway tools and source-store/service-day/WebTRIS wrappers | Prepared in isolation |
| Gleislicht | Compatible exact-version upgrade, preserving local interface work | Awaiting release |
| Correspondances | Compatible exact-version upgrade | Awaiting release |
| Umlauf | Compatible exact-version upgrade | Awaiting release |
| Manifest | Compatible exact-version upgrade | Awaiting release |
| Zugunruhe | Compatible exact-version upgrade, preserving soundtrack work | Awaiting release |

Local / Express and NORIKAE remain parked and are excluded from this rollout. Package publication does not establish new national coverage, acquire a complete Bristol weekday or turn London timetable/prediction data into observed trajectories.
