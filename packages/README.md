# Motion Studies packages

Shared packages for the Motion Studies transport instrument. The source workspace and compiled distributions expose the same explicit, extensionless module subpaths. The initial release is `0.1.0-alpha.0` under npm’s `next` tag.

- `@motionstudies/core`: transport contracts, indexing, interpolation and visual theme contracts; no browser or Node dependencies.
- `@motionstudies/three`: `NationalNetworkScene`, `HubPulseScene`, `StationFlowScene`, camera framing and label-mode contracts. React, React Three Fiber and Three.js are peers; rendering internals are not public subpaths.
- `@motionstudies/web`: picker, button tooltips, theme application, mounting, progressive loaders, observed operations and recording. Import `tokens.css` and `mobile-picker.css` for isolated widgets. `shell.css` is an optional full-page study shell scoped to `.motion-study`; `mountMotionStudy` applies that class. Fonts and edition layouts belong to consumers.
- `@motionstudies/data`: Node-only GTFS readers, network chunking, merging and station ranking. ZIP reading requires `unzip` on the host. Source selection, provenance overrides and compilation commands belong to each edition.

```tsx
import { MobilePicker } from '@motionstudies/web/components/MobilePicker'
import { createDataUrlResolver } from '@motionstudies/web/data-url'
import { useProgressiveNetworkDay } from '@motionstudies/web/use-progressive-network-day'
import '@motionstudies/web/tokens.css'
import '@motionstudies/web/mobile-picker.css'

const resolveData = createDataUrlResolver('/my-edition/data/')
// Inside a React component:
// const day = useProgressiveNetworkDay('day.json', enabled, time, resolveData)
```

Keep the resolver stable across renders. Manifest paths and their chunk paths are relative to the supplied asset root. Changing the resolved manifest URL resets the loader; disabling cancels requests, and re-enabling retries failures. Optional road manifests distinguish a 404 from an error. Observations poll serially; changing their endpoint drops the previous source's state, and disabling/unmounting cancels the request and timer.

Build release candidates with `npm run build:packages`. Distribution manifests and compiled ESM/declarations are written to `.package-dist/`; workspace manifests continue to point at source for fast local iteration. `npm run check:packed` packs and installs those distributions into a separate consumer, builds the lab and validates the public exports. No source aliases or workspace links are used in that consumer.

Source workspace manifests always stay private. `npm run check:release` builds public candidates, tests their packed consumer and records the tested tarball hashes; `npm run release:dry-run` inspects the publication without writing to npm. The manual main-branch `release.yml` workflow publishes those same tarballs with public access and provenance. See [release instructions](https://github.com/emmettl/motionstudies/blob/main/docs/RELEASING.md) for bootstrap-token and trusted-publisher setup. All four shared packages are MIT-licensed; each distribution includes `LICENSE`.

## Now and browser location

`useNowClock` from `@motionstudies/web/use-now-clock` follows the wall clock on each animation frame, so returning from a suspended tab catches up immediately. Call `start()` from a Now button, set the consumer's playback rate to 1, and render its `time` while `active`. With `NationalNetworkScene`, pass `isPlaying={false}` while this external clock owns time. Call `stop()` before pausing, seeking or changing speed, and retain the last clock time for ordinary playback. Clear moving vehicle selections on entry to keep the camera still; panning and zooming remain available.

Supply a resolver `(instant: Date) => number | null` that maps the instant into the edition's service-time coordinates. The edition owns timezone, service date, daylight-saving rules and source coverage. Now is appropriate when the data gives a meaningful sense of this place at this time; exact live vehicle positions are not required. An edition may explicitly map the current local clock onto a suitable representative weekday or seasonal timetable, with a quiet label such as “Typical weekday · realtime pace”. Historical or modelled sources need that same meaningful relationship to the present; merely having timestamps is insufficient. Return null outside the chosen data's coverage: the hook stops, retains the last valid time and exposes `unavailable`. Do not silently relabel a recording as live or wrap a partial study window. Timetable and observed-data labels remain the consumer's responsibility; 1× playback does not imply a live vehicle feed.

`useBrowserLocation` from `@motionstudies/web/use-browser-location` requests a single position only when `locate()` is called. It exposes `location`, `status` and `clear()`; it neither stores nor sends coordinates. Render localized messages for denied, timeout and unavailable states. Clearing or unmounting discards late responses. A secure browser context and user permission are required.

Pass an in-coverage position as `NationalNetworkScene`'s `userLocation` for a steady glowing dot. Use the existing `focus-location` camera command once after locating, with `[longitude, latitude]` and a suitable `distanceScale`. Validate coverage in the consumer and preserve the view when the user is outside it. Show the reported `accuracy` in accessible text; the dot is an approximate position. The marker hides in diagram layouts. The lab's **Now** specimen uses a clearly labelled synthetic UTC timetable and covers clock, permission and out-of-coverage behavior. Public editions still require independent adoption and releases.

## Selection labels

`NationalNetworkScene` gives the selected station first label priority, followed by the selected route's terminal stops (including branches), then intermediate stops. Selected services use their own endpoints. Priority precedes retained labels and ordinary rank/tier admission; clearing selection restores edition ranking. This is built in for every consumer, including geographic and diagram layouts. Supply complete enabled infrastructure as `referenceSnapshot` to preserve endpoints through timetable gaps; its stop indexes need not match the active snapshot. See the [edition behaviour contract](https://github.com/emmettl/motionstudies/blob/main/docs/EDITIONS.md#selection-and-station-labels).

## Button help

`mountMotionStudy` installs one shared tooltip surface. Independent consumers such as the lab can render `ButtonTooltips` from `@motionstudies/web/components/ButtonTooltips` once instead. Put concise, action-oriented help in each button’s `data-tooltip`; icon buttons fall back to their `aria-label`. An empty `data-tooltip` opts out. Avoid native `title` attributes on these buttons, which can also appear during touch interaction.

Help appears after a short mouse hover or on keyboard focus when the primary pointer is fine and supports hover. Touch input suppresses it, including on hybrid devices. Escape, activation, scrolling and blur dismiss it. The tooltip stays inside the viewport, can itself be hovered, and temporarily extends `aria-describedby` without replacing existing descriptions. Copy and translations stay in the edition; rendering and input handling stay in this package. The Controls specimen and packed-consumer tests exercise this contract.

## Airport heroes and split-flap boards

`AirportHeroCard` provides an airport identity header and switchable departure/arrival boards. `SplitFlapBoard` is the underlying transport-neutral widget, also suitable for rail stations. Both use scoped package styles, semantic tables, full accessible cell values, keyboard-operable selection, contained horizontal scrolling and reduced-motion support. Only changed characters remount for the flap animation.

```tsx
import { AirportHeroCard } from '@motionstudies/web/components/AirportHeroCard'
import '@motionstudies/web/airport-hero-card.css'

<AirportHeroCard
  key={airport.id}
  airport={airport}
  departures={departures}
  arrivals={arrivals}
  study={{ time, windowStart: metadata.windowStart, windowEnd: metadata.windowEnd }}
  dateLabel={metadata.serviceDate}
  note="Observed study · inferred directions; times are observations."
  onSelectFlight={selectAirTrack}
  selectedFlightId={selectedAirTrackId}
/>
```

Entries have a stable `id`, a `service` label, and optional numeric `time`, `place`, `stand`, `status` and `tone` (`neutral`, `accent` or `warning`). Movement times and `study.time`, `windowStart`, and `windowEnd` must use the same study-relative seconds and service date. Do not parse display strings or normalize numeric times at midnight: an event after 24:00 retains its value above 86,400. `formatTime` optionally controls display formatting; the default uses the study's `formatServiceTime` helper. The header clock is derived directly from `study.time`, with no independent wall clock.

The card sorts movements chronologically and shows up to eight rows per direction inside the intersection of the study bounds and a rolling window: ten minutes behind the playback clock and sixty minutes ahead, with inclusive endpoints. Override this with `horizon={{ lookBehindSeconds: 600, lookAheadSeconds: 3600 }}` and `maxRows`. Playback, backward seeking, changed study bounds and updated movement times all recalculate the rows. An out-of-study or invalid clock shows no movements; rows with missing or non-finite times are excluded because they cannot be placed in the window. Other unknown fields render as a dash. Labels include `studyTime`, `boardWindow` and `outsideWindow` for localization. Filtering does not infer operational statuses or clear the consumer's map selection when a row leaves the window.

Consumers still own time coordinates, source interpretation and data loading. Supply movements for the displayed horizon, not just aircraft active at the current second, and use the selected study's bounds rather than an individual progressive chunk's bounds. Do not turn an approach-envelope association into a confirmed departure/arrival: unclassified tracks should remain outside these direction lists. Current `AirTrack` data does not supply scheduled times, routes or gates; leave those fields absent, use observation times only when clearly labelled, and explain any inference in the required `note`.

Pass `labels` for edition translations, `loading`, or a localized `error` and `onRetry` for data states. The selected direction is local to each card; key the card by airport ID to reset it on selection changes. The Airports lab specimen exercises synthetic timetables, playback, scrubbing, study-window changes, incomplete observations, French labels, long destinations, updates and recovery. Edition adoption happens through their independently pinned package releases; adding this export does not update deployed studies.

For a custom rail or transport board, import `SplitFlapBoard` from `@motionstudies/web/components/SplitFlapBoard` and `@motionstudies/web/split-flap-board.css`. Supply `columns` (`key`, `label`, `characters`) and `rows` (`id`, `cells`, optional `tone`). Cell text longer than its flap count is visually ellipsized, with the full value retained for assistive technology and hover. `onSelectRow`, `selectedRowId` and `selectionColumn` optionally make one cell per row selectable.

The shared board also accepts `loading`, a localized `loadingMessage`, and `loadingRows` (default five). While loading, its decorative rows cycle through staggered letters and digits; they are hidden from assistive technology and cannot be selected. A single status message announces loading. When data arrives, characters flip through a short sequence and settle into their actual values; later changes animate only the changed characters. These CSS animations have no JavaScript timers and stop looping when loading ends or the board is removed. Reduced-motion users get static blank loading flaps and immediate final text. `AirportHeroCard` uses this shared loading treatment automatically. Use **Reload board** in the Airports lab to preview the complete loading-to-ready transition.

Empty messages also appear on the flaps, in the widest column (the destination/origin column in airport cards), with the other columns blank. Longer localized messages wrap across display rows instead of being truncated. They settle with the same animation as flight details, and one hidden status announces the complete message to assistive technology. This also applies when the study clock moves into a window with no movements.

Rail and other transport consumers can share the same time filtering through `movementBoardWindow(study, horizon)` and `movementsForBoard(entries, window, maxRows)` from `@motionstudies/core/domain/movement-board`. Format the returned numeric times when mapping them into `SplitFlapBoard` cells. The lab's rail board follows the same study clock and horizon as its airport card.

`@motionstudies/data/air-endpoints` provides offline `enrichAirEndpoints` for existing air manifests, chunks and opening snapshots. Supply cached same-date global ADSB.lol heatmaps, an OurAirports CSV and the service date's local UTC offset. It associates only unambiguous low-altitude endpoints near a reference airport; cruise-only traces and uncertain routes stay unknown. Optional `AirEndpoint` origin/destination fields carry airport identity, observed boundary time and `observed-endpoint` evidence. `airportBoardMovements` maps full manifest entries to board rows without confusing playback chunk boundaries with flight endpoints. Input hashes and source/licence attribution are recorded in fixture metadata. These fields describe inferred observations, never flight schedules, gates or live status.
