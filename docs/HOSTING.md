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

## Router changes

The router is in `hosting/edition-router.mjs`, with explicit routes in `wrangler.editions.jsonc`. Run `npx vitest run hosting/edition-router.test.mjs` and `npx wrangler@4.129.0 deploy --config wrangler.editions.jsonc --dry-run` before deploying with the same command without `--dry-run`. Router deployment is separate from the catalogue’s automatic Pages deployment and requires authenticated Cloudflare access.

The existing Swiss and London live-data Workers include `https://motionstudies.app` in `ALLOWED_ORIGINS`. Their edition configuration files preserve that setting for future deployments. Storage, collection settings and secrets are unchanged.

## Verification and rollback

Check every edition document, its referenced JavaScript/CSS, and its initial data requests. Verify the catalogue, lab, www redirect and live-data CORS responses too. Existing GitHub Pages edition URLs remain available.

To stop proxying an edition, remove its Cloudflare route (and its catalogue link) while retaining the independent edition site. To roll back all routing, remove the six Worker routes and restore the catalogue links to their GitHub Pages URLs. DNS can remain proxied with Full (Strict); the catalogue origin is still GitHub Pages.
