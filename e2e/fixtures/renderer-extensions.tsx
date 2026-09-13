import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useThree } from '@react-three/fiber'
import type { Camera, Scene } from 'three'
import { NationalNetworkScene } from '@motionstudies/three/NationalNetworkScene'
import { useNetworkScene, type NetworkSceneExtensions, type TrailBackend, type TrailFrame } from '@motionstudies/three/scene-extensions'
import { buildStationIndex } from '@motionstudies/core/domain/network'
import { network, layout } from '../../lab/src/fixtures.ts'

const probe = {
  positions: 0, starts: 0, disposals: 0, childMounts: 0, childDisposals: 0,
  resets: 0, submissions: 0, backendDisposals: 0, ids: [] as string[],
  stop: [] as number[], camera: undefined as Camera | undefined, scene: undefined as Scene | undefined,
}
Object.assign(globalThis, { rendererExtensionProbe: probe })

class Backend implements TrailBackend {
  available = true
  private key?: object
  private frame?: TrailFrame
  reset() { this.available = true; probe.resets++; this.frame = undefined }
  select(key: object) { if (key !== this.key) { this.key = key; this.frame = undefined } }
  submit(_time: number, ids: string[]) {
    probe.submissions++; probe.ids = ids
    this.frame = { counts: [1, 1, 1], colors: Array.from({ length: 3 }, () => new Float32Array(6).fill(1)),
      positions: Array.from({ length: 3 }, () => new Float32Array([7, 0.2, 4, 8, 0.2, 4])) }
  }
  takeFrame() { const frame = this.frame; this.frame = undefined; return frame }
  dispose() { probe.backendDisposals++; this.available = false; this.frame = undefined }
}
const createTrailBackend = () => new Backend()
const createCameraDriver: NonNullable<NetworkSceneExtensions['createCameraDriver']> = ({ camera }) => {
  probe.starts++
  return { update() { camera.position.set(7, 25, 18); return true }, dispose() { probe.disposals++ } }
}

function Layer() {
  const { projectedStops } = useNetworkScene()
  const { camera, scene } = useThree()
  useEffect(() => {
    probe.camera = camera; probe.scene = scene; probe.childMounts++
    return () => { probe.childDisposals++ }
  }, [camera, scene])
  useEffect(() => { probe.stop = [...projectedStops[0]] }, [projectedStops])
  return <mesh name="edition-layer" position={projectedStops[0]}><sphereGeometry args={[0.3]} /><meshBasicMaterial color="#fff" /></mesh>
}
export function ExtensionFixture() {
  const [position, setPosition] = useState<'default' | 'custom' | 'hidden'>('default')
  const [driver, setDriver] = useState(false)
  const [backend, setBackend] = useState(false)
  const [mounted, setMounted] = useState(true)
  const [mix, setMix] = useState(0)
  const extensions = useMemo<NetworkSceneExtensions>(() => ({
    trainPosition: (_train, _time, _stops) => {
      probe.positions++
      return position === 'custom' ? [7, 0.2, 4] : position === 'hidden' ? null : undefined
    },
    createCameraDriver: driver ? createCameraDriver : undefined,
    createTrailBackend: backend ? createTrailBackend : undefined,
  }), [position, driver, backend])
  return <>
    <select aria-label="Position" value={position} onChange={event => setPosition(event.target.value as typeof position)}>
      <option value="default">Default</option><option value="custom">Custom</option><option value="hidden">Hidden</option>
    </select>
    <button onClick={() => setDriver(value => !value)}>Toggle driver</button>
    <button onClick={() => setBackend(value => !value)}>Toggle backend</button>
    <button onClick={() => setMix(value => 1 - value)}>Toggle layout</button>
    <button onClick={() => setMounted(value => !value)}>Toggle scene</button>
    <div style={{ height: 400 }}>
      {mounted && <NationalNetworkScene snapshot={network} referenceSnapshot={network}
        stations={buildStationIndex(network)} isPlaying={false} time={60} onTime={() => {}}
        playbackRate={1} trainLabelMode="off" cameraFraming={{ homeDistanceScale: 1, minimumDistanceScale: 0.1 }} spatialLayout={layout} spatialLayoutMix={mix}
        extensions={extensions}><Layer /></NationalNetworkScene>}
    </div>
  </>
}
createRoot(document.getElementById('root')!).render(<ExtensionFixture />)
