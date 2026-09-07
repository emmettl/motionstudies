# Motion Studies

**[Open Motion Studies catalogue](https://emmettl.github.io/motionstudies/)** · [Widget lab](https://emmettl.github.io/motionstudies/lab/)

The catalogue for authored studies of cities and movement, and the home of the shared transport packages and widget lab.

## Studies and plans

| Study | Live page | Repository |
| --- | --- | --- |
| Gleislicht · Switzerland | [Open study](https://emmettl.github.io/gleislicht/) | [gleislicht](https://github.com/emmettl/gleislicht) |
| All Change · London | [Open study](https://emmettl.github.io/allchange/) | [allchange](https://github.com/emmettl/allchange) |
| Correspondances · Paris | [Open study](https://emmettl.github.io/correspondances/) | [correspondances](https://github.com/emmettl/correspondances) |
| Local / Express · New York | Private proof; publication held | Private repository |

[Project goals](docs/VISION.md) · [Overall roadmap](ROADMAP.md) · [City briefs and source audits](docs/README.md) · [Catalogue programme](docs/CATALOGUE.md)

## Development

Use Node 22.12 or newer. Run `npm ci`, then `npm run lab` for the widget lab. The root catalogue remains a static page; `npx vite` previews it.

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run check:architecture` verify the workspace.
- `npm run check:packed` builds four compiled candidates, installs them in a clean temporary consumer and tests its lab in Chromium and WebKit. Install test engines first with `npx playwright install chromium webkit`.
- `npm run test:loaders` covers delayed requests, errors, recovery and teardown.
- `npm run build` assembles only catalogue assets and the production lab at `/lab/` into `dist/`.

See [package contracts](packages/README.md) and [extraction provenance](docs/EXTRACTION.md).

## Repository ownership

`packages/` owns `@motionstudies/core`, `three`, `web` and Node-only `data`. `lab/` is a synthetic consumer. Each edition owns its application, data, ingestion policy, styles, workers and publication decisions. [All Change](https://github.com/emmettl/allchange), [Correspondances](https://github.com/emmettl/correspondances) and [Gleislicht](https://github.com/emmettl/gleislicht) consume exact published versions in independent repositories. Local / Express has a private repository while its publication hold remains unresolved.

The package and lab directories retain their Git history from Gleislicht. Source workspaces remain private. The current coordinated prerelease is `0.1.0-alpha.2` under `next`, published with verified trusted publishing. Only explicit release builds produce publishable compiled tarballs; the manual `release.yml` workflow uses OIDC. See [release instructions](docs/RELEASING.md). Pushing or merging alone never publishes npm packages.

## Hosting

Checks run for pushes and pull requests. Only `main` deploys the catalogue plus lab to Pages. The catalogue links to the three independent public edition sites. Local / Express remains unpublished.

## Local validation

140 unit tests and 32 browser checks (8 packed lab, 24 loader regressions). Independent package/consumer typechecks, lint, architecture and catalogue/lab build pass. These are local Chromium/WebKit results; GitHub-hosted CI is a separate check.
