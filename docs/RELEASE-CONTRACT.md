# Release handoffs: one file descriptor, one verifier

Recorded evidence reaches the works as dated, versioned releases that the [recorder](https://github.com/emmettl/motionstudies-recorder) writes and editions read: the published national bus day, power, air-day and road evidence releases, air endpoint enrichment and the feed-quality histories. A survey on 19 September 2026 found that they had converged on one thing without agreeing on the rest.

**What they share.** Each describes its files as `{ path, sha256, bytes }`, with the digest over the stored bytes (compressed where the file is compressed), a release-relative path and a staged directory renamed into place.

**What they did not share.** How files are listed (a `files` array, a name-keyed map, an `objects` map keyed by digest, `chunks`, named descriptors such as `day`, or a bus day's `list`, which had no digests). Compiler identity (a string, an object with a code hash, or nothing). Whether an existing release is refused or replaced. And every consumer wrote its own check loop: about thirty across the recorder, England, LUFT, Underfall and this repository, with five different safe-path rules.

## The shared verifier

`@motionstudies/data/release` runs in Node and browsers (Web Crypto only):

- `readDescriptor` checks one descriptor: a path of safe forward-slash segments (never absolute, empty, `.` or `..`), a lowercase hex SHA-256 and a non-negative byte count.
- `releaseDescriptors(manifest)` enumerates every descriptor in any of today's layouts and refuses two descriptors that give one path different bytes.
- `checkReleaseManifest` checks `kind` and accepted `schemaVersion`s.
- `verifyDescriptorBytes` and `digestHex` check fetched bytes in a browser or in Node.

`@motionstudies/data/release-files` is Node only:

- `openRelease(root, { kind, schemaVersions, manifestSha256 })` reads `manifest.json` with a size bound, checks it against a pinned digest when one is given (LUFT's `data-release.json` pins one), checks identity and returns a `read(path)` that refuses any file the manifest does not describe.
- `readReleaseFile` refuses a path that resolves outside the release or passes through any symbolic link below the release root (even one pointing inside it), reads no more than the described size, and checks size and digest.
- `verifyRelease` checks every described file against a total byte budget.

Verified against real data on 19 September: LUFT's 17 September air release, 147 files and 261,260,128 bytes, with the manifest matching the digest LUFT pins.

Format-specific meaning stays with its reader: `@motionstudies/core/domain/published-day`, `domain/power-day` and `air-enrichment` still decide what a valid day, power day or enrichment is. The shared layer only establishes that the bytes are the ones the manifest names.

## For new release formats

- List **every** retained file as a descriptor, including copied source objects. The road release's `objects/` files are verified through their source records today, not listed; a future version should list them.
- Give the manifest `kind` and `schemaVersion`, and a `compiler` object naming the writer and, where practical, a digest of its code.
- Refuse an existing destination; stage and rename. The bus day still replaces an existing day on recompilation, which is deliberate while a day can gain late hours, and is why consumers pin what they adopt.
- Record sources as `@motionstudies/data/source-store` capture records where the bytes were captured.

## Adoption

The bus day gained per-file digests in its `list` on 19 September (recorder PR #19), so it can be verified like the others; `checkDayManifest` is unchanged and older days stay readable. The verifier was published in `0.1.0-alpha.29` on 19 September 2026 through the trusted release workflow ([run 35460111146](https://github.com/emmettl/motionstudies/actions/runs/35460111146)); the installed package verified LUFT's 17 September release. Consumers adopt it by upgrading and replacing their local loops one at a time; each keeps its own format checks.

`0.1.0-alpha.30` (19 September) refuses any symbolic link inside a release, after Underfall's adoption found that a link to another file in the same release passed containment. By the end of that day every consumer was on alpha.30:

| Repository | Adopted | Kept locally |
| --- | --- | --- |
| England | power compiler, power context and bus-day adoption through `openRelease`/`readReleaseFile`; browser checks through `verifyDescriptorBytes` | its file whitelists, `readPowerDay`, `checkDayManifest`, reconciliation and decoded `.gz` digests; days without list digests keep the old path |
| LUFT | daily release checks, data fetch, build scripts and enrichment through a pinned `openRelease`; browser chunk checks through `digestHex` and `isReleasePath` | frame, source and chunk counts, the chunk-to-files cross-check, enrichment binding and its single-segment path rule |
| Underfall | the road release reader and feed history; nine browser loaders through `digestHex` | its road cross-file checks and read budget; eleven other build scripts still hash for themselves |
| Recorder | the three offline air audit tools through one helper | `readArtifact`, on the live analytics path, and `scheduled-coverage` |

Every adoption preserved or tightened behaviour. Among the tightenings: England's power compiler now refuses a source object listed under the wrong digest, which it previously would have parsed as the wrong register.
