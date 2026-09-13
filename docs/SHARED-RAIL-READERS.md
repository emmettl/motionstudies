# Shared railway preparation

This extraction replaces Underfall's hash-pinned All Change reader/geometry bridge with typed Node ESM APIs. It also removes Python from All Change's national-rail source acquisition, normalization and geometry path. Regional station names, operators, exceptional track access, public timetable calendar exclusions and clipping policy remain in the editions.

No package version is bumped here. The coordinating task will combine this with the other foundations, publish the next release and update consumers against the actual registry artifacts. The local tarball used for validation is a private candidate, not the published alpha.12 package.

## Modules

- `@motionstudies/data/rail-wtt`: bounded XLSX archive access, sparse worksheet cells, reviewed WTT time/calendar interpretation and dated source-column audit. Retains half-minutes, working symbols and original row/column identity; cached formula values are read, never evaluated. Unsupported XML namespaces, external entities, invalid workbook relationships, duplicate members and resource overruns fail closed.
- `@motionstudies/data/rail-journeys`: joins UID and originating date across adjacent table banks; reconciles header public times; preserves working/passenger/pickup/set-down distinctions and source references. Station/alias resolution and operator scope are explicit inputs. Public-call supplementation requires two surrounding passenger anchors; consumers must reject ambiguous and unreviewed unmatched records before emission.
- `@motionstudies/data/rail-public-calls`: pdftotext bbox page/row/column extraction. The caller supplies page/calendar acceptance and station-name resolution. The fixed pdftotext XHTML doctype is stripped; arbitrary doctypes/entities remain rejected.
- `@motionstudies/data/rail-routing`: connected OSM A* routing with explicit kilometre projection, distance function, railway exceptions, anchor radii and study boundary. Missing paths and excessive detours are reported, never replaced with straight lines.
- `@motionstudies/data/rail-geometry`: the existing connected-corridor helper and output assembler, including monotonic calling times, identity checks and path continuity.

The public APIs have `.d.mts` contracts; a TypeScript specimen consumes each subpath. Node 24+ and host `unzip` are runtime requirements. `fast-xml-parser` 5.11.1 is the pinned XML dependency. Acquisition of public passenger PDFs also needs `pdftotext` in the edition. No Python is shipped in the npm distribution. Existing Python files in the editions remain validation oracles and unrelated Python pipelines remain out of scope.

## Calendar limits

The source-column audit supports reviewed Monday–Saturday banks. Sunday is rejected. Joined assembly requires all three adjacent banks; with Sunday unsupported it currently accepts Tuesday–Friday study dates. Monday and Saturday joined assembly are rejected instead of silently omitting an adjacent Sunday bank. Bristol's Saturday source-column audit and local daytime-only compiler continue to operate unchanged. Unsupported running-day codes, dates, timing symbols and active UID conflicts fail explicitly.

Default workbook limits are 32 MiB compressed, 128 MiB expanded XML, eight million allocated cells, 10,000 rows and 16,384 columns. Byte/cell limits can be reduced or explicitly configured. XML and archive processing are bounded in memory; this is offline preparation, not a streaming national ingestion service.

## Evidence

[Source hashes and results](evidence/rail-reader-parity.json) record the exact validation inputs. The retained national WTT archive is the same June–December 2026 archive already captured by Underfall.

- All 31 London XLSX worksheets compare cell for cell with the old Python reader.
- All 3,138 public passenger records compare exactly, including anchors, pages and columns, on freshly retrieved copies of the cited eNRT PDFs.
- Joined London output: 8,681 journeys, zero timing conflicts and 1,051 public supplements compare deeply equal on identical inputs. Connected routing: 474 paths/OSM way lists and 588 unavailable-path reasons compare exactly; maximum length difference is zero.
- Bristol's six-table Saturday audit compares fully equal except reader provenance: 1,004 accepted and 255 rejected columns. All 47 published station pairs compare exactly with the legacy corridor helper. Rebuilding the edition preserves all 245 rail journeys, 23 stations, aircraft/morning files and recording-window files/hashes.
- Shared unit tests: 257 pass. London: 280 tests, lint and production build pass. Bristol: 80 tests, lint and production build pass. Shared type checks, architecture gate and distribution builds pass.

The full historical London OSM cache was unavailable. Fresh requests yielded three regional extracts; remaining Overpass queries timed out. Missing station identities for parity were taken from the retained edition catalogue/snapshots and supplied identically to both implementations. The composed input proves implementation parity; it does not reproduce the complete historical London publication and is not suitable for replacing production fixtures. No production data files are changed by this migration.
