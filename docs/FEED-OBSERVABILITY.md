# Feed observability: contracts and recorder adapter

## Implemented scope

The first slice provides common registry, event and health-report contracts in `@motionstudies/data`, a read-only recorder adapter, a command-line report and an example registry for the four MiniMax feeds. It runs independently of collection and makes no provider calls. It can inspect the existing recorder deployment without changing or restarting it.

The broader goal is to follow each feed through capture, processing, publication and consumption, with durable incident history and an observer outside the recording host. This slice establishes the interfaces and tests; it does not install a monitoring service, emit notifications or implement incident persistence.

## Run

From the Motion Studies repository, using Node 24 or later:

```sh
node scripts/feed-health.mjs \
  --registry config/feeds/recorder.example.json \
  --producer recorder-minimax \
  --status /path/to/recorder/status.json
```

`npm run feeds:health -- ...` is also available. The CLI writes JSON to stdout and never changes the status file or collection state. Redirect the result to an operator-owned output file if needed. No host credentials or private `host.json` configuration are read. Input limits are 256 KiB for the registry and 4 MiB for a status report; files must be regular JSON files. Missing status produces a structured unknown report; malformed/oversized/unreadable input fails explicitly.

Exit codes:

- **0:** current telemetry; capacity healthy; every active feed is healthy or waiting.
- **2:** valid report with degraded/unknown active feed health, unavailable telemetry or capacity needing attention.
- **1:** input/contract/argument error; no health report was produced. An observer must treat this as a failed check, not retain a green result indefinitely.

The complete example intentionally reports `unknown` for archive upload without additional upload evidence. Expect code 2 even when the capture and normalization stages are healthy. This is evidence coverage, not a claim that uploads have failed. Do not wire code 2 directly to paging before stage policies and incident handling exist. Waiting also needs stage-specific deadline evaluation before it can serve as an unattended alert policy.

## Registry

Each feed has a stable ID, label, producer/binding, source identity, maintainer, runbook, configured state, schedule and a dependency graph of stages. Dependencies must exist and be acyclic. Duplicate IDs or producer/feed bindings are rejected. Registry readers reject unknown fields, unsupported versions, invalid times/timezones and unbounded values.

Configured state is `active`, `paused` or `setup-required`. A pause is explicit operator configuration; the adapter never infers it from a dead process. Keep registry changes under review, since declaring a feed paused affects its summary and CLI exit result.

Interval, daily (timezone and local deadline), push and manual schedules are representable. **The recorder adapter evaluates timestamp freshness only; it does not yet evaluate daily due dates, missed scheduled starts, startup grace or maintenance windows.** Those rules belong in the independent observer. The recorder example uses 30-second bus acquisition and 60-second other acquisition intervals; capture thresholds use three intervals. Heartbeat allowance is 180 seconds with up to 30 seconds clock skew. Normalization allows 4,500 seconds since the end of the latest completed receipt hour, covering the hourly cycle plus 15 minutes of processing. Analytics status permits 30 minutes. These are explicit initial settings to calibrate, not established service guarantees.

The example identifies feeds by the recorder's example configuration names. Verify bindings and enabled stages against the host being observed. A missing feed or source mismatch remains unknown. One recorder status contains at most one analytics worker, so only one feed may bind an analytics stage for that producer.

## Health report semantics

Health reports have both observer time (`observedAt`) and producer report time (`producerGeneratedAt`). Telemetry is current, stale, missing or invalid. Stale/invalid/missing telemetry forces every stage and capacity assessment to unknown. Each stage has independent state, bounded reason codes, timestamps and numeric metrics; no free-form producer errors, paths or credentials are copied.

`readFeedHealth` validates consistency at the report's recorded `observedAt`; it does not consult the wall clock. Consumers must also age `observedAt` against their own clock before displaying current health. A valid saved report is historical evidence, not a renewable heartbeat. Running the adapter again reevaluates producer freshness at the new observer time.

| Stage | Evidence used | Limits |
| --- | --- | --- |
| Capture | Last successful receipt timestamp, collection state/plan, available source age | Receipt age is recomputed, never copied from a cached age or `healthy` label. Required source time missing means unknown. An old historical `lastFailure` does not prove an active failure after recovery. |
| Normalize | Latest normalized receipt-hour end | Lag is recomputed. The timestamp is `latestPeriodEnd`, not a claim that all earlier hours are present or valid. Future hours are unknown. |
| Archive | Incomplete close-out count and shared processing-job outcome | Zero incomplete close-outs does not prove upload: local-only close-outs exist. A processing job covers several operations; `processing-job-failed` does not identify an R2 outage. Verified upload evidence is a follow-on adapter. |
| Analytics | Its own status timestamp, last successful month, pending months, waiting inputs, current worker failure | Old analytics status stays unknown even under a fresh host heartbeat. Waiting on open inputs is normal. A completed pass is not proof that the expected latest service date is published. Daily deadlines and publication checks follow separately. |
| Other stages | No evidence yet | Declared publication/serving stages remain unknown until supported; no success is inferred from a process exit. |

Recorder status currently stores source age rather than the original source timestamp. The adapter estimates `sourceGeneratedAt` from report time minus that age, then ages it forward to observer time. It has the precision and semantics of the producer's source-age field (which may be edge receipt time); it is not necessarily the original provider observation timestamp. Direct provenance timestamps should replace this legacy projection in a later recorder change.

Feed summaries prioritize degraded, then unknown, then waiting, then healthy across applicable stages. Configured paused/setup state is preserved. They do not suppress downstream symptoms based on dependency graphs; incident correlation is future work. Local analytics depends on normalization, not archive upload.

Capacity includes only safe numeric usage, reservation, free-space and forecast values plus bounded state/reasons. It reflects the existing **local** recorder ledger; it does not inspect or certify R2 capacity. Forecasts retain the producer's limitation: current capture growth does not include all future processing growth or new feeds.

## Event contract

`readFeedEvent(input, registry)` validates a caller-supplied stable event ID, feed/stage/producer identity, run and optional parent run IDs, revision, occurrence/receipt timestamps, type (`started`, `succeeded`, `failed`, `heartbeat`), bounded reason codes and numeric metrics. Only registered feed/stage/producer combinations are accepted. IDs survive replay unchanged. The validator does not generate events, persist them or deduplicate a store. Producer adapters will assign deterministic IDs and a later event store will enforce uniqueness.

This intentionally excludes provider payloads, free-form stack traces, credential-bearing URLs and vehicle identities. Keep detailed diagnostics in their existing restricted logs and add safe evidence references in a versioned extension when required.

## Verification

Tests cover stale-green reports, old source data with fresh receipts, missing/future clocks, missing feeds, pauses and rollover, normalization lag, independent analytics progress, unavailable upload/serving evidence, redaction, contract validation and CLI exit/read limits. The package smoke check imports the subpaths from real packed artifacts and typechecks their public declarations.

Local validation: 374 tests passed; typechecking, lint and architecture checks passed. The packed consumer check passed public imports, declarations, Node tooling, production build and 100 browser checks (two existing skips).

Read-only live validation on 17 September 2026 at 21:49 UTC found all four capture and normalization stages healthy, the local capacity assessment healthy, and bus analytics waiting on one input with no pending months. Archive upload remained unknown because the host status lacks verification evidence. The redacted report is in `docs/evidence/feed-observability-recorder-2026-09-17.json`; it is a dated snapshot, not a current service-health claim. The live recorder was not changed.

## Next slices

1. Add explicit upload/publication evidence and overdue-work assessment, then persist run events and incident transitions with replay/restart safety and bounded retention.
2. Run an independent checker outside the Mac; detect missing host heartbeats, missed expected schedules and the checker itself failing. Check the actual consumer manifest/release period.
3. Add Swiss edge and LUFT adapters using the same contracts; evaluate daily deadlines in the declared timezone.
4. Serve the read-only overview/history and a small public data-freshness summary, then configure notification delivery and tune incident policies.

No package version is bumped or published by this change. The CLI is usable directly from the repository now; downstream repositories can adopt the exported modules after the normal shared-package release.
