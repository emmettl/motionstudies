# Recorder evidence and durable incident history

This extends the [feed observability contracts](FEED-OBSERVABILITY.md). Evidence verification is read-only. Incident tracking writes only to a separately selected operational store. Neither starts collectors, contacts providers/R2, sends notifications, nor changes data retention.

## Run with evidence and history

```sh
node scripts/feed-health.mjs \
  --registry config/feeds/recorder.example.json \
  --producer recorder-minimax \
  --status /path/to/recorder/status.json \
  --evidence /path/to/dated-evidence-plan.json \
  --incidents /path/to/observability/recorder-history
```

The incident directory is created on first use; its parent must already exist. An existing directory without a valid state is an error, not permission to initialize new history. Both flags are optional. JSON stdout remains a `feed-health` report; history is separately readable through `readIncidentStore(root)`. Code 1 includes persistence/lock/capacity failures and must be treated as a failed monitoring check.

Use `config/feeds/recorder-evidence.example.json` as a **dated template**, replacing its paths and expectations with the intended collection/release. Do not reuse its dates as a standing monitoring configuration. Each stage must exist in the registry. The example registry now declares a bus `publication` stage depending on analytics.

## Evidence expectations

The plan binds each target to a registered producer/feed and declares a deadline. `validUntil` expires the whole plan; expired expectations yield unknown health. Deadlines cannot precede the expected period end or exceed plan validity. A future independent scheduler must generate the next expectations; this CLI does not advance dates automatically.

### Archive

An archive target selects one closed journal, its close-out record, its expected end and its delivery deadline. The reader verifies the journal's source/period, hashes its actual bytes, requires the close-out to reference that journal/hash, and checks every captured UTC date. Normalization must have no skipped/unhandled hours, bus day packs must exist, and each required upload summary must account for every file with no errors, stopped upload or failed files. A non-bus feed may legitimately have no published day-pack upload.

Missing upload evidence is waiting before its deadline and degraded afterwards. Recorded upload errors are degraded immediately. Invalid hashes, mismatched identities, changed/unreadable files and malformed evidence are unknown. A local-only `complete: true` cannot prove an upload.

Healthy means **the selected journal has internally consistent evidence that the recorder uploaded or verified its files at close-out**. It does not prove those objects still exist in R2 after retention, that every historical journal was selected, or that the recorded day had full observation coverage. Metrics are named `recorded-upload-files` for this reason. A later external consumer/storage check is still required.

### Publication

A publication target selects a native `feed-quality-release-pointer`, an operator and the expected completed London service date. The pointer's validated result digest selects its sibling immutable release; the reader verifies the manifest, byte count, file hash, payload identity, operator/range and expected day. The selected day must be `current`, have a revision/quality result and match the London study-day boundaries. This preserves 23/25-hour days. The pointer is reread to detect concurrent promotion.

A missing expected day, older release or pending/stale selected day becomes degraded after the deadline. Valid hashes alone do not establish a current expected period. A current day can still have partial collection coverage: publication health does not turn it into complete coverage or measured punctuality.

Healthy proves the **local selected artifact**. It does not prove the HTTP endpoint, proxy or edition deployment serves it. Consumer checks remain a separate stage.

All evidence paths come from the operator-supplied plan, never from the host status JSON or free-form provider data. Limits: 16 feed selections, 16 MiB per journal, 1 MiB per close-out, 2 MiB per release, small pointer/manifest limits and 64 MiB total reads per invocation. Final symlinks and nonregular files are refused. Reports contain only bounded reason codes and safe timestamps/counts; private paths and raw errors stay out of stdout.

## Incident lifecycle

`updateIncidentStore(root, registry, report, options)` processes fresh, validated health reports. Defaults:

| Setting | Default |
| --- | --- |
| Sustained problem before opening | 120 seconds |
| Sustained healthy evidence before recovery | 60 seconds |
| Retain recovered incidents | 180 days after recovery |
| Maximum retained transition events | 10,000 |
| Maximum committed state file | 8 MiB |

The first problem observation starts a persisted candidate. A later problem observation after the grace period opens one incident for that producer/feed/stage. Repeated conditions do not add duplicate events; changed state/reasons add `updated`. Recovery requires observed healthy state across its grace period and an advancing producer heartbeat. Changing only observer time on a replayed producer report cannot confirm recovery. These checks require repeated invocations; this change does not install a scheduler.

Unknown, waiting, paused, removed and dependency-suppressed stages never recover an existing incident. Missing instrumentation such as `upload-evidence-unavailable` does not open incidents by itself. Once a plan supplies evidence, invalid/expired evidence is actionable unknown health. A producer heartbeat failure opens one producer incident rather than incidents for every stage. New downstream symptoms are suppressed while their upstream dependency is unhealthy; existing incidents remain unresolved. Capacity problems are separate producer incidents. This is deterministic dependency suppression, not a claim to infer root cause from logs.

The store contains the latest report, active incidents, pending candidates and opened/updated/recovered events with stable IDs. Equal-time identical replay is a no-op; conflicting equal-time and older observations are rejected. Registry identity, producer identity and retention/debounce policy are bound to the store; changing policy requires an explicit migration. Configured pauses may change without rewriting the historical incidents.

## Durability, retention and recovery

Writers take an exclusive sibling `<store>.lock` **before initializing the directory**. They write a checksummed state to a private temporary file, flush it, rename atomically, then flush the directory. Readers see the previous or next complete state. A crash before promotion cannot replace the committed history with partial JSON. Permissions for newly created stores/files are 0700/0600.

Only whole recovered incidents older than the retention period are pruned, including their transition events. Active incidents and their history are retained. `prunedEvents` makes retention visible. Reaching either event or byte capacity fails before replacing the committed state; no unresolved history is silently discarded. The next operator action is an explicit archive/migration, not relaxing the budget inside a retry loop. No raw recordings, normalized data or analytics releases are deleted.

Corrupt/missing state in an existing store fails closed and must be restored from a verified copy. A lock left by an interrupted process is also refused: inspect its host/PID, establish that the writer is gone, and preserve the committed state before removing that specific lock. No automatic stale-lock takeover is implemented. If interruption happened before the first state was ever committed, preserve that incomplete directory for inspection and initialize a new store at a new path. Uncommitted `.state-*` files are ignored on reads and can be inspected separately; the writer does not scan/delete arbitrary leftovers.

This history is currently local. It can survive normal process restarts and detected interruptions, but cannot diagnose loss of the entire disk on its own. Off-host export, the independent heartbeat checker, consumer probes, daily expectation generation, notifications and a shared dashboard remain subsequent work.

## Validation scope

Fixtures exercise real recorder close-out and release layouts, stale/missing/expired targets, false local completion, hash mismatches, partial upload failure and stale day selection. Store tests cover debounce/recovery, normal restart, replay/conflict rejection, concurrent initialization, dependency suppression, retention, corruption, capacity failure, abandoned locks and ignored uncommitted temporary files. CLI tests verify opt-in persistence, redacted errors and unchanged JSON output. These are controlled local tests; no production failure was induced and no monitor was deployed by this change.

Validation for this extension: 394 tests passed, plus typechecking, lint and architecture checks. The isolated packed consumer passed public imports, declarations, Node tooling, a production build and 100 browser tests (two existing skips).
