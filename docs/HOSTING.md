# Domain routing

The catalogue and widget lab are built by this repository’s Pages workflow. GitHub Pages retains `motionstudies.app` as the custom domain and enforces HTTPS. Cloudflare DNS proxies the apex records; SSL/TLS uses Full (Strict) against GitHub’s valid origin certificate.

All six public editions are hosted directly by individual Cloudflare Workers Static Assets deployments. GitHub Pages remains available at each repository's original URL.

| Path | Edition | Cloudflare Worker |
| --- | --- | --- |
| `/gleislicht/` | Switzerland | `gleislicht-hosting` |
| `/allchange/` | London | `allchange-hosting` |
| `/correspondances/` | Paris | `correspondances-hosting` |
| `/umlauf/` | Berlin | `umlauf-hosting` |
| `/norikae/` | Tokyo | `norikae-hosting` |
| `/manifest/` | World trade | `manifest-hosting` |

Each edition owns its `motionstudies.app/<edition>*` route. Prefix routes include slashless URLs with query strings; unmatched files return 404. The retired `motionstudies-editions` proxy has no routes. New York remains excluded while its publication hold is unresolved. MANIFEST's existing public route is retained without adding catalogue links; its published vessel data remains synthetic.

The root and `/lab/` continue to the catalogue's GitHub Pages origin. The DNS-only `www` record redirects through GitHub Pages to the apex domain and preserves the path.

## Gleislicht Cloudflare hosting

[Open Gleislicht](https://motionstudies.app/gleislicht/). The `gleislicht-hosting` Worker hosts a complete copy of a successful Gleislicht GitHub Pages artifact using Workers Static Assets. Files are served directly from Cloudflare storage, without a GitHub origin fetch, application Worker handler, R2 bucket or extra live-data service.

`wrangler.gleislicht.jsonc` owns `motionstudies.app/gleislicht*`, covering the production directory, slashless links with query strings, and old pilot links. `/gleislicht-pilot` and its subpaths permanently redirect to the equivalent production paths. Other unmatched suffixes return 404. The edition proxy no longer owns a Gleislicht route. Catalogue links already use `/gleislicht/` and require no URL change. [GitHub Pages](https://emmettl.github.io/gleislicht/) remains an independently available parallel copy. The private Sites preview is a separate deployment.

The existing realtime CORS permissions and automatic Web Analytics injection apply to the production URL. Responses carry `X-Motion-Studies-Hosting: cloudflare-static`; the pilot's `noindex` directive is removed. Missing files return 404 instead of application HTML. Directory URLs receive a trailing slash, preserving relative asset and data URLs.

Content-hashed files under `/gleislicht/assets/` use `Cache-Control: public, max-age=31536000, immutable` for a one-year browser TTL. The publisher rejects files in that directory without Vite's eight-character filename hash. HTML, data manifests, stable-name datasets and root images retain Cloudflare's default `public, max-age=0, must-revalidate`; `_release.json` uses `no-cache`. Cloudflare manages its static asset cache separately from these browser directives.

The promotion uses the same verified [Pages run 34328735854](https://github.com/emmettl/gleislicht/actions/runs/34328735854) as the pilot, commit `eafb3d257b9e04e9ae3fe2676cf359d51c41bfe8`: 882 source files, 757,479,618 bytes (722.4 MiB). Source files are copied byte for byte. [Release metadata](https://motionstudies.app/gleislicht/_release.json) records the source run, commit, file count and a digest of sorted paths and their SHA-256 content hashes. Hosting adds only release metadata, response headers and redirects.

### Automatic publishing

Gleislicht's `cloudflare.yml` follows completed, successful main-branch `Deploy to GitHub Pages` runs, including scheduled timetable refreshes. It downloads that run's `github-pages` artifact and publishes it separately; a Cloudflare failure cannot fail or undo the completed GitHub Pages release. Failed Pages runs and pull requests do not publish. A manual workflow dispatch accepts a successful source run ID for retries.

The workflow checks out these hosting tools at a reviewed commit, uses the edition repository's read-only `GITHUB_TOKEN` for artifact access, and reads `CLOUDFLARE_API_TOKEN` from the existing `cloudflare-pilot` environment. That internal environment name is retained to preserve its encrypted credential and `main`-only deployment restriction; the deployment, workflow and public URL use production names. The Cloudflare token needs Workers Scripts edit for the account and Workers Routes edit plus Zone read for `motionstudies.app`. Keep its value only in the environment secret; never put a local Wrangler OAuth token in CI. Updating the publisher requires advancing the pinned hosting commit in the edition workflow.

CI serializes Cloudflare deployments without cancelling active uploads. `--require-latest` skips releases superseded by a newer successful Pages run, with a second check immediately before deployment. After publishing, the command verifies live release metadata, the long-lived asset versus revalidating document/data cache policies, and the absence of `noindex`, retrying briefly for edge propagation. A verification failure fails the workflow.

The original [successful pilot CI publication](https://github.com/emmettl/gleislicht/actions/runs/34343835256) established the deployment credential and publishing gates on 2026-09-09. The old pilot workflow is disabled and replaced by the production workflow. The first [successful production CI publication](https://github.com/emmettl/gleislicht/actions/runs/34347417910) verified the promoted release and cache policies. Morning and full-day studies, analytics injection, query-preserving redirects, the parallel GitHub Pages site and the other five edition routes were also checked after promotion.

For local publishing, use a completed, successful main-branch run of Gleislicht's `pages.yml`; the publisher rejects failed, pending, foreign-repository and other-workflow runs. The run must still have its `github-pages` artifact available. It already passed the edition's build, publication and browser gates.

With Python 3, Node/npm, an authenticated `gh` and a Wrangler login available:

```sh
python3 scripts/test-gleislicht.py
python3 scripts/publish-gleislicht.py --run RUN_ID
python3 scripts/publish-gleislicht.py --run RUN_ID --deploy
```

The default is a dry run. `--deploy` also performs the dry run before publishing. The publisher validates archive paths, rejects links and foreign-edition data, enforces Cloudflare's 25 MiB per-file and 20,000-file limits, and stages it under `/gleislicht/`. It never rebuilds datasets or changes an edition checkout. Successful publication removes its temporary download; dry-run and failed-upload staging directories are printed and retained for inspection.

After publishing, check release metadata, page and referenced assets, initial JSON requests and live-data responses. Confirm an automatic analytics beacon is present in a browser HTML response and GitHub Pages remains available. Static asset requests are free and unlimited under [Cloudflare's billing rules](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/); existing live-data Workers keep their own usage.

### Rollback

To roll back a Cloudflare release, disable `cloudflare.yml` and republish an earlier successful Pages artifact locally without `--require-latest`, or select a previous deployment of `gleislicht-hosting` in Cloudflare. Re-enable CI when ready to follow new releases again.

To restore the GitHub Pages proxy at `/gleislicht/`, first disable the production publishing workflow. Restore `gleislicht` to the proxy's edition allowlist and deploy its code before transferring `motionstudies.app/gleislicht*` back to `motionstudies-editions` in Cloudflare. Update both Wrangler configurations to reflect that ownership change before their next deployment. If old pilot redirects are still needed, retain exact `/gleislicht-pilot` and `/gleislicht-pilot/*` routes on `gleislicht-hosting`. The retired `gleislicht-hosting-pilot` Worker is retained without routes as a recovery snapshot and is no longer published by CI.

## Other edition publishing

`hosting/editions.json` explicitly allows All Change, Correspondances, Umlauf, Norikae and MANIFEST. `scripts/publish-edition.py` uses each edition's own successful main-branch `pages.yml` artifact, validates its required entry/data files and approved data paths, and copies source bytes under the edition's URL prefix. The existing Gleislicht publishing gates are preserved separately in its established publisher.

The generic publisher also rejects archive traversal, links, special files, duplicate or reserved hosting files, unhashed `/assets/` filenames, oversized files and excessive file counts. MANIFEST's public manifest must remain labelled `synthetic` and `synthetic-only`; adding observed data requires a separate reviewed publication change. This deployment does not change any study's data or source labels.

Each `wrangler.<edition>.jsonc` config names a separate `<edition>-hosting` Worker. `_release.json` records source repository, run, commit, file count, bytes and a content digest. Responses use `X-Motion-Studies-Hosting: cloudflare-static`. Hashed `/assets/*` files receive a one-year immutable browser TTL; documents, stable datasets and manifests revalidate, and release metadata uses `no-cache`. Data outside `/assets/`, including MANIFEST's demo chunks, retains revalidation.

Each edition's `cloudflare.yml` follows its exact Pages workflow name (`Deploy Pages`, or `Deploy to GitHub Pages` for Norikae), and checks out this repository's publisher at a reviewed commit. It accepts only successful `main` releases from the same repository, serializes deployments and checks again for superseding releases immediately before publishing. After deployment it verifies live release identity, cache headers and absence of `noindex`. GitHub Pages publication succeeds independently of Cloudflare.

### Verified rollout

All five direct deployments were verified on 2026-09-09: live release identity, browser cache policies, main pages, analytics injection, playback/data loading and parallel GitHub Pages availability. The proxy now has zero routes.

| Edition | Successful source Pages run | Files | MiB |
| --- | --- | ---: | ---: |
| allchange | [34340913917](https://github.com/emmettl/allchange/actions/runs/34340913917) | 1,777 | 67.5 |
| correspondances | [34340909755](https://github.com/emmettl/correspondances/actions/runs/34340909755) | 218 | 31.8 |
| umlauf | [34340912865](https://github.com/emmettl/umlauf/actions/runs/34340912865) | 11 | 3.0 |
| norikae | [34340915029](https://github.com/emmettl/norikae/actions/runs/34340915029) | 6 | 1.2 |
| manifest | [34340918207](https://github.com/emmettl/manifest/actions/runs/34340918207) | 41 | 129.6 |

### CI activation

The five `cloudflare` environments allow deployments only from the `main` branch. Their workflows remain gated by the repository variable `CLOUDFLARE_ENABLED` until `CLOUDFLARE_API_TOKEN` is configured in each environment. The credential needs the same existing Cloudflare account Workers Scripts edit and `motionstudies.app` Workers Routes edit plus Zone read permissions used by Gleislicht. Credential distribution requires approval; do not store plaintext in files, commits, logs or artifacts.

After securely setting the five environment secrets, set each repository variable `CLOUDFLARE_ENABLED=true` and manually dispatch its `cloudflare.yml` with the latest successful Pages `source_run_id` to verify activation. Set the variable to `false` to pause publishing before rollback. The same workflow then follows successful Pages releases automatically. Advance its pinned hosting-tools commit when updating publisher code.

Local publishing uses the existing authenticated `gh` and Wrangler login:

```sh
python3 scripts/test-edition-hosting.py
python3 scripts/publish-edition.py --edition allchange --run RUN_ID
python3 scripts/publish-edition.py --edition allchange --run RUN_ID --require-latest --deploy
```

The default performs a dry run. Successful publication cleans up its temporary payload; failed publication retains staging for recovery. To roll back a release, pause CI and publish an earlier successful Pages artifact without `--require-latest`, or select a previous deployment of that edition's Worker. To restore proxy hosting, deploy the retained router code and transfer only that edition's route back to `motionstudies-editions`, updating the affected Wrangler configurations before the next deployment.

## Visitor analytics

Cloudflare Web Analytics covers both public hostnames. In the account's [Web Analytics dashboard](https://dash.cloudflare.com/8cac82a07417990e553f88793670f361/web-analytics/sites), select `motionstudies.app` or `emmettl.github.io`, or view all sites and filter by Host and Path to compare editions.

`motionstudies.app` uses Cloudflare's existing automatic beacon injection. The catalogue, lab, six public edition HTML entries and Gleislicht methodology page load the GitHub Pages beacon only when `window.location.hostname === 'emmettl.github.io'`. This avoids duplicate beacons on the custom domain and excludes localhost and preview hostnames. Compatibility redirects are not tracked separately. The site token embedded in HTML is a public collection identifier, not an API credential.

The GitHub Pages analytics site is `d1a9e30966554da393c4d92da01d4a6b`; the custom-domain site is `839302657436471c8302b2ebe00a4fd3`. Keep automatic injection enabled on the custom-domain site. New editions should include the same hostname-guarded snippet in their own HTML entry. Changes to shared packages are unnecessary.

Web Analytics reports visits, page views, referrers, countries, devices and page performance. It does not instrument playback, layer selections or other application interactions. Browser blocking can reduce recorded counts, and these counts differ from server request totals. See [Cloudflare's setup instructions](https://developers.cloudflare.com/web-analytics/get-started/) and [metric definitions](https://developers.cloudflare.com/web-analytics/data-metrics/).

## Router changes

The router is in `hosting/edition-router.mjs`, with explicit routes in `wrangler.editions.jsonc`. Run `npx vitest run hosting/edition-router.test.mjs` and `npx wrangler@4.129.0 deploy --config wrangler.editions.jsonc --dry-run` before deploying with the same command without `--dry-run`. Router deployment is separate from the catalogue’s automatic Pages deployment and requires authenticated Cloudflare access.

The existing Swiss and London live-data Workers include `https://motionstudies.app` in `ALLOWED_ORIGINS`. Their edition configuration files preserve that setting for future deployments. Storage, collection settings and secrets are unchanged.

## Verification and rollback

Check every edition document, its referenced JavaScript/CSS, and its initial data requests. Verify the catalogue, lab, www redirect and live-data CORS responses too. Existing GitHub Pages edition URLs remain available.

To stop proxying an edition, remove its Cloudflare route (and its catalogue link) while retaining the independent edition site. To roll back all routing, transfer the affected routes to the retained proxy or remove them and restore catalogue links to their GitHub Pages URLs. DNS can remain proxied with Full (Strict); the catalogue origin is still GitHub Pages.
