import { expect, test } from 'vitest'
import { Mesh, OrthographicCamera, Vector2, WebGPUCoordinateSystem } from 'three'
import { createMotionSpriteGeometry, createMotionSpriteUniforms, motionSpritePosition, pickMotionSprite, type MotionSpriteData } from './motion-sprites.ts'
const fixture = (): MotionSpriteData => ({positions:new Float32Array([-.5,0,0]),positionsTo:new Float32Array([.5,0,0]),windows:new Float32Array([1,11]),colours:new Float32Array([1,.5,.2]),sizes:new Float32Array([32])})
test('sprite CPU sampling retains inclusive stale windows, reverse seeks and empty slots',()=>{
  const data=fixture(), uniforms=createMotionSpriteUniforms(); uniforms.stale.value=2
  for(const [time,visible,x] of [[-2,false,0],[-1,true,-.5],[6,true,0],[13,true,.5],[13.25,false,0],[6,true,0]] as const) {
    uniforms.clock.value=time;const position=motionSpritePosition(data,0,uniforms)
    expect(!!position).toBe(visible);if(position)expect(position.x).toBeCloseTo(x)
  }
  data.windows.set([11,1]);expect(motionSpritePosition(data,0,uniforms)).toBeNull()
})
test('screen-space picking tracks parent transforms, camera zoom and hidden glyphs',()=>{
  const data=fixture(), uniforms=createMotionSpriteUniforms();uniforms.viewport.value.set(256,256);uniforms.clock.value=6
  const geometry=createMotionSpriteGeometry(data),mesh=new Mesh(geometry), camera=new OrthographicCamera(-1,1,1,-1,.1,10);camera.position.z=2;camera.zoom=2;camera.updateProjectionMatrix();camera.updateMatrixWorld()
  mesh.position.x=.2
  expect(pickMotionSprite(data,uniforms,new Vector2(.4,0),camera,mesh)).toBe(0)
  expect(pickMotionSprite(data,uniforms,new Vector2(0,0),camera,mesh)).toBeNull()
  uniforms.clock.value=14;expect(pickMotionSprite(data,uniforms,new Vector2(.4,0),camera,mesh)).toBeNull();geometry.dispose()
})
test('invalid lengths, sizes and nonfinite positions fail before GPU allocation',()=>{
  expect(()=>createMotionSpriteGeometry({...fixture(),windows:new Float32Array()})).toThrow()
  expect(()=>createMotionSpriteGeometry({...fixture(),sizes:new Float32Array([-1])})).toThrow()
  expect(()=>createMotionSpriteGeometry({...fixture(),positions:new Float32Array([NaN,0,0])})).toThrow()
  const empty=createMotionSpriteGeometry({positions:new Float32Array(),positionsTo:new Float32Array(),windows:new Float32Array(),colours:new Float32Array(),sizes:new Float32Array()});expect(empty.instanceCount).toBe(0);empty.dispose()
})

test('picking rejects a glyph clipped by the WebGPU near plane',()=>{
  const data=fixture(),uniforms=createMotionSpriteUniforms();uniforms.clock.value=6;uniforms.viewport.value.set(256,256)
  const geometry=createMotionSpriteGeometry(data),mesh=new Mesh(geometry),camera=new OrthographicCamera(-1,1,1,-1,.1,10)
  camera.coordinateSystem=WebGPUCoordinateSystem;camera.position.z=2;camera.updateProjectionMatrix();camera.updateMatrixWorld()
  mesh.position.z=1.95
  expect(pickMotionSprite(data,uniforms,new Vector2(0,0),camera,mesh)).toBeNull()
  mesh.position.z=0
  expect(pickMotionSprite(data,uniforms,new Vector2(0,0),camera,mesh)).toBe(0);geometry.dispose()
})
