# @motionstudies/three

React Three Fiber scenes, rendering policies and terrain surfaces. ESM with TypeScript declarations. Peers: React ^19.3.0, React Three Fiber ^9.8.1 and Three.js ^0.187.0.

```sh
npm install --save-exact @motionstudies/three@1.0.1 @react-three/fiber@9.8.2 react@19.3.1 react-dom@19.3.1 three@0.187.0
```

```ts
import { createTerrainGeometry } from '@motionstudies/three/terrain-surface'

const geometry = createTerrainGeometry({
  rows: 2, columns: 2,
  widthMetres: 100, depthMetres: 100,
  elevations: [10, 12, 9, 11],
})
// The caller owns this geometry:
geometry.dispose()
```

## Included contracts

- `NationalNetworkScene`, `HubPulseScene`, `StationFlowScene` and optional `RoadTrafficLayer`.
- Camera, label, style, spatial morph, picking, performance and scene extension contracts.
- CPU terrain geometry and WebGL2 GPU height surfaces; row zero is north, scene Y is elevation.

The current scene backend is WebGL2. Consumers can supply supported policies through public exports; renderer internals are private. Keep callbacks stable and use the scene's existing playback/frame ownership. Terrain scale, exaggeration and datum are explicit. GPU surfaces dispose their own resources; supplied textures remain caller-owned. CPU raycasting does not see shader displacement.

## Imports and compatibility

Use explicit extensionless subpaths; there is no root barrel import. The package's `exports` map lists supported entry points. The four runtime packages share exact version 1.0.1; upgrade them together where used. Published public exports and documented behaviour follow semantic versioning from 1.0. Internal files are not an API. Editions adopt releases explicitly with their own checks.

See [the complete package contracts](https://github.com/emmettl/motionstudies/blob/main/packages/README.md), [release instructions](https://github.com/emmettl/motionstudies/blob/main/docs/RELEASING.md) and [the widget lab](https://motionstudies.app/lab/). Node 26 and npm 12 are the repository's development target; browser modules require a modern ESM build pipeline.

MIT. [Source and issues](https://github.com/emmettl/motionstudies).
