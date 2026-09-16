# Air continent labels

`@motionstudies/core/air-continents` owns the seven geographical continent codes,
display names, endpoint classifier and coverage summary. `AirEndpoint` adds optional
`continent` and `continentSource` fields so older recorded days remain readable.
No endpoint means `unknown-endpoint`; an older or unlabelled endpoint means
`unknown-continent`. Neither implies Europe or absence of intercontinental service.

`@motionstudies/data/air-endpoints` retains OurAirports' airport-level continent in
`parseAirports` and carries it through `inferAirEndpoints`. Endpoint inference still
uses the same complete-trace proximity, altitude and speed rules. The continent
describes the airport association; it does not confirm a flight plan or itinerary.

The existing endpoint `icao` field historically stores OurAirports `ident`. Some
identifiers differ from the current `icao_code`. Join existing releases by `ident`;
do not reinterpret their endpoint identifiers as current ICAO codes.

`parseAirports(csv, { continentOverrides })` optionally accepts a list of
`{ airportIdent, continent, reason }` objects for documented geographical conventions.
The identifier must exist in the reference; duplicate entries, unsupported continents
and blank reasons fail. Recorder releases should retain and hash the override file.

The recorder owns offline compilation and immutable releases. It should retain the
labelled endpoint objects in both the canonical index and playback chunks, and call
`summarizeAirContinents(index.aircraft)` once for release coverage. Do not summarize
overlapping chunks or describe track-segment counts as flight totals. Unknown
endpoints remain in the coverage denominator; empty coverage is null.

LUFT and other consumers read labels from a versioned release and use the core helper
for display/filtering. They do not download a live airport table. Existing releases
are unchanged and return unknown continent labels until explicitly rebuilt or enriched
into a new release. Publish/adopt matching core and data packages before recompiling;
these source changes alone do not update consumers pinned to an older package.
