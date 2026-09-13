import type { NetworkSceneExtensions } from '@motionstudies/three/scene-extensions'
import type { NetworkMapStyle } from '@motionstudies/three/scene-style'
import type { RoadTopologySnapshot } from '@motionstudies/core/domain/road'
import type { StudyAirport } from '@motionstudies/core/domain/airport'
import { SpecimenStations, SpecimenRoadOverlay } from './InfrastructureSpecimen.tsx'
import { network } from './fixtures.ts'

export const infrastructureStyle: NetworkMapStyle = {
  vehicleElevation: 0.085,
  airports: { independent: true, labelRenderOrder: 30, fog: false },
  diagram: { laneSpacing: 0.11, casingWidth: 0.075, coreWidth: 0.04 },
  stationLabels: { rankLimit: () => Infinity, refreshInterval: 0.1 },
}
export const inactiveNetwork = { ...network, trains: [] }
export const specimenAirports: readonly StudyAirport[] = [{ id: 'field', name: 'Synthetic Airfield', city: 'Invented', iata: 'SYN', icao: 'SYN0',
  longitude: 0.22, latitude: 0.16, approachRadiusKilometres: 10, maximumApproachAltitudeFeet: 10000 }]
export const specimenRoads: RoadTopologySnapshot = {
  metadata: { publisher: 'Synthetic', sourceUrl: 'https://example.test', sourceAsset: 'invented', sourceCrs: 'WGS84', sourceDate: '2026-01-01', sourceUpdated: '2026-01-01',
    measurementSiteUrl: 'https://example.test', measurementSiteTableVersion: 1, measurementSitePublishedAt: '2026-01-01', model: 'Invented geometry',
    coverage: { federalStations: 0, federalDetectorRecords: 0, usableDirectionalGroups: 0, matchedDirectionalGroups: 0, highConfidenceDirectionalGroups: 0,
      continuityResolvedDirectionalGroups: 0, authoritativeResolvedDirectionalGroups: 0, reviewDirectionalGroups: 0, unmatchedDirectionalGroups: 0,
      matchedStations: 0, medianMatchDistanceMetres: 0, p95MatchDistanceMetres: 0, roads: 0, axisSegments: 0 } },
  roads: [], paths: [], sections: [], sites: [],
}
export const infrastructureExtensions: NetworkSceneExtensions = {
  stationPicking: 'custom', DiagramStations: SpecimenStations, RoadOverlay: SpecimenRoadOverlay,
  aircraftPicking: { event: 'click', accepts: event => event.dragDistance <= 5 },
}
