# External feed checks on Cloudflare

The observer runs independently of the recording Mac. The Mac submits a small, validated `feed-health` report; Cloudflare stores it without changing its producer timestamp. A minute cron reevaluates that timestamp and optionally verifies the actual analytics consumer endpoint. Authenticated status reads also age the check itself, so a stopped cron cannot leave a saved green status current.

**Rollout started on 19 September 2026.** The Worker is deployed privately. The checked-in Cloudflare configuration remains disabled, with no public route or consumer URL, pending Access provisioning. See [rollout state](FEED-OBSERVER-ROLLOUT.md). The existing recorder analytics server is loopback-only. Its externally reachable, authenticated consumer URL must be supplied before HTTP publication checks can run. No notifications are sent.

## Components and boundaries

- `@motionstudies/data/feed-expectations`: completed service-date expectations from a timezone/local delivery deadline, including DST.
- `@motionstudies/data/feed-observer`: portable Web API checker and read-time assessment. No filesystem or Node dependencies.
- `scripts/observe-feeds.mjs`: standalone Node checker; optionally persists the existing local incident history.
- `services/feed-observer/worker.ts`: Cloudflare Worker, minute cron and one SQLite-backed Durable Object. Uses the bundled `recorder.production.json` registry, including the five currently running feeds.
- `scripts/push-feed-health.mjs`: bounded HTTPS submission of a validated report. Credentials come from the environment, never command-line arguments.
- `scripts/export-recorder-health.mjs`: one scheduled Mac invocation; makes a fresh report, advances the local publication expectation, records incidents and submits valid unhealthy reports. Projection failure never replays a prior report. It atomically replaces a small status file and cleans up per-invocation temporary files.

The Cloudflare object stores only the latest producer report, latest check/failure and latest attempt reservation. This is **not off-host incident history**: older checks are replaced. The existing incident store remains local. No raw recordings or analytics releases are stored by the observer, and no retention policy for recordings is changed.

The implementation uses [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) and [transactional Durable Object storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/). A single object serializes updates; a persisted attempt reservation prevents duplicate cron deliveries or restarts from repeating checks within 60 seconds. Checks do not hold a `blockConcurrencyWhile` gate across network I/O.

## Daily consumer expectation

For the initial bus adapter, a `06:00` Europe/London deadline means yesterday must be present after 06:00 today; before that deadline, the previous completed date remains expected. Midnight boundaries come from the shared London service-day helper, including 23/25-hour days. At an ambiguous local deadline, the later occurrence is used; a nonexistent deadline uses the first valid minute after the DST gap.

The native `/feeds/FBRI/manifest.json` selects exactly `releases/<sha256>/result.json` on the same origin/path. The checker verifies response byte count and hash, payload identity, operator/date range, expected day's `current` state and revision, and service-day boundaries. A successful HTTP response or a valid old artifact cannot prove today's expectation. Crossing the deadline during a check requires a new check. This verifies the release served over HTTP, not full collection coverage, timetable accuracy or measured punctuality.

Cloudflare can retain a healthy consumer result while producer telemetry is unavailable, but the shared report still marks producer-dependent stages unknown. The independent consumer result remains visible under `lastCheck.consumers`.

## Status API and credentials

| Endpoint | Credential | Behaviour |
| --- | --- | --- |
| `PUT /api/feeds/v1/producer` | `FEED_PUSH_TOKEN` | Accepts a redacted, registry-bound report up to 64 KiB. Identical replay is a no-op; conflicting/older observer times or backward producer times are rejected. New writes are limited to one per 30 seconds. |
| `GET /api/feeds/v1/status` | `FEED_READ_TOKEN` | Reassesses the saved check at the current clock. HTTP 200 only when healthy; 503 for unavailable, stale or attention-required evidence. `lastCheck` is explicitly historical. |

Tokens must be separate random secrets of 32–256 characters. Both endpoints use `Authorization: Bearer …`. There is no public check-trigger endpoint, permissive CORS or query-string authentication. Paths/errors/tokens from failed HTTP requests are not exposed. Cloudflare's request limiter additionally caps authenticated traffic at 30 requests/minute per IP. Read credentials should remain in the operator's server/proxy, not public browser code.

Status becomes unknown if no check exists, a check fails, or its completion is older than 180 seconds. It also reevaluates the original producer heartbeat, stage ages and next consumer deadline. A failed check latches unknown immediately until a later successful check. A total Cloudflare outage still needs an independent uptime probe of this authenticated status endpoint; this service cannot notify about its own complete disappearance.

## Rollout

1. Review `config/feeds/recorder.example.json` against the actual host bindings and thresholds. The Worker bundles this registry; the Mac must use the same version. Use the existing evidence plan for local upload/publication stages. Those plans still need automatic dated generation and artifact selection; the new daily helper advances **consumer** expectations only.
2. Configure a reachable bus analytics manifest in `wrangler.feed-observer.jsonc` under `OBSERVER_CONFIG.consumers`, using the consumer entry in `config/feeds/observer.example.json`. It must be the endpoint consumers will use. If the server remains private, first provide an authenticated proxy/tunnel. Do not substitute the recorder's loopback address.
3. Provision distinct Worker secrets with `wrangler secret put FEED_PUSH_TOKEN --config wrangler.feed-observer.jsonc` and the equivalent `FEED_READ_TOKEN`. Where needed, `FEED_CONSUMER_TOKENS_JSON` is a secret JSON map from feed ID to its consumer bearer token. No Cloudflare account-wide credential is given to the Mac.
4. After provisioning and verifying Cloudflare Access protection, add the `motionstudies.app/api/feeds/*` route, set `OBSERVER_CONFIG.enabled` to true, and deploy with `wrangler deploy --config wrangler.feed-observer.jsonc`. The configuration creates a dedicated object namespace and does not reuse airport storage or its request limiter. No CI deployment workflow is installed in this slice.
5. On the Mac, run the existing health projection every 60 seconds, then submit its report using the command below. An exit code of 2 from `feed-health.mjs` still produces a valid unhealthy report and **must be submitted**; exit code 1 must not submit an older output file. Create a new temporary output for each invocation. Keep the push secret in restricted service environment configuration. Installing this host schedule remains rollout work.
6. Verify healthy capture, stale producer detection after stopping only the exporter, consumer failure and recovery, stopped-cron freshness, read/push credential separation and secret rotation. Leave collection running throughout. Only then wire a dashboard or notification delivery.

```sh
# After successfully producing this invocation's fresh report (exit 0 or 2):
node scripts/push-feed-health.mjs \
  --registry config/feeds/recorder.example.json \
  --report /path/to/this-invocation-health.json \
  --url https://motionstudies.app/api/feeds/v1/producer
```

Submission failure exits 1 with a redacted message and no retry loop. Replaying a previously healthy report cannot extend its heartbeat.

## Standalone checker

```sh
node scripts/observe-feeds.mjs \
  --registry config/feeds/recorder.example.json \
  --config /path/to/observer.json \
  --incidents /path/to/observer-history
```

Copy the example config and replace `.invalid` URLs. For Access-protected destinations, consumer credentials can be `{ "accessClientId": "…", "accessClientSecret": "…", "bearer": "optional origin token" }` instead of a bearer string. The push CLI accepts `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` alongside its separate `FEED_PUSH_TOKEN`. Access headers are sent only to the configured endpoint and pinned same-origin release, with redirects disabled.

Here `healthUrl` is a reachable redacted producer report, not the Cloudflare status wrapper. The Cloudflare Worker supplies its stored report internally and never requests the placeholder health URL. Optional `FEED_HEALTH_TOKEN` and `FEED_CONSUMER_TOKENS_JSON` provide separate bearer credentials. Incidents are opt-in; exit 0 means healthy/waiting, 2 means attention required, 1 means configuration/store/check failure. A persistent store must have one designated writer and consistent registry/policy.

## Bounds and operating cost

Each check allows at most four consumer targets, nine reads, 10 MiB total response data, 5 seconds per request and 30 seconds total network time. Manifest limit is 8 KiB; each immutable result is capped at 2 MiB. Redirects and automatic retries are disabled. Streamed bytes are counted even without Content-Length. The standalone health report limit is 1 MiB; Cloudflare accepts 64 KiB reports and stores checks of at most 96 KiB. The deployment sets a 1,000 ms CPU ceiling; a ceiling failure leaves an old check that expires on reads.

Cloudflare reserves at most one check/minute, or 1,440/day. It currently rereads full releases: one consumer at the 2 MiB ceiling could transfer about 2.8 GiB/day, so check actual artifact sizes before enabling targets. The maximum request reservation is 12,960/day across all four consumers (one source read is local in Cloudflare). There is no immutable-release cache or separate monthly budget yet. Stored monitoring data stays bounded to three keys; there is no unbounded event table.

## Remaining increments

- Deploy/configure the Worker, wire the Mac exporter and expose the real consumer endpoint.
- Generate archive/local-publication evidence plans automatically, including journal selection and missing periods.
- Export durable incident history off-host, add recovery-aware notifications and the read-only operational dashboard.
- Add release caching/cost telemetry if measured size warrants it, then other feed adapters.
- Probe the checker from outside Cloudflare and exercise operational failure/recovery drills.
