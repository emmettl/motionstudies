# Publishing the shared packages

The four shared packages are MIT-licensed. The first coordinated release is `0.1.0-alpha.0`, published under the npm `next` tag. Stable versions use `latest`. All four packages share a version; internal dependencies pin that exact version. Source workspaces stay private. Only an explicit release build produces publishable compiled distributions.

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

Update all four `packages/*/package.json` versions and their internal dependency pins, plus the root and lab workspace dependency pins. Run `npm install --package-lock-only --ignore-scripts` to update the lockfile, commit, and let CI validate the release build. `npm run check:release` and `npm run release:dry-run` rehearse it locally without publishing. Dispatch `release.yml` on main with the committed version and mode **trusted**.

All Change can replace its four `file:vendor/...` dependencies with the exact published version once the initial release is verified. Its existing vendor candidates remain unchanged until that separate consumer update is made.

References: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) and [npm provenance](https://docs.npmjs.com/generating-provenance-statements/).
