# Publishing the shared packages

The four shared packages are MIT-licensed. The first coordinated release is `0.1.0-alpha.0`, published under the npm `next` tag. Stable versions use `latest`. All four packages share a version; internal dependencies pin that exact version. Source workspaces stay private. Only an explicit release build produces publishable compiled distributions.

## Completed bootstrap

`0.1.0-alpha.0` bootstrapped the package names. `0.1.0-alpha.1` verified OIDC for all four packages without a token fallback. The GitHub bootstrap secret has been removed. The historical bootstrap procedure follows.

## Before the first release

1. Merge the prepared workspace and release workflow into `main` after CI passes.
2. Confirm that the npm account owning `NPM_TOKEN` can create packages in the `@motionstudies` scope. This requires access to that npm scope; the similarly named GitHub repository does not grant it.
3. In GitHub Actions, select **Release npm packages** (`release.yml`), branch `main`, version `0.1.0-alpha.0`, mode **dry-run**. Inspect the `npm-release` artifact and workflow results.
4. Run the same workflow with mode **bootstrap** to publish with the existing `NPM_TOKEN` repository secret. This is the explicit publication action. Merely pushing or merging changes never publishes npm packages.

Validation has no npm write credentials. It builds and packs each package, typechecks a clean consumer, exercises the packed lab and loader lifecycle, and runs `npm publish --dry-run`. The publish job downloads those same tested tarballs, checks their hashes and source commit, then publishes core before its dependants with public access and provenance. It uses the `npm` GitHub environment.

If a release stops after one package, rerun the same committed version. The publisher checks all registry versions first and skips only byte-identical existing artifacts. A conflicting existing version is an error: fix the source and bump all four packages rather than overwriting a release. The four registry writes are sequential, not atomic.

## Switch to trusted publishing

After all four package names exist, configure a GitHub Actions trusted publisher in each package's npm settings:

| Field | Value |
| --- | --- |
| Organization or user | `emmettl` |
| Repository | `motionstudies` |
| Workflow filename | `release.yml` |
| Environment | `npm` |
| Allowed action | Direct `npm publish` |

The package names are `@motionstudies/core`, `@motionstudies/data`, `@motionstudies/three` and `@motionstudies/web`. The workflow uses GitHub-hosted Ubuntu, Node 24, npm 11.5.1 and `id-token: write` in the publish job. Trusted mode passes no npm token, so success proves OIDC rather than a token fallback. Run trusted mode for the next new version; a rerun that skips already-published packages does not test authentication.

After a successful OIDC publication, revoke the bootstrap token in npm and delete the GitHub `NPM_TOKEN` secret. npm's “Require two-factor authentication and disallow tokens” setting is compatible with trusted publishers.

## Prepare subsequent versions

`0.1.0-alpha.14` adds opt-in panel layout, control styling and compact airport cards. See [the shared styling contract](PANEL-LAYOUT.md) and [release and adoption record](PANEL-LAYOUT-ALPHA-14.md).

`0.1.0-alpha.13` published the [All Change foundations](ALLCHANGE-FOUNDATIONS.md): typed railway data tools, repeated timetable patterns and verified progressive loading, independent station-call sources, public renderer interfaces and observation-window compilation. Publication and edition adoption are recorded in [the alpha.13 release record](FOUNDATIONS-ALPHA-13.md).

`0.1.0-alpha.8` adds responsive bus and rail hero cards, dot-matrix and SBB layouts, and snapshot-based station departures. See [the release and adoption record](TRANSPORT-CARDS-ALPHA-8.md).

`0.1.0-alpha.7` adds optional live airport boards, the shared offline ADS-B compiler and airport-card refinements. It also updates compatible build and test dependencies. See [the release and adoption record](AIRPORTS-ALPHA-7.md).

`0.1.0-alpha.6` adds the shared Now clock, opt-in browser location and geographic location marker, with a synthetic Now specimen in the public widget lab. Eligibility belongs to each study: suitable representative data can convey the present without exact live positions. This release does not upgrade or enable Now in any edition.

Update all four `packages/*/package.json` versions and their internal dependency pins, plus the root and lab workspace dependency pins. Run `npm install --package-lock-only --ignore-scripts` to update the lockfile, commit, and let CI validate the release build. `npm run check:release` and `npm run release:dry-run` rehearse it locally without publishing. Dispatch `release.yml` on main with the committed version and mode **trusted**.

`0.1.0-alpha.2` adds shared desktop button help and was published through OIDC. All Change, Correspondances, Gleislicht and the private Local / Express proof consume its exact registry versions. Edition changes update their own manifests and lockfiles and run their own regression gates. No vendored candidates or shared workspaces remain in the edition repositories.

References: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) and [npm provenance](https://docs.npmjs.com/generating-provenance-statements/).

`0.1.0-alpha.4` establishes selected-station and route-terminal label priority as shared renderer behaviour. Trusted publication and adoption in all six network-scene editions completed on 7 September 2026; see the [release record](RENDERER-ALPHA-4.md).

`0.1.0-alpha.9` upstreams shared renderer performance, indexed train positions and movement counters, and adds optional JSON asset loading, scalar transitions and the network chunk CLI. It follows the alpha.8 transport board release. Edition adoption must remove overlapping renderer transforms before upgrading; see [refactoring and adoption](REFACTORING-ALPHA-9.md).

`0.1.0-alpha.10` adds typed scene children, train and road resolvers, trail backend and camera lifecycles, Canvas scheduling, and hub flow policy. See [renderer extensions and edition migration](RENDERER-EXTENSIONS-ALPHA-10.md).

`0.1.0-alpha.12` adds vehicle hero cards and snapshot calling points alongside the shared ground-transport modules. See [release and edition adoption](VEHICLE-CARDS-ALPHA-12.md).
