# Feed observer rollout — 19 September 2026

## State

- `motionstudies-feed-observer` is deployed to the existing Motion Studies Cloudflare account with a dedicated SQLite Durable Object and minute cron. Initial version: `f578875b-9e6a-4ecb-aa1c-cfb82512bd3f`.
- The Worker has **no public route**, `workers_dev` and previews are disabled, and `OBSERVER_CONFIG.enabled` is false. Scheduled events return without checking until activation.
- Separate push/read secrets are stored in the Worker. Values are not in this repository.
- Exporter runtime and configuration are staged on the CI Mac. Its launchd definition is not loaded yet.
- Cloudflared 2026.9.1 is installed on the Mac; no tunnel or tunnel service is started.
- Cloudflare Access service-credential creation was rejected by the existing CLI OAuth login with HTTP 403/code 1010. A narrowly scoped, temporary deployment credential is prepared in the dashboard for approval; no additional Access credential has been created yet.

The preparatory deployment does **not** mean off-host monitoring is active. Activate only after completing the steps below.

## Verified live data

A read-only projection at 2026-09-19 09:42 UTC found current producer telemetry, healthy capacity and healthy capture/normalization for all five feeds: UK bus archive, London arrivals, London cycle docks, Swiss realtime and UK bus SIRI-SX disruptions. SIRI-SX polls every five minutes; its capture threshold is fifteen minutes.

The automatically selected local FBRI release for service date 2026-09-18 passed pointer/hash/day validation. Analytics was waiting for inputs/work. Archive stages remain unknown because explicit upload-evidence plans are not yet supplied; HTTP serving remains unknown until the external route is active.

The native analytics listener is `127.0.0.1:4295`, with `/feeds/FBRI/manifest.json`. The selected result was 161,414 bytes, well below the checker's 2 MiB ceiling. At one check/minute, that size implies approximately 222 MiB/day of response payload. No raw archives are exposed.

## Host layout

Paths below are relative to the recorder account's home directory:

- Runtime: `Developer/Deployments/motionstudies-feed-observer/rollout-20260919/`
- Control: `Library/Application Support/MotionStudies/feed-observer/`
- `exporter.json`: reviewed paths, producer identity, endpoint and publication settings.
- `credentials.json`: push credential and, once provisioned, its Access service credentials; private file in a private directory.
- `exporter.plist`: proposed `app.motionstudies.feed-observer-exporter` launch agent, `StartInterval: 60`, using `/opt/homebrew/opt/node/bin/node`.
- `state/export-status.json`: bounded latest submission outcome, with no free-form errors or secrets.
- `state/last-report.json`: last successfully submitted redacted report; never an input to a subsequent upload.
- `state/incidents/`: local durable incident store under existing retention/capacity rules.

The exporter exits 1 if projection, persistence or submission fails. Launchd does not overlap invocations of this job. Do not independently invoke another writer against the same incident store while it is running. The exporter emits no growing stdout/stderr log; inspect the bounded status file and launchd exit status. Abrupt interruption can leave a temporary `.export-*` directory for manual inspection, and the incident store's verified lock-recovery procedure still applies.

Local publication selection follows the recorder's native pointer key: SHA-256 of the JSON object `{operator, from, to}`, in that order. `from` is the later of configured analytics start and expected month's first day; `to` is the service day due at the configured deadline. Selection advances without searching the raw recording tree. Missing expected pointers/releases produce unknown/overdue evidence rather than retaining success.

## Activation checklist

1. Provision Access service tokens for exporter push, operator read and analytics consumer. Protect `motionstudies.app/api/feeds/*` and `analytics.motionstudies.app` with service-auth policies allowing only the corresponding named tokens. The deployment credential needs Access service-token and app/policy edit, Tunnel edit, and DNS edit restricted to `motionstudies.app`; it should expire after rollout.
2. Create a named remotely managed tunnel from `analytics.motionstudies.app` to the Mac's loopback analytics listener. Use an ingress rule restricted to the analytics feed path and a default 404. Store only that tunnel's run token on the host; supervise cloudflared through its own launch agent.
3. Add the consumer Access credential object under the Worker's `FEED_CONSUMER_TOKENS_JSON`, and the push Access credential to the Mac's private `credentials.json`. Keep distinct origin push/read tokens as well.
4. Verify anonymous traffic is rejected by Access, then add the Worker route and FBRI consumer URL, enable and deploy the observer.
5. Install the staged exporter plist into `~/Library/LaunchAgents/` and bootstrap it in the recorder user's launchd domain. Confirm at least two automatically advancing producer/check timestamps.
6. Stop only the exporter for longer than the heartbeat allowance, verify telemetry becomes stale externally, then restart it and confirm recovery. Verify consumer release integrity and the current expected day. Do not interrupt the recorder for this drill.
7. Save version, route, tunnel and validation evidence here, update the checked-in deployment configuration, and revoke/expire the temporary deployment credential. Future notification delivery and a probe outside Cloudflare remain separate work.

The Access layer is required before enabling these routes under the repository's cost-control policy: anonymous requests should be rejected before reaching metered Worker execution. Worker-level credentials and per-IP limits alone are not an account spending cap.
