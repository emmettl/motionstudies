import * as THREE from 'three'
import { weatherFramePair, type WeatherTimeSupport } from '@motionstudies/core/domain/weather-field'

export interface GridTextureSource {
  width: number; height: number; times: string[]
  timeSupport?: WeatherTimeSupport; intervalSeconds?: number
  /** RGBA pixels. R is value premultiplied by validity; A is validity. */
  frame: (index: number) => Uint8Array | Float32Array
  type?: typeof THREE.UnsignedByteType | typeof THREE.FloatType
}
/** Provider-independent two-frame GPU playback. Appearance and projection belong to the edition. */
export function createGridTexturePair(source: GridTextureSource) {
  const {width,height,times}=source
  if (!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||width*height>1_000_000||!times.length||times.some((t,i)=>!Number.isFinite(Date.parse(t))||i>0&&Date.parse(t)<=Date.parse(times[i-1]))) throw new Error('Invalid texture grid or times')
  const timeSupport=source.timeSupport??'instant'
  if(!['instant','interval-mean','interval-total'].includes(timeSupport)||timeSupport!=='instant'&&(!Number.isFinite(source.intervalSeconds)||source.intervalSeconds!<=0))throw new Error('Invalid texture time support')
  const type=source.type??THREE.FloatType
  function pixels(index:number) {
    const data=source.frame(index)
    if(data.length!==width*height*4 || (type===THREE.FloatType ? !(data instanceof Float32Array) : !(data instanceof Uint8Array))) throw new Error('Invalid texture frame')
    return data
  }
  const texture=(data:Uint8Array|Float32Array)=>{
    const t=new THREE.DataTexture(data.slice(),width,height,THREE.RGBAFormat,type)
    t.minFilter=t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;t.needsUpdate=true
    return t
  }
  const initial=pixels(0),a=texture(initial),b=texture(initial)
  let left=0,right=0,disposed=false
  const uniforms={weatherA:{value:a},weatherB:{value:b},weatherBlend:{value:0}}
  function setFrames(pair:{a:number;b:number;fraction:number}) {
    if(disposed)throw new Error('Texture pair disposed')
    if(!Number.isInteger(pair.a)||!Number.isInteger(pair.b)||pair.a<0||pair.b<0||pair.a>=times.length||pair.b>=times.length||!Number.isFinite(pair.fraction)||pair.fraction<0||pair.fraction>1)throw new Error('Invalid texture bracket')
    const first=left!==pair.a?pixels(pair.a):undefined,second=right!==pair.b?pixels(pair.b):undefined
    if(first){a.image.data!.set(first);a.needsUpdate=true;left=pair.a}
    if(second){b.image.data!.set(second);b.needsUpdate=true;right=pair.b}
    uniforms.weatherBlend.value=pair.fraction
    return true
  }
  return {a,b,uniforms,setFrames,
    /** Call after changing the variable behind the frame callback. */
    invalidate(){left=-1;right=-1},
    update(time:string|number) {
      if(disposed)throw new Error('Texture pair disposed')
      const pair=weatherFramePair({times,timeSupport,intervalSeconds:source.intervalSeconds},time)
      return pair?setFrames(pair):false
    },
    dispose(){if(!disposed){disposed=true;a.dispose();b.dispose()}}
  }
}
/** Keep signed values and units. Zero is valid, null is not. */
export function scalarGridPixels(values: readonly (number|null)[]): Float32Array {
  const pixels=new Float32Array(values.length*4)
  values.forEach((value,i)=>{if(value!==null){if(!Number.isFinite(value)||!Number.isFinite(Math.fround(value)))throw new Error('Invalid grid value');pixels[i*4]=value;pixels[i*4+3]=1}})
  return pixels
}
/** UV is already in texel-centre coordinates. Missing weighted samples stay missing. */
export const WEATHER_SAMPLE_GLSL=`
vec2 sampleWeatherScalar(sampler2D a, sampler2D b, vec2 uv, float blend) {
  vec4 x=texture2D(a,uv), y=texture2D(b,uv);
  if ((blend<1.0 && x.a<0.99999) || (blend>0.0 && y.a<0.99999)) return vec2(0.0);
  return vec2(mix(x.r,y.r,blend),1.0);
}`
