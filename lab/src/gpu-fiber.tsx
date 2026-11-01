import { useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Mesh } from 'three'
import { createMotionSpriteGeometry, createMotionSpriteUniforms } from '@motionstudies/three/motion-sprites'
import { createLuminousSpriteNodeMaterial } from '@motionstudies/three/luminous-materials-nodes'
import { createMotionLightTexture } from '@motionstudies/three/light-textures'
const requested = new URLSearchParams(location.search).get('backend') ?? 'webgl2'
export function Glyph() {
  const { renderer } = useThree()
  const resources = useMemo(() => {
    const uniforms=createMotionSpriteUniforms(); uniforms.clock.value=6;uniforms.viewport.value.set(320,240)
    const geometry=createMotionSpriteGeometry({positions:new Float32Array([-.5,0,0]),positionsTo:new Float32Array([.5,0,0]),windows:new Float32Array([1,11]),colours:new Float32Array([.3,1,.65]),sizes:new Float32Array([32])})
    const texture=createMotionLightTexture('orb'), material=createLuminousSpriteNodeMaterial(uniforms,texture), mesh=new Mesh(geometry,material);mesh.frustumCulled=false
    return {geometry,texture,material,mesh}
  },[])
  useEffect(()=>()=>{resources.geometry.dispose();resources.texture.dispose();resources.material.dispose()},[resources])
  useFrame(({elapsed,time,delta})=>{
    const backend = 'isWebGLBackend' in renderer.backend ? 'webgl2' : 'webgpu'
    const valid = requested !== 'webgpu' || backend==='webgpu'
    const status=document.querySelector<HTMLOutputElement>('[data-fiber-status]')!
    status.dataset.result=valid?'pass':'fail';status.textContent=JSON.stringify({backend,elapsed,time,delta})
  })
  return <primitive object={resources.mesh} dispose={null}/>
}
createRoot(document.querySelector('#root')!).render(<Canvas orthographic dpr={1} camera={{position:[0,0,2],zoom:100}} renderer={{antialias:false,forceWebGL:requested==='webgl2'}}><Glyph/></Canvas>)
