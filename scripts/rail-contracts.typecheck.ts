import {readWtt, auditWttGrid} from '@motionstudies/data/rail-wtt'
import {joinWttColumns, supplementPublicCalls, type JoinWttOptions} from '@motionstudies/data/rail-journeys'
import {routeRailJourneys, type RailOsm, type RailRoutingOptions, type RailBoundary} from '@motionstudies/data/rail-routing'
import {railCorridorGeometry, assembleRailCorridor} from '@motionstudies/data/rail-geometry'
import {publicTimetablePages, publicTimetableColumns} from '@motionstudies/data/rail-public-calls'
export async function specimen(path: string, options: JoinWttOptions, osm: RailOsm, routing: RailRoutingOptions, boundary: RailBoundary) {
 const sheets = await readWtt(path, {weekends: true})
 const audit = auditWttGrid(sheets, 'X1', options.serviceDate, {includeColumn: column => column.events.some(e => e.kind === 'pass')})
 const joined = joinWttColumns([{table:'X1', sha256:'source', sheets}], options)
 const publicAudit = supplementPublicCalls(joined, publicTimetableColumns(publicTimetablePages(new Uint8Array()), {table:'P1', target:'A', operator:'OP', acceptPage:page=>page.page===1, resolveCode:()=>undefined}))
 const routed = routeRailJourneys(joined, osm, {...routing, boundary})
 const geometry = railCorridorGeometry(osm, ['A','B'])
 const corridor = assembleRailCorridor({journeys:[{id:'u1', direction:'outbound', stops:[[0,0,0],[1,60,60]]}], geometry, metadata:{coverage:{}}, bounds:{}})
 return {audit, publicAudit, routed, corridor}
}
