# Route fields and off-route events — shared contracts

[Study index](README.md) · [Bristol](BRISTOL.md) · [Shared ground-transport foundations](SHARED-GROUND-TRANSPORT.md)

Prepared 19 September 2026 from Underfall's two-day running-time and off-route work (`underfall` branch `codex/running-time-research`, `docs/RUNNING-TIME.md`). This records the domain contracts and the rendering rules that work established, so a scene layer can be built against `@motionstudies/core` rather than against one edition's scripts. No renderer code is added here; the layer itself is later work.

## What the layer shows

Two things from one projection of recorded vehicle positions onto a journey's own published road path:

- **A baseline field** along each pattern: a ratio of medians over many journeys per bin of road, such as peak speed over the same pattern's off-peak speed. It is timetable-free, isolates congestion from scheduled dwell, and is quiet where nothing is wrong.
- **Events**: bounded runs where journeys left their matched path, clustered by place and time within a service day, with the lines involved, the journeys affected and any published explanation that covers the window.

The paper mocks established the rule for each: the baseline draws thin and pale at the ratio's baseline, growing in width and glow as the ratio falls and earning a ring below a threshold; events draw as the observed tracks, width from the journeys involved, hue from the hour they began, appearing through a short lead-in and fading after they end when the day is scrubbed. Places where runs recur on every day across most of the day are drawn muted and kept out of events; they are long-running diversions or published geometry that disagrees with the road, which detection alone cannot separate.

## Contracts in `@motionstudies/core`

`domain/route-field` — `RouteField` carries the pattern path, bin size, minimum support, the compared periods and `RouteFieldBin[]` with `value: number | null` and `support`. `routeFieldValue` withholds values below the support threshold; `routeFieldEmphasis` returns `{width, glow, ring}` for a value under a `RouteFieldEmphasisRule` (`PEAK_SPEED_EMPHASIS` is the mock rule: baseline 1, floor 0.4, ring 0.6) and null for an unsupported bin, which a renderer draws dashed rather than fine. `pathChainage` and `pointAlongPath` place bins on the path on a local plane; `routeFieldBinsBetween` selects by overlap.

`domain/route-events` — `OffRouteRun` holds the journey identity, window, maximum distance and the recorded track. `RouteEvent` holds the service date, window in service-day seconds to match the scene clock and as ISO instants for provenance, lines, journeys, runs, centroid, a `recurs` flag and `RouteEventExplanation[]`. `PersistentPlace` records the muted places. `eventPresenceAt` gives 0–1 through a lead-in, the event and a fade; `eventsPresentAt` lists present events strongest first; `eventEmphasis` keeps single excursions thin and unlabelled; `explanationsCovering` joins explanations whose validity covers the window, treating an open end as still valid.

Both modules are pure and tested. They encode the evidence rules from the Bristol work: unsupported is not fine, a single excursion is not an event, an explanation is the publisher's statement and not a verified cause.

## Rendering against the scene

`NationalNetworkScene.children` render inside the Canvas and `useNetworkScene()` supplies the projection and current props, including the scene clock; that is the route for an edition-side prototype without a new extension slot. The existing `extensions.RoadOverlay` is typed to road topology and should not be widened. If the layer proves out in Underfall, the shared renderer would gain a route overlay slot and a bus-field style entry in `NetworkMapStyle`, with real additive glow rather than layered strokes and one ring per place where both directions qualify.

## Sources for explanations

The BODS SIRI-SX disruptions feed (`/api/v1/siri-sx/`, same key as the vehicle feed) carries participant-published situations with lines, stops, validity, reason and planned/unplanned flags. It is a present-state feed: long-lived situations stay listed, short ones vanish when they end, so it must be recorded continuously to explain past events. On 18 September 2026 it held 418 situations, 63 from `WestofEngland`, and covered the nightly closures Underfall detected at Hengrove Way, Victoria Street and Gainsborough Square; it did not cover the A4 at Saltford or Brislington on 16 September. Street Manager's open data is an AWS SNS push subscription to an endpoint the subscriber hosts, under OGL, with permits and activities carrying coordinates, USRN, dates and traffic-management type; it publishes forward from subscription and offers no history. one.network holds five years of history but commercially. The joinable open path is therefore: record SIRI-SX alongside vehicle positions now, and subscribe a small endpoint to Street Manager if permit-level detail proves worth it.

## Limits

Two Bristol weekdays informed these rules; the thresholds are starting points, not calibrated constants. Off-route detection depends on the dated pattern being the one the bus ran; a Monday timetable applied to Tuesday and Wednesday left 20 % of journeys unmatched, and those are excluded rather than guessed. Nothing here is a punctuality measure.
