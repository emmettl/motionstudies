# Shared ground-transport foundations

This additive extraction supports Underfall's road work and the national study's evidence requirements. It leaves existing road classes and renderer defaults unchanged. It is rebased onto the published alpha.11 styling release (main `99f4805`), without a version bump. Coordinate the next package version with the active vehicle hero-card task. The review branch is approved for GitHub; these transport additions have not been published to npm.

## Public modules

- `@motionstudies/data/source-store`: bounded HTTP/local-file capture, immutable content-addressed objects, capture history, atomic request pointers, hash-checked offline replay and JSON validation. Default User-Agent is `Motion Studies source capture`; callers can retain their application identifier. URL origin/credential checks are common; provider-specific path restrictions and credential handling remain adapters.
- `@motionstudies/data/uk-service-day`: validated dates, Europe/London civil-day boundaries, overlapping UTC dates and the distinct GTFS noon-based origin. The explicit UK name matters: its midnight calculation is not a general solution for every timezone. No WebTRIS clock interpretation is inferred from this helper.
- `@motionstudies/data/webtris`: validated daily-report URLs, pure report normalization and conversion to aggregate-road series. Original report labels, nullable measurements, length-class counts, duplicate/conflict audits and source-local slots are retained. Pagination and capture orchestration remain in the edition for this increment.
- `@motionstudies/core/domain/aggregate-road`: aggregate samples, separate geometry associations, safe metric access and a per-date slot index. Counts are passages per reported interval; speeds retain mph/km/h units. Provider-slot and UTC intervals are discriminated. Duplicate slots remain unavailable; neither gaps nor another date receive fallback values. Series identify provider, dataset and site; each sample retains source-record references. No tracked-car identities are constructed.

The existing light/heavy road contract is retained for its current consumers. Its conversion, interpolation and topology assumptions must not leak into this aggregate contract. An illustrative geometry allocation records its method/extent independently from a provider-link association with an exact model version.

## Provenance and extraction

Source implementation: Underfall `6ef70b3`, especially `scripts/feeds/store.mjs`, `clock.mjs` and the pure portions of `road-report.mjs`. Its ADSB.lol repository restriction remains in the edition wrapper. Additional input validation rejects invalid capture limits, ambiguous site identities, invalid report pagination and booleans/arrays masquerading as numeric measurements.

Capture remains bounded in memory, not streaming-to-disk. Reuse by a national compiler does not justify requesting an unbounded payload. Response redirects retain the supplied fetch implementation's behaviour; authenticated adapters must continue to enforce their own destination and credential boundaries.

## Consumer proof

An isolated Underfall adoption replaces about 230 lines of duplicate acquisition, clock and report interpretation with imports and a small provider-specific wrapper. Four private package tarballs built from this branch were unpacked into the isolated consumer, with no workspace-source imports. The running Underfall checkout and its registry pins are unchanged until publication.

Validation on 13 September 2026:

- 238 shared unit tests, including 15 new transport cases; shared package type checks, lint and all four distribution builds pass.
- Underfall's existing 79 tests, lint and production build pass against the candidate distributions. They exercise BODS authentication boundaries, recorded bus replay/window checkpoints, WTT/date preparation and tidal civil days as well as roads.
- A clean public-subpath TypeScript specimen consumes all four new exports and typechecks.
- Offline replay of the cached M32 reports is deeply equal to the existing compiled report: 26 sites, 25 reports with rows, 19 usable series and 2,400 samples. Every original count and speed survives aggregate conversion.

London's WebTRIS consumer is deliberately not silently migrated: it converts length classes into light/heavy hourly rates and assumes fixed fifteen-minute slots. It needs an explicit adapter/evidence review before adopting the aggregate contract. The new parser can already accept other motorway identifiers; Bristol names are not built into it.

## Adoption and subsequent work

1. The additive branch has been rebased after the styling release, preserving its versions and exports. Coordinate and bump all four packages together through the existing release process; do not publish these additions under alpha.11.
2. Apply the prepared Underfall wrapper migration and pin all four packages to that exact published version, with a normal lockfile update. Re-run its checks against registry artifacts, replacing candidate tarballs.
3. Use the scene extension API to build aggregate roads in the main map, then prove the renderer contract with a second edition. A shared screen must still preserve incompatible source clocks.
4. Extract observation-window machinery with provider-neutral identities and explicit mode policies; package the proven rail readers and geometry helper. These are subsequent extractions, not part of this release.
5. Build spatial/temporal constituent lookup for the national brief's overview → group → service → source-record transition. The present series/source references establish a seam; they do not yet implement national aggregation or spatial delivery.

Post-alpha.11 validation: the rebased tree passes 241 shared unit tests. The original packed Underfall proof above remains based on the pre-rebase candidate; repeat adoption against the eventual registry release.
