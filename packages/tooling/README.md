# @motionstudies/tooling

Shared development defaults for Motion Studies, Working Models and their independent editions. Node 26+, ESM. This package is versioned independently of the four runtime packages. Source workspaces remain private; only an explicit build creates a public release candidate.

- `@motionstudies/tooling/stack`: frozen stack manifest and `checkStack(packageJson)`. Checks dependencies that are present, rather than requiring every package. Runtime version enforcement belongs in CI, not in browser code.
- `@motionstudies/tooling/check-project`: `checkProject({ root, sources, packages, manifests, allowWorkspaces, stack })`. Editions leave workspaces disabled. Package hosts opt in. `packages` is an explicit list of installed registry packages to verify. `manifests` includes workspace declarations. Source directories must exist and stay inside the repository. The checker verifies exact dependency pins, lockfile/installed identity, public imports, source links and undeclared dependencies. Node-only; it reuses the published module-reference parser from `@motionstudies/data`.
- `@motionstudies/tooling/tsconfig/base.json` and `tsconfig/react.json`: extend from local tsconfigs; consumers own `include`, `exclude` and output paths.
- `@motionstudies/tooling/oxlint.json`: use `oxlint --config node_modules/@motionstudies/tooling/oxlint.json` with consumer-owned file selection.
- `@motionstudies/tooling/oxfmt.json`: shared formatting defaults for Oxfmt 0.78.0: 100 columns, two spaces, single quotes, no semicolons and trailing commas. Package key sorting is disabled. Keep generated-file exclusions in each consumer; the preset contains style only. Run `oxfmt --config node_modules/@motionstudies/tooling/oxfmt.json --check <source paths>`, or merge the JSON preset into a consumer-owned Oxfmt TypeScript config with local `ignorePatterns`.

No Vite factory, renderer settings or source aliases are imposed. Static hosting is opt-in; each consumer owns its repository, domain, artifact/workflow names, asset directories, indexing policy and site-specific validation.

## Static-site hosting (1.1.0)

`@motionstudies/tooling/static-site` is a Node-only public export, promoted after Working Models and Leica demonstrated the same static-artifact deployment contract. It does not deploy or manage credentials itself.

- `sourceCommit()` reads the native Cloudflare commit, GitHub commit or local Git HEAD and requires a full SHA.
- `writeStaticAssetHeaders({ root, assetDirectories })` appends exact one-year immutable rules for emitted eight-character Vite fingerprints. It rejects unversioned files, symlinks, escaping paths and Cloudflare’s 100-rule overflow. The consumer supplies the base `_headers`; default asset directory is `assets`.
- `stampStaticRelease({ root, repository, commit, runId })` writes `_release.json` with a Zod-validated schema, all regular-file sizes/digests and source identity. `verifyStaticRelease` rejects different repositories, commits, optional run IDs, tampering, omitted/extra files and symlinks. Local manifests have no CI run identity and cannot stand in for checked CI artifacts.
- `prepareCheckedArtifact({ root, repository, commit, artifactName, branch, workflow, token })` waits for the exact successful own-repository push/manual run, verifies GitHub’s ZIP digest and the complete release inventory, then replaces an owned output directory. It rejects expired/ambiguous artifacts, path escapes, archive downloads above 50 MiB and declared expansion above 100 MiB. It polls at most 90 times at five-second intervals; individual API calls time out after 30 seconds. Defaults are branch `main`, workflow `.github/workflows/check.yml`, output `dist` and build-only `GITHUB_ARTIFACT_TOKEN`. That dedicated GitHub token needs Actions Read-only for the one consumer repository.
- `requireCurrentSource` rejects an older source after a newer branch check exists. Call it again immediately before the consumer invokes Wrangler.
- `verifyStaticDeployment({ root, repository, commit, runId, siteUrl, indexable, assetDirectories })` compares HTTPS release identity and every public file with the checked artifact. It verifies exact immutable caching, HTML revalidation, no-store release metadata, the explicit indexing policy and real 404s without positive cache lifetimes. `indexable` is required: `false` requires a noindex response header. Propagation retries are bounded to 18 attempts, ten seconds apart; requests time out after 15 seconds.

The release format remains compatible with Working Models’ original schema 1. Headers and release metadata are created in CI and consumed unchanged by native Cloudflare Builds. Each application retains its own content/size/rights checks; module import has no publication or deployment side effect. No runtime bindings, Cloudflare token management, DNS changes or npm publication are provided by this export.

## Candidate verification

From the repository root:

```sh
npm run test --workspace @motionstudies/tooling
npm run format:check --workspace @motionstudies/tooling
npm run check:packed --workspace @motionstudies/tooling
```

The packed check builds a public candidate, installs its tarball in a temporary consumer, exercises exports, config resolution and the configurable checker, and formats/typechecks/lints a sample with the installed presets. It verifies Working Models' bootstrap pins/configs, including formatting style, against the candidate when `--consumer /absolute/path/to/workingmodels` is supplied. It never changes that consumer or its dependency lockfile. Before the runtime version is published, add `--runtime-tarballs /absolute/path/to/.package-dist/tarballs` to test against the packed core/data candidates; normal release verification uses registry dependencies.

## Release and adoption

Version `1.1.0` adds the opt-in static-site contract, targets Node 26 and npm 12.2.2, pins the runtime packages at 1.0.1 and refreshes the development stack. Stable versions publish under `latest`; prereleases use `next`. Public exports and documented configuration follow semantic versioning.

```sh
npm install --save-dev --save-exact @motionstudies/tooling@1.1.0
```

Tooling is versioned independently of the four runtime packages. From the repository root, dispatch `tooling-release.yml` on `main` with `mode: trusted` after the runtime release is available. The workflow tests an isolated packed consumer, retains the tested tarball, publishes with provenance and verifies registry bytes. Stable releases use `latest` automatically. `dry-run` verifies without publishing; `verify-registry` and `promote-latest` inspect or promote an existing byte-identical release. Historical bootstrap and staging modes remain available for package setup.

Adoption is explicit: update the consumer's exact dependency and lockfile, extend the exported presets and run its checks. Keep dataset, renderer, hosting and generated-file policies in the consumer. Source workspaces remain private; only release builds produce publishable distributions.
