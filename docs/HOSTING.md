# Domain routing

The [series cost-control policy](COST-CONTROL.md) sets an approximately $100/month total operating ceiling and distinguishes direct static hosting from metered live-data and R2 paths. Its proposed quotas are not yet a verified account-wide spending guarantee. Hosting changes must preserve that distinction; audit browser data requests as well as the page-serving route.

The catalogue and widget lab are built by this repository’s Pages workflow. GitHub Pages retains `motionstudies.app` as the custom domain and enforces HTTPS. Cloudflare DNS proxies the apex records; SSL/TLS uses Full (Strict) against GitHub’s valid origin certificate.

All seven public editions are hosted directly by individual Cloudflare Workers Static Assets deployments. GitHub Pages remains available at each repository's original URL.

| Path | Edition | Cloudflare Worker |
| --- | --- | --- |
| `/gleislicht/` | Switzerland | `gleislicht-hosting` |
| `/allchange/` | London | `allchange-hosting` |
| `/correspondances/` | Paris | `correspondances-hosting` |
| `/umlauf/` | Berlin | `umlauf-hosting` |
| `/norikae/` | Tokyo | `norikae-hosting` |
| `/manifest/` | World trade | `manifest-hosting` |
| `/zugunruhe/` | Bird migration studies | `zugunruhe-hosting` |
| `/luft/` | Flights over Europe (research) | `luft-hosting` |
| `/grid84/` | Grid/84 Terminal Atlas (adjunct) | `grid84-hosting` |
| `/underfall/` | Bristol (research, unlisted) | `underfall-hosting` |
| `/pfad/` | Swiss pathfinding (first connectivity study) | `pfad-hosting` |
| `/zenit/` and `zenit.motionstudies.app` | Earth orbit (stellar reference) | `zenit-hosting` |

Each edition owns its `motionstudies.app/<edition>*` route. Underfall is unlisted research from a private repository: reachable at its URL, marked `noindex` in its own HTML and absent from the catalogue. Prefix routes include slashless URLs with query strings; unmatched files return 404. The retired `motionstudies-editions` proxy has no routes. New York remains excluded while its publication hold is unresolved. MANIFEST's existing public route is retained without adding catalogue links; its published vessel data remains synthetic.

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

The five `cloudflare` environments allow deployments only from the `main` branch. Each has `CLOUDFLARE_API_TOKEN` configured and its repository variable `CLOUDFLARE_ENABLED=true`. The credential has the same Cloudflare account Workers Scripts edit and `motionstudies.app` Workers Routes edit plus Zone read permissions used by Gleislicht. Keep plaintext only in the environment secret, never in files, commits, logs or artifacts. The approved one-time encrypted transfer workflow and its temporary artifact have been removed.

Each `cloudflare.yml` now follows successful Pages releases automatically. A manual dispatch with the latest successful Pages `source_run_id` can retry a publication. Set `CLOUDFLARE_ENABLED=false` to pause publishing before rollback, and restore `true` to resume. Advance the pinned hosting-tools commit when updating publisher code.

The first production CI deployments passed the publishing tests, deployed their selected Pages artifacts and verified live release identity and cache headers:

| Edition | Verified CI deployment |
| --- | --- |
| allchange | [34397529428](https://github.com/emmettl/allchange/actions/runs/34397529428) |
| correspondances | [34397534632](https://github.com/emmettl/correspondances/actions/runs/34397534632) |
| umlauf | [34397540240](https://github.com/emmettl/umlauf/actions/runs/34397540240) |
| norikae | [34397545350](https://github.com/emmettl/norikae/actions/runs/34397545350) |
| manifest | [34397549859](https://github.com/emmettl/manifest/actions/runs/34397549859) |

Local publishing uses the existing authenticated `gh` and Wrangler login:

```sh
python3 scripts/test-edition-hosting.py
python3 scripts/publish-edition.py --edition allchange --run RUN_ID
python3 scripts/publish-edition.py --edition allchange --run RUN_ID --require-latest --deploy
```

The default performs a dry run. Successful publication cleans up its temporary payload; failed publication retains staging for recovery. To roll back a release, pause CI and publish an earlier successful Pages artifact without `--require-latest`, or select a previous deployment of that edition's Worker. To restore proxy hosting, deploy the retained router code and transfer only that edition's route back to `motionstudies-editions`, updating the affected Wrangler configurations before the next deployment.

## PFAD hosting

PFAD is an unnumbered public edition in development in
[`emmettl/pfad`](https://github.com/emmettl/pfad). Its first national study uses the same
dual hosting model: a verified `pages.yml` artifact is independently copied to
`pfad-hosting` at `motionstudies.app/pfad*`; GitHub Pages remains available at
`https://emmettl.github.io/pfad/`. The homepage catalogue lists it as an
unnumbered research study.

PFAD also serves at `https://pfad.motionstudies.app/` through a Custom Domain on
the same Worker. `hosting/pfad-subdomain.mjs` maps unmatched subdomain requests
to the existing `/pfad/` assets and keeps asset redirects at the subdomain root.
The path route continues to serve matched assets directly. Both addresses use
the same Pages artifact and are verified for release identity and cache headers
after each publication. Subdomain requests that invoke the handler follow Worker
request billing. Run `node --test hosting/pfad-subdomain.test.mjs` with the
publisher gates before deploying.

The data allowlist admits `data/pfad-manifest.json` and dated, content-identified
datasets containing a manifest, hashed node/edge/geometry chunks and optional
source evidence. The selected Swiss graph and drawing geometry total 15.9 MB;
raw OSM extracts and compiler intermediates stay outside the artifact. This
profile enforces distance and one-way connectivity, with turn and conditional
rules still unimplemented. Data refreshes are manual, versioned releases,
independent of application builds and hosting publication.

## Grid/84 hosting

[Grid/84](https://motionstudies.app/grid84/) is an adjunct, not an edition: a world-state playback engine with its execution studies, kept in the [grid84](https://github.com/emmettl/grid84) repository and hosted by the same publisher as `grid84-hosting` on `motionstudies.app/grid84*`. It is not listed in the catalogue.

Its Pages artifact carries the application, the grids index and the HYDE 3.3 study grids under `data/hyde/` (about 66 MiB, every file under 5 MiB). HYDE is CC BY-NC-SA 4.0; the site is non-commercial and every readout that uses a grid names it and its licence. The GHSL tiles are not in the artifact: the site reads them across origins from the `grid84-grids` R2 bucket named in its grids index, whose CORS rule allows GET from any origin. The map's vector tiles come from OpenFreeMap and terrain from the AWS terrain tiles, as in development. The application uses hash routes under a relative base, so it runs unchanged under `/grid84/` and at its GitHub Pages URL.

Publishing follows the generic path: `python3 scripts/publish-edition.py --edition grid84 --run RUN_ID [--deploy]`, and the repository's `cloudflare.yml` follows its successful main-branch `Deploy Pages` runs once its `cloudflare` environment holds `CLOUDFLARE_API_TOKEN` and the repository variable `CLOUDFLARE_ENABLED` is `true`.

## ZENIT hosting

ZENIT's independent public repository is [`emmettl/zenit`](https://github.com/emmettl/zenit).
The canonical address is `https://zenit.motionstudies.app/`; the same verified artifact
also serves at `https://motionstudies.app/zenit/`, with the independent GitHub Pages
copy at `https://emmettl.github.io/zenit/`. The HTML canonical link names the subdomain.

The publisher stages the checked main Pages artifact under `/zenit/`.
`wrangler.zenit.jsonc` owns both routes, and `hosting/zenit-subdomain.mjs` maps
subdomain requests into that asset namespace while preserving query strings,
request headers and missing-file responses. Both custom-domain addresses must
pass live release and cache verification. Builds do not request provider data.

The stellar data allowlist admits `data/zenit-manifest.json`, `data/stellar/NOTICE.txt`
and immutable `data/stellar/hyg-v44-bright-<12 hex>.json` releases, plus
`data/orbital/NOTICE.txt` and immutable `data/orbital/iss-<12 hex>.json` and `data/orbital/cohorts-<12 hex>.json` snapshots. The compiled
release and raw source hashes are verified, with HYG attribution and CC BY-SA 4.0
notices retained in the artifact. Raw CSV and gzip captures remain excluded.
Additional orbital cohort formats need a separate allowlist and source attribution review.
The edition remains unnumbered while the orbital composition is developed.

The edition follows successful `Deploy Pages` runs with an independent
Cloudflare workflow using pinned hosting tools. Its `cloudflare` environment
permits `main` only. Automatic deployment requires its encrypted
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ENABLED=true`.

**Activated and verified — 7 October 2026.** [Pages run 37689557637](https://github.com/emmettl/zenit/actions/runs/37689557637)
passed three camera tests and six Chromium/WebKit browser checks on macOS 15,
then published edition commit `ac6946ae778724ab1d9fca615d45ff040dc09846`.
[Cloudflare run 37689783913](https://github.com/emmettl/zenit/actions/runs/37689783913)
published that same artifact and verified both addresses. The
[delivery evidence](evidence/zenit-scaffold-2026-10-07.json) additionally confirms
matching application bytes across the subdomain, path and GitHub Pages,
canonical links, zero data records, font notices and missing-file 404s.
The complete CI artifact measures 475,894 gzip bytes; this is an artifact
measurement, not physical-phone performance. Ubuntu's browser dependency
downloads were unreliable during setup, so the edition's complete browser
gate uses native macOS runtimes; Pages and Cloudflare deployment remain on Linux.

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

## Zugunruhe hosting

Zugunruhe follows the same verified Pages artifact publisher at
`https://motionstudies.app/zugunruhe/`, with an independent
`https://emmettl.github.io/zugunruhe/` copy. The artifact contains the three
current study entries and frozen Layers/Archipelago builds. Observations and
geography are bundled in hashed client assets; no raw source archives or live
data service are required. Reproduction source snapshots are included alongside
the frozen studies. The hosting adapter fixes internal links under the edition
prefix while the saved renderer assets and local snapshots remain unchanged.

`wrangler.zugunruhe.jsonc` owns only `motionstudies.app/zugunruhe*`. The
`cloudflare` environment is restricted to main and follows successful Pages
runs, using the same deployment credential provisioning as the other editions.

## LUFT hosting

[LUFT](https://motionstudies.app/luft/) is a research study with a parallel
[GitHub Pages copy](https://emmettl.github.io/luft/). `luft-hosting` owns
`motionstudies.app/luft*` and serves the complete successful `Check and deploy LUFT`
Pages artifact directly through Workers Static Assets. The recorded flight chunks,
airport references and endpoint enrichment remain byte-identical to that artifact.
All playback data is bundled; this route introduces no live-data service or R2 reads.

The LUFT `cloudflare` environment permits only main. Its workflow follows successful
main-branch `Check and deploy LUFT` and `Refresh daily aircraft feed` releases, pins these hosting tools, rejects superseded runs, and
verifies live provenance and cache policies. The `CLOUDFLARE_ENABLED` repository
variable pauses publication when set to `false`; manual dispatch accepts a successful
Pages run ID for retries. The credential is stored only as an encrypted environment
secret. The existing default dry run and rollback commands apply with `--edition luft`.

## Underfall hosting

[Underfall](https://motionstudies.app/underfall/) is the Bristol research edition, hosted by
`underfall-hosting` on `motionstudies.app/underfall*` through the generic publisher. The
[underfall](https://github.com/emmettl/underfall) repository is private and has no GitHub
Pages site, so there is no parallel public copy: its `Check` workflow builds the site and, on
`main` pushes, uploads the `github-pages` artifact that `cloudflare.yml` then publishes, exactly
as the Pages editions do. `hosting/editions.json` names `check.yml` as the release-producing
workflow, requires the recording library index, the West of England route-events index and the
first published bus-day release, and approves only the dated study directories under `data/`
(`avon-*`, `bristol-*`, `west-of-england-*` and `library`). Working files, keys and Parquet
never enter the artifact.

The edition is unlisted: its HTML carries `<meta name="robots" content="noindex">`, which the
publisher's `X-Robots-Tag` check does not cover, and the catalogue does not link it. Remove the
meta tag when the study is ready to be found. Cloudflare's automatic Web Analytics beacon covers
the route like every other edition. The Live now rail cards need the same-origin `api/rail`
handler that only the Vite dev and preview servers mount, so on Cloudflare they report that live
departures could not be refreshed; the recorded studies are complete without it.

Publication needs the Underfall repository's `cloudflare` environment (restricted to `main`) to
hold `CLOUDFLARE_API_TOKEN` with the same account permissions as the other editions, and the
repository variable `CLOUDFLARE_ENABLED=true`. Local publishing and rollback use the generic
commands with `--edition underfall`. The first release, on 2026-09-19, was published locally from
a research-branch build ahead of the first CI run; its `_release.json` says so and carries no run
ID.


**Stellar release verified — 8 October 2026.** [Pages run 37693667600](https://github.com/emmettl/zenit/actions/runs/37693667600)
passed eight numerical/data tests and twelve Chromium/WebKit browser checks,
then published edition commit `31fb38106a2cac3b1f36931b55a35c475b13a123`.
[Cloudflare run 37693845837](https://github.com/emmettl/zenit/actions/runs/37693845837)
published the same checked artifact. The [stellar delivery audit](evidence/zenit-stellar-2026-10-08.json)
confirms identical application and catalogue hashes at all three addresses,
5,070 HYG records, source attribution, data licence and missing-file 404s.
CI measured 326,531 gzip bytes for the stellar subset and 811,638 for the complete
artifact; local compressor measurements differ and are retained separately.
No orbital records or satellite passes are published yet.


**ISS sequence verified — 8 October 2026.** [Pages run 37698877139](https://github.com/emmettl/zenit/actions/runs/37698877139)
passed 17 numerical/data tests and 26 Chromium/WebKit browser checks, including
the complete animated cue, reduced motion, reverse/seek determinism, source
integrity, twilight fading and the app-panel layout. Edition commit
`ec639cab4e2f044f2cab19bd935ea20db7e633aa` is published by
[Cloudflare run 37699117166](https://github.com/emmettl/zenit/actions/runs/37699117166).
The [ISS delivery audit](evidence/zenit-iss-2026-10-08.json) confirms identical
application and dataset hashes at all three addresses, source/licence notices,
canonical identity and missing-file 404s. The CI artifact measures 848,621 gzip
bytes, including the 326,531-byte stellar subset and one bounded orbital snapshot.
The frozen Sydney pass and shared clock are modelled from dated inputs; satellite
optical visibility and sustained physical-phone frame rate remain unmeasured.

**Orbital families verified — 8 October 2026.** [Pages run 37704156821](https://github.com/emmettl/zenit/actions/runs/37704156821)
passed 22 numerical/data tests and 32 Chromium/WebKit browser checks. Edition
commit `ad40634cb5930cb8fc459fab61b1a1d19422f085` is published by
[Cloudflare run 37704385574](https://github.com/emmettl/zenit/actions/runs/37704385574),
using hosting revision `fb3f45c5dfa821b5038805c32986ef20f6e14015`.
The [family delivery audit](evidence/zenit-cohorts-2026-10-08.json) confirms
identical application, background worker and three dataset hashes at all three
addresses, 12 source/licence notices, canonical identity and missing-file 404s.
The frozen population retains 635 independent movers (616 eligible initially)
and 12 parent-station attachments. Family filters, direct timestamped propagation
and whole-orbit framing preserve the Sydney ISS descent and stellar reference.
CI measured 941,363 gzip bytes for the complete artifact and 326,531 for the
stellar subset; local compression measurements are recorded separately.
The scene uses a dated snapshot with bounded element ages. Neither optical
satellite visibility nor sustained physical-phone frame rate is established.

**Camera interaction verified — 8 October 2026.** [Pages run 37738881117](https://github.com/emmettl/zenit/actions/runs/37738881117)
passed 25 numerical/data tests and 42 Chromium/WebKit browser checks, including
orbit/zoom navigation, timestamp-coherent follow, attachment focus, expiry,
worker failure/retry and reversible descent from a custom viewpoint. Edition
commit `cd980d3099a5b24c7cde17dc4b5268d399f6f194` is published by
[Cloudflare run 37739183285](https://github.com/emmettl/zenit/actions/runs/37739183285).
The [camera delivery audit](evidence/zenit-camera-2026-10-08.json) confirms the same
application, stylesheet, worker, manifest and three dataset hashes at all three
addresses. The orbital and stellar releases remain unchanged. The CI artifact
measures 943,217 gzip bytes; the local compressor measured 950,523. The canonical
site's camera controls were exercised directly and left in a paused whole-orbit
overview. Physical-phone frame rate remains unmeasured.

**Geographic globe and Sydney arrival verified — 8 October 2026.**
[Pages run 37744187266](https://github.com/emmettl/zenit/actions/runs/37744187266)
passed 28 numerical/data tests and 46 Chromium/WebKit browser checks. Edition
commit `6a26f87e2fe01529be50d59007dbbbab430b90db` is published by
[Cloudflare run 37744548206](https://github.com/emmettl/zenit/actions/runs/37744548206).
The [arrival delivery audit](evidence/zenit-arrival-2026-10-08.json) confirms
matching application, stylesheet, worker, manifest and unchanged orbital/stellar
hashes at all three addresses, together with the Natural Earth geography metadata
and all 13 source/licence notices. The geography is bundled into the application;
the hosting data allowlist is unchanged. CI measured 987,098 gzip bytes for the
complete artifact, compared with 994,393 locally.

The twelve-second cue now reaches the 58 m Sydney observer at 7.68 seconds,
holds a two-degree horizon gaze until 9.36 seconds, then reveals the sky. Full
panels recede into a compact identity, clock and pause/return view. The source
map is generalised global geography; the ground/horizon tint is authored and
does not reconstruct terrain, atmosphere or optical satellite visibility.
Physical-phone frame rate remains unmeasured.

**Automatic playback and looping verified — 8 October 2026.**
[Pages run 37751550201](https://github.com/emmettl/zenit/actions/runs/37751550201)
passed 28 numerical/data tests and 52 Chromium/WebKit browser checks. Edition
commit `3dbf5fe96eae4f432529488d575c425aabf7082b` is published by
[Cloudflare run 37751909973](https://github.com/emmettl/zenit/actions/runs/37751909973).
The [playback delivery audit](evidence/zenit-playback-2026-10-08.json) verifies
matching application, stylesheet, worker, manifest and three dataset hashes at
all three addresses, canonical identity, 13 notices and missing-file 404s.
CI measured 987,375 gzip bytes for the artifact, compared with 994,667 locally.

Visible sessions start at 600× after sources settle and the first population
packet is ready. The dated twelve-hour clock loops forward and backward while
preserving elapsed-time overshoot, camera, selection and filters. Reduced motion
opens paused; manual pause or seek cancels a pending initial start. Hiding the
tab pauses an already-started session without restarting on return. The Sydney
cue still freezes the clock during descent and starts 10× after the upward reveal.
A separate live test tab confirmed autoplay and forward boundary wrap. The
existing user tab was preserved because refreshing could reset its current view.

**Automatic cinematic journey verified — 8 October 2026.**
[Pages run 37756432607](https://github.com/emmettl/zenit/actions/runs/37756432607)
passed 32 numerical/data tests and 58 Chromium/WebKit browser checks. Edition
commit `3089687dff9def4ddfda4209757d9d98e0f25285` is published by
[Cloudflare run 37756910739](https://github.com/emmettl/zenit/actions/runs/37756910739).
The [journey delivery audit](evidence/zenit-journey-2026-10-08.json) verifies
matching application, stylesheet, worker, manifest and unchanged orbital/stellar
hashes at all three addresses, canonical identity, 13 notices and missing-file
404s. CI measured 988,390 gzip bytes for the artifact, compared with 995,653 locally.

The sixty-second composition opens on the orbital shells for eight seconds at
600×, descends to Sydney over twelve seconds with the clock held, watches the
retained ISS pass for twenty-eight seconds at 10×, then ascends over twelve
seconds with the clock held. A one-second fade on each side of the orbital seam
conceals the dated pass reset. Pause holds both camera and clock; Explore freely
keeps the displayed pose and time with manual controls restored. Replay journey
restores the retained composition. Manual controls and orbital gestures hand over
to exploration; Show panels permits inspection during the journey. Reduced motion
opens paused and enabling it mid-journey leaves the current view paused.

The full loop, coherent dates, pause/resume, surface handover, replay and orbital
gestures are checked in both browsers. A controlled browser clock makes phase
checks independent of runner speed; boundary checks use 10× free playback.
The orbital, stellar and geographic sources remain unchanged. Physical-phone
frame rate remains unmeasured.

**Social artwork and static page metadata verified — 8 October 2026.**
[Pages run 37767996061](https://github.com/emmettl/zenit/actions/runs/37767996061)
passed 32 numerical/data tests and 60 Chromium/WebKit browser checks, including
metadata and asset retrieval with JavaScript disabled. Edition commit
`3cd7032e69ccb0870471e2c0d79f8589766efc00` is published by
[Cloudflare run 37768435764](https://github.com/emmettl/zenit/actions/runs/37768435764),
which succeeded on its second attempt after an upload connectivity failure.
The [sharing delivery audit](evidence/zenit-sharing-2026-10-08.json) verifies
static canonical/OG/Twitter identity, CreativeWork JSON-LD, image alt text,
source/licence notice, image MIME/dimensions/hash and icons at all three addresses.
The application bundle, manifest and orbital/stellar releases remain unchanged
from the cinematic journey release. CI measured 1,062,347 gzip bytes for the
complete artifact; local compression measured 1,069,506.

The 1200×630 card is the production-rendered Sydney ISS culmination at
17:58:49 UTC, framed with ZENIT typography. It measures 69,970 bytes and uses
`share/zenit-aa44f7a96603.png`, a content-addressed URL under the canonical
subdomain. The adapted stellar field and share artwork retain CC BY-SA 4.0,
with HYG and orbital attribution in the image, its public notice and JSON-LD.
The artwork record and manual reproduction script live in the edition repo;
builds do not regenerate it or fetch providers. SVG, 32 px PNG and 180 px touch
icons use a separately authored Z/orbit mark. Static fallback copy now describes
the implemented dated scene. The audit checks anonymous crawler-style responses;
it does not claim to invalidate third-party preview caches.

**Orbital family introduction verified — 8 October 2026.**
[Pages run 37771912007](https://github.com/emmettl/zenit/actions/runs/37771912007)
passed 34 numerical/data tests and 64 Chromium/WebKit browser checks on its
second attempt. The first runner lost a WebKit graphics context in an existing
reduced-motion case; the new introduction checks passed in both attempts.
Edition commit `a9be7de87a5f23551fb23bff9fad5ef69bce69b5` is published by
[Cloudflare run 37773033670](https://github.com/emmettl/zenit/actions/runs/37773033670).
The [introduction delivery audit](evidence/zenit-introduction-2026-10-08.json)
verifies matching new application bytes and declared timings at all three
addresses, with unchanged source evidence, datasets, OG image and static
sharing metadata. CI measured 1,064,198 gzip bytes for the complete artifact;
local compression measured 1,071,395.

The one-minute loop opens with four seconds each for stations, navigation,
geosynchronous members and the ISS. The first three beats run at 600×; the ISS
beat holds the retained initial pass time before the twelve-second descent.
The sky hold is twenty seconds and still reaches culmination nine seconds in;
the twelve-second ascent holds 18:00:39 UTC. Visual emphasis uses smooth opacity
and size treatment while retaining the full eligible population and one glyph
per identity. Captions use median WGS84 model height from the displayed worker
packet and median mean period from the retained mean motion. Attachments are
excluded. Manual exploration clears emphasis at the same displayed pose and date.

Desktop and WebKit phone-viewport captures verify caption/control separation;
a dark caption backing protects readability where distant lights pass behind
text. The canonical site was directly checked for family readings and pause/replay,
with no console errors. The user will review the published edition on a real
phone; physical-device playback and frame rate remain unmeasured here.

## ZENIT scrubbing correction · 2026-10-08

Edition commit `0382c29ad64acba42f3cb7f46710e198a84f4b23` fixes the
satellite disappearance reported during scrubbing on the user's iPhone.
[Pages run 37778320106](https://github.com/emmettl/zenit/actions/runs/37778320106)
passed 34 numerical/data checks and all 66 desktop/mobile WebKit browser checks
on its first attempt. The checked artifact is published by
[Cloudflare run 37778720217](https://github.com/emmettl/zenit/actions/runs/37778720217).
The [scrubbing delivery audit](evidence/zenit-scrubbing-2026-10-08.json)
verifies the same application bytes across all three public addresses, with
unchanged source evidence, datasets, metadata and share artwork. CI measured
1,064,250 gzip bytes; local compression measured 1,071,449.

The time slider tracks each requested seek immediately. While propagation is
pending, the last complete population packet remains visible, and sky geometry,
ISS position and selected-object readings retain that packet's timestamp.
Superseded responses are discarded and the latest requested instant replaces
the scene as a unit. The regression test delays real worker results through
rapid seeks, checks that no empty population appears, and preserves an active
navigation-satellite follow. Failure, retry and source replacement still clear
the retained packet. Two existing WebKit startup checks failed locally and
passed on an unchanged-code targeted rerun; the new tests passed immediately
and the independent CI suite passed in full. The user reports smooth physical
iPhone playback; no quantitative frame rate or device/browser identity is recorded.
