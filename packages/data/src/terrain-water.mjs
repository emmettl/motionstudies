/** Projected polygon operations; source selection and water-level policy stay in the edition. */
export function clipRingToBounds(ring, bounds) {
  let result = ring
  for (const [axis, edge, sign] of [[0, bounds.minEasting, 1], [0, bounds.maxEasting, -1], [1, bounds.minNorthing, 1], [1, bounds.maxNorthing, -1]]) {
    const next = []
    for (let i = 0; i < result.length; i++) {
      const a = result[i], b = result[(i + 1) % result.length], ai = sign * (a[axis] - edge) >= 0, bi = sign * (b[axis] - edge) >= 0
      if (ai) next.push(a)
      if (ai !== bi) { const t = (edge - a[axis]) / (b[axis] - a[axis]); next.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) }
    }
    result = next
  }
  return result
}

export function pointInRing(point, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j]
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside
  }
  return inside
}
