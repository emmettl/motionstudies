# Shared recorded air data

The offline ADSB.lol compiler belongs in `@motionstudies/data/adsb-heatmap`. The live AeroDataBox service remains in `services/airports`: recorded observations and current flight boards have different sources, time coordinates and availability rules.

The shared module exports:

- `decodeAdsbHeatmap(bytes, options, onSample)`: decode uncompressed 16-byte heatmap records, optionally restricted by geographic bounds and numeric ICAO addresses. Samples include the observed callsign and retain full coordinate precision. Returns the accepted observation count.
- `transportAirTracks(records, { splitTracks })`: sort and deduplicate samples, apply the existing transport thresholds, and segment known callsign changes or gaps over 30 minutes. Inputs are not mutated.
- `chunkAirSnapshot(snapshot, options)`: produce an indexed manifest and chunk payloads with 180 seconds of trailing overlap and 45 seconds of forward overlap by default. Descriptors include byte counts and SHA-256 of compact JSON plus its final newline.
- `ingestAdsbHeatmaps(options)`: read cached gzip files, compile tracks and write an opening snapshot, or a day manifest and its chunks when `chunkHours` is supplied. The output directory must already exist. No downloads or credentials are involved.

`enrichAirEndpoints` in the existing `air-endpoints` module uses this same decoder for full traces of the selected aircraft. Airport reference parsing and conservative endpoint inference remain in that module; it does not use the compiler's regional clipping or transport filters.

## Edition adapter

Keep source selection and configuration with the edition. An edition's script can retain its existing argument parser, list input files in a deterministic order, and replace decoding, segmentation and writing with one call:

```js
import { ingestAdsbHeatmaps } from '@motionstudies/data/adsb-heatmap'

const artifact = await ingestAdsbHeatmaps({
  inputs: options.inputs,
  output: options.output,
  serviceDate: options.serviceDate,
  utcOffsetHours: options.utcOffsetHours,
  timezone: edition.timezone,
  bounds: options.bounds,
  windowStart: options.windowStart,
  windowEnd: options.windowEnd,
  chunkHours: options.chunkHours,
  splitTracks: edition.splitOpeningTracks || options.chunkHours !== undefined,
})
```

Do not use a sibling repository path or a workspace alias in an edition's production script. Adopt a released package containing this export and keep the edition's package version pinned. The shared export is published in `0.1.0-alpha.7`; see the [release and adoption record](AIRPORTS-ALPHA-7.md) for consumer versions and validation.

The current migration points are:

| Edition | Existing script | Configuration to retain |
| --- | --- | --- |
| Gleislicht | `scripts/ingest-adsb-heatmap.mjs` | Bounds `[5.45, 45.55, 10.75, 48.2]`; service date and offset supplied by the script; opening window 06:45–08:45; `splitOpeningTracks: false` for legacy aircraft IDs. Day output splits flights. |
| Correspondances | `scripts/ingest-paris-air.mjs` | Bounds `[1.5, 48.3, 3.4, 49.35]`; timezone `Europe/Paris`; opening window 07:00–09:00; `splitOpeningTracks: true`. Retain its source dates and output paths. |
| All Change | Base ingestion script is not present in the checked-out `scripts/` directory | A future base compiler can use the same API with its authored region and source choices. Existing `scripts/enrich-air-routes.mjs` already imports shared endpoint enrichment; retain its explicit local offset. |

`timezone` is provenance and does not calculate offsets. The caller supplies the offset applicable to the recording. A window spanning an offset transition needs edition-specific time handling; this compiler uses one explicit offset. Windows may extend past 86,400 seconds without wrapping. Bounding boxes require west < east; split a region crossing the antimeridian upstream.

## Compatibility and validation

Flight filtering retains the editions' thresholds: at least four distinct samples, a maximum speed of at least 120 knots and altitude of at least 1,500 feet; without an airline-like callsign, at least 250 knots and 10,000 feet. Those are observed-track selection rules, not scheduled-flight classification.

Inputs preserve caller order. For duplicate timestamps, the first observation wins. Flight segment IDs remain `icao-startSeconds`; legacy unsplit snapshots use the aircraft address. Chunk filenames, full-flight index bounds and window membership follow the existing edition convention. Observation time remains local service seconds, including after midnight; it never becomes a scheduled departure time.

Two decoder fixes apply consistently: negative latitudes are treated as positions rather than callsign markers, and non-ICAO callsign records cannot overwrite an ICAO aircraft's callsign. Invalid configuration and incomplete binary records fail explicitly. Source and chunk integrity metadata is additive for consumers that did not previously record it.

The unit suite exercises binary decoding, filters, midnight, malformed inputs, segmentation, legacy IDs, overlaps, hashes, gzip compilation and endpoint enrichment. A synthetic gzip fixture was also run through the existing Gleislicht and Correspondances scripts and the shared compiler: both opening outputs matched in track content, and both day outputs matched in aircraft indexes and byte-for-byte chunk payloads. This parity check does not replace regenerating and reviewing each edition's real fixtures during adoption.
