import { Color, MathUtils } from 'three'
import type { TrainLabelMode } from './train-labels.ts'
import { SERVICE_COLORS } from '@motionstudies/core/theme'
import type { ServiceCategory, StationIndexEntry } from '@motionstudies/core/domain/network'

export type CategoryPalette = Readonly<Partial<Record<ServiceCategory, string>>>

export interface TrainLabelStyle {
  /** Ambient label count. Off, selection/comparison priority and the pool cap remain renderer-owned. Keep callbacks stable. */
  readonly budget?: (semanticCameraHeight: number, viewportWidth: number, mode: TrainLabelMode) => number
  /** Label height in CSS pixels, including focused labels. */
  readonly screenHeight?: (viewportWidth: number, selected: boolean, semanticCameraHeight: number) => number
  /** Hide labels at or above the given semantic camera height, including focused labels. */
  readonly maxCameraHeight?: Readonly<Partial<Record<ServiceCategory, number>>>
  readonly viewportPadding?: number
  readonly elevation?: number
  /** Sprite anchor: 0.5 centres the label; negative values place it above the anchor. */
  readonly anchorY?: number
  readonly collisionWidthScale?: number
  readonly avoidStationLabels?: boolean
  readonly selectedAboveStations?: boolean
  /** Preserve line identity in text and halo even before the route-colour blend begins. */
  readonly routeTextCategories?: readonly ServiceCategory[]
}

export interface RoadStrokeStyle {
  readonly color?: string
  readonly opacity?: number | ((state: { readonly subdued: boolean; readonly selected: boolean }) => number)
  readonly depthTest?: boolean
  readonly toneMapped?: boolean
}
export interface RoadInfrastructureStyle {
  readonly mainline?: RoadStrokeStyle
  readonly connectors?: RoadStrokeStyle
  readonly selected?: RoadStrokeStyle
}
export interface AirportInfrastructureStyle {
  /** Show configured airports independently of flight data and flight-label visibility. */
  readonly independent?: boolean
  /** Hide independent infrastructure without unmounting its GPU resources or allowing picks. */
  readonly visible?: boolean
  /** Label visibility for independent infrastructure; markers remain visible. */
  readonly showLabels?: boolean
  readonly labelRenderOrder?: number
  readonly fog?: boolean
}

/** Optional policies shared by station labels and their built-in tap targets.
 * Keep this object and its callbacks stable. Ordering receives ranked stations;
 * selection priority and the renderer's collision/frame budgets remain owned here.
 */
export interface StationLabelStyle {
  readonly rankLimit?: (semanticCameraHeight: number) => number
  readonly refreshInterval?: number
  readonly orderStations?: (ranked: readonly StationIndexEntry[]) => readonly StationIndexEntry[]
  readonly semanticHeight?: (height: number, spatialLayoutMix: number) => number
  readonly eligible?: (station: StationIndexEntry, semanticHeight: number, tierLimit?: number) => boolean
  readonly screenHeight?: (width: number, focused: boolean, rank: number | undefined, semanticHeight: number) => number
  /** Omission retains labels extending outside the viewport. */
  readonly viewportPadding?: number
}

/** Per-frame material policies. Camera height is world-space, not semantic label height.
 * Keep callbacks stable; they update existing materials without rebuilding geometry. */
export interface NetworkMaterialStyle {
  /** Multiplier for the border's existing subdued and spatial-layout opacity. */
  readonly borderOpacityScale?: (cameraHeight: number) => number
  /** Replaces the traffic layer's overview emphasis for its weighted strokes. Pulses retain their existing emphasis. */
  readonly trafficFlowOverviewEmphasis?: (cameraHeight: number) => number
}

export interface NetworkMapStyle {
  readonly materials?: NetworkMaterialStyle
  readonly vehicleElevation?: number
  readonly trailElevationOffset?: number
  readonly diagram?: { readonly laneSpacing?: number; readonly casingWidth?: number; readonly coreWidth?: number }
  readonly stationLabels?: StationLabelStyle
  readonly roads?: RoadInfrastructureStyle
  readonly airports?: AirportInfrastructureStyle
  /** Flat compositing fixes the painter order for rail, flow and trails. */
  readonly surface?: 'luminous' | 'flat'
  /** Independent of route identity: changing a category colour does not add route meshes. */
  readonly categoryColors?: CategoryPalette
  readonly trainLabels?: TrainLabelStyle
}

export const FLAT_NETWORK_MAP_STYLE: NetworkMapStyle = /* @__PURE__ */ Object.freeze({
  surface: 'flat',
  trainLabels: Object.freeze({ elevation: 0.085, anchorY: -0.3, collisionWidthScale: 1.12,
    avoidStationLabels: true, selectedAboveStations: true }),
})

export function networkRouteColor(category: ServiceCategory, routeName: string,
  routeColors: Readonly<Record<string, string>> | undefined, mix: number,
  categoryColors?: CategoryPalette): string {
  const serviceColor = categoryColors?.[category] ?? SERVICE_COLORS[category]
  const identityColor = routeColors?.[routeName]
  if (!identityColor || mix <= 0) return serviceColor
  return `#${new Color(serviceColor).lerp(new Color(identityColor), MathUtils.clamp(mix, 0, 1)).getHexString()}`
}

export function trainLabelCollisionBox(x: number, y: number, width: number, height: number, anchorY: number) {
  return { left: x - width / 2, right: x + width / 2, top: y - height * (1 - anchorY), bottom: y + height * anchorY }
}

export function roadStrokeOpacity(style: RoadStrokeStyle | undefined, fallback: number, subdued: boolean, selected: boolean): number {
  return typeof style?.opacity === 'function' ? style.opacity({ subdued, selected }) : style?.opacity ?? fallback
}
