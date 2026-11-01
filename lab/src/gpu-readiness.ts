import { BufferGeometry, Float32BufferAttribute, LineSegments, Mesh, OrthographicCamera, Scene, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { createMotionSpriteGeometry, createMotionSpriteUniforms, motionSpritePosition, pickMotionSprite, type MotionSpriteData } from '@motionstudies/three/motion-sprites'
import { createLuminousLineMaterial, createLuminousSpriteMaterial } from '@motionstudies/three/luminous-materials'
import { createLuminousLineNodeMaterial, createLuminousSpriteNodeMaterial } from '@motionstudies/three/luminous-materials-nodes'
import { createLuminousOutput } from '@motionstudies/three/luminous-output'
import { createMotionLightTexture } from '@motionstudies/three/light-textures'
import { applyMotionLerp, createMotionLerp } from '@motionstudies/three/motion-lerp'
import { applyMotionLerpNodes, createMotionLerpNodes } from '@motionstudies/three/motion-lerp-nodes'

const query = new URLSearchParams(location.search), choice = query.get('backend') ?? 'auto'
const host = document.querySelector<HTMLDivElement>('#map')!, label = document.querySelector<HTMLSpanElement>('#label')!
const output = document.querySelector<HTMLElement>('[data-results]')!, time = document.querySelector<HTMLInputElement>('[data-time]')!
const state = { time: matchMedia('(prefers-reduced-motion: reduce)').matches ? 11 : 6, zoom: false, wide: false, generations: 0 }
let dispose: (() => Promise<void>) | undefined, running = false, recreating = false
async function mount() {
  const opened = performance.now()
  const renderer = choice === 'legacy' ? new WebGLRenderer({ antialias: false }) : new WebGPURenderer({ antialias: false, forceWebGL: choice === 'webgl2' })
  if (renderer instanceof WebGPURenderer) await renderer.init()
  let retired = false
  const actual = renderer instanceof WebGLRenderer ? 'legacy' : 'isWebGLBackend' in renderer.backend ? 'webgl2' : 'webgpu'
  if (choice === 'webgpu' && actual !== 'webgpu') { renderer.dispose(); throw Error('Native WebGPU unavailable; fallback rejected') }
  renderer.setClearColor('#080d10', 1); renderer.setPixelRatio(1)
  renderer.domElement.setAttribute('aria-label', 'Renderer comparison map'); host.prepend(renderer.domElement)
  document.querySelector('p[data-backend]')!.textContent = `Requested ${choice}; actual ${actual}`
  document.body.dataset.backend = actual; host.dataset.generation = String(++state.generations)
  const recover = () => { if (!retired) void recreate(actual === 'webgpu' ? 'webgpu-device-lost' : 'webgl-context-lost').catch(fail) }
  if (renderer instanceof WebGLRenderer) renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); recover() }, {once:true})
  else {
    renderer.onDeviceLost = recover
    const backend = renderer.backend as typeof renderer.backend & { device?: { destroy():void; lost:Promise<unknown> } }
    // Three intentionally ignores an explicit GPUDevice.destroy(); observe the actual device promise for this fault-injection fixture.
    void backend.device?.lost.then(recover)
  }
  document.querySelector<HTMLButtonElement>('[data-loss]')!.onclick = () => {
    if (running || recreating) return
    if (actual === 'webgpu' && renderer instanceof WebGPURenderer) {
      const backend = renderer.backend as typeof renderer.backend & {device:{destroy():void}}
      backend.device.destroy()
    } else {
      const gl = renderer instanceof WebGLRenderer ? renderer.getContext() : (renderer.backend as typeof renderer.backend & {gl:WebGL2RenderingContext}).gl
      const extension = gl.getExtension('WEBGL_lose_context')
      if (!extension) { fail(Error('Context-loss injection unavailable')); return }
      extension.loseContext()
    }
  }
  const displayOutput = createLuminousOutput()
  const scene = new Scene(), camera = new OrthographicCamera(-1, 1, 1, -1, .1, 10); camera.position.z = 2
  const uniforms = createMotionSpriteUniforms(); uniforms.stale.value = 2
  const data: MotionSpriteData = { positions: new Float32Array([-.6, .2, 0]), positionsTo: new Float32Array([.6, .2, 0]), windows: new Float32Array([1, 11]), colours: new Float32Array([.3, 1, .65]), sizes: new Float32Array([32]) }
  const geometry = createMotionSpriteGeometry(data), map = createMotionLightTexture('orb')
  const spriteMaterial = actual === 'legacy' ? createLuminousSpriteMaterial(uniforms, map) : createLuminousSpriteNodeMaterial(uniforms, map, displayOutput)
  const glyph = new Mesh(geometry, spriteMaterial); glyph.frustumCulled = false; scene.add(glyph)
  const haloData = { ...data, sizes: new Float32Array([52]), colours: new Float32Array([1, .55, .15]) }, haloGeometry = createMotionSpriteGeometry(haloData), haloMap = createMotionLightTexture('halo')
  const haloUniforms = { ...uniforms, opacity: { value: .35 } }
  const haloMaterial = actual === 'legacy' ? createLuminousSpriteMaterial(haloUniforms, haloMap) : createLuminousSpriteNodeMaterial(haloUniforms, haloMap, displayOutput)
  const halo = new Mesh(haloGeometry, haloMaterial); halo.frustumCulled = false; scene.add(halo)
  const trailGeometry = new BufferGeometry()
  trailGeometry.setAttribute('position', new Float32BufferAttribute([-.8, -.1, 0, -.6, -.1, 0], 3))
  trailGeometry.setAttribute('positionTo', new Float32BufferAttribute([.4, -.1, 0, .6, -.1, 0], 3))
  trailGeometry.setAttribute('motionTime', new Float32BufferAttribute([1, 11, 1, 11], 2))
  const trailMaterial = actual === 'legacy' ? createLuminousLineMaterial('#ff7040') : createLuminousLineNodeMaterial('#ff7040', 1, displayOutput)
  if (actual === 'legacy') applyMotionLerp(trailMaterial, createMotionLerp(uniforms))
  else applyMotionLerpNodes(trailMaterial as ReturnType<typeof createLuminousLineNodeMaterial>, createMotionLerpNodes(uniforms))
  const trail = new LineSegments(trailGeometry, trailMaterial); trail.frustumCulled = false; scene.add(trail)
  const contextGeometry = new BufferGeometry().setFromPoints([[-.9,-.7], [.9,-.7], [.9,-.7], [.9,.8], [.9,.8], [-.9,.8], [-.9,.8], [-.9,-.7], [-.7,-.5], [.7,-.4]].map(([x,y]) => new Vector3(x,y,0)))
  const contextMaterial = actual === 'legacy' ? createLuminousLineMaterial('#6688aa', .3) : createLuminousLineNodeMaterial('#6688aa', .3, displayOutput)
  const context = new LineSegments(contextGeometry, contextMaterial); scene.add(context)
  const target = new WebGLRenderTarget(256, 256, { depthBuffer: false })
  const matrices = () => { camera.zoom = state.zoom ? 1.5 : 1; camera.position.x = state.zoom ? .1 : 0; camera.updateProjectionMatrix(); camera.updateMatrixWorld() }
  const placeLabel = () => {
    const centre = motionSpritePosition(data, 0, uniforms)
    label.hidden = !centre
    if (centre) { centre.applyMatrix4(glyph.matrixWorld).project(camera); label.style.left = `${(centre.x + 1) * uniforms.viewport.value.x / 2}px`; label.style.top = `${(1 - centre.y) * uniforms.viewport.value.y / 2}px` }
  }
  const draw = () => { matrices(); displayOutput.render(renderer, scene, camera); placeLabel(); host.dataset.time = String(state.time); host.dataset.zoom = String(state.zoom); host.dataset.labelVisible = String(!label.hidden) }
  const resize = () => { const width = state.wide ? 384 : 256, height = state.wide ? 192 : 256; renderer.setSize(width, height); uniforms.viewport.value.set(width, height); host.style.width = `${width}px`; host.style.height = `${height}px`; draw() }
  time.value = String(state.time); uniforms.clock.value = state.time; resize()
  const firstFrameMs = performance.now() - opened
  time.oninput = () => { state.time = Number(time.value); uniforms.clock.value = state.time; draw() }
  document.querySelector<HTMLButtonElement>('[data-zoom]')!.onclick = () => { state.zoom = !state.zoom; draw() }
  document.querySelector<HTMLButtonElement>('[data-resize]')!.onclick = () => { state.wide = !state.wide; resize() }
  renderer.domElement.onclick = event => {
    const bounds = renderer.domElement.getBoundingClientRect(), pointer = new Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2)
    document.querySelector('[data-pick]')!.textContent = pickMotionSprite(data, uniforms, pointer, camera, glyph) === 0 ? 'Fixture journey selected' : 'No journey'
  }
  async function check() {
    if (running) return
    running = true; output.dataset.result = 'running'
    const saved = { ...state }, frames = []
    try {
      state.zoom = state.wide = false; resize()
      const fixtures = [
        { name: 'before', time: -2 }, { name: 'early-boundary', time: -1 }, { name: 'start', time: 1 },
        { name: 'midpoint', time: 6 }, { name: 'end', time: 11 }, { name: 'late-boundary', time: 13 },
        { name: 'stale', time: 13.25 }, { name: 'backward-seek', time: 6 }, { name: 'reversed', time: 6, reverse: true },
        { name: 'zero-span', time: 1, end: 1, stale: 0 }, { name: 'minimum-span', time: 1.0005, end: 1, stale: 1 }, { name: 'zero-span-stale', time: 1.25, end: 1, stale: 0 },
      ]
      for (const fixture of fixtures) {
        uniforms.clock.value = fixture.time; uniforms.stale.value = fixture.stale ?? 2
        const end = fixture.end ?? 11
        geometry.getAttribute('spriteWindow').setXY(0, fixture.reverse ? end : 1, fixture.reverse ? 1 : end); geometry.getAttribute('spriteWindow').needsUpdate = true
        context.visible = halo.visible = trail.visible = false
        matrices(); displayOutput.render(renderer, scene, camera, target)
        const pixels = renderer instanceof WebGLRenderer ? new Uint8Array(256 * 256 * 4) : await renderer.readRenderTargetPixelsAsync(target, 0, 0, 256, 256)
        if (renderer instanceof WebGLRenderer) renderer.readRenderTargetPixels(target, 0, 0, 256, 256, pixels)
        // Green channel separates the glyph from the dark background. Y is reported from the bottom on both APIs.
        let count = 0, x = 0, y = 0, left = 256, right = -1, bottom = 256, top = -1, energy = 0
        for (let k = 0; k < 256 * 256; k++) if (pixels[k * 4 + 1] > 40) { const px = k % 256, py = actual === 'webgpu' ? 255 - Math.floor(k / 256) : Math.floor(k / 256); count++; x += px; y += py; left = Math.min(left,px); right = Math.max(right,px); bottom = Math.min(bottom,py); top = Math.max(top,py); energy += pixels[k*4+1] }
        const visible = !fixture.reverse && fixture.time >= 1 - uniforms.stale.value && fixture.time <= end + uniforms.stale.value
        const expectedX = (Math.min(1,Math.max(0,(Math.fround(fixture.time)-1)/Math.max(end-1,.001))) * 1.2 + .4) * 128 - .5
        if ((count > 0) !== visible || visible && (Math.abs(x / count - expectedX) > 2 || right - left < 20 || right - left > 33)) throw Error(`${fixture.name}: wrong glyph footprint ${count}/${x/count}/${right-left}`)
        frames.push({ name: fixture.name, visible, pixels: count, centre: count ? [x/count, y/count] : null, extent: count ? [right-left+1, top-bottom+1] : null, energy })
      }
      geometry.getAttribute('spriteWindow').setXY(0,1,11); geometry.getAttribute('spriteWindow').needsUpdate = true
      context.visible = halo.visible = trail.visible = true
      uniforms.clock.value = 6; uniforms.stale.value = 2; matrices(); displayOutput.render(renderer, scene, camera, target)
      const composed = renderer instanceof WebGLRenderer ? new Uint8Array(256*256*4) : await renderer.readRenderTargetPixelsAsync(target,0,0,256,256)
      if (renderer instanceof WebGLRenderer) renderer.readRenderTargetPixels(target,0,0,256,256,composed)
      const tiles = Array.from({length: 8*8*3}, () => 0)
      for (let y=0;y<256;y++) for (let x=0;x<256;x++) for(let c=0;c<3;c++) tiles[(Math.floor(y/32)*8+Math.floor(x/32))*3+c] += composed[((actual === 'webgpu' ? 255-y : y)*256+x)*4+c] / 1024
      draw()
      const capture = document.createElement('canvas'); capture.width=256;capture.height=256
      const context2d=capture.getContext('2d')!; context2d.drawImage(renderer.domElement,0,0)
      const screen=context2d.getImageData(0,0,256,256).data
      const screenTiles=Array.from({length:8*8*3},()=>0), haloEnergy=[0,0,0]
      for(let y=0;y<256;y++) for(let x=0;x<256;x++) for(let c=0;c<3;c++) {
        screenTiles[(Math.floor(y/32)*8+Math.floor(x/32))*3+c]+=screen[(y*256+x)*4+c]/1024
        const radius=Math.hypot(x-127.5,y-101.9)
        if(radius>17&&radius<25)haloEnergy[c]+=screen[(y*256+x)*4+c]
      }
      const frameIntervalsMs: number[] = []
      let previous: number | undefined
      for (let i=0;i<13;i++) {
        const now = await new Promise<number>(resolve => requestAnimationFrame(resolve))
        if (previous !== undefined) frameIntervalsMs.push(now-previous)
        previous=now;draw()
      }
      const payloadBytes = Object.values(data).reduce((sum,values) => sum + values.byteLength,0)
      output.textContent = JSON.stringify({ pass: true, backend: actual, generation: state.generations, firstFrameMs, frameIntervalsMs, payloadBytes, frames, tiles, screenTiles, haloEnergy, renderer: { geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }, scope: 'Synthetic composed scene and rendered glyph footprints; CPU timings, no GPU or physical-phone budget claim.' },null,2)
      output.dataset.result = 'pass'
    } finally {
      state.time = saved.time; state.zoom = saved.zoom; state.wide = saved.wide; uniforms.clock.value = state.time; time.value = String(state.time); resize(); running = false
    }
  }
  document.querySelector<HTMLButtonElement>('[data-run]')!.onclick = () => { void check().catch(fail) }
  dispose = async () => { retired = true; renderer.domElement.onclick = null; for (const resource of [geometry, haloGeometry, trailGeometry, contextGeometry, map, haloMap, spriteMaterial, haloMaterial, trailMaterial, contextMaterial, target]) resource.dispose(); await renderer.dispose(); if (renderer instanceof WebGLRenderer && !renderer.getContext().isContextLost()) renderer.forceContextLoss(); renderer.domElement.remove() }
  await check()
}
function fail(error: unknown) { output.dataset.result = 'fail'; output.textContent = String(error); console.error(error) }
async function recreate(reason = 'manual') {
  if (running || recreating) return
  recreating = true; host.dataset.recovery = reason
  try { await dispose?.(); await mount() } finally { recreating = false }
}
document.querySelector<HTMLButtonElement>('[data-remount]')!.onclick = () => { void recreate().catch(fail) }
window.addEventListener('pagehide', () => { void dispose?.() }, { once:true })
void mount().catch(fail)
