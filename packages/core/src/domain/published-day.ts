/** A published day of the national layer, as compiled by the recording host: the sea (one file of 0.1° cells per
 * five-minute slice), the shoal (one file per slice from cell to member vehicles), and the fish (one gzipped pack
 * per operator per day, split into parts by sample budget), with an index from operator and vehicle to part and a
 * manifest of every file. Everything is static; opening one vehicle fetches one pack. Readers supply the transport
 * and, where the platform lacks DecompressionStream, the inflater; nothing here touches the network itself.
 */
export const SLICE_SECONDS=300,CELL_DEGREES=0.1
export interface PublishedDayManifest {readonly date:string;readonly compiledAt:string;readonly hours:{readonly present:readonly string[];readonly missing:readonly string[]};readonly stats:{readonly samples:number;readonly vehicles:number;readonly operators:number;readonly slices:number;readonly excludedRejected:number;readonly excludedOutsideDay:number};readonly slices:number;readonly files:number;readonly bytes:number;readonly list:readonly {readonly path:string;readonly bytes:number}[]}
/** One cell of a slice: centre-less floor coordinates, samples (which sum across cells) and distinct vehicles (which do not). */
export type SliceCell=readonly [lon:number,lat:number,samples:number,vehicles:number]
export interface SliceFile {readonly slice:string;readonly cells:readonly SliceCell[]}
/** Members of each cell as operator index into the day index and vehicle reference. */
export type Member=readonly [operatorIndex:number,vehicleRef:string]
export interface MembersFile {readonly slice:string;readonly cells:Readonly<Record<string,readonly Member[]>>}
export interface PackPart {readonly file:string;readonly bytes:number;readonly vehicles:number;readonly samples:number;readonly refs?:readonly string[]}
export interface OperatorEntry {readonly ref:string;readonly vehicles:number;readonly samples:number;readonly parts:readonly PackPart[]}
export interface DayIndex {readonly date:string;readonly operators:readonly OperatorEntry[]}
export type TrackPoint=readonly [epochSeconds:number,lon:number,lat:number]
export type JourneyRun=readonly [epochSeconds:number,lineRef:string|null,journeyRef:string|null]
export interface VehicleDay {readonly track:readonly TrackPoint[];readonly journeys:readonly JourneyRun[]}
export interface Pack {readonly date:string;readonly operator:string;readonly part:number;readonly parts:number;readonly vehicles:Readonly<Record<string,VehicleDay>>}
export interface DayTransport {
 /** Text of a file under the day's base, by its relative path. */
 readonly text:(path:string)=>Promise<string>
 /** Bytes of a file under the day's base. */
 readonly bytes:(path:string)=>Promise<Uint8Array>
 /** Gunzip; defaults to the platform's DecompressionStream. */
 readonly inflate?:(bytes:Uint8Array)=>Promise<Uint8Array>
}

/** The slice file name for an instant: HH-MM of the five-minute slice containing it, UTC. */
export function sliceNameAt(instant:string|number):string {
 const t=typeof instant==='number'?instant:Date.parse(instant)
 if(!Number.isFinite(t))throw new Error('Invalid instant')
 const s=Math.floor(t/1000/SLICE_SECONDS)*SLICE_SECONDS,d=new Date(s*1000)
 return `${String(d.getUTCHours()).padStart(2,'0')}-${String(d.getUTCMinutes()).padStart(2,'0')}`
}
/** The ISO start of a named slice on a date. */
export function sliceStart(date:string,name:string):string {return `${date}T${name.replace('-',':')}:00Z`}
/** The cell a position falls in, by the compiler's own rule: floor of the coordinate over the cell size, in double
 * arithmetic, printed to one decimal. The rule is reproduced exactly rather than rounded, so a position near a
 * cell edge lands where the compiler put it. */
export function cellOf(lon:number,lat:number):readonly [number,number] {
 return [Number((Math.floor(lon/CELL_DEGREES)*CELL_DEGREES).toFixed(1)),Number((Math.floor(lat/CELL_DEGREES)*CELL_DEGREES).toFixed(1))]
}
export function cellKey(cellLon:number,cellLat:number):string {return `${cellLon.toFixed(1)},${cellLat.toFixed(1)}`}
/** The pack part holding a vehicle: the only part, or the part whose reference list names it. */
export function partFor(index:DayIndex,operatorRef:string,vehicleRef:string):PackPart|null {
 const op=index.operators.find(o=>o.ref===operatorRef)
 if(!op)return null
 if(op.parts.length===1)return op.parts[0]
 return op.parts.find(p=>p.refs?.includes(vehicleRef))??null
}
/** Position along a track at an instant: linear between the samples around it, null outside the track or across a
 * gap longer than the tolerance, so a vehicle that stopped reporting does not glide. */
export function positionAt(track:readonly TrackPoint[],epochSeconds:number,maxGapSeconds=180):readonly [lon:number,lat:number]|null {
 if(!track.length||epochSeconds<track[0][0]||epochSeconds>track[track.length-1][0])return null
 let lo=0,hi=track.length-1
 while(hi-lo>1){const mid=(lo+hi)>>1;if(track[mid][0]<=epochSeconds)lo=mid;else hi=mid}
 const a=track[lo],b=track[hi]
 if(a[0]===epochSeconds||lo===hi)return [a[1],a[2]]
 if(b[0]===epochSeconds)return [b[1],b[2]]
 if(b[0]-a[0]>maxGapSeconds)return null
 const f=(epochSeconds-a[0])/(b[0]-a[0])
 return [a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f]
}
/** The line and journey a vehicle was on at an instant, from its runs. */
export function journeyAt(journeys:readonly JourneyRun[],epochSeconds:number):JourneyRun|null {
 let found:JourneyRun|null=null
 for(const run of journeys){if(run[0]<=epochSeconds)found=run;else break}
 return found
}
/** Minimal shapes of the platform pieces used, so the module compiles without DOM typings. */
interface ByteSource {arrayBuffer():Promise<ArrayBuffer>}
interface ResponseLike extends ByteSource {readonly ok:boolean;readonly status:number;text():Promise<string>}
export type FetchLike=(url:string)=>Promise<ResponseLike>
interface Platform {DecompressionStream?:new(format:string)=>unknown;Blob?:new(parts:unknown[])=>{stream():{pipeThrough(transform:unknown):unknown}};Response?:new(body:unknown)=>ByteSource;TextDecoder?:new()=>{decode(bytes:Uint8Array):string};fetch?:FetchLike}
const platform=globalThis as unknown as Platform
export async function inflateGzip(bytes:Uint8Array):Promise<Uint8Array> {
 if(!platform.DecompressionStream||!platform.Blob||!platform.Response)throw new Error('No DecompressionStream on this platform; supply an inflater')
 const stream=new platform.Blob([bytes]).stream().pipeThrough(new platform.DecompressionStream('gzip'))
 return new Uint8Array(await new platform.Response(stream).arrayBuffer())
}
/** Packs are stored gzipped, but a server that declares the encoding hands the browser the decoded bytes; either form is accepted by its first two bytes. */
export async function inflateIfGzipped(bytes:Uint8Array,inflate:(bytes:Uint8Array)=>Promise<Uint8Array>):Promise<Uint8Array> {
 return bytes.length>=2&&bytes[0]===0x1f&&bytes[1]===0x8b?inflate(bytes):bytes
}
function decodeText(bytes:Uint8Array):string {
 if(!platform.TextDecoder)throw new Error('No TextDecoder on this platform')
 return new platform.TextDecoder().decode(bytes)
}
export interface PublishedDay {
 readonly manifest:PublishedDayManifest
 readonly index:DayIndex
 readonly slice:(name:string)=>Promise<SliceFile>
 readonly members:(name:string)=>Promise<MembersFile>
 readonly pack:(operatorRef:string,vehicleRef:string)=>Promise<Pack>
 readonly vehicle:(operatorRef:string,vehicleRef:string)=>Promise<VehicleDay|null>
 /** Slice names present, from the manifest's file list, in order. */
 readonly sliceNames:readonly string[]
}
/** Open a published day: manifest and index up front, everything else on demand and cached per file. */
export async function openPublishedDay(transport:DayTransport):Promise<PublishedDay> {
 const manifest=JSON.parse(await transport.text('manifest.json')) as PublishedDayManifest
 const index=JSON.parse(await transport.text('index.json')) as DayIndex
 if(manifest.date!==index.date)throw new Error('Manifest and index disagree on the date')
 const cache=new Map<string,Promise<unknown>>()
 const cached=<T,>(path:string,load:()=>Promise<T>):Promise<T>=>{let p=cache.get(path) as Promise<T>|undefined;if(!p){p=load();cache.set(path,p)}return p}
 const inflate=transport.inflate??inflateGzip
 const sliceNames=manifest.list.filter(f=>f.path.startsWith('slices/')).map(f=>f.path.slice(7,-5)).sort()
 const pack=(operatorRef:string,vehicleRef:string)=>{const part=partFor(index,operatorRef,vehicleRef);if(!part)return Promise.reject(new Error(`No pack for ${operatorRef} ${vehicleRef}`));return cached(part.file,async()=>JSON.parse(decodeText(await inflateIfGzipped(await transport.bytes(part.file),inflate))) as Pack)}
 return {manifest,index,sliceNames,
  slice:name=>cached(`slices/${name}.json`,async()=>JSON.parse(await transport.text(`slices/${name}.json`)) as SliceFile),
  members:name=>cached(`members/${name}.json`,async()=>JSON.parse(await transport.text(`members/${name}.json`)) as MembersFile),
  pack,
  vehicle:async(operatorRef,vehicleRef)=>{if(!partFor(index,operatorRef,vehicleRef))return null;return (await pack(operatorRef,vehicleRef)).vehicles[vehicleRef]??null}}
}
/** A transport over fetch for a day served under a base URL. */
export function fetchTransport(base:string,fetchImpl:FetchLike|undefined=platform.fetch):DayTransport {
 if(!fetchImpl)throw new Error('No fetch on this platform; supply one')
 const url=(path:string)=>`${base.replace(/\/$/,'')}/${path}`
 const get=async(path:string)=>{const r=await fetchImpl(url(path));if(!r.ok)throw new Error(`${path} returned HTTP ${r.status}`);return r}
 return {text:async path=>(await get(path)).text(),bytes:async path=>new Uint8Array(await (await get(path)).arrayBuffer())}
}
