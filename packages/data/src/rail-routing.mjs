/** Connected OSM routing. Projection and regional track exceptions are explicit caller policy. */
export class RailwayGraph {
  constructor(osm, stations, { project, measure, includeWay = way => way.tags?.railway === 'rail', anchorRadius = () => .25 } = {}) {
    if (typeof project !== 'function') throw new Error('A kilometre projection is required')
    this.project = project; this.measure = measure; this.stations = stations; this.anchorRadius = anchorRadius
    this.nodes = new Map(osm.elements.filter(e => e.type === 'node').map(e => [e.id, e]))
    this.graph = new Map(); this.grid = new Map(); this.candidates = new Map(); this.cache = new Map()
    for (const way of osm.elements) {
      if (way.type !== 'way' || ['yard', 'siding', 'spur'].includes(way.tags?.service)) continue
      const nodes = way.nodes.map(id => this.nodes.get(id))
      if (!includeWay(way, nodes)) continue
      if (nodes.some(n => !n)) throw new Error(`Missing OSM nodes on ${way.id}`)
      for (let i = 1; i < nodes.length; i++) {
        const a = nodes[i - 1], b = nodes[i], length = this.distance([a.lon, a.lat], [b.lon, b.lat])
        for (const [from, to] of [[a.id, b.id], [b.id, a.id]]) {
          if (!this.graph.has(from)) this.graph.set(from, [])
          this.graph.get(from).push([to, length, way.id])
        }
      }
    }
    for (const id of this.graph.keys()) {
      const n = this.nodes.get(id), [x, y] = project([n.lon, n.lat]), key = `${Math.floor(x / .25)}:${Math.floor(y / .25)}`
      if (!this.grid.has(key)) this.grid.set(key, [])
      this.grid.get(key).push(id)
    }
  }
  distance(a, b) { if (this.measure) return this.measure(a, b); const x = this.project(a), y = this.project(b); return Math.hypot(x[0] - y[0], x[1] - y[1]) }
  stationCandidates(code) {
    if (this.candidates.has(code)) return this.candidates.get(code)
    const station = this.stations[code]
    if (!station) throw new Error(`Unknown station ${code}`)
    const point = [station.lon, station.lat], [x, y] = this.project(point), gx = Math.floor(x / .25), gy = Math.floor(y / .25), found = [], radius = this.anchorRadius(code)
    if (!(radius > 0 && radius <= .5)) throw new Error('Anchor radius must be within 0–0.5 km')
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) for (const id of this.grid.get(`${gx + dx}:${gy + dy}`) ?? []) {
      const n = this.nodes.get(id), length = this.distance(point, [n.lon, n.lat])
      if (length <= radius) found.push([id, length])
    }
    found.sort((a, b) => a[1] - b[1]); this.candidates.set(code, found.slice(0, 100)); return this.candidates.get(code)
  }
  route(a, b) {
    const key = `${a}:${b}`, reverse = this.cache.get(`${b}:${a}`)
    if (this.cache.has(key)) return this.cache.get(key)
    if (reverse) return [[...reverse[0]].reverse(), reverse[1], reverse[2]]
    const na = this.stations[a], nb = this.stations[b]
    if (!na || !nb) throw new Error(`Unknown route station ${!na ? a : b}`)
    const pa = [na.lon, na.lat], pb = [nb.lon, nb.lat], starts = this.stationCandidates(a), targets = new Map(this.stationCandidates(b))
    if (!starts.length || !targets.size) throw new Error(`Station lacks a connected railway anchor: ${!starts.length ? a : b}`)
    const queue = new MinHeap(), best = new Map(), previous = new Map()
    const heuristic = id => { const n = this.nodes.get(id); return this.distance([n.lon, n.lat], pb) }
    for (const [id, length] of starts) { best.set(id, length); queue.push([length + heuristic(id), length, id]) }
    let finish, total = Infinity
    while (queue.length) {
      const [estimate, cost, id] = queue.pop()
      if (estimate >= total) break
      if (cost !== best.get(id)) continue
      if (targets.has(id) && cost + targets.get(id) < total) { finish = id; total = cost + targets.get(id) }
      for (const [target, length, way] of this.graph.get(id)) {
        const candidate = cost + length
        if (candidate >= (best.get(target) ?? Infinity)) continue
        best.set(target, candidate); previous.set(target, [id, way]); queue.push([candidate + heuristic(target), candidate, target])
      }
    }
    if (finish === undefined) throw new Error(`Disconnected rail path ${a}–${b}`)
    const nodes = [finish], ways = new Set()
    while (previous.has(nodes.at(-1))) { const [id, way] = previous.get(nodes.at(-1)); nodes.push(id); ways.add(way) }
    const path = [pa, ...nodes.reverse().map(id => { const n = this.nodes.get(id); return [n.lon, n.lat] }), pb].filter((p, i, all) => !i || p[0] !== all[i - 1][0] || p[1] !== all[i - 1][1])
    if (total > Math.max(3, this.distance(pa, pb) * 2.6)) throw new Error(`Rail detour ${a}–${b}: ${total.toFixed(2)} km vs ${this.distance(pa, pb).toFixed(2)} km direct`)
    const result = [path, [...ways].sort((a, b) => a - b), total]; this.cache.set(key, result); return result
  }
}

// Numeric lexicographic ordering preserves deterministic A* ties.
class MinHeap {
  items = []
  get length() { return this.items.length }
  less(a, b) { return (a[0] - b[0] || a[1] - b[1] || a[2] - b[2]) < 0 }
  push(value) { const a = this.items; let i = a.length; a.push(value); while (i) { const p = (i - 1) >> 1; if (!this.less(value, a[p])) break; a[i] = a[p]; i = p } a[i] = value }
  pop() { const a = this.items, value = a[0], last = a.pop(); if (a.length) { let i = 0; while (i * 2 + 1 < a.length) { let c = i * 2 + 1; if (c + 1 < a.length && this.less(a[c + 1], a[c])) c++; if (!this.less(a[c], last)) break; a[i] = a[c]; i = c } a[i] = last } return value }
}

export function railBoundaryDistance(point, rings, project) {
  let inside = false, nearest = Infinity
  const [px, py] = project(point)
  for (const ring of rings) for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside
    const [ax, ay] = project(a), [bx, by] = project(b), dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy
    const t = length ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length)) : 0
    nearest = Math.min(nearest, Math.hypot(px - ax - t * dx, py - ay - t * dy))
  }
  if (!Number.isFinite(nearest)) throw new Error('Empty railway study boundary')
  return inside ? -nearest : nearest
}

export function routeRailJourneys(result, osm, { boundary, routeMargin = 5, visibleMargin = 4, ...options }) {
  if (result.conflicts.length) throw new Error('Resolve timetable conflicts before compiling geometry')
  if (!['Polygon', 'MultiPolygon'].includes(boundary.type)) throw new Error('Expected polygon boundary')
  if (!(routeMargin >= visibleMargin && visibleMargin >= 0)) throw new Error('Invalid railway boundary margins')
  const rings = boundary.type === 'Polygon' ? boundary.coordinates : boundary.coordinates.flat()
  const graph = new RailwayGraph(osm, result.stations, options)
  const distances = Object.fromEntries(Object.entries(result.stations).map(([code, n]) => [code, railBoundaryDistance([n.lon, n.lat], rings, options.project)]))
  const pairs = new Map()
  for (const train of result.journeys) for (let i = 1; i < train.points.length; i++) { const a = train.points[i - 1].code, b = train.points[i].code; if (a !== b) pairs.set(`${a}:${b}`, [a, b]) }
  const failed = {}, geometry = {}
  for (const [key, [a, b]] of [...pairs].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    if (distances[a] > routeMargin && distances[b] > routeMargin) continue
    try { const [path, ways, length] = graph.route(a, b); geometry[key] = { path, ways, length } } catch (error) { failed[key] = error.message }
  }
  const included = [], excluded = []
  for (const train of result.journeys) {
    const visible = train.points.flatMap((p, i) => distances[p.code] <= visibleMargin ? [i] : [])
    if (!visible.length) continue
    const points = train.points.slice(Math.max(0, visible[0] - 1), visible.at(-1) + 2)
    const missing = points.slice(1).map((p, i) => `${points[i].code}:${p.code}`).filter(key => !geometry[key])
    if (missing.length) excluded.push({ uid: train.uid, originDate: train.originDate, operator: train.operator, missing })
    else included.push({ ...train, points })
  }
  return { ...result, journeys: included, geometry, stationBoundaryDistances: distances, geometryFailures: failed, excludedGeometry: excluded }
}
