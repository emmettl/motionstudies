# Domain routing

The catalogue and widget lab are built by this repository’s Pages workflow. GitHub Pages retains `motionstudies.app` as the custom domain and enforces HTTPS. Cloudflare DNS proxies the apex records; SSL/TLS uses Full (Strict) against GitHub’s valid origin certificate.

The `motionstudies-editions` Worker forwards the six already-public edition prefixes to the corresponding `https://emmettl.github.io/<edition>/` deployment:

| Path | Edition |
| --- | --- |
| `/gleislicht/` | Switzerland |
| `/allchange/` | London |
| `/correspondances/` | Paris |
| `/umlauf/` | Berlin |
| `/norikae/` | Tokyo |
| `/manifest/` | World trade |

Each edition’s own workflow continues to publish its code and datasets. No copying or combined rebuild is required. Paths, queries, conditional requests and byte ranges are preserved; slashless edition paths redirect to their directory URL. Only GET and HEAD are forwarded. Cookies and authorization headers are not sent to GitHub. Other paths continue to the catalogue origin. New York is deliberately excluded while its publication hold remains unresolved.

The root and `/lab/` bypass the Worker. The DNS-only `www` record continues to GitHub Pages, which redirects it to the apex domain and preserves the path.

## Gleislicht Cloudflare pilot

[Open the pilot](https://motionstudies.app/gleislicht-pilot/). The `gleislicht-hosting-pilot` Worker hosts a complete copy of a successful Gleislicht GitHub Pages artifact using Workers Static Assets. It serves files directly from Cloudflare storage. There is no GitHub origin fetch, application Worker handler, R2 bucket or extra live-data service in this deployment.

`wrangler.gleislicht-pilot.jsonc` owns only the exact `/gleislicht-pilot` route and `/gleislicht-pilot/*`. These take precedence over the existing edition router's broader `/gleislicht*` pattern. `/gleislicht/` and `https://emmettl.github.io/gleislicht/` retain their existing hosting. The private Sites preview is a separate deployment and is unaffected.

The pilot uses the same origin as the live edition, so the existing realtime CORS permissions and automatic Web Analytics injection apply. Filter analytics by `/gleislicht-pilot/` to distinguish pilot visits. Responses carry `X-Motion-Studies-Hosting: cloudflare-pilot` and `X-Robots-Tag: noindex`. Missing files return 404 instead of the application HTML. Directory URLs receive a trailing slash, preserving relative asset and data URLs.

The initial pilot copies successful [Pages run 34328735854](https://github.com/emmettl/gleislicht/actions/runs/34328735854), commit `eafb3d257b9e04e9ae3fe2676cf359d51c41bfe8`: 882 source files, 757,479,618 bytes (722.4 MiB). The source files are copied byte for byte. [Release metadata](https://motionstudies.app/gleislicht-pilot/_release.json) records the source run, commit, file count and a digest of sorted paths and their SHA-256 content hashes. The pilot adds only release metadata and response headers.

### Update the pilot

The pilot is a manually refreshed snapshot, independent of scheduled GitHub Pages releases. Use a completed, successful main-branch run of Gleislicht's `pages.yml`; the publisher rejects failed, pending, foreign-repository and other-workflow runs. The run must still have its `github-pages` artifact available. It already passed the edition's build, publication and browser gates.

With Python 3, Node/npm, an authenticated `gh` and a Wrangler login available:

```sh
python3 scripts/test-gleislicht-pilot.py
python3 scripts/publish-gleislicht-pilot.py --run RUN_ID
python3 scripts/publish-gleislicht-pilot.py --run RUN_ID --deploy
```

The default is a dry run. `--deploy` also performs the dry run before publishing. The publisher downloads the existing artifact, validates archive paths, rejects links and foreign-edition data, enforces Cloudflare's 25 MiB per-file and 20,000-file limits, and stages it under the pilot URL prefix. It never rebuilds datasets or changes an edition checkout. The publishing command needs no new GitHub Actions secret. Successful publication removes its temporary download; dry-run and failed-upload staging directories are printed and retained for inspection.

After publishing, check the release metadata, page and referenced assets, initial JSON requests and live-data responses. Confirm an automatic analytics beacon is present in a browser HTML response and that the two existing Gleislicht addresses remain available. Static asset requests are free and unlimited under [Cloudflare's billing rules](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/); existing live-data Workers keep their own usage.

### Rollback and promotion

To roll the pilot back, republish an earlier successful Pages artifact while it is retained, or use the pilot Worker's previous deployment in Cloudflare. To retire it, remove its two routes; this does not alter the live edition routes. Moving `/gleislicht/` to Cloudflare is a separate promotion: first arrange ongoing deployment of each verified Pages artifact, then change the live route and retain GitHub Pages as the parallel copy.

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

To stop proxying an edition, remove its Cloudflare route (and its catalogue link) while retaining the independent edition site. To roll back all routing, remove the six Worker routes and restore the catalogue links to their GitHub Pages URLs. DNS can remain proxied with Full (Strict); the catalogue origin is still GitHub Pages.
