import {test,expect} from 'vitest'
import {mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {execFileSync} from 'node:child_process'
import {readWtt,auditWttGrid,wttRunsOn,wttTiming} from './rail-wtt.mjs'
import {parseRailXml} from './rail-xml.mjs'
import {joinWttColumns,supplementPublicCalls} from './rail-journeys.mjs'
import {RailwayGraph,railBoundaryDistance,routeRailJourneys} from './rail-routing.mjs'
import {railCorridorGeometry,assembleRailCorridor} from './rail-geometry.mjs'
import {publicTimetablePages,publicTimetableColumns} from './rail-public-calls.mjs'
const headers=['TID','UID','Operator','Origin','Destination','Timing Load','Dates of Operation','Running Days','Service Code']
const grid=(events,values=['2A01','U1','OP','Alpha\n23:50','Beta\n00:10','DMU','01/06/2026 to 12/12/2026','FO','1'])=>({'Mondays to Fridays Forward':[...headers.map((h,i)=>['',h,values[i]]),...events]})
const stations={A:{lon:0,lat:0,tags:{name:'Alpha'}},B:{lon:.01,lat:0,tags:{name:'Beta'}}}
const options={serviceDate:'2026-09-04',stations,operators:['OP'],normalizeName:s=>s.toUpperCase(),resolveLocation:name=>({Alpha:'A',Beta:'B'})[name]}
const table=sheets=>[{table:'X1',sha256:'source-hash',sheets}]

test('WTT source audit preserves midnight rollover and rejects unfamiliar active cells',()=>{
 const sheets=grid([['Alpha','dep','23T50'],['Beta','arr','00T10']])
 const audit=auditWttGrid(sheets,'X1','2026-09-04')
 expect(audit.columns[0].events[1]).toMatchObject({row:11,sourceTime:'00T10',wallSecondsFromBankMidnight:87000})
 sheets['Mondays to Fridays Forward'][10][2]='00ZZ10'
 expect(auditWttGrid(sheets,'X1','2026-09-04').rejected[0]).toMatchObject({column:3,uid:'U1',reason:'Unreviewed WTT time: 00ZZ10'})
 expect(()=>auditWttGrid(sheets,'X1','2026-09-06')).toThrow(/Sunday/)
})
test('Calendars and timing symbols fail closed',()=>{
 expect(wttTiming('12T -D30½')).toEqual([45030,'T -D'])
 expect(wttRunsOn('ThFO','01/06/2026 to 12/12/2026','2026-09-04')).toBe(true)
 expect(wttRunsOn('FX','01/06/2026 to 12/12/2026','2026-09-04')).toBe(false)
 expect(()=>wttRunsOn('HOL','01/06/2026 to 12/12/2026','2026-09-04')).toThrow(/Unreviewed/)
 expect(()=>wttRunsOn('FO','31/02/2026 to 12/12/2026','2026-09-04')).toThrow()
 expect(()=>wttTiming('2460')).toThrow()
 expect(()=>wttRunsOn('FO','12/12/2026 to 01/06/2026','2026-09-04')).toThrow(/Reversed/)
})
test('Joined source identities retain working and passenger distinctions across midnight',()=>{
 const result=joinWttColumns(table(grid([['Alpha','dep','23D50'],['Beta','pass','0010']])),options)
 expect(result.journeys).toHaveLength(1)
 expect(result.journeys[0]).toMatchObject({uid:'U1',originDate:'2026-09-04',sources:[{table:'X1',sheet:'Mondays to Fridays Forward',column:3}]})
 expect(result.journeys[0].points[0]).toMatchObject({passenger:true,setDownOnly:true,pickupOnly:false})
 expect(result.journeys[0].points[1]).toMatchObject({passenger:false,arrival:87000,rows:[11]})
 expect(()=>joinWttColumns(table(grid([])),{...options,serviceDate:'2026-09-06'})).toThrow(/Sunday/)
 expect(()=>joinWttColumns(table(grid([])),{...options,serviceDate:'2026-09-07'})).toThrow(/Sunday/)
 expect(()=>joinWttColumns(table(grid([])),{...options,serviceDate:'2026-09-05'})).toThrow(/Sunday/)
})
test('Small backward times and conflicting originating identities are rejected',()=>{
 expect(()=>joinWttColumns(table(grid([['Alpha','dep','1200'],['Beta','arr','1159']])),options)).toThrow(/Non-monotonic/)
 const a=grid([['Alpha','dep','2350'],['Beta','arr','0010']]),b=structuredClone(a);b['Mondays to Fridays Forward'][3][2]='Different\n23:50'
 expect(()=>joinWttColumns([...table(a),...table(b)],options)).toThrow(/Conflicting active UID/)
})
const train=(uid,a,b)=>({uid,operator:'OP',originDate:'2026-09-04',sources:[],points:[{code:'A',arrival:a,departure:a,passenger:true},{code:'B',arrival:b,departure:b,passenger:true}]})
const record={code:'MID',time:150,kind:'departure',operator:'OP',anchors:[{code:'A',time:100,kind:'departure'},{code:'B',time:200,kind:'arrival'}],table:'P1',page:2,column:3}
test('Public call supplementation needs surrounding anchors and preserves evidence',()=>{
 const result={journeys:[train('U1',100,200)]},audit=supplementPublicCalls(result,[record])
 expect(audit.added[0]).toMatchObject({uid:'U1',table:'P1',page:2,column:3})
 expect(result.journeys[0].points[1]).toMatchObject({code:'MID',passenger:true,publicSupplement:{table:'P1',page:2,column:3}})
 expect(supplementPublicCalls({journeys:[train('U1',100,200)]},[{...record,anchors:record.anchors.slice(0,1)}]).unmatched).toHaveLength(1)
})
test('Equally good but different public-call brackets are audited as ambiguous',()=>{
 const result={journeys:[train('U1',90,210),train('U2',110,190)]}
 const audit=supplementPublicCalls(result,[record])
 expect(audit.ambiguous).toHaveLength(1);expect(audit.added).toHaveLength(0)
 expect(result.journeys.every(t=>t.points.length===2)).toBe(true)
})
const osm={elements:[{type:'node',id:1,lon:0,lat:0,tags:{railway:'station','ref:crs':'A',name:'Alpha'}},{type:'node',id:2,lon:.005,lat:0},{type:'node',id:3,lon:.01,lat:0,tags:{railway:'station','ref:crs':'B',name:'Beta'}},{type:'way',id:10,nodes:[1,2,3],tags:{railway:'rail'}}]}
const project=p=>p.map(x=>x*100)
test('Rail routing uses connected rails and reverses the exact cached route',()=>{
 const graph=new RailwayGraph(osm,stations,{project})
 const [path,ways,length]=graph.route('A','B')
 expect(path).toEqual([[0,0],[.005,0],[.01,0]]);expect(ways).toEqual([10]);expect(length).toBe(1)
 expect(graph.route('B','A')).toEqual([[...path].reverse(),ways,length])
 const disconnected=structuredClone(osm);disconnected.elements.at(-1).tags.service='siding'
 expect(()=>new RailwayGraph(disconnected,stations,{project}).route('A','B')).toThrow(/anchor/)
 expect(()=>new RailwayGraph(osm,stations)).toThrow(/projection/)
})
test('Study boundary distance supports holes and routing refuses timetable conflicts',()=>{
 const outer=[[-1,-1],[1,-1],[1,1],[-1,1]],hole=[[-.1,-.1],[.1,-.1],[.1,.1],[-.1,.1]]
 expect(railBoundaryDistance([0,0],[outer,hole],project)).toBe(10)
 expect(railBoundaryDistance([.5,0],[outer,hole],project)).toBe(-40)
 expect(()=>railBoundaryDistance([0,0],[],project)).toThrow(/Empty/)
 expect(()=>routeRailJourneys({conflicts:[{}]},osm,{boundary:{type:'Polygon',coordinates:[outer]},project})).toThrow(/conflicts/)
})
test('Corridor assembly reuses connected geometry and refuses a missing intermediate section',()=>{
 const geometry=railCorridorGeometry(osm,['A','B'])
 const result=assembleRailCorridor({journeys:[{id:'u1',direction:'outbound',stops:[[0,100,100],[1,200,200]]}],geometry,metadata:{},bounds:{}})
 expect(result.trains[0].pathSegments).toEqual([0]);expect(result.paths[0]).toEqual(geometry.paths[0])
 expect(()=>assembleRailCorridor({journeys:[{id:'u1',direction:'outbound',stops:[[0,100,100],[1,200,200]]}],geometry:{...geometry,paths:[]},metadata:{}})).toThrow(/Missing corridor/)
})
test('bbox parsing retains table/page/column and ignores unaccepted calendars',()=>{
 const word=(text,a,y)=>`<word xMin="${a}" xMax="${a+10}" yMin="${y}">${text}</word>`
 const bytes=Buffer.from(`<doc><page>${word('Operator',0,0)}${word('OP',100,0)}${word('Alpha (A)',0,10)}${word('0001',100,10)}${word('Middle',0,20)}${word('0002a',100,20)}${word('Beta (B)',0,30)}${word('0003',100,30)}</page></doc>`)
 const pages=publicTimetablePages(bytes),policy={table:'P1',target:'MID',operator:'OP',acceptPage:()=>true,resolveCode:n=>({'Alpha (A)':'A',Middle:'MID','Beta (B)':'B'})[n]}
 expect(publicTimetableColumns(pages,policy)[0]).toMatchObject({table:'P1',page:1,column:1,time:120,kind:'arrival',anchors:[{code:'A',time:60,kind:'departure'},{code:'B',time:180,kind:'departure'}]})
 expect(publicTimetableColumns(pages,{...policy,acceptPage:()=>false})).toEqual([])
 expect(()=>parseRailXml(Buffer.from('<!DOCTYPE d [<!ENTITY x SYSTEM "file:///secret">]><d>&x;</d>'))).toThrow(/Unsupported/)
})
test('XLSX reading preserves sparse shared strings, rich text and cached formula cells within bounds',async()=>{
 const root=await mkdtemp(join(tmpdir(),'rail-test-'))
 try{
  await mkdir(join(root,'xl/_rels'),{recursive:true});await mkdir(join(root,'xl/worksheets'))
  await writeFile(join(root,'xl/workbook.xml'),'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Mondays to Fridays Forward" r:id="r1"/></sheets></workbook>')
  await writeFile(join(root,'xl/_rels/workbook.xml.rels'),'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Target="worksheets/sheet1.xml"/></Relationships>')
  await writeFile(join(root,'xl/sharedStrings.xml'),'<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><r><t>A &amp; </t></r><r><t>B</t></r></si></sst>')
  await writeFile(join(root,'xl/worksheets/sheet1.xml'),'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="2"><c r="B2" t="s"><v>0</v></c><c r="D2"><f>1+1</f><v>2</v></c></row></sheetData></worksheet>')
  execFileSync('zip',['-qr','book.xlsx','xl'],{cwd:root})
  expect(await readWtt(join(root,'book.xlsx'))).toEqual({'Mondays to Fridays Forward':[[],['','A & B','','2']]})
  await expect(readWtt(join(root,'book.xlsx'),{maxCells:2})).rejects.toThrow(/budget/)
  await expect(readWtt(join(root,'book.xlsx'),{maxExpandedBytes:1})).rejects.toThrow()
  await expect(readWtt(join(root,'book.xlsx'),{maxCells:NaN})).rejects.toThrow(/limit/)
 }finally{await rm(root,{recursive:true,force:true})}
})
