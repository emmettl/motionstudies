# Motion Studies

**[Open Motion Studies catalogue](https://motionstudies.app/)** · [Widget lab](https://motionstudies.app/lab/)

The catalogue for authored studies of cities and movement, and the home of the shared transport packages and widget lab.

## Studies and plans

| Study | Live page | Repository |
| --- | --- | --- |
| Gleislicht · Switzerland | [Open study](https://motionstudies.app/gleislicht/) | [gleislicht](https://github.com/emmettl/gleislicht) |
| All Change · London | [Open study](https://motionstudies.app/allchange/) | [allchange](https://github.com/emmettl/allchange) |
| Correspondances · Paris | [Open study](https://motionstudies.app/correspondances/) | [correspondances](https://github.com/emmettl/correspondances) |
| Local / Express · New York | Parked; private proof, publication held | [local-express (private)](https://github.com/emmettl/local-express) |
| NORIKAE · Tokyo | Parked; [synthetic preview](https://motionstudies.app/norikae/) · [Brief](docs/TOKYO.md) | [norikae](https://github.com/emmettl/norikae) |
| MANIFEST · World trade | [Open study](https://motionstudies.app/manifest/) · [Brief](docs/MANIFEST.md) | [manifest](https://github.com/emmettl/manifest) |
| Umlauf · Berlin | [Open study](https://motionstudies.app/umlauf/) · [Brief](docs/BERLIN.md) | [umlauf](https://github.com/emmettl/umlauf) |
| Zugunruhe · European bird migration | [Open study](https://motionstudies.app/zugunruhe/) · [Brief](docs/ZUGUNRUHE.md) | [zugunruhe](https://github.com/emmettl/zugunruhe) |
| Underfall · Bristol | Local research edition; not deployed · [Brief](docs/BRISTOL.md) | Local checkout |

[Project goals](docs/VISION.md) · [Overall roadmap](ROADMAP.md) · [City briefs and source audits](docs/README.md) · [Catalogue programme](docs/CATALOGUE.md)

## Development

Use Node 24 LTS (`nvm use`) and npm 11.19.0. Run `npm ci`, then `npm run lab` for the widget lab. The root catalogue remains a static page; `npx vite` previews it.

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run check:architecture` verify the workspace.
- `npm run check:packed` builds four compiled candidates, installs them in a clean temporary consumer and tests its lab in Chromium and WebKit. Install test engines first with `npx playwright install chromium webkit`.
- `npm run test:loaders` covers delayed requests, errors, recovery and teardown.
- `npm run build` assembles only catalogue assets and the production lab at `/lab/` into `dist/`.

See [package contracts](packages/README.md) and [extraction provenance](docs/EXTRACTION.md).

## Repository ownership

`packages/` owns `@motionstudies/core`, `three`, `web` and Node-only `data`. `lab/` is a synthetic consumer. Each edition owns its application, data, ingestion policy, styles, workers and publication decisions. Nine downstream projects consume exact published versions. [All Change](https://github.com/emmettl/allchange), [Correspondances](https://github.com/emmettl/correspondances), [Gleislicht](https://github.com/emmettl/gleislicht), Umlauf, MANIFEST, Zugunruhe and NORIKAE live in independent public repositories. [Local / Express](https://github.com/emmettl/local-express) has a private repository while its publication hold remains unresolved, and Underfall is a local checkout. See the [alpha.15 rollout](docs/CONSOLIDATION-ALPHA-15.md#verified-rollout).

The package and lab directories retain their Git history from Gleislicht. Source workspaces remain private. The latest verified coordinated prerelease is `0.1.0-alpha.15` under `next`, published through [trusted release run 34777637695](https://github.com/emmettl/motionstudies/actions/runs/34777637695) with registry integrity checked against the tested artifacts. The workspace is prepared at `0.1.0-alpha.16`; its [publication and adoption](docs/MOTION-ALPHA-16.md#publication-and-adoption) are not yet recorded. Editions upgrade their exact pins independently. Only explicit release builds produce publishable compiled tarballs; the manual `release.yml` workflow uses OIDC. See [release instructions](docs/RELEASING.md). Pushing or merging alone never publishes npm packages.

## Hosting

Checks run for pushes and pull requests. Only `main` deploys the catalogue plus lab to GitHub Pages at `https://motionstudies.app/`. Cloudflare manages the domain DNS; the custom domain is configured in the repository’s Pages settings. The Actions deployment does not require a `CNAME` file. Seven public editions are hosted directly by individual Cloudflare Workers Static Assets deployments under `motionstudies.app`, with GitHub Pages copies retained; see [domain routing](docs/HOSTING.md). Local / Express remains unpublished.

## Local validation

At the alpha.15 release: 272 shared unit tests, 90 packed-consumer browser checks with two existing skips and 34 loader browser checks, alongside type, lint and architecture checks. See the [release record](docs/CONSOLIDATION-ALPHA-15.md). These are local Chromium/WebKit results; GitHub-hosted CI is a separate check.
