export const distance = (a, b) => Math.hypot((a[0] - b[0]) * Math.cos((a[1] + b[1]) * Math.PI / 360), a[1] - b[1]) * 111.32
/** Route on connected OSM rails through each station; never replace gaps with straight lines. */
export function railCorridorGeometry(osm, stationCodes) {
  if (!Array.isArray(stationCodes) || stationCodes.length < 2 || new Set(stationCodes).size !== stationCodes.length) throw new Error('Expected distinct corridor station codes')
  const nodes = new Map(osm.elements.filter(e => e.type === 'node').map(e => [e.id, e]))
  const graph = new Map()
  for (const way of osm.elements.filter(e => e.type === 'way' && e.tags?.railway === 'rail' && !['yard', 'siding', 'spur'].includes(e.tags.service))) {
    for (let i = 1; i < way.nodes.length; i++) {
      const a = nodes.get(way.nodes[i - 1]), b = nodes.get(way.nodes[i])
      if (!a || !b) throw new Error(`Missing OSM nodes on ${way.id}`)
      const weight = distance([a.lon, a.lat], [b.lon, b.lat])
      for (const [from, to] of [[a.id, b.id], [b.id, a.id]]) {
        if (!graph.has(from)) graph.set(from, [])
        graph.get(from).push({ to, weight, way: way.id })
      }
    }
  }
  const stations = stationCodes.map(code => {
    const station = [...nodes.values()].find(node => node.tags?.railway === 'station' && node.tags['ref:crs'] === code)
    if (!station) throw new Error(`Missing OSM station ${code}`)
    return station
  })
  // The largest connected component excludes isolated rails and works-in-progress.
  const visited = new Set(); let component = []
  for (const start of graph.keys()) {
    if (visited.has(start)) continue
    const found = [], queue = [start]; visited.add(start)
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i]; found.push(id)
      for (const { to } of graph.get(id)) if (!visited.has(to)) { visited.add(to); queue.push(to) }
    }
    if (found.length > component.length) component = found
  }
  if (!component.length) throw new Error('No connected railway geometry')
  const anchors = stations.map(station => {
    const point = [station.lon, station.lat]
    const id = component.reduce((best, id) => distance(point, [nodes.get(id).lon, nodes.get(id).lat]) < distance(point, [nodes.get(best).lon, nodes.get(best).lat]) ? id : best, component[0])
    if (distance(point, [nodes.get(id).lon, nodes.get(id).lat]) > 0.25) throw new Error(`Station too far from connected railway: ${station.tags.name}`)
    return id
  })
  const queue = [{ id: anchors[0], weight: 0 }], best = new Map([[anchors[0], 0]]), previous = new Map()
  const target = anchors.at(-1)
  while (queue.length) {
    queue.sort((a, b) => b.weight - a.weight)
    const current = queue.pop()
    if (current.weight !== best.get(current.id)) continue
    if (current.id === target) break
    for (const edge of graph.get(current.id)) {
      const weight = current.weight + edge.weight
      if (weight >= (best.get(edge.to) ?? Infinity)) continue
      best.set(edge.to, weight); previous.set(edge.to, { id: current.id, way: edge.way }); queue.push({ id: edge.to, weight })
    }
  }
  if (!best.has(target)) throw new Error('Disconnected railway corridor')
  const ids = [target], wayIds = new Set()
  while (ids.at(-1) !== anchors[0]) {
    const edge = previous.get(ids.at(-1)); wayIds.add(edge.way); ids.push(edge.id)
  }
  const line = ids.reverse().map(id => [nodes.get(id).lon, nodes.get(id).lat])
  // Snap every intermediate station to this continuous route, avoiding jumps between parallel tracks.
  const indexes = stations.map(station => line.reduce((best, point, i) => distance(point, [station.lon, station.lat]) < distance(line[best], [station.lon, station.lat]) ? i : best, 0))
  const paths = []
  for (let i = 0; i < indexes.length; i++) {
    if (distance(line[indexes[i]], [stations[i].lon, stations[i].lat]) > 0.25) throw new Error(`Railway misses ${stationCodes[i]}`)
    if (!i) continue
    if (indexes[i] <= indexes[i - 1]) throw new Error(`Railway reverses at ${stationCodes[i]}`)
    const path = line.slice(indexes[i - 1], indexes[i] + 1)
    const length = path.slice(1).reduce((sum, point, j) => sum + distance(path[j], point), 0)
    if (length > Math.max(2, distance(path[0], path.at(-1)) * 1.8)) throw new Error(`Implausible railway detour to ${stationCodes[i]}`)
    paths.push(path)
  }
  return { stops: stations.map((station, i) => [...line[indexes[i]], station.tags.name, '', `crs:${stationCodes[i]}`]), paths, wayIds: [...wayIds].sort((a, b) => a - b) }
}


/** Shared output boundary for operator tables or normalized machine-readable schedules. */
export function assembleRailCorridor({ journeys, geometry, metadata, bounds, excluded = [] }) {
  const ids = new Set(), paths = [], pathIndexes = new Map()
  const trains = journeys.map(train => {
    if (ids.has(train.id)) throw new Error(`Duplicate rail identity: ${train.id}`)
    ids.add(train.id)
    if (train.stops.length < 2 || !['inbound', 'outbound'].includes(train.direction)) throw new Error(`Invalid rail journey: ${train.id}`)
    for (let i = 0; i < train.stops.length; i++) {
      const [stop, a, d] = train.stops[i]
      if (!geometry.stops[stop] || !Number.isFinite(a) || !Number.isFinite(d) || d < a || (i && a < train.stops[i - 1][2])) throw new Error(`Non-monotonic rail journey: ${train.id}`)
    }
    return { ...train, start: train.stops[0][1], end: train.stops.at(-1)[2], pathSegments: train.stops.slice(1).map(([to], index) => {
      const from = train.stops[index][0], key = `${from}:${to}`
      if (from === to) throw new Error(`Repeated corridor station: ${train.id}`)
      if (pathIndexes.has(key)) return pathIndexes.get(key)
      if (geometry.pairPaths) {
        const path = geometry.pairPaths[key]
        if (!path || path.length < 2 || JSON.stringify(path[0]) !== JSON.stringify(geometry.stops[from].slice(0, 2)) || JSON.stringify(path.at(-1)) !== JSON.stringify(geometry.stops[to].slice(0, 2))) throw new Error(`Missing or disconnected rail path: ${key}`)
        const pathIndex = paths.length
        paths.push(path); pathIndexes.set(key, pathIndex)
        return pathIndex
      }
      const segments = geometry.paths.slice(Math.min(from, to), Math.max(from, to))
      if (segments.length !== Math.abs(to - from) || segments.some(path => path.length < 2)) throw new Error(`Missing corridor geometry: ${key}`)
      for (let i = 1; i < segments.length; i++) if (JSON.stringify(segments[i - 1].at(-1)) !== JSON.stringify(segments[i][0])) throw new Error(`Disconnected corridor geometry: ${key}`)
      const path = segments.flatMap((points, i) => i ? points.slice(1) : points)
      const pathIndex = paths.length
      paths.push(from < to ? path : [...path].reverse()); pathIndexes.set(key, pathIndex)
      return pathIndex
    }) }
  }).sort((a, b) => a.start - b.start || a.id.localeCompare(b.id))
  return { metadata: { ...metadata, coverage: { ...metadata.coverage, includedJourneys: trains.length, excluded } }, bounds, stops: geometry.stops, paths, edges: [], trains, corridorPaths: geometry.corridorPaths ?? geometry.paths, fadeKilometres: 4 }
}
