# Shared live airport boards

The optional live-airport service serves the existing airport card without changing recorded study data. Initial coverage is Zürich (ZRH), enabled for the Gleislicht capability namespace and exercised in the local widget lab. Other edition entries are disabled until explicitly configured and adopted. No edition deployment or npm publication is implied by this service deployment.

## Ownership

- `@motionstudies/core/domain/live-airport`: version 1 response contracts and boundary validation. All live timestamps are Unix seconds. Provider revisions remain revisions; they are not necessarily actual times.
- `@motionstudies/web/use-airport-feed`: capabilities, cancellable serial polling, timeout, retry and source isolation.
- `@motionstudies/web/components/AirportBoard`: optional Study/Now wrapper around `AirportHeroCard`; independent wall clock and flight selection, dated stale data, expiry and return to study. Recorded card state is preserved while hidden.
- `services/airports`: Worker gateway, provider adapter and one named Durable Object for global refresh coordination and budget accounting.
- R2: only the current normalized snapshot for each configured airport. Flight records are never written to Durable Object storage, which retains only control and usage state.

## API and configuration

Configuration is the readable `FEED_CONFIG` object in `wrangler.airports.jsonc`. It contains exact HTTPS origins, enabled editions, airport identities/timezones, refresh/expiry periods, budgets and a credential version. Airport lists are limited to 50. Provider URLs and query options are fixed in the adapter; requests cannot supply arbitrary airports, dates or upstream URLs.

- `GET /api/airports/v1/gleislicht/capabilities`: enabled flag and supported airport codes; never calls AeroDataBox.
- `GET /api/airports/v1/gleislicht/ZRH/board`: versioned fresh/stale/unavailable/disabled response with an optional snapshot.

Missing Origin is accepted only on a configured origin (ordinary same-origin GETs may omit it). CORS is not authentication: non-browser clients can forge Origin. The fixed query scope, per-IP limit and global upstream budgets protect the feed independently. Responses are no-store, with exact CORS and `Vary: Origin`; flight snapshots are kept in the private R2 bucket and served through the Worker, not a public bucket URL.

## Cost and fallback

The current AeroDataBox Direct FIDS endpoint costs **two units** per combined arrivals/departures request. It queries from one hour ago to two hours ahead, omitting codeshares, cargo, private flights and location data. Missing coverage stays missing. The card displays a narrower rolling horizon from the returned snapshot.

Refreshes are demand-driven and separated by at least five minutes for each airport. Concurrent viewers and editions share one refresh. Successful reads use the same R2 snapshot. With Zürich requested continuously, the maximum routine rate is 576 units/day, or 17,856 units over 31 days. Limits are conservatively set to 1,000 units per UTC day and 30,000 per UTC calendar month; this also limits any 31-day billing window to at most 31,000 units. These counters cover this service only, not separate uses of the account. Failed/interrupted upstream attempts reserve two units as well. Do not reset counters to recover provider access.

Provider failures back off from five minutes to one hour; Retry-After may extend this. A 401, 402 or 403 latches the feed off and deletes cached flights. Capabilities then report disabled. After resolving access, increment `credentialVersion` and redeploy the Worker to reset the circuit without resetting usage.

Snapshots are fresh for five minutes and may be displayed as stale until fifteen minutes after retrieval. The browser checks expiry against its wall clock even during network failure. Expired data is never silently substituted for a live board. The user can return to the recorded study. Turning `FEED_CONFIG.enabled` off disables all live capabilities; the next capabilities request clears snapshots and cleanup alarms also remove them. No edition rebuild is needed for this setting.

## Retention

The Starter plan currently lists seven-day retention. This implementation uses a much shorter lifetime: fifteen minutes, with an alarm checking expiration and removing R2 objects even without viewers. A one-day R2 lifecycle is a backup; lifecycle deletion is asynchronous and is not the freshness mechanism. If cleanup alarms fail, the backup still has ample margin below seven days. No raw response archive, flight-history dataset or long-term derived statistics are implemented. Those need a specific product and rights decision before collection starts.

## Local development

The root `.dev.vars` file is ignored by Git and holds `AERODATABOX_KEY`; use mode 0600. Never put the key in a `VITE_` variable, committed file, command argument, frontend bundle or log. The original supplied key file is separate from this ignored development copy.

Run `npm run lab` to use the deployed shared feed through the lab's same-origin development proxy. For Worker development, run `npm run dev:airports` with Wrangler installed, then start the lab with `MOTION_AIRPORT_WORKER_URL=http://127.0.0.1:8787 npm run lab`. The development proxy sets the configured site origin. Now demonstrates real Zürich; Study remains the invented Northfield fixture. The API key is used only inside the Worker. Default previews share the production cache and budget; local Worker testing has a separate local counter, so keep paid smoke tests bounded. Production lab builds have no local proxy and use the same-origin deployed API.

Use `npm test -- services/airports/airports.test.ts`, `npm run typecheck`, `npm run lint`, `npm run check:architecture`, the airport browser tests and `npm run check:packed` before release. Browser tests intercept the live API with synthetic data; they do not consume paid provider quota.

## Deployment and operations

1. Create the private `motionstudies-airport-cache` R2 bucket and set one-day expiry for `board/` objects.
2. Deploy `wrangler.airports.jsonc`. Without a secret, capabilities stay disabled and no paid requests occur.
3. Set `AERODATABOX_KEY` with `wrangler secret put --config wrangler.airports.jsonc`, supplying the key through stdin.
4. Verify capabilities, one live board, repeated cached reads, rejected origins and unsupported queries.

To cancel: set `FEED_CONFIG.enabled` to false and deploy. Verify disabled capabilities and cache cleanup, then remove the provider secret if no longer needed. Recorded edition fixtures remain independent. Add new airports to configuration only after checking coverage and the refresh budget; each edition must adopt the shared web package once. The Worker response version lets that deployment evolve independently.

## Sources inspected 12 September 2026

- [AeroDataBox Direct API schema](https://doc.aerodatabox.com/docs/openapi-direct-v1.json)
- [AeroDataBox plans](https://aerodatabox.com/pricing) and [terms](https://aerodatabox.com/terms)
- [Cloudflare Durable Object alarms](https://developers.cloudflare.com/durable-objects/api/alarms/)
- [R2 object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)

## Pilot status

Deployed on 12 September 2026 at `motionstudies.app/api/airports/*` with a private R2 bucket, one-day backup expiry and the API key stored as a Worker secret. Zürich/Gleislicht is the only enabled airport/edition mapping. Public edition frontends and npm package versions have not been updated by this work.
