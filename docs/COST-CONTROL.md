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

## Current position and next proof

The checked-in edition hosting configurations already use direct Static Assets, without an application handler. The retired edition proxy has no configured routes. That is a useful foundation, not a complete spending audit: [hosting documentation](HOSTING.md) records separate London/Swiss live-data Workers and Grid/84's public R2-backed GHSL tiles. The shared airport service also has its own Worker configuration. Their current deployment, plan, usage and reachable billing paths need inspection, including auxiliary hostnames and cross-origin browser requests.

Before expanding collection or publishing a national study:

1. Inventory accounts, bills, subscriptions, buckets, schedules, endpoints, CI retention and backups across editions. Record the owner, price basis, maximum exposure and stop behavior of each service. Check existing live-data and Grid/84 R2 paths first.
2. Verify the public route graph: a cold visit, deep evidence lookup, unknown path and repeated request must not initiate unbounded paid work. Confirm static handling in deployed configuration and usage metrics. Exercise a traffic burst against fixtures/local tests without generating a large paid load.
3. Prove storage admission and job quotas under concurrent writes, oversized input, retry storms, a failed ledger and delayed deletion. Stop new work while the last compiled study remains viewable. Confirm the bounded billable overhead of rejecting work.
4. Add provider alerts well below the ceiling, alongside an independent total-cost view. Translate total-budget warning points of $40 and $60 into provider thresholds after accounting for fixed and non-Cloudflare costs. Test the stop mechanism independently of alert delivery; resume only after reconciliation within the same allowance.

Cloudflare explicitly states that budget alerts are informational and do not pause or cap usage. They are useful notification, not the enforcement mechanism. Until the inventory and proofs are complete, **the $100 ceiling is a documented design requirement, not a verified live guarantee**. [Budget alerts](https://developers.cloudflare.com/billing/manage/budget-alerts/)
