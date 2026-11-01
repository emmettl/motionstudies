# England, shared power infrastructure and KRAFT

**1 November 2026.** Implementation audit of England and the recorder, following the [shared weather extraction](WEATHER-FIELDS.md). England already consumes the shared power contract. Its remaining power code mostly expresses British source interpretation and the work's composition; a second wholesale extraction would blur that useful boundary.

## Reuse, ownership and adoption

| Existing implementation | Decision | Reason |
| --- | --- | --- |
| Core `domain/power-day`: `readPowerDay`, `powerPeriod`, `unitPower`, `plannedPower`, `sumPower`, `fuelMixAt` | Reuse for GB settlement and unit inspection | Already shared between recorder writer and England compiler/browser. Preserves MWh versus MW, signed values, missing values, settlement revisions, ambiguous plans and exclusive interval ends. |
| Data `source-store`, `release`, `release-files` | Reuse for KRAFT acquisition and handoff | Captured bytes, explicit descriptors, safe paths, digests, quotas and offline replay are independent of electricity provider. England already adopts the release verifier. |
| Web `TimelineScrubber`, core timeline/daylight, weather evidence and GPU helpers | Adopt where needed | England's `RecordedClock` already wraps the shared scrubber. KRAFT can use the weather contract without adopting England's map or allocating station output from weather. |
| Recorder Elexon/NESO/DESNZ capture and normalization | Keep in recorder | Source identities, settlement-run precedence, endpoint selection and capture policy are provider adapters. They do not belong in browser-safe core. |
| England `scripts/power/placement.mjs`, `curated.csv`, `osgb.mjs`, CSV decoding and generation selection | Keep in England | British registers, technology gates, name/owner/capacity matching and population exclusions are study policy. Swiss plant identity and projected coordinates need their own adapter. A second demonstrated use can justify a smaller extraction later. |
| England `PowerMap`, `UnitChart`, fuel names/colours, map camera and inspector | Keep in England | SVG markers, radius scales, palette, projection and panel composition are authored choices. KRAFT's border bands and possible spatial/abstract transitions are still experiments. No shared power renderer is established. |
| England `transport/power-context.ts` and `adopt-power-context.mjs` | Keep as a dated compatibility adapter | This separate national context preserves Elexon rows, publication times, source indices, GB scope and a particular civil date. It is not a general European area/border schema. |
| England's four npm pins | Adopt published alpha.46 | Brings the consumer onto the verified shared baseline. This audit adds no package API, so it needs no further npm release. Recorder compatibility is checked in isolation; its package pins are not changed by this adoption. |

The detailed acquisition and placement history remains in [Power](POWER.md) and [England's implementation record](https://github.com/emmettl/england/blob/main/docs/POWER-DAY.md). England's retained day has 451 generation units, 267 located. Unplaced members contribute to group totals; supplier aggregates and interconnectors are excluded from the displayed generation population. Coordinates identify a site or connection with a method, never a demonstrated path between generation and consumption.

## What KRAFT should carry forward

The most valuable inheritance is the evidence path: immutable source capture → normalized release → edition compiler → verified static artifact → inspectable quantity at a recorded time. Reuse that path and its verifiers. Preserve the distinction between a provider's complete ledger, the work's selected population and an independent national total. A smooth visual transition must not interpolate extra measurements or conceal unavailable intervals.

Keep `PowerDay` version 1 intact. It requires a complete civil day of 46, 48 or 50 half-hour settlement periods, per-unit MWh, settlement runs and B1610/plan source linkage. Its national fuel samples have a five-minute validity policy. KRAFT's first surveyed sources describe reporting areas and borders, with mixed quarter-hour/hourly intervals, power in MW or GW, and a 24-hour UTC window. Adding empty settlement units or invented run identifiers would misdescribe those inputs.

The next shared power contract should be a separate area/edge series, proven against KRAFT's retained European inputs before publication. It needs:

- Explicit reporting-area identities and scope; countries, bidding zones and control areas must not become interchangeable IDs.
- A measure identity and evidence/status for each series: generation by fuel, demand, physical exchange, commercial exchange and storage intake remain distinguishable. Preserve provider category names alongside any edition mapping.
- Native UTC interval bounds, declared timestamp convention and quantity units. Quarter-hour and hourly evidence can share a playback instant without acquiring the same temporal support. Convert GW to MW explicitly; derive MWh by integrating the documented support.
- An explicit border orientation and sign convention. Keep each provider/reported side separately identifiable; deduplicate a mirrored pair only through a documented edition policy. Equal opposite values from the same provider are not independent corroboration.
- Null versus zero, revisions/publication instants where available, source hashes, original-row linkage, licence and attribution. Do not replace disagreeing Swiss providers with a reconciled value without a method.
- Coverage-aware reading and integration that report missing duration and contributor counts. Do not silently fill a gap or scale a partial total to a full day.

Start with one pure reader and one offline adapter over retained bytes. Publish only when they reproduce native intervals, signed exchanges, gaps and provenance from those real inputs. The current GB national-context reader is useful as a comparison for bounded sample holding and inspectable source rows; its provider fields should not determine the new schema.

## Weather and the shared clock

The alpha.46 weather contract already covers the reusable field work: source kinds, height, units, missingness, grid sampling, interval support and GPU resource ownership. Cloud fraction, radiation, atmospheric wind and metered generation remain separate variables. A wind-speed field does not establish a station's output; illustrative cloud shadows do not measure PV production.

England's recorded station day is 5 September 2026 and its bus/national context is 14 September. KRAFT's surveyed electricity window is 16 September UTC. None of these are a same-day overlay. A full GB civil-day series also starts at 23:00 UTC during BST, so a complete UTC-day comparison can need two civil releases and explicit clipping. Reuse the absolute clock and interval readers; establish actual coverage before composing layers. England has no dated weather artifact to adopt in this audit.

## Repeatable compatibility check

```sh
# Candidate packages: build compiled tarballs and install isolated consumers.
npm run check:power-consumers -- --england /path/to/england --recorder /path/to/motionstudies-recorder

# Published packages, plus an optional explicitly supplied retained handoff.
npm run check:power-consumers -- --england /path/to/england --recorder /path/to/motionstudies-recorder \
  --registry 0.1.0-alpha.46 --manifest /path/to/power-evidence-release/manifest.json
```

The checker copies code/config into temporary consumers and reads England's static evidence through a symlink. It installs packages with lifecycle scripts disabled, runs England's tests/lint/build and the recorder's power writer/release tests. The latter use temporary fixtures and injected HTTP responses; they do not collect provider data. It never copies the recorder's private store. With `--manifest`, England's offline compiler verifies that explicit handoff and recompiles into a new temporary directory, then compares the day and every unit evidence extract byte-for-byte with England's retained publication. The existing compiler's 64 MiB publication ceiling applies. Private handoffs and raw provider bytes remain outside the shared repository.

Each run leaves a JSON report with package identities/integrities, checks and optional replay digests. Candidate and registry checks are separate: passing local tarballs does not prove npm adoption. A future shared power change should run these consumer checks alongside its core tests and packed package gate. This audit changes no data artifact or publication route.

Both modes passed against alpha.46: England's 32 tests, lint and TypeScript/production build; the recorder's six power writer/release tests. The registry replay reproduced `day.json` and all 451 unit evidence files exactly, with the same 267 placements. Ten shared power/release tests and the architecture check passed. A production-browser smoke check in desktop Chromium and 390 px WebKit exercised study/station selection, verified evidence loading and seeking to period 48 without page errors. See the [recorded package and replay evidence](evidence/power-alignment-alpha46.json). The browser check was an audit run, not an added recurring browser gate; source adoption does not establish a served deployment.
