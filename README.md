# Motion Studies

The catalogue for authored studies of cities and movement, and the home of the shared transport packages and widget lab.

## Development

Use Node 22.12 or newer. Run `npm ci`, then `npm run lab` for the widget lab. The root catalogue remains a static page; `npx vite` previews it.

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run check:architecture` verify the workspace.
- `npm run check:packed` builds four compiled candidates, installs them in a clean temporary consumer and tests its lab in Chromium and WebKit. Install test engines first with `npx playwright install chromium webkit`.
- `npm run test:loaders` covers delayed requests, errors, recovery and teardown.
- `npm run build` assembles only catalogue assets and the production lab at `/lab/` into `dist/`.

See [package contracts](packages/README.md) and [extraction provenance](docs/EXTRACTION.md).

## Repository ownership

`packages/` owns `@motionstudies/core`, `three`, `web` and Node-only `data`. `lab/` is a synthetic consumer. Each edition owns its application, data, ingestion policy, styles, workers and publication decisions. All Change is being rehearsed in [emmettl/allchange](https://github.com/emmettl/allchange).

The package and lab directories retain their Git history from Gleislicht. Source workspaces remain private. The first coordinated npm release is `0.1.0-alpha.0` under `next`; only explicit release builds produce publishable compiled tarballs. The manual `release.yml` workflow supports a token bootstrap and subsequent OIDC releases. See [release instructions](docs/RELEASING.md). Pushing or merging alone never publishes npm packages.

## Hosting

Checks run for pushes and pull requests. Only `main` deploys the catalogue plus lab to Pages. The preparation branch leaves the current public catalogue deployment intact. Existing edition links stay in place until their independent sites have passed publication checks.

## Local validation

140 unit tests and 32 browser checks (8 packed lab, 24 loader regressions). Independent package/consumer typechecks, lint, architecture and catalogue/lab build pass. These are local Chromium/WebKit results; GitHub-hosted CI is a separate check.
