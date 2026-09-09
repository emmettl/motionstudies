# Domain routing

The catalogue and widget lab are built by this repository’s Pages workflow. GitHub Pages retains `motionstudies.app` as the custom domain and enforces HTTPS. Cloudflare DNS proxies the apex records; SSL/TLS uses Full (Strict) against GitHub’s valid origin certificate.

The `motionstudies-editions` Worker forwards five public edition prefixes to the corresponding `https://emmettl.github.io/<edition>/` deployment:

| Path | Edition |
| --- | --- |
| `/allchange/` | London |
| `/correspondances/` | Paris |
| `/umlauf/` | Berlin |
| `/norikae/` | Tokyo |
| `/manifest/` | World trade |

Gleislicht at `/gleislicht/` is served directly by the `gleislicht-hosting` Worker described below. Each edition’s own workflow continues to publish its code and datasets. No copying or combined rebuild is required. Paths, queries, conditional requests and byte ranges are preserved; slashless edition paths redirect to their directory URL. Only GET and HEAD are forwarded. Cookies and authorization headers are not sent to GitHub. Other paths continue to the catalogue origin. New York is deliberately excluded while its publication hold remains unresolved.

The root and `/lab/` bypass the Worker. The DNS-only `www` record continues to GitHub Pages, which redirects it to the apex domain and preserves the path.

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

The original [successful pilot CI publication](https://github.com/emmettl/gleislicht/actions/runs/34343835256) established the deployment credential and publishing gates on 2026-09-09. The old pilot workflow is disabled and replaced by the production workflow.

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

To stop proxying an edition, remove its Cloudflare route (and its catalogue link) while retaining the independent edition site. To roll back all routing, remove the five proxy Worker routes and restore the catalogue links to their GitHub Pages URLs. DNS can remain proxied with Full (Strict); the catalogue origin is still GitHub Pages.
