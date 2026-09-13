/** A continuous estimate between scattered instruments. Values are reconstructed from weighted
 * neighbouring stations; `support` reports how near the closest contributing evidence is, so a
 * rendering can fade where its evidence weakens. The estimate is a model choice, not an observation
 * at the sampled place, and missing station values stay missing rather than becoming zero.
 */
export interface FieldStation {readonly latitude:number;readonly longitude:number}
/** Kilometre scales of the neighbour kernel and the support fade. */
export interface FieldSupportOptions {
 /** Gaussian scale of neighbour weights. */
 readonly scaleKm:number
 /** Weights taper smoothly from `reachStartKm` to zero at `reachKm`; stations beyond `reachKm` do not contribute. */
 readonly reachStartKm:number
 readonly reachKm:number
 /** Support is 1 within `supportNearKm` of the nearest contributing station and fades to 0 at `supportFarKm`. */
 readonly supportNearKm:number
 readonly supportFarKm:number
}
export const DEFAULT_FIELD_SUPPORT:FieldSupportOptions={scaleKm:90,reachStartKm:180,reachKm:240,supportNearKm:120,supportFarKm:240}
export interface FieldNeighbour {readonly index:number;readonly distanceKm:number;readonly weight:number}
/** One station's contribution at one instant. A null value excludes the station; an incomplete vector excludes it from the vector estimate only. */
export interface FieldSample {readonly value:number|null;readonly vector?:readonly [east:number,north:number]|null}
export interface FieldEstimate {
 readonly value:number|null
 readonly vector:readonly [east:number,north:number]|null
 /** Fade from the nearest station that supplied a value. */
 readonly support:number
 /** Fade from the nearest station that supplied a complete vector; 0 when none did. */
 readonly vectorSupport:number
}
export interface FieldGridBounds {readonly west:number;readonly east:number;readonly south:number;readonly north:number;readonly step:number}
export interface FieldGridCell {readonly latitude:number;readonly longitude:number;readonly neighbours:readonly FieldNeighbour[]}
export interface FieldGrid {readonly width:number;readonly height:number;readonly bounds:FieldGridBounds;readonly cells:readonly FieldGridCell[]}
/** A bilinear reading of a sampled grid. The vector is null when any contributing corner lacks one. */
export interface FieldGridSample {readonly value:number;readonly vector:readonly [east:number,north:number]|null;readonly support:number}

const rad=Math.PI/180
const smooth=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)}
const fade=(distance:number,near:number,far:number)=>1-smooth((distance-near)/Math.max(far-near,1e-9))

/** Great-circle distance on a spherical Earth. */
export function distanceKm(a:FieldStation,b:FieldStation):number {
 const p=(b.latitude-a.latitude)*rad,q=(b.longitude-a.longitude)*rad
 const h=Math.sin(p/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(q/2)**2
 return 12742.0176*Math.asin(Math.min(1,Math.sqrt(h)))
}
/** Stations within reach of a place, weighted by distance. `exclude` withholds one station, for example to test the estimate against it. */
export function fieldNeighbours(stations:readonly FieldStation[],latitude:number,longitude:number,options:FieldSupportOptions=DEFAULT_FIELD_SUPPORT,exclude=-1):FieldNeighbour[] {
 const place={latitude,longitude},neighbours:FieldNeighbour[]=[]
 stations.forEach((station,index)=>{
  const distance=distanceKm(station,place)
  if(index===exclude||distance>=options.reachKm)return
  neighbours.push({index,distanceKm:distance,weight:Math.exp(-.5*(distance/options.scaleKm)**2)*fade(distance,options.reachStartKm,options.reachKm)})
 })
 return neighbours
}
/** Weighted estimate from the supplied station samples. Vector components blend as east/north components, never as bearings. */
export function estimateField(neighbours:readonly FieldNeighbour[],sample:(index:number)=>FieldSample|null|undefined,options:FieldSupportOptions=DEFAULT_FIELD_SUPPORT):FieldEstimate {
 let weight=0,value=0,vectorWeight=0,east=0,north=0,nearest=Infinity,nearestVector=Infinity
 for(const n of neighbours){
  const s=sample(n.index)
  if(!s||s.value===null||!Number.isFinite(s.value))continue
  weight+=n.weight;value+=n.weight*s.value;nearest=Math.min(nearest,n.distanceKm)
  const v=s.vector
  if(v&&Number.isFinite(v[0])&&Number.isFinite(v[1])){vectorWeight+=n.weight;east+=n.weight*v[0];north+=n.weight*v[1];nearestVector=Math.min(nearestVector,n.distanceKm)}
 }
 if(weight<1e-12)return {value:null,vector:null,support:0,vectorSupport:0}
 return {value:value/weight,vector:vectorWeight?[east/vectorWeight,north/vectorWeight]:null,
  support:fade(nearest,options.supportNearKm,options.supportFarKm),vectorSupport:vectorWeight?fade(nearestVector,options.supportNearKm,options.supportFarKm):0}
}
/** Precompute neighbours for a regular grid. Rows run south to north; the grid includes both bounds. */
export function createFieldGrid(stations:readonly FieldStation[],bounds:FieldGridBounds,options:FieldSupportOptions=DEFAULT_FIELD_SUPPORT):FieldGrid {
 const width=Math.round((bounds.east-bounds.west)/bounds.step)+1,height=Math.round((bounds.north-bounds.south)/bounds.step)+1,cells:FieldGridCell[]=[]
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const latitude=bounds.south+y*bounds.step,longitude=bounds.west+x*bounds.step
  cells.push({latitude,longitude,neighbours:fieldNeighbours(stations,latitude,longitude,options)})
 }
 return {width,height,bounds,cells}
}
/** Four channels per cell and level: value, east, north, support; levels are the outer dimension.
 * Unavailable channels are NaN. With `movement`, a cell without a complete vector is entirely
 * unavailable and its support also fades from the nearest station with a vector.
 */
export function sampleFieldGrid(grid:FieldGrid,sample:(index:number,level:number)=>FieldSample|null|undefined,levels:number,options:FieldSupportOptions=DEFAULT_FIELD_SUPPORT,movement=false):Float32Array {
 const data=new Float32Array(grid.cells.length*levels*4);data.fill(NaN)
 for(let level=0;level<levels;level++)for(let i=0;i<grid.cells.length;i++){
  const e=estimateField(grid.cells[i].neighbours,(index)=>sample(index,level),options),o=(level*grid.cells.length+i)*4
  if(e.value===null||(movement&&!e.vector))continue
  data[o]=e.value;data[o+3]=movement?Math.min(e.support,e.vectorSupport):e.support
  if(e.vector){data[o+1]=e.vector[0];data[o+2]=e.vector[1]}
 }
 return data
}
/** Bilinear reading of `sampleFieldGrid` output. Null outside the grid or where any contributing corner lacks a value. */
export function sampleFieldGridAt(data:Float32Array,grid:FieldGrid,latitude:number,longitude:number,level:number):FieldGridSample|null {
 const {width,height,bounds}=grid,x=(longitude-bounds.west)/bounds.step,y=(latitude-bounds.south)/bounds.step
 if(!(x>=0&&x<=width-1&&y>=0&&y<=height-1)||level<0||(level+1)*width*height*4>data.length)return null
 const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,out=[0,0,0,0]
 let vector=true
 for(const [xx,yy,w] of [[x0,y0,(1-fx)*(1-fy)],[Math.min(x0+1,width-1),y0,fx*(1-fy)],[x0,Math.min(y0+1,height-1),(1-fx)*fy],[Math.min(x0+1,width-1),Math.min(y0+1,height-1),fx*fy]]){
  if(w<1e-10)continue
  const o=(level*width*height+yy*width+xx)*4
  if(!Number.isFinite(data[o])||!Number.isFinite(data[o+3]))return null
  if(!Number.isFinite(data[o+1])||!Number.isFinite(data[o+2]))vector=false
  for(let c=0;c<4;c++)out[c]+=data[o+c]*w
 }
 return {value:out[0],vector:vector?[out[1],out[2]]:null,support:out[3]}
}
