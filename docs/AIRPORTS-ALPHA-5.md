# Airport boards · 0.1.0-alpha.5

Shared airport hero cards offer departure and arrival split-flap boards. Their rolling horizon is clipped to the study time window; loading characters flip continuously, empty messages appear in the display columns, and new rows settle in 675 ms plus stagger (25% shorter). Reduced-motion users see stable characters.

Core adds study-window filtering and optional observed origin/destination evidence. Data adds offline endpoint enrichment from cached global ADSB.lol heatmaps and the public-domain OurAirports reference. Unknown and ambiguous routes stay blank. The full-day manifest carries endpoint evidence independently of chunk playback, and the helper deduplicates repeated regional trace fragments.

Local release gates passed: typecheck, lint, architecture, 157 unit tests, release tarball/public export validation, 26 packed browser checks (two touch-inapplicable skips), 24 loader browser checks and npm publication dry runs.

The three air-enabled editions consume the shared card with edition-owned translations and position styles. Other editions receive exact published dependency upgrades. Existing synthetic or rail-only studies keep their existing data scope.
