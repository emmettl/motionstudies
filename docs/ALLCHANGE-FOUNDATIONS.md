# All Change foundations

The shared instrument needs to preserve the route from the whole to a group to an individual record. These extractions support that relationship without treating a timetable, an observation and an estimate as equivalent evidence. Edition geography, source permissions, public language and data selection remain local.

## Timetable patterns and progressive loading

`@motionstudies/core/domain/network-patterns` encodes repeated relative schedules once and decodes their individual journey IDs, absolute calls and route geometry references. It supports multiple service categories. The optional format and category policy lets an existing edition keep its published wire format. All Change retains `tfl-bus-patterns-v1`; new consumers can use `network-patterns-v1`.

`@motionstudies/web/use-pattern-network-day` verifies the exact downloaded byte length and SHA-256 before decoding, then checks the chunk window and journey count against its manifest. It loads the current chunk before adjacent chunks and retains only that neighbourhood when loading new chunks. The decoder itself loads lazily. Manifest changes discard the old source immediately; disabling cancels requests; `retry()` retries failures. Keep the asset resolver and optional category array stable across React renders.

These checks prove that a chunk matches the published manifest. They do not prove the timetable is current or correct. Integrity metadata must originate from the edition's trusted compilation process.

## Calls across independently acquired sources

`@motionstudies/core/domain/station-calls` keeps source identity, repeated call occurrences, service date and acquired window separate. Stop IDs are authoritative when supplied. Identical repeated journey records are deduplicated; conflicting records with the same source-local journey ID are rejected. Equal station names or call times never merge unrelated services.

The adapter supplies passenger restrictions, origin/destination policy and interchange mappings. The shared combiner namespaces call IDs, rejects duplicate source IDs and excludes failed, loading or differently dated sources independently. `stationSourceStatus` exposes unavailable, partial, ready and error states for the requested window. Board filtering intersects each source window with the requested window and upcoming hour; it never wraps into an unacquired day.

## Observation archives

`@motionstudies/data/observation-windows` compiles bounded, already acquired observations into hashed time windows. Every record retains its ID, supplied value, optional original source references and measurement/receipt timestamps. The caller must name `sourceId`, `evidenceKind` and the time basis: measurement, receipt or capture schedule. Missing samples remain missing; zero measurements remain zero.

The compiler reports exact duplicates, conflicting identities, excluded records, occupied cadence slots and gaps. Conflicts reject by default; omitting all conflicting records or explicitly retaining the last is an adapter decision recorded in the manifest. Default limits are 100,000 input records and 256 MiB of serialized input; the coverage index is bounded too. These are operational limits, not measured national capacity. The caller must bound file reading before passing records to this in-memory compiler.

Time is elapsed UTC seconds from explicit study bounds, so UK daylight-saving days can contain 23 or 25 hours. All Change's existing replay format uses a 24-hour wall-clock presentation and explicitly rejects transition days until that presentation is adapted. Ordinary-day replay bytes remain compatible. Capture completeness measures acquisition coverage, not the accuracy or completeness of TfL's underlying predictions.

## Railway and renderer interfaces

Railway readers, service-calendar semantics, public/working call evidence and routing are extracted as typed JavaScript in the Node data package. Renderer picking, infrastructure and diagram extension points are documented in [renderer interfaces](RENDERER-INTERFACES.md). Source-specific scraping, artistic choices and edition geography are not generic library responsibilities.

No Python interpreter is required by these shared runtime exports. npm does not require a TypeScript rewrite: this repository uses TypeScript for browser code and ESM JavaScript with declarations for Node data tools. Existing Python programs can remain reference implementations or edition-specific research tools. Publishing Python in a tarball is not inherently prohibited by npm; it would introduce a separate runtime and portability contract, and this extraction avoids that requirement. See [npm's scripts documentation](https://docs.npmjs.com/cli/using-npm/scripts/).

## Validation evidence before release

- All twelve retained London bus chunks round-trip unchanged: 145,826 chunk journey occurrences, including overlap between windows.
- Eight Swiss national PostBus chunks also round-trip unchanged: 36,566 chunk journey occurrences. This exercises a second edition's ordinary network chunks through the same codec.
- A controlled 1,300-frame London observation archive produces the same eleven replay chunks, byte lengths and hashes as the previous compiler. This is fixture parity, not a claim about a newly acquired full day.
- Browser specimens exercise lazy loading, current/adjacent windows, integrity failures, retry, eviction and source changes in desktop Chromium and iPhone WebKit, alongside the existing network, road and air loader regressions.

Publication and edition adoption are separate steps. The release record must state the actual registry version and consumer commits once those steps complete. Local / Express and NORIKAE remain parked.
