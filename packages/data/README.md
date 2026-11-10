# @motionstudies/data

Node-only offline preparation, source storage and release verification. Requires Node 26 or newer; ESM with TypeScript declarations.

```sh
npm install --save-exact @motionstudies/data@1.0.0
```

```js
import { parseCsvLine } from '@motionstudies/data/gtfs'

const fields = parseCsvLine('station_id,"Station, Central"')
```

## Included contracts

- GTFS reading, network merging/chunking and station ranking; GTFS ZIP reading requires host `unzip`.
- ADS-B heatmaps, air endpoint enrichment and bounded observation windows.
- Source storage, recorder evidence, feed health and release descriptor/file verification.
- Edition dependency/import boundary checking and module reference parsing.
- Bounded terrain rasters and water polygons, weather and power preparation.

Keep this package out of browser bundles. Editions own acquisition, source terms, attribution, transformations and publication rights. A code licence does not relicense data. No acquisition or measurement is implied by generated geometry.

## Imports and compatibility

Use explicit extensionless subpaths; there is no root barrel import. The package's `exports` map lists supported entry points. The four runtime packages share exact version 1.0.0; upgrade them together where used. Published public exports and documented behaviour follow semantic versioning from 1.0. Internal files are not an API. Editions adopt releases explicitly with their own checks.

See [the complete package contracts](https://github.com/emmettl/motionstudies/blob/main/packages/README.md), [release instructions](https://github.com/emmettl/motionstudies/blob/main/docs/RELEASING.md) and [the widget lab](https://motionstudies.app/lab/). Node 26 and npm 12 are the repository's development target; browser modules require a modern ESM build pipeline.

MIT. [Source and issues](https://github.com/emmettl/motionstudies).
