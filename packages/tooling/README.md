# @motionstudies/tooling

Shared development defaults for Motion Studies, Working Models and their independent editions. Node 24+, ESM. This package is versioned independently of the four runtime packages. Source workspaces remain private; only an explicit build creates a public release candidate.

- `@motionstudies/tooling/stack`: frozen stack manifest and `checkStack(packageJson)`. Checks dependencies that are present, rather than requiring every package. Runtime version enforcement belongs in CI, not in browser code.
- `@motionstudies/tooling/check-project`: `checkProject({ root, sources, packages, manifests, allowWorkspaces, stack })`. Editions leave workspaces disabled. Package hosts opt in. `packages` is an explicit list of installed registry packages to verify. `manifests` includes workspace declarations. Source directories must exist and stay inside the repository. The checker verifies exact dependency pins, lockfile/installed identity, public imports, source links and undeclared dependencies. Node-only; it reuses the published module-reference parser from `@motionstudies/data`.
- `@motionstudies/tooling/tsconfig/base.json` and `tsconfig/react.json`: extend from local tsconfigs; consumers own `include`, `exclude` and output paths.
- `@motionstudies/tooling/oxlint.json`: use `oxlint --config node_modules/@motionstudies/tooling/oxlint.json` with consumer-owned file selection.
- `@motionstudies/tooling/oxfmt.json`: shared formatting defaults for Oxfmt 0.78.0: 100 columns, two spaces, single quotes, no semicolons and trailing commas. Package key sorting is disabled. Keep generated-file exclusions in each consumer; the preset contains style only. Run `oxfmt --config node_modules/@motionstudies/tooling/oxfmt.json --check <source paths>`, or merge the JSON preset into a consumer-owned Oxfmt TypeScript config with local `ignorePatterns`.

No Vite factory, renderer settings, source aliases or hosting policy are imposed.

## Candidate verification

From the repository root:

```sh
npm run test --workspace @motionstudies/tooling
npm run format:check --workspace @motionstudies/tooling
npm run check:packed --workspace @motionstudies/tooling
```

The packed check builds a public candidate, installs its tarball in a temporary consumer, exercises exports, config resolution and the configurable checker, and formats/typechecks/lints a sample with the installed presets. It verifies Working Models' bootstrap pins/configs, including formatting style, against the candidate when `--consumer /absolute/path/to/workingmodels` is supplied. It never changes that consumer or its dependency lockfile.

## Release and adoption

This initial candidate is **not published**. The existing four-package release workflow deliberately excludes tooling. The dedicated manual `tooling-release.yml` workflow tests and retains the exact tarball before publication. It has four explicit modes:

- `dry-run` (default): verify and retain the candidate, without npm credentials or publication.
- `stage`: submit the verified tarball using `NPM_TOKEN`, download the stored stage and verify its bytes. A maintainer then approves it on npm with 2FA. For a new package, npm creates a public `0.0.0-stage` placeholder; the candidate remains unavailable to install until approval.
- `bootstrap`: first publication using the `NPM_TOKEN` secret in the repository's `npm` GitHub environment. It fails before publishing if the secret is missing.
- `trusted`: subsequent publication through npm OIDC, with an empty `NODE_AUTH_TOKEN` so the bootstrap secret is not used.

All staging/publishing modes require `main` and submit the same verified artifact. To introduce this new package:

1. Manually create an npm granular token with write permission for the `@motionstudies` scope. Add it as **`NPM_TOKEN`** in Motion Studies' repository secrets or the `npm` environment secrets. Enter the token directly in GitHub; do not put it in chat, source files or workflow inputs.
2. Run **Release shared tooling** (`tooling-release.yml`) on `main` with **`mode: stage`**, then approve the reported stage in npm's Staged Packages tab with 2FA. Alternatively, `mode: bootstrap` directly publishes with a token explicitly permitted to bypass publishing 2FA; an `EOTP` failure means npm still requires interactive authentication. The bootstrap workflow verifies live registry bytes; the stage workflow verifies stored stage bytes, and live bytes must be verified after approval.
3. Once `@motionstudies/tooling` exists on npm, configure its trusted publisher: GitHub owner **`emmettl`**, repository **`motionstudies`**, workflow **`tooling-release.yml`**, environment **`npm`**.
4. Use **`mode: trusted`** for later versions. If the token was created solely for this bootstrap, revoke it after trusted publication is verified.

See npm's [access token guidance](https://docs.npmjs.com/about-access-tokens/), [staged publishing](https://docs.npmjs.com/staged-publishing/) and [trusted publishing configuration](https://docs.npmjs.com/trusted-publishers/).

After registry publication, Working Models can add the exact `@motionstudies/tooling` dev dependency, extend these configs and invoke `checkProject` from a small repository-owned script. Its current minimal bootstrap configs allow clean registry-only installation before that release. No application imports sibling source or unpublished tarballs.
