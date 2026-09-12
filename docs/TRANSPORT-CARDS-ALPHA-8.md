# Transport cards · 0.1.0-alpha.8

This coordinated release adds responsive bus and rail hero cards alongside the existing airport card. Bus and UK rail boards use dot-matrix lettering; Swiss rail has an SBB-inspired blue and white layout. Consumers control the number of lines, available height, selection, locale labels and data provenance. Container sizing keeps narrow cards legible and adjusts automatic row counts when space changes.

`@motionstudies/core/domain/station-departures` derives departures from a supplied network snapshot and station name. It resolves the current snapshot's stop indexes, uses departure times, retains repeated calls, omits terminators, and preserves scheduled, adjusted or cancelled status. Times from an adjusted snapshot are already adjusted; consumers must not add delays again. Missing platforms remain unknown. The helper does not imply that scheduled services are on time.

The release is published under npm's `next` tag. All four package versions and internal dependencies are pinned to `0.1.0-alpha.8`. Edition adoption and validation results will be recorded here after publication.
