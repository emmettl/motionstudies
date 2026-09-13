# Motion Studies packages

Shared packages for the Motion Studies transport instrument. The source workspace and compiled distributions expose the same explicit, extensionless module subpaths. The initial release is `0.1.0-alpha.0` under npm’s `next` tag.

- `@motionstudies/core`: transport contracts, indexing, interpolation and visual theme contracts; no browser or Node dependencies.
- `@motionstudies/three`: `NationalNetworkScene`, `HubPulseScene`, `StationFlowScene`, camera framing and label-mode contracts. React, React Three Fiber and Three.js are peers; rendering internals are not public subpaths.
- `@motionstudies/web`: picker, button tooltips, theme application, mounting, progressive loaders, observed operations and recording. Import `tokens.css` and `mobile-picker.css` for isolated widgets. `shell.css` is an optional full-page study shell scoped to `.motion-study`; `mountMotionStudy` applies that class. Fonts and edition layouts belong to consumers.
- `@motionstudies/data`: Node-only GTFS readers, ADS-B heatmap compilation, air endpoint enrichment, network chunking, merging and station ranking. ZIP reading requires `unzip` on the host. Source selection, provenance overrides and compilation commands belong to each edition.

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

For bus stops and local transport, `DotMatrixBoard` accepts the same rows, selection callbacks, loading state and empty/loading messages. It uses an amber 5 × 7 LED alphabet and its own scoped stylesheet; the flip-board stylesheet is not required. Consumers can switch components without remapping their data.

```tsx
import { DotMatrixBoard } from '@motionstudies/web/components/DotMatrixBoard'
import '@motionstudies/web/dot-matrix-board.css'

<DotMatrixBoard
  label="Bus departures"
  columns={[
    { key: 'route', label: 'Route', characters: 4, minCharacters: 4 },
    { key: 'destination', label: 'Destination', characters: 24 },
    { key: 'time', label: 'Due', characters: 6, minCharacters: 6, align: 'right' },
  ]}
  rows={[{ id: 'bus-71', cells: { route: '71', destination: 'City Centre', time: '2 min' } }]}
  lineCount="auto"
  style={{ height: 360 }}
/>
```

`lineCount` defaults to six display slots and accepts 1–30 (values outside that range are clamped; non-finite values use six). Fixed counts keep all slots and scale their contents to the available height, so dense boards need taller containers to remain readable. `"auto"` observes the actual container and fits 1–30 rows at a target `minRowHeight` of 34px. The default board height is 320px; use `style`, `className`, or `height: '100%'` inside a parent with a defined height. Unused slots stay blank; rows beyond the visible slots are omitted, without pagination or changes to consumer selection.

For dot-matrix columns, `characters` is a width weight, while `minCharacters` reserves space before the remaining width is distributed. At very narrow widths all columns scale down. Long cell values are visually ellipsized, with their full original text available to assistive technology and on hover. Characters outside the bitmap alphabet (including accented names and non-Latin scripts) use SVG text as a visual fallback. `--matrix-ink` and `--matrix-unlit` customize the LEDs. Updates are immediate, with no flashing or scrolling animation. The **Bus boards** lab specimen exercises both presentations, height/width resizing, row counts, selection, long names, loading and empty states using synthetic timetable data.

`variant="uk-rail"` gives the matrix a square black enclosure, mixed-case amber lettering, matrix column headings and horizontal display bands. Optional `heading` and `headingColumnSpan` replace the visual labels across the leading columns while preserving the individual accessible column headers. `footerLabel` and `clockLabel` add a matrix footer; the consumer owns clock formatting and updates. No live clock or pagination is inferred. `DotMatrixRow.note` adds a detail line and an accessible description on the selection button. Details consume one display slot and stay with their departure: if only one slot remains, the next departure with a detail waits until there is room for both. A one-line board still shows its first departure, retaining its full note for assistive technology.

## Rail, bus and airport hero cards

Hero cards have separate transport-specific APIs and visual identities, with shared display components underneath:

| Card | Identity | Departure fields | Default display |
| --- | --- | --- | --- |
| `RailStationHeroCard` | Station name, optional code and locality | Scheduled time, destination, platform, expected time/status, via/service note | UK rail matrix |
| `BusStopHeroCard` | Stop name, optional stop code and locality | Route, destination, due estimate, optional via | Bus dot matrix |
| `AirportHeroCard` | IATA code, airport name and city | Flight, time, destination/origin, gate, remarks, direction tabs | Split flap |

Import the new cards from `@motionstudies/web/components/RailStationHeroCard` or `@motionstudies/web/components/BusStopHeroCard`, plus `@motionstudies/web/transport-hero-cards.css` (which includes both board styles). Airport imports and study-window behavior remain as documented above.

```tsx
<RailStationHeroCard
  station={{ name: 'Bristol Temple Meads', code: 'BRI', locality: 'Bristol' }}
  departures={[{
    id: 'train-1', time: '17:15', destination: 'Portsmouth Harbour',
    platform: '9', expected: '17:22', via: 'Eastleigh',
  }]}
  lineCount="auto"
  boardHeight={400}
  clockLabel="16:49:26"
  footerLabel="Study timetable"
  note="Synthetic timetable. Example times, not a live service."
/>

<BusStopHeroCard
  stop={{ name: 'Anchor Road', code: 'A1', locality: 'Bristol' }}
  departures={[{ id: 'bus-1', route: '71', destination: 'City Centre', due: '2 min' }]}
  lineCount={6}
  note="Synthetic timetable. Example estimates, not a live service."
/>
```

Rail and bus consumers supply already ordered and formatted departures, including their own filtering, timezones and freshness. Missing times, platforms and statuses stay unknown rather than becoming “On time”. Both cards accept `presentation` (`'uk-rail'`, `'dot-matrix'`, `'split-flap'`), `lineCount`, `boardHeight` in pixels, `minRowHeight`, `loading`, `error`, `onRetry`, localized `labels`, and controlled `onSelectDeparture`/`selectedDepartureId`. A required `note` explains the source. The matrix fits its container; the split-flap alternative contains scrolling and places any service details in an Information column. Fixed line counts represent physical matrix lines; in split-flap mode they limit departure rows. The **Transport heroes** lab compares all three cards, switches the new cards' presentations, and exercises details, row fitting, updates, long names and failure states.

The rail card additionally accepts `presentation="sbb"`: a blue-and-white typographic departure board with service badges, scheduled time, destination/via information and prominent track numbers. This layout follows the information hierarchy in [SBB's general display guide](https://www.sbb.ch/en/travel-information/stations/services-station/station-customer-information/general-display-board.html). It uses ordinary text, including accented and non-Latin names. `RailDeparture.service` supplies a train label such as `IC 1`; optional `serviceCategory` (`'intercity'`, `'international'`, `'regional'`, `'suburban'`) selects the badge treatment. `platformSector` supplies a separate sector label when known. Expected times or disruption messages appear below the scheduled time; absence of a message does not manufacture an “On time” assertion.

For this layout, `lineCount` counts departures with their inline detail, and `"auto"` fits rows using a default target height of 64px. Dense fixed counts reduce type size; long values remain in the accessible text and hover titles. Labels stay consumer-owned, including the added `service` column label. The lab's **SBB departure board** option selects a synthetic Zürich HB example with German, French, Italian and English labels. Both new board styles are included in `transport-hero-cards.css`.

At compact widths the SBB layout stacks the service badge under the time, preserving destination space and the separate track column. Rail and bus hero padding follows the card width rather than the viewport. The lab includes a 240–980px width slider and Compact/Mobile/Panel/Wide presets, plus a 180–640px board-height control. The size regression suite covers seven card widths, four board heights, fixed and automatic line counts, long destinations, selection during updates, mobile viewports and loading/error states in Chromium and WebKit. Prefer `lineCount="auto"` for small panels; high fixed line counts deliberately trade text size for density.

```tsx
<RailStationHeroCard
  presentation="sbb"
  station={{ name: 'Zürich HB' }}
  labels={{ station: 'Bahnhof', departures: 'Abfahrt', service: 'Zug', time: 'Zeit', destination: 'Nach', platform: 'Gleis' }}
  departures={[{ id: 'example-1', service: 'IC 1', serviceCategory: 'intercity',
    time: '09:02', destination: 'Genève-Aéroport', via: 'Bern · Lausanne', platform: '32', platformSector: 'ABCD' }]}
  lineCount="auto"
  boardHeight={430}
  note="Synthetic timetable · Example data."
/>
```

The shared board also accepts `loading`, a localized `loadingMessage`, and `loadingRows` (default five). While loading, its decorative rows cycle through staggered letters and digits; they are hidden from assistive technology and cannot be selected. A single status message announces loading. When data arrives, characters flip through a short sequence and settle into their actual values; later changes animate only the changed characters. These CSS animations have no JavaScript timers and stop looping when loading ends or the board is removed. Reduced-motion users get static blank loading flaps and immediate final text. `AirportHeroCard` uses this shared loading treatment automatically. Use **Reload board** in the Airports lab to preview the complete loading-to-ready transition.

Empty messages also appear on the flaps, in the widest column (the destination/origin column in airport cards), with the other columns blank. Longer localized messages wrap across display rows instead of being truncated. They settle with the same animation as flight details, and one hidden status announces the complete message to assistive technology. This also applies when the study clock moves into a window with no movements.

Rail and other transport consumers can share the same time filtering through `movementBoardWindow(study, horizon)` and `movementsForBoard(entries, window, maxRows)` from `@motionstudies/core/domain/movement-board`. Format the returned numeric times when mapping them into `SplitFlapBoard` cells. The lab's rail board follows the same study clock and horizon as its airport card.

`@motionstudies/data/air-endpoints` provides offline `enrichAirEndpoints` for existing air manifests, chunks and opening snapshots. Supply cached same-date global ADSB.lol heatmaps, an OurAirports CSV and the service date's local UTC offset. It associates only unambiguous low-altitude endpoints near a reference airport; cruise-only traces and uncertain routes stay unknown. Optional `AirEndpoint` origin/destination fields carry airport identity, observed boundary time and `observed-endpoint` evidence. `airportBoardMovements` maps full manifest entries to board rows without confusing playback chunk boundaries with flight endpoints. Input hashes and source/licence attribution are recorded in fixture metadata. These fields describe inferred observations, never flight schedules, gates or live status.

## Vehicle hero cards

`VehicleHeroCard` shows one vehicle's destination, next stop and remaining calling points. Import it from `@motionstudies/web/components/VehicleHeroCard` with `@motionstudies/web/vehicle-hero-card.css`. The **Vehicle heroes** lab compares `uk-bus` (amber onboard display), `uk-rail` (dark rail display), `yellow-bus` (yellow next-stop panel) and `sbb` (blue next-stop panel with a red service badge). These are presentation studies, not official operator components.

```tsx
<VehicleHeroCard
  presentation="sbb"
  vehicle={{ service: 'IC 1', operator: 'SBB CFF FFS', destination: 'Genève-Aéroport' }}
  stops={[
    { id: 'bern', name: 'Bern', time: '10:28', platform: '6' },
    { id: 'fribourg', name: 'Fribourg/Freiburg', time: '10:56' },
  ]}
  note="Synthetic journey · Example calls and times."
  onSelectStop={selectStation}
  selectedStopId={selectedStationId}
/>
```

Consumers supply remaining `stops` in journey order and update them with playback, seeking or observations; the card has no independent clock. The first supplied call is the next stop. Optional `time`, `platform` and `detail` are consumer-formatted; absent values stay absent. `vehicle.destination` is optional and shows an explicit unavailable label when missing. The final supplied stop is never inferred to be the destination: set `isDestination` only when confirmed, especially when data is progressively chunked. Empty calls mean no upcoming stops are available, without asserting that the vehicle has arrived.

The required `note` explains provenance. Optional `status`, `statusTone`, `clockLabel`, localized `labels`, `loading`, `error` and `onRetry` follow the consumer's data; the component never manufactures an on-time status. Loading and errors hide the calling points. Stop selection is controlled through stable call IDs and does not alter playback or clear when a call leaves the list. All supplied calls are shown, with wrapping names and container-based compact layouts. The lab exercises advance/rewind, unknown destinations/times, localization, disruption, recovery and narrow widths. Edition adoption requires its own package upgrade and data adapter.

## Optional live airport feed

`AirportBoard` from `@motionstudies/web/components/AirportBoard` adds Study/Now controls around an existing `AirportHeroCard` configuration. Pass `studyCard` with the usual card props and `live={{ baseUrl, edition, airport }}` for the shared service. Import `airport-hero-card.css`. `labels` localizes the wrapper's control and availability messages. The lower-level `useAirportFeed` hook and core `domain/live-airport` contract are also public exports.

Live timestamps are Unix seconds and use the airport's timezone for display, independently of recorded service time. The wrapper does not pass live flight IDs to the recorded scene's selection callback. The recorded card remains mounted while hidden; the edition still owns playback and can pause its study when appropriate. Only Now mode fetches flight boards; checking capabilities does not query the paid provider. Stale results carry their retrieval time and disappear when expired. Source data never falls back to synthetic or recorded flights under a live label.

See [service architecture and operations](../docs/LIVE-AIRPORTS.md). The Worker is deployed separately; npm publication and edition adoption remain explicit release steps.

## Shared recorded air compilation

`@motionstudies/data/adsb-heatmap` consolidates the offline heatmap pipeline previously copied between editions. `ingestAdsbHeatmaps` reads cached gzip slices, decodes observations, filters transport-scale tracks, splits flights, and writes either an opening snapshot or an indexed day with overlapping chunks. Source hashes, chunk hashes and ODbL attribution accompany the output. It makes no network requests.

The same `decodeAdsbHeatmap` now powers `enrichAirEndpoints`; endpoint inference retains full coordinate precision, while playback compilation retains the existing five-decimal coordinates. `transportAirTracks` and `chunkAirSnapshot` are also available for consumers that assemble their own pipeline. All functions have public TypeScript declarations and work in the packed Node package.

Editions supply geographic bounds, service date, explicit UTC offset, optional timezone, input files and output paths. Flight IDs and chunk overlap retain the existing contracts. The default splits known callsign changes and gaps over 30 minutes. Set `splitTracks: false` only when reproducing a legacy opening snapshot with one ID per aircraft. See [adoption and compatibility](../docs/AIR-DATA.md).

## Shared edition controllers and performance

`positionForTrain` now indexes chronological stop times with binary search and retains sequential behavior for unordered observations. Stop arrays are immutable: replace the array when a timetable changes. Arrival/departure boundaries, dwell, cancellation and backward seeking retain the existing contract.

`countableVehicleTrains(network, stations, selection)` and `createActiveTimetableVehicleCounter(trains, options)` from `@motionstudies/core/domain/vehicle-counts` separate station/route/category membership from clock updates. Build the selector and counter with `useMemo` when data or selection changes, then call the counter at the displayed time. It includes both interval endpoints and excludes cancellations and inverted intervals. Missing stations yield no matches. By default it counts timetable intervals even if a journey lacks enough stops to position; `{ requirePositionable: true }` excludes journeys with fewer than two stops. This distinction is explicit so an edition can retain its established metric.

The renderer now shares active GPU upload ranges, paused frame reuse, label and trail frame budgets, cached text comparators and batched hub lines. Custom layers can import the low-level helpers from `@motionstudies/three/render-performance`. Recreate frame trackers when their geometry/data/selection inputs change; `batchHubLines` takes ownership of two-vertex source line resources. Edition-specific worker transfer, picking and cartographic adapters remain consumer-owned.

`useJsonAsset<T>(url, enabled, parse?, optional?)` from `@motionstudies/web/use-json-asset` loads a single asset lazily and exposes `data`, `loading`, `error`, `unavailable`, and `retry`. Keep the parser stable and perform edition-specific schema/source compatibility checks there. Successful data remains cached while disabled; consumers decide whether to display it. Changing the URL or parser immediately discards prior-source state, and disabling/unmounting cancels requests. `retry()` discards cached state and requests again when enabled. Optional HTTP 404 responses are unavailable; other failures are errors. No source fallback or freshness policy is inferred.

`useTransitionValue(target, { durationMs, easing, steps })` from `@motionstudies/web/use-transition-value` animates a numeric value, returning `value` and `transitioning`. It reverses from the current frame, cancels on teardown, and settles immediately when reduced motion becomes active. `smoothTransition` is the default easing; `cosineTransition` and stepped progress support existing edition rhythms. Keep custom easing functions stable. Camera actions and lazy layout loading stay in the edition.

Edition chunk scripts can call `runNetworkChunkCli()` from `@motionstudies/data/network-chunk-cli`. It accepts the existing `--input`, `--manifest`, `--opening`, `--chunk-hours`, `--opening-start`, `--opening-end`, and `--focus` arguments. Source acquisition, provenance, output paths and command invocation remain edition-owned.

For timetable-backed vehicle selections, `NetworkVehicleHeroCard` from `@motionstudies/web/components/NetworkVehicleHeroCard` accepts `snapshot`, `train`, playback `time`, a required source `note` and the vehicle card's presentation/state/label options. Import `vehicle-hero-card.css`. It resolves the selected train ID against the current snapshot, retaining destination identity but showing no stale calls when that ID is absent. Calls stay in journey order, use stable journey/call IDs and follow backward seeking. During dwell the heading becomes `atStopLabel` (default “At stop”) and the time is the departure; otherwise it is the upcoming arrival. Times are formatted with `formatServiceTime` by default, without normalizing after midnight or adding delay twice. Use `showTimes={false}` for frequency-modelled journeys, and explain the model in `note`. The core `vehicleCalls` helper is also exported from `@motionstudies/core/domain/vehicle-calls` for custom adapters. Selection callback IDs refer to calls, not station indexes.
