# @motionstudies/core

Framework-free domain contracts and motion primitives. ESM with TypeScript declarations; no React, Three.js, browser or Node dependencies.

```sh
npm install --save-exact @motionstudies/core@1.0.1
```

```ts
import { timelinePosition } from '@motionstudies/core/timeline'

const progress = timelinePosition(1800, { start: 0, end: 3600 }) // 0.5
```

## Included contracts

- Transport: network days and repeated patterns, station/vehicle calls, road and air contracts, indexing and interpolation.
- Fields: supported station estimates, gridded and weather series, illustrative paths and daylight.
- Recorded evidence: published-day reading and reconciliation, power days and power series.
- Presentation primitives: timelines, themes, labels, terrain and paused-frame tracking.

Missing evidence stays distinct from zero. Consumers own source selection, units, timezones, service days, provenance and authored scales. Illustrative paths do not represent tracked individuals.

## Imports and compatibility

Use explicit extensionless subpaths; there is no root barrel import. The package's `exports` map lists supported entry points. The four runtime packages share exact version 1.0.1; upgrade them together where used. Published public exports and documented behaviour follow semantic versioning from 1.0. Internal files are not an API. Editions adopt releases explicitly with their own checks.

See [the complete package contracts](https://github.com/emmettl/motionstudies/blob/main/packages/README.md), [release instructions](https://github.com/emmettl/motionstudies/blob/main/docs/RELEASING.md) and [the widget lab](https://motionstudies.app/lab/). Node 26 and npm 12 are the repository's development target; browser modules require a modern ESM build pipeline.

MIT. [Source and issues](https://github.com/emmettl/motionstudies).
