import { stressText } from './stress-fixtures.ts'
import type { NetworkSnapshot } from '@motionstudies/core/domain/network'
import type { SpatialLayoutSnapshot } from '@motionstudies/core/domain/spatial-layout'
import { network, layout } from './fixtures.ts'

export const branchingNetwork: NetworkSnapshot = {
  ...network,
  stops: [...network.stops, [.15, .175, stressText.longStation, '4', 'north']],
  edges: [...network.edges, [1, 3]],
  paths: [...network.paths!, [[.14, .13], [.18, .145], [.15, .175]]], edgePaths: [0, 1, 2],
  trains: [...network.trains, { ...network.trains[0], id: 'branch', route: '3', category: 'bus', headsign: 'North', stops: [[0, 0, 0], [1, 110, 130], [3, 240, 240]], pathSegments: [0, 2] }],
}
export const branchingLayout: SpatialLayoutSnapshot = { ...layout,
  stops: [...layout.stops, ['north', 0, -.55]],
  paths: [[[-.8, 0], [-.4, .12], [0, 0]], [[0, 0], [.4, -.12], [.8, 0]], [[0, 0], [.15, -.25], [0, -.55]]],
}
export const denseNetwork: NetworkSnapshot = { ...branchingNetwork,
  trains: Array.from({ length: 48 }, (_, i) => {
    const base = branchingNetwork.trains[i % 3], shift = (i % 8) * 3
    return { ...base, id: `dense-${i}`, shortName: `LAB ${i + 1}`, headsign: `${base.headsign} · synthetic service ${i + 1}`, start: -shift, end: 240 - shift,
      stops: base.stops.map(([stop, arrival, departure]) => [stop, arrival - shift, departure - shift] as const) }
  }),
}
const metadata = { source: 'Synthetic', sourceUrl: 'https://example.test', productUrl: 'https://example.test', edition: 'Lab', attribution: 'Invented', sourceCrs: 'WGS84', outputCrs: 'WGS84', simplificationToleranceMetres: 0 }
export const policyBoundary = { metadata, rings: [[[.01, .01], [.29, .01], [.29, .18], [.01, .18], [.01, .01]] as const] }
export const policyLakes = { metadata: { ...metadata, minimumAreaSquareKilometres: 0 }, lakes: [{ id: 'lake', name: 'Synthetic lake', areaSquareKilometres: 1, polygons: [[[[.035, .14], [.09, .14], [.09, .17], [.035, .17], [.035, .14]] as const]] }] }
