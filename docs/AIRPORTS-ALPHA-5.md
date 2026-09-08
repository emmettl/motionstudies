# Airport boards · 0.1.0-alpha.5

Shared airport hero cards offer departure and arrival split-flap boards. Their rolling horizon is clipped to the study time window; loading characters flip continuously, empty messages appear in the display columns, and new rows settle in 675 ms plus stagger (25% shorter). Reduced-motion users see stable characters.

Core adds study-window filtering and optional observed origin/destination evidence. Data adds offline endpoint enrichment from cached global ADSB.lol heatmaps and the public-domain OurAirports reference. Unknown and ambiguous routes stay blank. The full-day manifest carries endpoint evidence independently of chunk playback, and the helper deduplicates repeated regional trace fragments.

Local release gates passed: typecheck, lint, architecture, 158 unit tests, release tarball/public export validation, 26 packed browser checks (two touch-inapplicable skips), 24 loader browser checks and npm publication dry runs.

The three air-enabled editions consume the shared card with edition-owned translations and position styles. Other editions receive exact published dependency upgrades. Existing synthetic or rail-only studies keep their existing data scope.


Published on 8 September 2026 from `4826b02` through the [trusted npm release](https://github.com/emmettl/motionstudies/actions/runs/34175603458). All four packages were accepted with provenance under `next` and installed from the registry with exact alpha.5 pins and integrity hashes.

The 4 September air fixtures now carry destination evidence for 4,695 of 6,708 Swiss track entries, 2,401 of 3,182 London entries and 3,056 of 4,385 Paris entries. These counts describe recorded segments, not unique flights. Airports are matched conservatively from full observed traces; unknown destinations remain unspecified. Input hashes and attribution are included, with local offsets checked against the archived clock. Paris chunk byte counts and hashes are regenerated after enrichment.

Edition type, lint, unit, package-boundary, production-build and applicable budget/worker-type checks passed. The shared packed widgets and loaders pass Chromium/WebKit, and the actual airport integrations pass 16 focused browser cases across the three air editions. Paris additionally checks that its wider hero clears the search controls. Gleislicht and All Change load the board assets lazily; All Change budgets the optional board separately. Its opening shell limit increases from 340 to 344 KiB (measured 341 KiB); air-index limits increase to accommodate the new endpoint evidence.

| Edition | Adoption commit | Scope |
| --- | --- | --- |
| Gleislicht | `531a121` | Airport card and enriched air fixtures |
| All Change | `f99ea44` | Airport card and enriched air fixtures |
| Correspondances | `6cc19ed` | Airport card and enriched air fixtures |
| Local / Express | `6133598` | Published dependency upgrade |
| Umlauf | `a932df1` | Published dependency upgrade |
| Norikae working branch | `c23a624` | Published dependency upgrade |
| Manifest | `7cb1f17` | Published dependency upgrade |
| Norikae main | `33591fb` | Published dependency upgrade |
