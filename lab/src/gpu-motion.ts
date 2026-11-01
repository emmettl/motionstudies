import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments, OrthographicCamera, Points, PointsMaterial, WebGLRenderTarget as RenderTarget, Scene, WebGLRenderer } from 'three'
import { LineBasicNodeMaterial, PointsNodeMaterial, WebGPURenderer } from 'three/webgpu'
import { applyMotionLerp, createMotionLerp, createMotionUniforms } from '@motionstudies/three/motion-lerp'
import { applyMotionLerpNodes, createMotionLerpNodes } from '@motionstudies/three/motion-lerp-nodes'
import { prepareNodeDebug } from '@motionstudies/three/debug-nodes'

const query = new URLSearchParams(location.search), choice = query.get('backend') ?? 'auto'
const button = document.querySelector<HTMLButtonElement>('[data-run]')!, output = document.querySelector<HTMLElement>('[data-results]')!
async function start() {
  const debug = choice === 'legacy' ? undefined : await prepareNodeDebug({ edition: 'motion-backend-check', build: 'alpha49-fixture' })
  const renderer = choice === 'legacy' ? new WebGLRenderer({ antialias: false }) : new WebGPURenderer({ antialias: false, forceWebGL: choice === 'webgl2' })
  if (renderer instanceof WebGPURenderer) { await renderer.init(); await debug?.observe(renderer) }
  const actual = renderer instanceof WebGLRenderer ? 'legacy' : 'isWebGLBackend' in renderer.backend ? 'webgl2' : 'webgpu'
  if (choice === 'webgpu' && actual !== 'webgpu') { debug?.dispose(); renderer.dispose(); throw Error('Native WebGPU unavailable; fallback rejected') }
  document.querySelector('[data-backend]')!.textContent = `Requested ${choice}; actual ${actual}`
  document.body.dataset.backend = actual
  renderer.setSize(256, 256); renderer.domElement.setAttribute('aria-label', 'Moving point and line'); document.body.append(renderer.domElement)
  const scene = new Scene(), camera = new OrthographicCamera(-1, 1, 1, -1, .1, 10); camera.position.z = 2
  const point = new BufferGeometry(), line = new BufferGeometry()
  point.setAttribute('position', new Float32BufferAttribute([-.75, .5, 0], 3)); point.setAttribute('positionTo', new Float32BufferAttribute([.75, .5, 0], 3))
  line.setAttribute('position', new Float32BufferAttribute([-.875, -.5, 0, -.625, -.5, 0], 3)); line.setAttribute('positionTo', new Float32BufferAttribute([.625, -.5, 0, .875, -.5, 0], 3))
  for (const geometry of [point, line]) geometry.setAttribute('motionTime', new Float32BufferAttribute(new Float32Array(geometry.getAttribute('position').count * 2), 2))
  const uniforms = createMotionUniforms()
  const pointsMaterial = actual === 'legacy' ? new PointsMaterial({ color: 0xff0000, size: 1, sizeAttenuation: false }) : new PointsNodeMaterial({ color: 0xff0000, size: 1, sizeAttenuation: false })
  const linesMaterial = actual === 'legacy' ? new LineBasicMaterial({ color: 0x00ff00 }) : new LineBasicNodeMaterial({ color: 0x00ff00 })
  pointsMaterial.name = 'Motion points'; linesMaterial.name = 'Motion lines'
  if (pointsMaterial instanceof PointsNodeMaterial && linesMaterial instanceof LineBasicNodeMaterial) {
    const nodes = createMotionLerpNodes(uniforms); applyMotionLerpNodes(pointsMaterial, nodes); applyMotionLerpNodes(linesMaterial, nodes)
  } else {
    const lerp = createMotionLerp(uniforms); applyMotionLerp(pointsMaterial, lerp); applyMotionLerp(linesMaterial, lerp)
  }
  const points = new Points(point, pointsMaterial), lines = new LineSegments(line, linesMaterial)
  points.frustumCulled = lines.frustumCulled = false; scene.add(points, lines)
  const target = new RenderTarget(64, 64, { depthBuffer: false })
  const draw = () => { renderer.setRenderTarget(null); renderer.render(scene, camera) }
  debug?.mount({ label: 'Motion point and line', redraw: draw, metadata: () => ({ playbackTime: uniforms.clock.value, stale: uniforms.stale.value, playing: false }) })
  async function check() {
    button.disabled = true; output.dataset.result = 'running'; output.textContent = 'Checking rendered pixels…'
    const cases = [
      { name: 'before', time: -2, start: 1, end: 11, stale: 2 },
      { name: 'early-boundary', time: -1, start: 1, end: 11, stale: 2 },
      { name: 'start', time: 1, start: 1, end: 11, stale: 0 },
      { name: 'midpoint', time: 6, start: 1, end: 11, stale: 0 },
      { name: 'end', time: 11, start: 1, end: 11, stale: 0 },
      { name: 'late-boundary', time: 13, start: 1, end: 11, stale: 2 },
      { name: 'stale', time: 13.25, start: 1, end: 11, stale: 2 },
      { name: 'reversed', time: 6, start: 11, end: 1, stale: 100 },
      { name: 'zero-span', time: 1, start: 1, end: 1, stale: 0 },
      { name: 'minimum-span', time: 1.0005, start: 1, end: 1, stale: 1 },
      { name: 'zero-span-stale', time: 1.25, start: 1, end: 1, stale: 0 },
      { name: 'backward-seek', time: 6, start: 1, end: 11, stale: 0 },
    ]
    const results = []
    try {
      for (const fixture of cases) {
        uniforms.clock.value = fixture.time; uniforms.stale.value = fixture.stale
        for (const geometry of [point, line]) {
          const windows = geometry.getAttribute('motionTime')
          for (let k = 0; k < windows.count; k++) windows.setXY(k, fixture.start, fixture.end)
          windows.needsUpdate = true
        }
        renderer.setRenderTarget(target); renderer.render(scene, camera)
        const pixels = renderer instanceof WebGLRenderer ? new Uint8Array(64 * 64 * 4) : await renderer.readRenderTargetPixelsAsync(target, 0, 0, 64, 64)
        if (renderer instanceof WebGLRenderer) renderer.readRenderTargetPixels(target, 0, 0, 64, 64, pixels)
        const channels = [0, 1].map(channel => {
          let count = 0, sum = 0
          for (let k = 0; k < 64 * 64; k++) if (pixels[k * 4 + channel] > 200) { count++; sum += k % 64 }
          return { count, centre: count ? sum / count : null }
        })
        const clock = Math.fround(fixture.time), visible = fixture.end >= fixture.start && clock >= fixture.start - fixture.stale && clock <= fixture.end + fixture.stale
        const phase = Math.min(1, Math.max(0, (clock - fixture.start) / Math.max(fixture.end - fixture.start, .001)))
        const expectedCentre = ((-.75 + 1.5 * phase) * .5 + .5) * 64 - .5
        if (channels.some(channel => (channel.count > 0) !== visible || visible && Math.abs(channel.centre! - expectedCentre) > 1.5)) throw Error(`${fixture.name}: pixel mismatch ${JSON.stringify(channels)}`)
        results.push({ name: fixture.name, visible, channels })
      }
      output.dataset.result = 'pass'; output.textContent = JSON.stringify({ pass: true, backend: actual, cases: results }, null, 2)
    } catch (error) { output.dataset.result = 'fail'; output.textContent = String(error); console.error(error) }
    finally { draw(); button.disabled = false }
  }
  button.onclick = () => { void check() }
  window.addEventListener('pagehide', () => { debug?.dispose(); target.dispose(); point.dispose(); line.dispose(); pointsMaterial.dispose(); linesMaterial.dispose(); renderer.dispose() }, { once: true })
  await check()
}
void start().catch(error => { output.dataset.result = 'fail'; output.textContent = String(error); console.error(error) })
