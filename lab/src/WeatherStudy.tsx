import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { readWeatherField, sampleWeather, type WeatherField } from '@motionstudies/core/domain/weather-field'
import { createGridTexturePair, scalarGridPixels, WEATHER_SAMPLE_GLSL } from '@motionstudies/three/weather-textures'

const times=['2026-09-16T00:00:00Z','2026-09-16T01:00:00Z']
const field:WeatherField=readWeatherField({kind:'weather-field',schemaVersion:1,grid:{west:6,south:46,step:1,width:3,height:3},sources:[{id:'synthetic',publisher:'Widget lab',url:'https://motionstudies.app/lab/',retrievedAt:times[0],sha256:'0'.repeat(64),license:'MIT',attribution:'Synthetic fixture, no weather observation'}],variables:{cover:{unit:'%',evidenceKind:'reanalysis',timeSupport:'instant',sourceIds:['synthetic'],times,frames:[[0,20,40,40,50,60,70,80,null],[100,80,60,60,50,40,30,20,null]]},radiation:{unit:'W/m²',evidenceKind:'reanalysis',timeSupport:'interval-mean',intervalSeconds:3600,sourceIds:['synthetic'],times,frames:[Array(9).fill(100),Array(9).fill(400)]}}})
export function WeatherStudy({epoch}:{epoch?:number}={}){
 const [minutes,setMinutes]=useState(30),[variable,setVariable]=useState('cover'),canvas=useRef<HTMLCanvasElement>(null)
 const time=epoch??Date.parse(times[0])+minutes*60000
 const reading=sampleWeather(field,variable,46,6,time)
 useEffect(()=>{
  const element=canvas.current;if(!element)return
  const renderer=new THREE.WebGLRenderer({canvas:element,alpha:true,preserveDrawingBuffer:true});renderer.setSize(480,240,false);renderer.setClearColor(0x000000,0)
  const v=field.variables[variable]
  const pair=createGridTexturePair({width:3,height:3,times:v.times,timeSupport:v.timeSupport,intervalSeconds:v.intervalSeconds,frame:i=>scalarGridPixels(v.frames[i])})
  const material=new THREE.ShaderMaterial({transparent:true,uniforms:{...pair.uniforms,scale:{value:variable==='cover'?100:400}},vertexShader:'varying vec2 p;void main(){p=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`uniform sampler2D weatherA,weatherB;uniform float weatherBlend,scale;varying vec2 p;${WEATHER_SAMPLE_GLSL} void main(){vec2 s=sampleWeatherScalar(weatherA,weatherB,(p*2.+.5)/3.,weatherBlend);gl_FragColor=vec4(vec3(.2,.5,.8)*s.x/scale,s.y);}`})
  const geometry=new THREE.PlaneGeometry(2,2),scene=new THREE.Scene();scene.add(new THREE.Mesh(geometry,material))
  if(pair.update(time))renderer.render(scene,new THREE.Camera());else renderer.clear()
  return()=>{pair.dispose();material.dispose();geometry.dispose();renderer.dispose()}
 },[time,variable])
 return <section><h2>Weather fields</h2><p>Synthetic evidence. Instant cover interpolates; hourly radiation holds its interval. The missing corner remains transparent.</p><div className="toolbar"><label>Weather variable <select value={variable} onChange={e=>setVariable(e.target.value)}><option value="cover">Cloud fraction</option><option value="radiation">Radiation mean</option></select></label>{epoch===undefined&&<label>Weather minute <input type="range" min="0" max="120" value={minutes} onChange={e=>setMinutes(Number(e.target.value))}/></label>}</div><canvas ref={canvas} aria-label="Synthetic weather field" style={{width:'100%',maxWidth:480,background:'#131d2b'}}/><p data-testid="weather-value">{reading?`${reading.value} ${reading.unit} · ${reading.timeSupport}`:'Unavailable'}</p><p data-testid="weather-span">{reading?`${reading.from} → ${reading.to}`:'Outside source coverage'}</p></section>
}
