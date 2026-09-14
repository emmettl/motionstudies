# Cost control

[Study documents](README.md) · [Archive and processing](ARCHIVE-AND-PROCESSING.md) · [Hosting](HOSTING.md)

**14 September 2026 — operating constraint and proposed controls.** The series has an approximately **US$100 maximum monthly operating budget in total**, shared across editions, archives and services. Popularity must not create an open-ended bill, and retaining data must not create an indefinitely growing commitment. Prefer a stale recorded edition or unavailable optional feature to exceeding the budget.

The budget is a requirement; the allocations and mechanisms below are starting proposals. This document does not configure a provider spending cap, change live infrastructure or delete existing evidence. Current account bills and deployed services still need an inventory before compliance can be claimed.

## Spend below the ceiling

Plan for **at most $60/month of committed and bounded operating costs**, leaving **$40 unallocated** for tax, currency movement, renewal timing and estimation error. The reserve is not permission for automatic expansion. Include existing services before allocating money to new ones; this is not $100 per edition or per provider.

| Proposed envelope | Monthly allowance | Admission rule |
| --- | ---: | --- |
| Object storage | $15 | At most 1,000 decimal GB in R2 Standard, counting all stored copies and uploads in progress |
| Collection and batch processing | $20 | Fixed-price capacity or an independently enforced finite job budget; no automatic capacity expansion |
| Hosting plans and metered operations | $15 | Include all service minimums and bounded reads/writes; public traffic must not drive unrestricted paid work |
| Other operations | $10 | Source subscriptions, CI/artifacts, monitoring, domains and backups outside the object allowance must fit here or displace another allocation |
| Unallocated reserve | $40 | Protect the $100 total; do not schedule routine work against it |

These are allocations, not vendor quotations or measured current spend. Annual renewals need both a monthly provision and cash available in their payment month. Account for every provider's billing cycle and shared allowances; do not credit the same free tier to multiple editions.

At the assumed Standard rate, 1,000 GB costs **$15/month for storage alone**, before free allowances. R2 operations remain separate. For scale, **one billion billable Standard Class B operations cost $360** before allowances. Free egress therefore does not make unrestricted public archive access cost-free. [R2 pricing](https://developers.cloudflare.com/r2/pricing/)

## Keep visitor traffic out of the paid processing path

Publish a finite, compiled study: application files, aggregate tiles, group indexes and permitted individual evidence extracts. Serve these directly through Workers Static Assets and perform playback, filtering and inspection in the browser. Cloudflare documents free, unlimited static-asset requests, with no additional asset-storage charge; requests invoking a Worker script follow Workers billing instead. [Static Assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)

This preserves the sea–shoal–fish descent through precomputed evidence. It does not require a server query for each selection. Keep a recorded release available when collection pauses, with its date and coverage visible.

The publisher currently enforces **25 MiB per file and 20,000 files**. Partition larger data to fit a measured browser workload within that envelope. Cloudflare permits more files on paid plans, but that is not a reason to expand our publishing limit or make the whole archive public. [Provider limits](https://developers.cloudflare.com/workers/platform/limits/)

Public routes must not invoke paid compute for redirects, missing paths, arbitrary queries, image generation, analytics writes or archive scans. Keep raw R2 buckets private, without public custom-domain or `r2.dev` access. Publish only the permitted extracts needed by the work through the static path. Bulk download and arbitrary query features wait until they have a separately proven cost bound.

Caching reduces expected origin reads; it is not a financial ceiling. R2 custom domains support caching, but only some file types are cached by default, and `r2.dev` has a separate public access path. Cache misses and bypasses must be included in any alternative design. [R2 public access](https://developers.cloudflare.com/r2/buckets/public-buckets/)

An application counter, per-IP rate limit or API key is insufficient if an unlimited stream of requests still reaches a paid Worker. Even rejecting a request can incur the invocation charge; limiting CPU per invocation does not bound invocation count. Do not present such controls as an account spending cap. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)

## Bound retention by age and bytes

**Adopted 14 September 2026:** a rolling window of N days for continuous collection, with the ability to save particular study days out of the window into the selected-evidence allocation. Saving a day pins its archives, normalised table and published artifacts against expiry and consumes selected allowance; it is an authored decision recorded in a small ledger, made within the window, and the day's settled power data arrives about a week after the day, so a day is judged complete no earlier than that. N starts at 30.

Start new continuous collections with a **30-day rolling window**, shortened where source terms require. This is a default for new collection, not an instruction to delete existing archives. Add a **1,000 GB total R2 storage ceiling** across the series, including original files, normalized partitions, derivatives, staging, backups and incomplete uploads. A separate store or database needs its own finite capacity and a place in the same dollar budget.

Reserve, initially, up to **250 GB for selected study evidence**, **650 GB for rolling data** and **100 GB for staging and cleanup headroom**. These are shared allocations. Promoting a day to the selected collection consumes its remaining allowance; it never grants perpetual additional space. A published study should retain its required evidence within that allocation and source policy. If evidence is withdrawn, explicitly revise its availability and reproducibility claims.

The earlier combined weather/bus scenario would occupy **163.44 GB over 30 days**, about **$2.45/month** for that layer alone. Raw weather products, normalized copies and backups are additional; the input estimate is not a measured upper bound. Use the [archive sizing assumptions](ARCHIVE-AND-PROCESSING.md#cost-model-and-limits), then replace them with measured retained bytes.

Every writer must reserve capacity atomically before uploading, including a bounded allowance for unknown response size and temporary coexistence during compaction. Enforce the response-size limit while streaming. Count outstanding reservations across concurrent jobs, and reject a write that cannot fit. Stop collection if the capacity ledger is unavailable or disagrees with the inventory; reconcile using a bounded maintenance job. No untracked writer should bypass admission.

Use lifecycle expiry as cleanup, alongside that admission control. R2 says removal typically occurs within 24 hours of expiry and objects remain billable until deleted. Do not count scheduled deletions as reclaimed space. A cleanup failure must eventually pause ingestion rather than grow storage. Test expiry, unfinished uploads and dependent manifest updates with disposable fixtures first. [R2 lifecycle behavior](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)

## Bound collection and processing independently

Collection runs on a fixed schedule, independent of visitor count. Each source/job has finite limits for requests, received bytes, retries, wall time, concurrency, output bytes and retention. Reserve a worst-case cost before starting; include failed attempts, multipart operations, repeated reads and logs. Abort oversized inputs and exhausted retries. Avoid self-replenishing queues and unbounded catch-up after an outage.

**Decision, 14 September 2026:** collection and batch compilation run on hardware the author already owns, the CI Mac, at approximately no marginal cost. Cloud storage holds retained objects and published artifacts only. A hosted collector is at most a fallback for continuity across a full day, and if ever needed it is a small fixed-price host inside this envelope, never a metered Worker, whose per-invocation compute would be cost-prohibitive for continuous collection. Prefer local batch work or fixed-price processing with automatic paid overages disabled. A time-series database must fit a fixed compute/storage/backup envelope; pause ingestion or reject optional queries at capacity. It must not autoscale beyond the allocation. An always-on database is unnecessary for the first recorded study.

Maintain a billing-cycle ledger of fixed commitments, incurred variable costs and reserved maximum costs of admitted jobs. Admit work only if the conservative total remains within its allocation and the $60 operating envelope. Reserve ongoing storage through the end of the cycle, including cleanup headroom. Monitoring and the quota mechanism themselves need bounded costs.

Provider-enforced quotas or fixed-price service terms provide stronger protection than our own counters. Software admission bounds cooperative workloads only when all writers and cost paths obey it. If a publicly reachable metered path cannot be bounded before billing occurs, it does not meet the strict budget requirement and must be removed, moved or left disabled. This design does not claim that Cloudflare exposes a universal $100 account cutoff.

## All-in estimate for the Parquet and R2 pipeline — 14 September 2026

Built from the [recorded national hour](ARCHIVE-AND-PROCESSING.md#first-implementation-proof) and prices reread from Cloudflare on 14 September: Standard storage $0.015 and Infrequent Access $0.01 per GB-month, Class A writes $4.50 per million ($9.00 Infrequent Access), Class B reads $0.36 per million ($0.90), Infrequent Access retrieval $0.01 per GB with a 30-day minimum, egress free, and a monthly free tier on Standard of 10 GB, one million writes and ten million reads; static-asset requests on Workers are free and unlimited. Storage bills on peak daily usage, so a 30-day window with lifecycle deletion lag is costed at 31 days. The measured hour was a weekday midday; nights are lighter, so day figures are near an upper bound.

**Measured per day, projected from the hour**

| Layer | Per day | Basis |
| --- | ---: | --- |
| Original archives | 6.71 GB | 2.33 MB × 2,880 captures |
| Deduplicated samples, Parquet | 0.62 GB | 25.8 MB × 24 |
| Published artifacts: packs, slices, tiles | 0.45 GB | 18 MB packs + 0.66 MB slices + 0.1 MB tiles, × 24 |
| **Total retained per day** | **7.78 GB** | |

**Scenarios, monthly**

| Scenario | Storage | Standard | Archives in Infrequent Access |
| --- | ---: | ---: | ---: |
| Intended: rolling 31 days of everything | 241 GB | $3.47 | $2.58 storage + $0.78 archive writes |
| Plus rainfall radar at 1.15 GB per day | +36 GB | +$0.54 | +$0.54 |
| Twelve selected days kept indefinitely | 93 GB | $1.40 | $1.00 |
| The full 250 GB selected-evidence allocation | 32 complete days | $3.73 | $2.66 |
| Continuous year, for comparison only | 2,840 GB | $42.59 | over the storage ceiling; excluded |

Operations: about 12,000 writes a day, of which 8,760 are per-operator-per-hour packs, 360,000 a month, inside the free million on Standard; only Infrequent Access archive writes are billable. Compilation runs on the author's Mac against the local copy before upload, so retrieval and read operations are near zero; a re-compilation from R2 costs about 2,900 reads and no egress. Ingress is free; the home uplink carries 7.8 GB a day, an average of 0.7 Mbit/s. The Mac draws perhaps 22 kWh a month if it would otherwise be off, an electricity cost rather than a cloud one. Power-axis data is 13 MB a day and does not register.

**All-in for the intended operation with weather: about $4.00 a month on Standard, $3.90 with archives in Infrequent Access**, against the $15 object-storage allowance and the $60 operating envelope. The one path that changes this is public reads from R2 itself: at twenty reads per visitor session, 1,000 sessions a day are free, 50,000 cost $7.20 and 500,000 cost $104. Publishing the day's roughly 660 static files, 450 MB, through Workers Static Assets keeps visitor traffic at zero regardless of volume, which is why raw buckets stay private and the published descent is static. Whether static assets require the paid Workers plan should be confirmed on the account before publication; the requests themselves are documented as free.

## Current position and next proof

The checked-in edition hosting configurations already use direct Static Assets, without an application handler. The retired edition proxy has no configured routes. That is a useful foundation, not a complete spending audit: [hosting documentation](HOSTING.md) records separate London/Swiss live-data Workers and Grid/84's public R2-backed GHSL tiles. The shared airport service also has its own Worker configuration. Their current deployment, plan, usage and reachable billing paths need inspection, including auxiliary hostnames and cross-origin browser requests.

**Experimental bucket, 14 September 2026.** `motionstudies-experimental` was created with a Western Europe location hint and Standard class, alongside the existing `gleislicht-observations`, `grid84-grids`, `motionstudies-airport-cache` and `motionstudies-data` buckets; the last holds 2,733 objects and 2.66 GB and is used by Gleislicht (author, 14 September); it is referenced from that edition's configuration, not this repository's, and belongs in the inventory below with the Swiss live-data services. Lifecycle rules were added and read back: `rolling-30d` expires objects under `rolling/` after 30 days and aborts incomplete multipart uploads after 2, and `test-expiry-1d` expires objects under `test-expiry/` after one day, alongside the default seven-day multipart abort rule. The hour's samples Parquet, tiles, captures, two packs and one archive were uploaded under `rolling/2026-09-14/`, 32 MB in seven objects, through wrangler at about 5 MB/s for the large file and 1.6 s of overhead per small one; the Parquet read back byte-identical. A probe object under `test-expiry/` was written at 14:21 UTC to observe deletion timing; Cloudflare states removal typically within 24 hours of expiry. Bucket statistics lag and reported zero objects while reads succeeded. Note that wrangler 4 targets a local simulated bucket unless `--remote` is passed; the first upload attempt went there. Bulk uploads of thousands of small files a day need the S3 API with a scoped token rather than per-object wrangler calls; creating that token is an account action for the author.

Before expanding collection or publishing a national study:

1. Inventory accounts, bills, subscriptions, buckets, schedules, endpoints, CI retention and backups across editions. Record the owner, price basis, maximum exposure and stop behavior of each service. Check existing live-data and Grid/84 R2 paths first.
2. Verify the public route graph: a cold visit, deep evidence lookup, unknown path and repeated request must not initiate unbounded paid work. Confirm static handling in deployed configuration and usage metrics. Exercise a traffic burst against fixtures/local tests without generating a large paid load.
3. Prove storage admission and job quotas under concurrent writes, oversized input, retry storms, a failed ledger and delayed deletion. Stop new work while the last compiled study remains viewable. Confirm the bounded billable overhead of rejecting work.

   **Partly proved, 14 September 2026, in Underfall's capacity ledger.** Every admitted capture reserves its worst case, the enforced response cap, against a per-layer allocation and a total before the request, counting outstanding reservations from every job; commits the actual bytes under the object's content-addressed key afterwards, idempotently for a repeated object; and releases on failure. Tests cover 25 concurrent writers admitted exactly up to the cap and none beyond, an oversized commit refused, a corrupt or missing ledger refusing admission, inventory disagreement pausing admission until resumed from a rebuilt listing, retirement after confirmed deletion, and the collector stopping with status `ledger-capacity` while earlier captures stay intact. Not yet proved: the maintenance job that lists the bucket to produce the inventory, retirement driven by observed lifecycle expiry, the billable cost of a rejected write, and any provider-side cap. The ledger is a file behind a lock on one host and bounds cooperative writers only.
4. Add provider alerts well below the ceiling, alongside an independent total-cost view. Translate total-budget warning points of $40 and $60 into provider thresholds after accounting for fixed and non-Cloudflare costs. Test the stop mechanism independently of alert delivery; resume only after reconciliation within the same allowance.

Cloudflare explicitly states that budget alerts are informational and do not pause or cap usage. They are useful notification, not the enforcement mechanism. Until the inventory and proofs are complete, **the $100 ceiling is a documented design requirement, not a verified live guarantee**. [Budget alerts](https://developers.cloudflare.com/billing/manage/budget-alerts/)
