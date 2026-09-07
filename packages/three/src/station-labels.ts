import type {
  NetworkRouteIndexEntry,
  NetworkSnapshot,
  NetworkTrain,
  StationIndexEntry,
} from '@motionstudies/core/domain/network'

/** Shared selection semantics, independent of edition ranking and camera layout. */
export function stationLabelSelection(
  snapshot: Pick<NetworkSnapshot, 'stops' | 'trains'>,
  selectedRoute?: NetworkRouteIndexEntry,
  selectedTrain?: NetworkTrain,
  referenceSnapshot = snapshot,
): { stationNames: Set<string>; terminalNames: Set<string> } {
  const stationNames = new Set<string>()
  const terminalNames = new Set<string>()
  const addTrain = (train: NetworkTrain, source: typeof snapshot) => {
    train.stops.forEach(([stopIndex], index) => {
      const name = source.stops[stopIndex]?.[2]
      if (!name) return
      stationNames.add(name)
      if (index === 0 || index === train.stops.length - 1) terminalNames.add(name)
    })
  }
  if (selectedTrain) {
    addTrain(selectedTrain, snapshot)
  } else if (selectedRoute) {
    // Preserve membership if a selected route outlives its active timetable chunk.
    for (const index of selectedRoute.stopIndexes) {
      const name = snapshot.stops[index]?.[2]
      if (name) stationNames.add(name)
    }
    // Stop indexes belong to their own snapshots. Join reference branches by
    // station name, as the station index does, never by cross-snapshot indexes.
    for (const source of referenceSnapshot === snapshot ? [snapshot] : [snapshot, referenceSnapshot]) {
      for (const train of source.trains) {
        if (train.route === selectedRoute.name && train.category === selectedRoute.category) addTrain(train, source)
      }
    }
  }
  return { stationNames, terminalNames }
}

/** Selection wins before retention, editorial rank, distance and collisions. */
export function stationLabelPriority(
  name: string,
  selectedStationName: string | undefined,
  terminalNames: ReadonlySet<string>,
  emphasised: boolean,
): number {
  if (name === selectedStationName) return 0
  if (terminalNames.has(name)) return 1
  return emphasised ? 2 : 3
}
import {
  homeMapDistanceScale,
  type MapCameraFraming,
} from './map-camera.ts'

export const MAX_STATION_LABELS = 96
export const STATION_LABEL_SETTLE_SECONDS = 0.16

export function stationLabelsCanRepopulate(
  stableSeconds: number,
  settleSeconds = STATION_LABEL_SETTLE_SECONDS,
): boolean {
  return stableSeconds >= settleSeconds
}

export function stableStationLabelBudget(
  targetBudget: number,
  retainedCount: number,
  canRepopulate: boolean,
): number {
  return canRepopulate ? targetBudget : Math.max(targetBudget, retainedCount)
}

export interface StationScreenPoint {
  readonly index: number
  readonly x: number
  readonly y: number
}

export interface StationLabelCandidatePriority {
  readonly name: string
  readonly rank: number
  readonly priority: number
  readonly retained: boolean
  readonly distance: number
}

export function compareStationLabelCandidates(
  first: StationLabelCandidatePriority,
  second: StationLabelCandidatePriority,
): number {
  return (
    first.priority - second.priority ||
    Number(second.retained) - Number(first.retained) ||
    first.rank - second.rank ||
    first.distance - second.distance ||
    first.name.localeCompare(second.name, 'de-CH')
  )
}

export function stationTapRadius(pointerType: string): number {
  return pointerType === 'touch' || pointerType === 'pen' ? 30 : 16
}

export function stationIndexAtScreenPoint(
  x: number,
  y: number,
  stations: readonly StationScreenPoint[],
  radius: number,
): number | undefined {
  let selectedIndex: number | undefined
  let closestSquaredDistance = radius * radius

  stations.forEach((station) => {
    const squaredDistance =
      (station.x - x) ** 2 + (station.y - y) ** 2
    if (squaredDistance > closestSquaredDistance) return
    selectedIndex = station.index
    closestSquaredDistance = squaredDistance
  })

  return selectedIndex
}

export function stationLabelScreenHeight(
  selected: boolean,
  emphasised: boolean,
  labelRank?: number,
): number {
  if (selected) return 56
  if (emphasised) return 46
  if (labelRank === 1) return 44
  if (labelRank === 2) return 39
  if (labelRank !== undefined && labelRank >= 3) return 36
  return 40
}

export function stationLabelOpacity(
  selected: boolean,
  emphasised: boolean,
  labelRank?: number,
): number {
  if (selected || emphasised) return 1
  if (labelRank === 1) return 0.9
  if (labelRank === 2) return 0.78
  if (labelRank !== undefined && labelRank >= 3) return 0.66
  return 0.78
}

export function stationLabelWithinTier(
  labelRank: number | undefined,
  tierLimit: number | undefined,
): boolean {
  return tierLimit === undefined || (labelRank ?? Number.POSITIVE_INFINITY) <= tierLimit
}

export function stationLabelScreenWidth(
  label: string,
  screenHeight: number,
): number {
  return Math.min(
    screenHeight * 8.25,
    Math.max(
      screenHeight * 1.6,
      label.length * screenHeight * 0.2 + screenHeight,
    ),
  )
}

export function stationLabelWorldHeight(
  cameraDepth: number,
  verticalFieldOfView: number,
  viewportHeight: number,
  screenHeight: number,
): number {
  if (
    cameraDepth <= 0 ||
    viewportHeight <= 0 ||
    screenHeight <= 0 ||
    !Number.isFinite(verticalFieldOfView)
  ) {
    return 0
  }

  const halfFieldOfView = (verticalFieldOfView * Math.PI) / 360
  const visibleWorldHeight = 2 * cameraDepth * Math.tan(halfFieldOfView)
  return (screenHeight / viewportHeight) * visibleWorldHeight
}

export function stationLabelCameraHeight(
  cameraHeight: number,
  framing: MapCameraFraming,
): number {
  const relativeHeight = cameraHeight / homeMapDistanceScale(framing)
  return relativeHeight * (framing.stationLabelHeightScale ?? 1)
}

export function stationLabelText(
  name: string,
  framing: MapCameraFraming,
): string {
  const prefix = framing.stationLabelPrefix
  if (!prefix || name === framing.stationLabelPrimaryName) return name
  if (name.startsWith(`${prefix}, `)) return name.slice(`${prefix}, `.length)
  if (name.startsWith(`${prefix} `) && name.includes(',')) {
    return name.slice(`${prefix} `.length)
  }
  return name
}

export function stationLabelBudget(cameraHeight: number): number {
  if (cameraHeight >= 30) return 8
  if (cameraHeight >= 22) return 20
  if (cameraHeight >= 15) return 48
  return MAX_STATION_LABELS
}

export function stationLabelRankLimit(cameraHeight: number): number {
  if (cameraHeight >= 30) return 8
  if (cameraHeight >= 22) return 20
  if (cameraHeight >= 15) return 48
  if (cameraHeight >= 14) return MAX_STATION_LABELS
  return Number.POSITIVE_INFINITY
}

export function rankStationsForLabels(
  stations: readonly StationIndexEntry[],
): readonly StationIndexEntry[] {
  return [...stations].sort(
    (first, second) =>
      (first.labelRank ?? Number.POSITIVE_INFINITY) -
        (second.labelRank ?? Number.POSITIVE_INFINITY) ||
      second.trainIds.length - first.trainIds.length ||
      second.routes.length - first.routes.length ||
      first.name.localeCompare(second.name, 'de-CH'),
  )
}
