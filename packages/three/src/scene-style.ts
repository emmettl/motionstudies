import { Color, MathUtils } from 'three'
import { SERVICE_COLORS } from '@motionstudies/core/theme'
import type { ServiceCategory } from '@motionstudies/core/domain/network'

export type CategoryPalette = Readonly<Partial<Record<ServiceCategory, string>>>

export interface TrainLabelStyle {
  readonly elevation?: number
  /** Sprite anchor: 0.5 centres the label; negative values place it above the anchor. */
  readonly anchorY?: number
  readonly collisionWidthScale?: number
  readonly avoidStationLabels?: boolean
  readonly selectedAboveStations?: boolean
  /** Preserve line identity in text and halo even before the route-colour blend begins. */
  readonly routeTextCategories?: readonly ServiceCategory[]
}

export interface NetworkMapStyle {
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
