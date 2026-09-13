import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {mkdtemp,writeFile,rm,stat} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join,posix} from 'node:path'
import {parseRailXml,xmlChildren,xmlContent,xmlText,xmlAttribute} from './rail-xml.mjs'
import {checkedDate} from './uk-service-day.mjs'
const execute=promisify(execFile)
const spreadsheetNamespace='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
function rootContent(nodes,name,namespace=spreadsheetNamespace){
 const roots=xmlChildren(nodes,name)
 if(roots.length!==1)throw new Error(`Missing or ambiguous workbook root: ${name}`)
 const node=roots[0],key=Object.keys(node).find(k=>k!==':@'),prefix=key.includes(':')?key.split(':')[0]:null
 if(node[':@']?.[prefix?'@_xmlns:'+prefix:'@_xmlns']!==namespace)throw new Error(`Unsupported workbook namespace: ${name}`)
 return xmlContent(node)
}

export async function listRailArchive(archive){
 const {stdout}=await execute('unzip',['-Z1',archive],{maxBuffer:8*1024*1024,timeout:30000})
 const entries=stdout.split('\n').filter(Boolean)
 if(new Set(entries).size!==entries.length)throw new Error('Duplicate archive member names')
 return entries
}
export async function readRailArchiveEntry(archive,member,maxBytes=32*1024*1024){
 if(!member||/[?*[\r\n]/.test(member)||!Number.isSafeInteger(maxBytes)||maxBytes<1)throw new Error('Invalid archive member or byte limit')
 const {stdout}=await execute('unzip',['-p',archive,member],{encoding:'buffer',maxBuffer:maxBytes,timeout:30000})
 return stdout
}
/** XLSX source cells only: formula results are retained; formulas are never evaluated. */
export async function readWtt(input,{weekends=false,maxWorkbookBytes=32*1024*1024,maxExpandedBytes=128*1024*1024,maxCells=8_000_000}={}){
 for(const value of [maxWorkbookBytes,maxExpandedBytes,maxCells])if(!Number.isSafeInteger(value)||value<1)throw new Error('Invalid workbook resource limit')
 let archive=input,temporary
 if(typeof input!=='string'){
  if(!(input instanceof Uint8Array)||input.length>maxWorkbookBytes)throw new Error('Workbook exceeds limit')
  temporary=await mkdtemp(join(tmpdir(),'motion-wtt-'));archive=join(temporary,'workbook.xlsx');await writeFile(archive,input,{mode:0o600})
 }
 try{
  if((await stat(archive)).size>maxWorkbookBytes)throw new Error('Workbook exceeds limit')
  const entries=new Set(await listRailArchive(archive));let expanded=0,allocated=0
  const read=async name=>{
   if(!entries.has(name))throw new Error(`Missing workbook member: ${name}`)
   const bytes=await readRailArchiveEntry(archive,name,maxExpandedBytes-expanded)
   expanded+=bytes.length;return parseRailXml(bytes)
  }
  const strings=entries.has('xl/sharedStrings.xml')?xmlChildren(rootContent(await read('xl/sharedStrings.xml'),'sst'),'si').map(n=>xmlText(xmlContent(n))):[]
  const links=xmlChildren(rootContent(await read('xl/_rels/workbook.xml.rels'),'Relationships','http://schemas.openxmlformats.org/package/2006/relationships'),'Relationship')
  const targets=new Map()
  for(const link of links){const id=xmlAttribute(link,'Id');if(targets.has(id))throw new Error('Duplicate workbook relationship');targets.set(id,link)}
  const book=rootContent(await read('xl/workbook.xml'),'workbook'),sheetsNode=xmlChildren(book,'sheets')[0]
  const result={}
  for(const sheet of xmlChildren(xmlContent(sheetsNode),'sheet')){
   const name=xmlAttribute(sheet,'name')
   if(!name.startsWith('Mondays to Fridays')&&!(weekends&&name.startsWith('Saturdays')))continue
   if(Object.hasOwn(result,name))throw new Error('Duplicate workbook sheet')
   const link=targets.get(xmlAttribute(sheet,'id'));if(!link||xmlAttribute(link,'TargetMode')==='External')throw new Error('Invalid workbook relationship')
   const target=xmlAttribute(link,'Target'),member=posix.normalize(target.startsWith('/')?target.slice(1):'xl/'+target)
   if(!member.startsWith('xl/'))throw new Error('Worksheet escapes workbook')
   const worksheet=rootContent(await read(member),'worksheet'),data=xmlChildren(worksheet,'sheetData')[0],rows=[]
   const rowIds=new Set()
   for(const row of xmlChildren(xmlContent(data),'row')){
    const index=Number(xmlAttribute(row,'r'))-1
    if(!Number.isInteger(index)||index<0||index>=10000||rowIds.has(index))throw new Error('Invalid or duplicate worksheet row')
    rowIds.add(index);while(rows.length<=index)rows.push([])
    const cols=new Set()
    for(const cell of xmlChildren(xmlContent(row),'c')){
     const address=/^([A-Z]+)(\d+)$/.exec(xmlAttribute(cell,'r')??'')
     if(!address||Number(address[2])!==index+1)throw new Error('Invalid cell address')
     let col=0;for(const letter of address[1])col=col*26+letter.charCodeAt(0)-64
     if(col>16384||cols.has(col))throw new Error('Invalid or duplicate cell column');cols.add(col)
     allocated+=Math.max(0,col-rows[index].length);if(allocated>maxCells)throw new Error('Worksheet cell budget exceeded')
     while(rows[index].length<col)rows[index].push('')
     const content=xmlContent(cell),value=xmlChildren(content,'v')[0],type=xmlAttribute(cell,'t')
     let text=value?xmlText(xmlContent(value)):''
     if(type==='s'){const i=Number(text);if(!/^\d+$/.test(text)||i>=strings.length)throw new Error('Invalid shared string reference');text=strings[i]}
     else if(type==='inlineStr'){const inline=xmlChildren(content,'is')[0];text=inline?xmlText(xmlContent(inline)):''}
     rows[index][col-1]=text
    }
   }
   result[name]=rows
  }
  return result
 }finally{if(temporary)await rm(temporary,{recursive:true,force:true})}
}
const SYMBOLS=new Set(['','/','T','TF','TB','U','D','A','T X','OP','S','T -D','T -U','T -DK','TBX','T -UK','T RM','T K -D','TBK','T K -U','TBN','U -D','D -U','TBS','TFN','TFS','T A','OPC','TBK KE','C A','C','X OP','OPX','RMN','RMD','RMU','D RM'])
export function wttTiming(value){
 const m=/^(\d{2})([A-Z/ -]*)(\d{2})(½?)$/.exec(value)
 if(!m||!SYMBOLS.has(m[2])||Number(m[1])>23||Number(m[3])>59)throw new Error(`Unreviewed WTT time: ${value}`)
 return [Number(m[1])*3600+Number(m[3])*60+(m[4]?30:0),m[2]]
}
export function wttRunsOn(code,dateRange,date){
 checkedDate(date)
 const parts=/^(\d{2})\/(\d{2})\/(\d{4}) to (\d{2})\/(\d{2})\/(\d{4})$/.exec(dateRange)
 if(!parts)throw new Error(`Unreviewed date range: ${dateRange}`)
 const start=checkedDate(`${parts[3]}-${parts[2]}-${parts[1]}`),end=checkedDate(`${parts[6]}-${parts[5]}-${parts[4]}`)
 if(start>end)throw new Error('Reversed WTT date range')
 if(date<start||date>end)return false
 const m=/^((?:Th|Sun|[MTWFS])+)([OX])$/.exec(code)
 if(!m)throw new Error(`Unreviewed running days: ${code}`)
 const day=['Sun','M','T','W','Th','F','S'][new Date(date+'T12:00:00Z').getUTCDay()]
 return m[1].match(/Th|Sun|[MTWFS]/g).includes(day)===(m[2]==='O')
}
export function wttTerminal(value){const i=value.lastIndexOf('\n');if(i<0)throw new Error('Missing terminal time');return [value.slice(0,i),wttTiming(value.slice(i+1).replaceAll(':',''))[0]]}

/** Audit source columns without assigning stations or joining different table banks. */
export function auditWttGrid(sheets,table,serviceDate,{includeColumn=()=>true}={}){
 checkedDate(serviceDate)
 const day=new Date(serviceDate+'T12:00:00Z').getUTCDay()
 if(day===0)throw new Error('Sunday is not supported by the reviewed reader; no partial Sunday audit is produced')
 const prefix=day===6?'Saturdays':'Mondays to Fridays',selected=Object.entries(sheets).filter(([name])=>name.startsWith(prefix))
 if(!selected.length)throw new Error(`No ${prefix} bank in ${table}`)
 const columns=[],rejected=[],expected=['TID','UID','Operator','Origin','Destination','Timing Load','Dates of Operation','Running Days','Service Code']
 for(const [sheet,rows] of selected){
  if(JSON.stringify(rows.slice(0,9).map(r=>r[1]??''))!==JSON.stringify(expected))throw new Error(`Unrecognized WTT headers: ${table}/${sheet}`)
  let location='';const locations=[]
  for(let i=9;i<rows.length;i++){const row=rows[i];if(row[0])location=row[0];if(['arr','dep','pass'].includes(row[1]))locations.push([i+1,location,row[1],row])}
  for(let c=2;c<rows[0].length;c++){
   const cell=r=>rows[r][c]??'',identity={table,sheet,column:c+1,uid:cell(1)}
   try{
    if(!wttRunsOn(cell(7),cell(6),serviceDate))continue
    if(!cell(1))throw new Error('Missing UID')
    const events=[];let previous=null,rollover=0
    for(const [row,location,kind,values] of locations){
     const sourceTime=values[c]??'';if(sourceTime===''||sourceTime==='..')continue
     const [seconds,symbols]=wttTiming(sourceTime);let local=seconds+rollover*86400
     if(previous!==null&&local<previous-43200){rollover++;local+=86400}
     if(previous!==null&&local<previous)throw new Error('Non-monotonic timing sequence')
     previous=local;events.push({location,kind,sourceTime,wallSecondsFromBankMidnight:local,symbols,row})
    }
    const column={...identity,tid:cell(0),operator:cell(2),origin:cell(3),destination:cell(4),datesOfOperation:cell(6),runningDays:cell(7),serviceCode:cell(8),events}
    if(includeColumn(column))columns.push(column)
   }catch(error){rejected.push({...identity,reason:error.message})}
  }
 }
 return {columns,rejected}
}
