# @motionstudies/tooling

Shared development defaults for Motion Studies, Working Models and their independent editions. Node 26+, ESM. This package is versioned independently of the four runtime packages. Source workspaces remain private; only an explicit build creates a public release candidate.

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

Version `1.0.0` targets Node 26 and npm 12.2.2, pins the runtime packages at 1.0.0 and refreshes the development stack. Stable versions publish under `latest`; prereleases use `next`. Public exports and documented configuration follow semantic versioning.

```sh
npm install --save-dev --save-exact @motionstudies/tooling@1.0.0
```

Tooling is versioned independently of the four runtime packages. From the repository root, dispatch `tooling-release.yml` on `main` with `mode: trusted` after the runtime release is available. The workflow tests an isolated packed consumer, retains the tested tarball, publishes with provenance and verifies registry bytes. Stable releases use `latest` automatically. `dry-run` verifies without publishing; `verify-registry` and `promote-latest` inspect or promote an existing byte-identical release. Historical bootstrap and staging modes remain available for package setup.

Adoption is explicit: update the consumer's exact dependency and lockfile, extend the exported presets and run its checks. Keep dataset, renderer, hosting and generated-file policies in the consumer. Source workspaces remain private; only release builds produce publishable distributions.
