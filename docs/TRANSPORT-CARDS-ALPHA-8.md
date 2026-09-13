# Transport cards · 0.1.0-alpha.8

This coordinated release adds responsive bus and rail hero cards alongside the existing airport card. Bus and UK rail boards use dot-matrix lettering; Swiss rail has an SBB-inspired blue and white layout. Consumers control the number of lines, available height, selection, locale labels and data provenance. Container sizing keeps narrow cards legible and adjusts automatic row counts when space changes.

`@motionstudies/core/domain/station-departures` derives departures from a supplied network snapshot and station name. It resolves the current snapshot's stop indexes, uses departure times, retains repeated calls, omits terminators, and preserves scheduled, adjusted or cancelled status. Times from an adjusted snapshot are already adjusted; consumers must not add delays again. Missing platforms remain unknown. The helper does not imply that scheduled services are on time.

The release is published under npm's `next` tag. All four package versions and internal dependencies are pinned to `0.1.0-alpha.8`. Edition adoption and validation results will be recorded here after publication.

## Publication and adoption

All four packages were published with provenance under `next` from `81d2b7f` through the [trusted release workflow](https://github.com/emmettl/motionstudies/actions/runs/34726616430). Registry metadata was verified. Local release validation passed typecheck, lint, architecture checks, 195 unit tests and 72 packed browser checks (two touch-inapplicable skips), plus all publication dry runs. The trusted workflow additionally passed loader checks.

| Edition | Adoption commit | Presentation and validation |
| --- | --- | --- |
| Gleislicht | `57ccd19` | SBB rail / matrix bus; 1,425 tests; desktop and phone card checks |
| All Change | `eafe34c` | UK rail / matrix bus; 309 tests; eight station-area, arrival, retry, Eurostar and selection browser cases |
| Correspondances | `1e21fe1` | French matrix rail; 49 tests; four card/count browser cases |
| Local / Express | `6ea7953` | Matrix rail; two tests; four card/count browser cases |
| Umlauf | `86195e4` | Matrix rail; 17 tests; two map-selection/card browser cases |
| Norikae development | `654caeb` | Synthetic matrix rail, English/Japanese; 28 tests; 14 browser cases |
| Norikae main | `34196c5` | Synthetic matrix rail, English/Japanese; 28 tests; 12 browser cases |
| Underfall | `1d93a33` | Bus and UK working-rail cards; 56 tests; four desktop/phone card checks |
| Manifest | `832f85a` | Dependency only; 70 tests and existing build/bundle gates |
| Zugunruhe | `df75594` | Dependency only; 46 tests and production build |

All declared type, lint, architecture/boundary and build checks passed. Existing bundle gates passed; London's lazy station-board allowance explicitly increased to account for the matrix glyph renderer and both card types (7.5 KiB JS / 4.4 KiB CSS measured). Opening-view budgets remain unchanged. Swiss tests were run with two workers after concurrent validation caused timeouts; all 1,425 passed. Desktop/mobile screenshots informed final spacing below search controls. Missing platforms remain unknown, scheduled services are not asserted to be on time, Bristol working timings and pickup restrictions remain labelled, and Norikae retains synthetic provenance.

Adoption commits are pushed to existing branches, except Underfall, which has no remote and is committed locally. Existing checkouts were fast-forwarded and dependencies refreshed. Gleislicht's unrelated local work was preserved while incorporating upstream changes already on its main branch; its saved-work backup remains available. Private data and publication gates were not changed by this adoption.

At handoff, edition deployment workflows are still progressing. London's initial CI run hit a five-second timeout in its existing rail-source validation test (308 other tests passed); the failed jobs were retried. npm publication itself succeeded.
