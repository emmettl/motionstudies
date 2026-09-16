/** Renderer-independent hierarchy shared by station and airport map labels. */
export interface MapLabelPriority {
  readonly name: string
  readonly rank: number
  readonly priority: number
  readonly retained: boolean
  readonly distance: number
}
export interface MapLabelBox { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number }
export interface MapLabelCandidate extends MapLabelPriority { readonly box: MapLabelBox }

export function compareMapLabelCandidates(first: MapLabelPriority, second: MapLabelPriority): number {
  return first.priority - second.priority || Number(second.retained) - Number(first.retained)
    || first.rank - second.rank || first.distance - second.distance || first.name.localeCompare(second.name, 'de-CH')
}
export function mapLabelBudget(cameraHeight: number): number {
  if (cameraHeight >= 30) return 8
  if (cameraHeight >= 22) return 20
  if (cameraHeight >= 15) return 48
  return 96
}
export function mapLabelRankLimit(cameraHeight: number): number {
  if (cameraHeight >= 30) return 8
  if (cameraHeight >= 22) return 20
  if (cameraHeight >= 15) return 48
  if (cameraHeight >= 14) return 96
  return Number.POSITIVE_INFINITY
}
export function mapLabelBoxesOverlap(box: MapLabelBox, other: MapLabelBox, horizontalGap = 5, verticalGap = 4): boolean {
  return box.left < other.right + horizontalGap && box.right > other.left - horizontalGap
    && box.top < other.bottom + verticalGap && box.bottom > other.top - verticalGap
}
/** Candidate boxes include the edition's full hit area. Selected candidates must
 * already have their higher priority; all labels respect viewport and obstacles. */
export function selectMapLabels<T extends MapLabelCandidate>(
  candidates: readonly T[], budget: number, viewport: MapLabelBox, obstacles: readonly MapLabelBox[] = [],
): T[] {
  const selected: T[] = [], occupied = [...obstacles]
  const limit = Number.isFinite(budget) ? Math.max(0, Math.floor(budget)) : 0
  for (const candidate of [...candidates].sort(compareMapLabelCandidates)) {
    if (selected.length >= limit) break
    const box = candidate.box
    if (![box.left,box.right,box.top,box.bottom].every(Number.isFinite) || box.right <= box.left || box.bottom <= box.top) continue
    if (box.left < viewport.left || box.right > viewport.right || box.top < viewport.top || box.bottom > viewport.bottom) continue
    if (occupied.some(other => mapLabelBoxesOverlap(box, other))) continue
    selected.push(candidate); occupied.push(box)
  }
  return selected
}
