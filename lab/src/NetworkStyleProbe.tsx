import { useNetworkScene } from '@motionstudies/three/scene-extensions'
import { scenePickMetadata } from '@motionstudies/three/scene-picking'
import { useFrame, useThree } from '@react-three/fiber'
import { NormalBlending, type PerspectiveCamera, type BufferGeometry, type Material, type Object3D, type SpriteMaterial } from 'three'

/** Observe the actual packed renderer so the lab can verify live style changes. */
export function NetworkStyleProbe() {
  const { gl, scene, camera } = useThree()
  const context = useNetworkScene()
  useFrame(() => {
    let flatStrokes = 0, customRoutes = 0, roadOverlays = 0, gridOpacity: number | undefined
    const airports: string[] = [], trains: string[] = [], stopIndexes: number[] = [], heights: number[] = []
    const trainPositions: { id: string; x: number; z: number }[] = []
    const colors: number[] = [], labels: string[] = [], airportResources: string[] = [], airportLabels: string[] = []
    scene.traverse((object: Object3D & { geometry?: BufferGeometry; material?: Material; isLineSegments?: boolean; isSprite?: boolean }) => {
      const material = object.material
      if (material && 'wireframe' in material && material.wireframe && 'color' in material && (material.color as { getHexString(): string }).getHexString() === '424b98') gridOpacity = material.opacity
      const metadata = scenePickMetadata(object)
      if (metadata?.target?.kind === 'airport') {
        let visible = object.visible
        for (let parent = object.parent; parent; parent = parent.parent) visible &&= parent.visible
        if (visible) airports.push(metadata.target.value.id)
        if (object.geometry) airportResources.push(object.geometry.uuid)
        if (object.isSprite) {
          airportResources.push((material as SpriteMaterial).map?.uuid ?? '')
          if (visible) airportLabels.push(metadata.target.value.id)
        }
      }
      if (object.userData.specimenRoutes) customRoutes += object.userData.specimenRoutes
      if (object.userData.specimenRoadOverlay) roadOverlays++
      if (object.geometry) {
        const pick = scenePickMetadata(object.geometry)
        stopIndexes.push(...pick?.stopIndexes ?? [])
        const position = object.geometry.getAttribute('position')
        for (let i = object.geometry.drawRange.start; i < Math.min(position?.count ?? 0, object.geometry.drawRange.start + object.geometry.drawRange.count); i++) {
          const train = pick?.trains?.[i]
          if (train) { trainPositions.push({ id: train.id, x: position.getX(i), z: position.getZ(i) }); trains.push(train.id); heights.push(Number(position.getY(i).toFixed(3))) }
        }
      }
      if (object.isLineSegments && material?.blending === NormalBlending && !material.depthTest && !material.depthWrite && [3, 4].includes(object.renderOrder)) flatStrokes++
      const color = object.geometry?.getAttribute('color')
      if (color) for (let i = 0; i < Math.min(color.array.length, 24); i++) colors.push(Number(color.array[i].toFixed(5)))
      if (object.isSprite && object.visible && [16, 21].includes(object.renderOrder)) labels.push((material as SpriteMaterial).map?.uuid ?? '')
    })
    gl.domElement.setAttribute('data-style-audit', JSON.stringify({ trainPositions, projectedStops: context.projectedStops, cameraZoom: (camera as PerspectiveCamera).zoom, gridOpacity, flatStrokes, colors, labels, airportResources, airportLabels, airports, trains, stopIndexes, heights, customRoutes, roadOverlays }))
  })
  return null
}
