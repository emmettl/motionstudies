import { DiagnosticPerf } from './DiagnosticPerf.tsx'
import { observeRenderer, perfEnabled } from './renderer-observation.ts'
import { useScenarioState } from './scenario-state.tsx'
import { useEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber/legacy'
import { BufferGeometry, DataTexture, FloatType, MeshStandardMaterial, LineSegments, LineBasicMaterial, RGBAFormat, Vector3, type Texture } from 'three'
import { createHeightfieldSurface, createTerrainGeometry } from '@motionstudies/three/terrain-surface'
import { terrainMaskAt, terrainPathDistances, terrainPathPoint, terrainSegmentMasked, type TerrainPoint, type TerrainPathMask } from '@motionstudies/core/terrain'

const size = 17, span = 160
const grids = [0, 1].map(phase => ({ rows: size, columns: size, widthMetres: span, depthMetres: span,
  elevations: Array.from({ length: size * size }, (_, i) => {
    const x = i % size, y = Math.floor(i / size)
    return 4 + 28 * Math.exp(-((x - 4 - phase * 7) ** 2 + (y - 3) ** 2) / 12) + y * .7
  }) }))
const masks: TerrainPathMask[] = [{ start: .4, end: .6, names: ['Synthetic covered section'], kinds: ['cover'], reason: 'covered' }]
const fragmentShader = `in float vBed; in vec3 vNormal_; out vec4 fragColor;
void main() { float l = .35 + .65 * max(dot(normalize(vNormal_), normalize(vec3(-.4,.75,-.5))),0.); fragColor=vec4(vec3(.3,.65,.5)*l,1.); }`

// Keep the texture provider mutable outside React: the surface owns no caller textures.
function textureSurface(textures: readonly Texture[], exaggeration: number, southFirst: boolean, wireframe: boolean) {
  let current = textures[0]
  const surface = createHeightfieldSurface(grids[0], () => current, { metresPerUnit: 20, verticalExaggeration: exaggeration, rowOrder: southFirst ? 'south-to-north' : 'north-to-south', wireframe, fragmentShader })
  return { ...surface, bind(texture: Texture) { current = texture; surface.update() } }
}

function Surfaces({ phase, exaggeration, southFirst, wireframe, progress, masked }: { phase: number; exaggeration: number; southFirst: boolean; wireframe: boolean; progress: number; masked: boolean }) {
  const { renderer, scene, camera, invalidate, size: viewportSize } = useThree()
  useEffect(() => observeRenderer(renderer, invalidate), [renderer, invalidate])
  useEffect(() => {
    const distance = Math.max(12, 25 / (viewportSize.width / viewportSize.height))
    camera.position.set(0, distance * .65, distance * .75)
    camera.lookAt(0, 0, 0)
    invalidate()
  }, [camera, viewportSize.width, viewportSize.height, invalidate])
  const textures = useMemo(() => grids.map(grid => {
    const data = new Float32Array(size * size * 4)
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) data[(y * size + x) * 4] = grid.elevations[(southFirst ? size - 1 - y : y) * size + x]
    const texture = new DataTexture(data, size, size, RGBAFormat, FloatType)
    texture.needsUpdate = true
    return texture
  }), [southFirst])
  const gpu = useMemo(() => textureSurface(textures, exaggeration, southFirst, wireframe), [textures, exaggeration, southFirst, wireframe])
  const cpu = useMemo(() => createTerrainGeometry(grids[phase], { metresPerUnit: 20, verticalExaggeration: exaggeration }), [phase, exaggeration])
  const material = useMemo(() => new MeshStandardMaterial({ color: '#4da680', wireframe }), [wireframe])
  const path: TerrainPoint[] = useMemo(() => Array.from({ length: size }, (_, x) => [(x / (size - 1) - .5) * span, 0, grids[phase].elevations[8 * size + x] + 2]), [phase])
  const distances = useMemo(() => terrainPathDistances(path), [path])
  const point = terrainPathPoint(path, distances, progress)
  const line = useMemo(() => {
    const vertices: Vector3[] = []
    for (let i = 1; i < path.length; i++) {
      if (masked && terrainSegmentMasked(masks, distances[i - 1] / distances.at(-1)!, distances[i] / distances.at(-1)!)) continue
      for (const [x, z, y] of [path[i - 1], path[i]]) vertices.push(new Vector3(x / 20, y * exaggeration / 20, z / 20))
    }
    return new BufferGeometry().setFromPoints(vertices)
  }, [path, distances, masked, exaggeration])
  const pathMaterial = useMemo(() => new LineBasicMaterial({ color: '#ffcf79' }), [])
  const pathLine = useMemo(() => new LineSegments(line, pathMaterial), [line, pathMaterial])
  useEffect(() => () => pathMaterial.dispose(), [pathMaterial])
  useEffect(() => {
    // Rebind the existing surface to a different caller-owned texture, as a ping-pong solver would.
    gpu.bind(textures[phase])
    invalidate()
    renderer.domElement.setAttribute('data-terrain-audit', JSON.stringify({ phase, texture: textures[phase].uuid, geometry: gpu.mesh.geometry.uuid, north: grids[phase].elevations[0], southFirst, hidden: masked && !!terrainMaskAt(masks, progress) }))
    renderer.render(scene, camera)
  }, [gpu, textures, phase, invalidate, renderer, scene, camera, southFirst, masked, progress])
  useEffect(() => () => gpu.dispose(), [gpu])
  useEffect(() => () => { textures.forEach(t => t.dispose()) }, [textures])
  useEffect(() => () => cpu.dispose(), [cpu])
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => () => line.dispose(), [line])
  return <>
    <ambientLight intensity={.7} /><directionalLight position={[-4, 8, -5]} intensity={2} />
    {[-4.7, 4.7].map((x, i) => <group key={x} position={[x, 0, 0]}>
      {i === 0 ? <mesh geometry={cpu} material={material} dispose={null} /> : <primitive object={gpu.mesh} dispose={null} />}
      <primitive object={pathLine.clone()} dispose={null} />
      {!(masked && terrainMaskAt(masks, progress)) && <mesh position={[point[0] / 20, point[2] * exaggeration / 20, point[1] / 20]}><sphereGeometry args={[.13]} /><meshBasicMaterial color="#fff4dc" /></mesh>}
    </group>)}
  </>
}

export function TerrainStudy() {
  const [phase, setPhase] = useScenarioState('phase', 0), [exaggeration, setExaggeration] = useScenarioState('exaggeration', 1), [southFirst, setSouthFirst] = useScenarioState('southFirst', false)
  const [wireframe, setWireframe] = useScenarioState('wireframe', false), [progress, setProgress] = useScenarioState('progress', .2), [masked, setMasked] = useScenarioState('masked', true), [mounted, setMounted] = useScenarioState('mounted', true)
  return <>
    <div className="toolbar">
      <button onClick={() => setPhase(1 - phase)}>Swap height texture</button><output>Landscape {phase + 1}</output>
      <label>Exaggeration <input aria-label="Terrain exaggeration" type="range" min=".5" max="4" step=".5" value={exaggeration} onChange={e => setExaggeration(+e.target.value)} /></label>
      <label><input type="checkbox" checked={southFirst} onChange={e => setSouthFirst(e.target.checked)} /> South-first texture adapter</label>
      <label><input type="checkbox" checked={wireframe} onChange={e => setWireframe(e.target.checked)} /> Wireframe</label>
      <label><input type="checkbox" checked={masked} onChange={e => setMasked(e.target.checked)} /> Visibility mask</label>
      <button onClick={() => setMounted(!mounted)}>{mounted ? 'Unmount terrain' : 'Mount terrain'}</button>
    </div>
    <p>CPU geometry (left) · GPU texture displacement (right). North is the far edge; the isolated peak starts in the northwest.</p>
    <div className="scene-preview">{mounted && <Canvas frameloop={perfEnabled ? 'always' : 'demand'} camera={{ position: [0, 14, 16], fov: 48 }} onCreated={({ camera }) => camera.lookAt(0, 0, 0)}><DiagnosticPerf /><Surfaces {...{ phase, exaggeration, southFirst, wireframe, progress, masked }} /></Canvas>}</div>
    <div className="timeline"><label>Path progress <input aria-label="Terrain path progress" type="range" min="0" max="1" step=".01" value={progress} onChange={e => setProgress(+e.target.value)} /></label><output data-testid="terrain-mask">{masked && terrainMaskAt(masks, progress) ? 'Hidden · Synthetic covered section' : 'Visible'}</output></div>
    <p className="note">Synthetic 160 × 160 m vertex grid; 10 m spacing. The gold alignment follows the terrain. The mask hides the alignment and moving marker between 40% and 60%; it is a presentation rule. Both surfaces should agree after every swap and orientation change.</p>
  </>
}
