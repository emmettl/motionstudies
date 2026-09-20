# Feed observer rollout — 20 September 2026

## Running services

- Cloudflare Worker: `motionstudies-feed-observer`, version `c4f90bfb-4995-4e4a-a841-f8ea239382c4`. The checked-in configuration is enabled, with a dedicated SQLite Durable Object and `* * * * *` cron. Workers.dev and preview URLs remain disabled.
- Protected status: `https://motionstudies.app/api/feeds/v1/status`. The exporter submits to `/api/feeds/v1/producer` every 60 seconds. Both require Cloudflare Access credentials and a separate origin bearer credential.
- Protected consumer: `https://analytics.motionstudies.app/feeds/FBRI/manifest.json`, through tunnel `c26e9124-c65f-4bf8-96b2-028df7d23b6e` to `127.0.0.1:4295` on the recorder Mac. Ingress permits only `/feeds/FBRI/…`, with a default 404.
- Access application IDs: observer `452619e8-ba4a-4922-9a98-57f4cdb0f85d`; analytics `e581aea3-6839-477c-91b9-4cdc49b15fc4`. Service-auth policies permit push/read credentials on the observer and only the consumer credential on analytics.
- Runtime Access credentials expire on **20 September 2027, approximately 08:26 UTC**. Rotate them before then. The temporary rollout API token expires on 21 September 2026 and is not installed on the recorder.

Anonymous requests were confirmed to receive Access HTTP 403 before the Worker route was enabled. The origin push token cannot read status (401); the read Access credential cannot read analytics (403); an authenticated request outside the tunnel feed path returns 404. The Access layer rejects anonymous requests before metered Worker execution. Worker credentials and per-IP limits alone are not an account spending cap.

## Live validation

The Cloudflare consumer check at **08:38:02 UTC on 20 September** verified the expected September 19 service date, release identity, content hash, byte count and service-day boundaries. Result ID: `fa73e05d9129b94c117041dd99de0005fb9341c5108e387ab9c622d0bbb14b91`; result size: **198,284 bytes**. At the maximum one check/minute, that is approximately 272 MiB/day of release payload. No raw archives are exposed.

Automatic exporter submissions advanced at 08:36:38 and 08:38:39 UTC, with distinct original recorder timestamps. The cloud check and producer timestamps advance independently. A submitted report may correctly be unhealthy: health projection exit 2 is submitted, while invalid projection never replays an old report.

An exporter-only outage drill began at **08:38:50 UTC**. The authenticated status read at **08:41:33 UTC** returned HTTP 503, `unknown` / `telemetry-stale`, while the saved consumer check remained healthy. The collector and analytics processes were not stopped. After resuming the exporter, the check at **08:43:02 UTC** saw current telemetry again (producer time 08:42:26 UTC) and verified the consumer release. Overall status correctly returned to `degraded` / `feed-attention-required` for the existing feed failures. Local incident history retained five active incidents across the exporter restart.

At initial activation (08:38 UTC), status was **degraded**, not green. Monitoring found these pre-existing recorder problems; the recovery below supersedes this snapshot:

- UK bus capture last advanced at 07:55:02 UTC; the other four capture stages remained healthy.
- Normalization was last current through the 04:00 UTC hour. Processing and analytics subprocesses report `spawn /opt/homebrew/Cellar/node/26.8.2/bin/node ENOENT`: Homebrew removed the executable still referenced by the running recorder. The recorder was subsequently repaired in the 09:18 UTC host rollout documented below.
- Capacity is healthy, with roughly 1.95 TB free. Analytics output for September 19 is served correctly, but the ongoing analytics job status is stale.

The consumer fetch initially failed because the installed Workers runtime rejects `redirect: 'error'`. A local workerd probe reproduced the exact error. The checker now uses `manual`, rejects non-2xx responses, and never forwards credentials to a redirect. The redirect regression test and the production consumer check both pass.

## Host layout and operation

Paths are relative to the recorder account's home directory:

- Runtime: `Developer/Deployments/motionstudies-feed-observer/44bd3ab/`, including the merged archive-evidence generator. The earlier runtime is preserved for rollback.
- Control: `Library/Application Support/MotionStudies/feed-observer/`, mode 0700; credential/config files are private.
- `exporter.json`: active status, local publication and archive evidence configuration; `archive.hostConfig` points to the recorder’s private `host.json`, with six-hour grace. `exporter-before-44bd3ab.json` and the matching plist preserve the earlier status-only configuration.
- `credentials.json`: only the push bearer and push Access credentials. `tunnel-token`: only this tunnel's run credential. No account-level deployment credential is on the Mac.
- Launch agents: `app.motionstudies.feed-observer-exporter` (60-second interval) and `app.motionstudies.analytics-tunnel` (keep alive). The tunnel exposes readiness only on `127.0.0.1:20245/ready`.
- `state/export-status.json`: bounded latest submission outcome. `state/last-report.json`: last successfully submitted redacted report, never reused as upload input. `state/incidents/`: private, bounded local incident history.

The exporter uses the dedicated `Developer/Runtimes/node-v26.9.0-darwin-arm64/bin/node` under the recorder user’s home, a normal scheduling priority and an explicit runtime working directory. Cloudflared 2026.9.1 runs separately. Neither service writes an unbounded log. Inspect the bounded status file, tunnel readiness and launchd exit state.

```sh
# Run on the recorder Mac as its recording user.
launchctl print gui/$(id -u)/app.motionstudies.feed-observer-exporter
launchctl print gui/$(id -u)/app.motionstudies.analytics-tunnel
cat "$HOME/Library/Application Support/MotionStudies/feed-observer/state/export-status.json"
curl --fail http://127.0.0.1:20245/ready
```

Do not run another incident writer while the exporter is loaded. To pause/reload it, use `launchctl bootout`/`bootstrap` with `gui/$(id -u)` and `~/Library/LaunchAgents/app.motionstudies.feed-observer-exporter.plist`. Bootout only while no invocation is active where possible. An interrupted incident writer's lock requires the verified recovery procedure in [FEED-INCIDENTS.md](FEED-INCIDENTS.md); do not delete locks blindly.

## Recorder and local-evidence recovery

At **09:18:35 UTC on 20 September**, after macOS volume approval and a successful launchd storage preflight, the recorder switched from `6a79fb1` to staged merged release `e0ef4c9`. It now runs on a checksum-verified official Node 26.9.0 distribution outside Homebrew; its child executable cannot disappear during Homebrew cleanup. All 185 recorder tests and lint passed before cutover. The existing config and budgets were preserved.

All five feeds resumed their original journals, with verified collector/lock ownership. Bus capture resumed at 09:18:38.948 UTC after an **83 minute 36.599 second receipt gap**. That interval remains missing data. All five processing jobs completed successfully: bus through receipt hour 07 and the other four feeds through hour 08. Recovered output hashes and sizes passed verification for each feed. Analytics completed at 09:29:38 UTC and report-only retention at 09:30:37 UTC, with zero eligible bytes and no deletions.

The exporter was upgraded to `44bd3ab` and the same dedicated Node runtime. Automatic submissions at 09:19:48 and 09:21:50 succeeded with advancing producer timestamps. Local FBRI publication and **all five archive stages** passed `publication-artifact-verified` / `archive-closeout-verified`; this verifies recorded close-out upload evidence, not current R2 object existence. The independent Cloudflare consumer check continues to verify the served September 19 release.

The independent status check at **09:33:02 UTC** confirmed current telemetry, healthy capacity, all five captures, the other four normalization stages, all archive stages and both local publication and consumer release checks. Analytics has current successful job status and is waiting for inputs or work. The only degraded stage is bus normalization: there were no captures in receipt hour 08. Its freshness warning can clear after a later captured hour closes and is processed; it does not imply that the earlier gap has been recovered.

Detailed host evidence: `Library/Application Support/MotionStudies/recorder/runtime-repair-20260920.json`. Backups include the previous runtime/config/plist and a rollback plist using the surviving dedicated executable. The preflight launch agent was unloaded after validation.

## Outstanding work

1. Retain capture gaps explicitly when interpreting analytics; restored processing does not recover missing observations.
2. Add off-host incident history, recovery-aware notifications and a read-only dashboard. Cloudflare currently stores only its latest report/check; no notification delivery is configured.
3. Add an authenticated probe outside Cloudflare to detect loss of the checker itself. Keep runtime credentials out of browser code and rotate them before expiry.

No raw-data retention policy or collection schedule changed in this deployment.

## Repository validation

On current main plus this activation change: **439 tests passed**, along with typechecking, lint and architecture checks. The prior rollout also passed the isolated packed-consumer checks and 100 browser tests (two existing skips). No runtime credentials are committed.
