# Oxc parser release — alpha.51

Published 6 November 2026 from `71a2e3b84095576e0129d6b4540c13e32572bcdf`,
after [PR #58](https://github.com/emmettl/motionstudies/pull/58) passed hosted
validation and merged. [Trusted release run 42197273783](https://github.com/emmettl/motionstudies/actions/runs/42197273783)
verified and published all four packages using OIDC. All four `next` tags point
to `0.1.0-alpha.51`. Independently downloaded registry archives match the retained,
tested CI tarballs byte-for-byte and have matching SHA-512 integrities. The local
checked candidate archives also match those CI archives byte-for-byte.

The data package replaces `@babel/parser` with exact `oxc-parser 0.156.0` for
module-reference and edition-boundary analysis. The React compilation prototype
and newer renderer compatibility/readiness tools use Oxc too. ESTree literals,
TypeScript import types, parenthesized references, Unicode offsets and diagnostic
line numbers retain their contracts; recovered syntax errors are rejected.
All four package versions and internal/root/lab pins are coordinated. The
browser packages retain the alpha.50 renderer APIs and validated Fiber 9.8.2
baseline. Editions upgrading from earlier pins also validate those intervening
shared releases through their own checks.

Local and trusted verification pass typechecking, architecture, package builds,
562 unit tests, 16 hosting tests, 296 packed browser cases with two existing skips,
40 loader cases and publication dry-run. Lint retains the pre-existing unused
`extname` warning in the shared boundary script. The independent catalogue
[main build and deployment](https://github.com/emmettl/motionstudies/actions/runs/42197273493)
are green. These checks cover Chromium and WebKit in desktop/phone viewports;
they do not establish physical-phone performance or a renderer/backend migration.

## Consumer adoption

Fifteen editions and the recorder consume exact registry alpha.51 pins. NORIKAE's
main and synthetic-player branches have separate maintenance adoptions, making
17 checkouts. Each clean registry install is compared file-by-file with the tested
archives, followed by its applicable type, lint, unit, boundary, build and payload
gates. Tracked public/fixture data hashes are retained. The new parser accepts all
2,604 scanned source files; the evidence binds those scans to their source hashes.
Existing local working-tree edits remain untouched in the original checkouts.

| Consumer | Previous shared release | Adoption | Integration |
| --- | --- | --- | --- |
| allchange | alpha.50 | [PR #4](https://github.com/emmettl/allchange/pull/4) | Merged `d13b1645`; PR checks green |
| correspondances | alpha.50 | [PR #2](https://github.com/emmettl/correspondances/pull/2) | Merged `c38014fc`; PR checks green |
| england | alpha.46 | [PR #4](https://github.com/emmettl/england/pull/4) | Merged `1387b6be`; PR checks green |
| gleislicht | alpha.48 | [PR #24](https://github.com/emmettl/gleislicht/pull/24) | Merged `00c08e6c`; main workflow failure |
| kraft | alpha.48 | [PR #11](https://github.com/emmettl/kraft/pull/11) | Merged `844a318e`; PR checks green |
| local-express | alpha.43 | [PR #1](https://github.com/emmettl/local-express/pull/1) | Merged `3751b382`; PR checks green |
| luft | alpha.48 | [PR #10](https://github.com/emmettl/luft/pull/10) | Merged `8a23e7da`; PR checks green |
| manifest | alpha.31 | [PR #2](https://github.com/emmettl/manifest/pull/2) | Merged `ef1c96a5`; PR checks green |
| motionstudies-recorder | alpha.47 | [PR #27](https://github.com/emmettl/motionstudies-recorder/pull/27) | Merged `a60a4074`; PR checks green |
| norikae | alpha.43 | [PR #4](https://github.com/emmettl/norikae/pull/4) | Merged `aedd4014`; PR checks green |
| norikae-player | alpha.43 | [PR #5](https://github.com/emmettl/norikae/pull/5) | Merged `f33c7c6b`; PR checks green |
| pfad | alpha.33 | [PR #4](https://github.com/emmettl/pfad/pull/4) | Merged `26b2f87a`; PR checks green |
| schwall | alpha.49 | [PR #1](https://github.com/emmettl/schwall/pull/1) | Merged `49f8a8c0`; PR checks green |
| umlauf | alpha.50 | [PR #3](https://github.com/emmettl/umlauf/pull/3) | Merged `1f082656`; PR checks green |
| underfall | alpha.48 | [PR #16](https://github.com/emmettl/underfall/pull/16) | Merged `b2230618`; PR checks green |
| zenit | alpha.31 | [PR #1](https://github.com/emmettl/zenit/pull/1) | Merged `8c70b60d`; PR checks green |
| zugunruhe | alpha.46 | [PR #2](https://github.com/emmettl/zugunruhe/pull/2) | Merged `aee0a859`; PR checks green |

Correspondances migrates its renderer-source tests to a local strict Oxc helper,
including a recovered-error regression; its 30 unit tests pass. Local / Express
and NORIKAE's synthetic-player branch remove unused direct Babel parser pins.
Required transitive `@babel/runtime` dependencies remain under their own packages.
England and LUFT resolve the shared renderer's required Fiber 9.8.2 peer; their
lockfiles also record its resolved runtime dependencies.

Gleislicht's existing alpha.48 opening exceeds its unchanged 380 KiB JavaScript
cap. Its adoption defers the whole debug bootstrap behind explicit URL opt-in,
resolves debug modes through the shared API before mounting, and keeps the study
usable if that optional chunk fails. Capture metadata and profiling remain
verified. Production JavaScript measures 379.6/380 KiB, with 807.4/808 KiB total;
the committed-fixture build measures 379.5/380 KiB, with 781.6/808 KiB total.
The worker types move to exact 5.20261023.1 to satisfy the already installed
Wrangler's peer minimum. All worker type checks pass. [Follow-up PR #25](https://github.com/emmettl/gleislicht/pull/25),
merged at `dafd298b`, explicitly prebundles the lazy CommonJS Spector dependency in
Vite development mode. All eight development and eight production debug cases
pass; normal visits still request no capture/profiling tools. Lint, build,
architecture and production transfer checks pass after this configuration fix.

The original main run passes its type/unit/architecture/bundle check but fails
regional preparation at the unchanged 65% rail-geometry threshold. Core executable
files are byte-identical to alpha.48; data executable files differ only in module
reference scanning, and the relevant edition preparation scripts are unchanged.
This data-refresh failure is separate from the SDK update. The original hosted
capture failure is addressed by PR #25; its new [main workflow](https://github.com/emmettl/gleislicht/actions/runs/42207402918)
is running at this record's cutoff and its regional jobs have failed again. Browser verification is ongoing. No publication or data-quality gate is bypassed.

Additional local browser evidence covers eight production Gleislicht debug and
recovery cases, 159 LUFT development cases with five existing skips, 30 compatible
LUFT production smoke cases, and 51 Underfall production cases with one existing
skip. LUFT's full suite contains development-module imports and filename matchers,
so full development coverage and built smoke coverage are reported separately.
No browser wait, numerical gate or transfer cap is weakened.

Source integration and hosted adoption checks are recorded above. Edition
publication follows each repository's existing verified-artifact pipeline; this
record does not attest that every public host is serving the adoption commit.
Underfall's automatic publication is blocked by the pre-existing missing `CLOUDFLARE_API_TOKEN` secret. Its successful main artifact has passed local staging and the deployment dry run; no manual production write is attested here. Private publication holds and paused acquisition remain in force. The
[machine-readable release and adoption evidence](evidence/oxc-alpha51-release.json)
retains registry identities, archive equality, source/data hashes, local commands,
PRs, merge identities and hosted checks.
