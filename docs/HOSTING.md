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
