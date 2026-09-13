import {wttTiming,wttRunsOn,wttTerminal} from './rail-wtt.mjs'
import {checkedDate} from './uk-service-day.mjs'
const addDays=(date,days)=>new Date(Date.parse(date+'T12:00:00Z')+days*86400000).toISOString().slice(0,10)
// Preserve the source reader's nearest-day tie handling (round half to even).
const roundDay=x=>{const floor=Math.floor(x);return x-floor===.5?(floor%2===0?floor:floor+1):Math.round(x)}

/** Join WTT banks by UID and originating date. Region/operator resolution is supplied by the edition. */
export function joinWttColumns(tables,{serviceDate,stations,operators,resolveLocation,normalizeName,includeTrain=tid=>/^[129][A-Z][0-9]{2}$/.test(tid)}){
 checkedDate(serviceDate)
 if([0,1,6].includes(new Date(serviceDate+'T12:00:00Z').getUTCDay()))throw new Error('Sunday banks are unsupported; joined assembly requires all three adjacent banks (Tuesday to Friday only)')
 const joined=new Map(),counts={},unmapped={},sources=[]
 for(const {table,sha256,sheets} of tables){
  sources.push({table,sha256})
  for(const [sheet,rows] of Object.entries(sheets)){
   if(!sheet.startsWith('Mondays to Fridays')&&!sheet.startsWith('Saturdays'))throw new Error(`Unexpected sheet ${sheet}`)
   const expected=['TID','UID','Operator','Origin','Destination','Timing Load','Dates of Operation','Running Days','Service Code']
   if(JSON.stringify(rows.slice(0,9).map(r=>r[1]??''))!==JSON.stringify(expected))throw new Error(`Unrecognized WTT headers: ${table}/${sheet}`)
   const labelled=[];let location='',block=0
   for(let i=9;i<rows.length;i++){const row=rows[i];if(row[0]){location=row[0];block++}if(['arr','dep','pass'].includes(row[1]))labelled.push([i+1,block,location,row[1],row])}
   for(let column=2;column<rows[0].length;column++){
    const cell=i=>rows[i][column]??'',tid=cell(0),uid=cell(1),operator=cell(2)
    if(!operators.includes(operator)||!includeTrain(tid))continue
    const [origin,originTime]=wttTerminal(cell(3)),[destination,destinationTime]=wttTerminal(cell(4)),days=cell(7),dateRange=cell(6)
    const activeDays=[-1,0,1].filter(offset=>{
     const date=addDays(serviceDate,offset),day=new Date(date+'T12:00:00Z').getUTCDay()
     return (day===6&&sheet.startsWith('Saturdays')||day>=1&&day<=5&&sheet.startsWith('Mondays to Fridays'))&&wttRunsOn(days,dateRange,date)
    })
    if(!activeDays.length)continue
    if(!uid)throw new Error('Missing UID')
    const points=[];let previous=-1,day=0,firstTime=null
    for(const [rowNumber,block,name,kind,row] of labelled){
     const value=row[column]??'';if(value===''||value==='..')continue
     let [time,symbols]=wttTiming(value);time+=day*86400
     if(time<previous-43200){day++;time+=86400}
     if(time<previous)throw new Error(`Non-monotonic WTT ${table}:${sheet}:${column+1}:${rowNumber}`)
     previous=time;if(firstTime===null)firstTime=time
     const code=resolveLocation(name,operator)
     if(!code){if(symbols.includes('T')||symbols.startsWith('U')||symbols.startsWith('D'))unmapped[name]=(unmapped[name]??0)+1;continue}
     if(!stations[code])throw new Error(`Unknown resolved station: ${code}`)
     if(!points.length||points.at(-1).block!==block)points.push({code,block,rows:[],passenger:false,pickupOnly:false,setDownOnly:false})
     const point=points.at(-1);point[kind]=time;point.rows.push(rowNumber)
     const activity=symbols.split(' ')[0]
     point.passenger ||= (activity.includes('T')||['U','D'].includes(activity))&&!activity.includes('N')&&!activity.includes('S')
     point.pickupOnly ||= activity==='U';point.setDownOnly ||= activity==='D'
    }
    if(!points.length)continue
    const originDay=originTime>firstTime+3600?-1:0
    for(const offset of activeDays){
     const originDate=addDays(serviceDate,offset+originDay),key=`${uid}:${originDate}`,source={table,sheet,column:column+1,days,dates:dateRange}
     if(!joined.has(key))joined.set(key,{uid,tid,operator,origin,destination,originDate,points:[],sources:[]})
     const entry=joined.get(key)
     if(entry.origin!==origin||entry.destination!==destination||entry.operator!==operator)throw new Error(`Conflicting active UID ${key}`)
     entry.sources.push(source)
     for(const point of points){
      let arrival=point.arr??point.dep??point.pass,departure=point.dep??point.arr??point.pass
      const station=stations[point.code],publicTimes=[]
      for(const [terminalName,terminalTime] of [[origin,originTime],[destination,destinationTime]])if(normalizeName(station.tags.name)===normalizeName(terminalName))publicTimes.push(terminalTime+roundDay((arrival-terminalTime)/86400)*86400)
      if(publicTimes.length){const closest=publicTimes.reduce((a,b)=>Math.abs(b-arrival)<Math.abs(a-arrival)?b:a);if(Math.abs(closest-arrival)<=300)arrival=departure=closest}
      entry.points.push({...point,rows:[...point.rows],arrival:arrival+offset*86400,departure:departure+offset*86400,source:entry.sources.length-1})
     }
     for(const [headerRow,name,terminalTime] of [[4,origin,originTime],[5,destination,destinationTime]]){
      const code=resolveLocation(name,operator,{header:true});if(!code)continue
      const reference=headerRow===4?firstTime:previous,time=terminalTime+roundDay((reference-terminalTime)/86400)*86400+offset*86400
      if(!entry.points.some(p=>p.code===code&&Math.abs(p.arrival-time)<=300))entry.points.push({code,arrival:time,departure:time,passenger:true,pickupOnly:false,setDownOnly:false,block:-headerRow,rows:[headerRow],source:entry.sources.length-1})
     }
     counts[operator]=(counts[operator]??0)+1
    }
   }
  }
 }
 const conflicts=[],journeys=[]
 for(const [id,entry] of joined){
  const points=[]
  for(const point of entry.points.sort((a,b)=>a.arrival-b.arrival||a.departure-b.departure)){
   let matches=points.slice(-8).filter(p=>p.code===point.code&&Math.abs(p.arrival-point.arrival)<=60&&Math.abs(p.departure-point.departure)<=60)
   if(points.length&&points.at(-1).code===point.code&&point.arrival-points.at(-1).departure<=1200)matches=[points.at(-1)]
   if(matches.length){const other=matches[0];other.arrival=Math.min(other.arrival,point.arrival);other.departure=Math.max(other.departure,point.departure);other.passenger ||= point.passenger;other.pickupOnly ||= point.pickupOnly;other.setDownOnly ||= point.setDownOnly}
   else points.push(point)
  }
  if(points.length<2||points[0].arrival>=86400||points.at(-1).departure<0)continue
  points.forEach((point,i)=>{if(point.departure<point.arrival||i&&point.arrival<points[i-1].departure)conflicts.push({id,point,previous:i?points[i-1]:null,sources:entry.sources})})
  entry.points=points;journeys.push(entry)
 }
 return {journeys,stations,sources,unmapped,conflicts,columnCounts:counts}
}

/** Reconcile supplied public-call records using two surrounding passenger anchors.
 * Parsing table layouts and accepting known calendar exclusions remain edition policy.
 */
export function supplementPublicCalls(result,records){
 const byOperator=new Map();for(const train of result.journeys){if(!byOperator.has(train.operator))byOperator.set(train.operator,[]);byOperator.get(train.operator).push(train)}
 const added=[],unmatched=[],ambiguous=[]
 for(const record of records){
  const candidates=[]
  for(const train of byOperator.get(record.operator)??[])for(const day of [-1,0,1]){
   const time=record.time+day*86400
   if(time<0||time>=86400||time<train.points[0].arrival||time>train.points.at(-1).departure)continue
   const matches=[]
   for(const anchor of record.anchors)for(const point of train.points){
    if(point.code!==anchor.code||!point.passenger)continue
    const delta=((point[anchor.kind]-anchor.time+43200)%86400+86400)%86400-43200
    if(Math.abs(delta)<=60)matches.push([point,Math.abs(delta)])
   }
   const before=matches.filter(([p])=>p.departure<=time),after=matches.filter(([p])=>p.arrival>=time)
   if(before.length&&after.length&&new Set(matches.map(([p])=>p.code)).size>=2)candidates.push({score:matches.reduce((n,[,d])=>n+d,0)/matches.length,train,time,bracket:[Math.max(...before.map(([p])=>p.departure)),Math.min(...after.map(([p])=>p.arrival))]})
  }
  if(!candidates.length){const {code,time,table,page,column}=record;unmatched.push({code,time,table,page,column});continue}
  const best=Math.min(...candidates.map(c=>c.score)),selected=candidates.filter(c=>c.score===best)
  if(new Set(selected.map(c=>JSON.stringify(c.bracket))).size>1){ambiguous.push({record,uids:selected.map(c=>c.train.uid)});continue}
  for(const {train,time} of selected){
   if(train.points.some(p=>p.code===record.code&&Math.abs(p.arrival-time)<=120))continue
   const source={table:record.table,page:record.page,column:record.column};train.sources.push(source)
   train.points.push({code:record.code,arrival:time,departure:time,passenger:true,pickupOnly:false,setDownOnly:false,rows:[],source:train.sources.length-1,publicSupplement:source});train.points.sort((a,b)=>a.arrival-b.arrival)
   added.push({uid:train.uid,originDate:train.originDate,code:record.code,time,...source})
  }
 }
 return {added,unmatched,ambiguous,sourceColumns:records.length}
}
