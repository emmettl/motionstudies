import { scenePickMetadata } from '@motionstudies/three/scene-picking'
import { useFrame, useThree } from '@react-three/fiber'
import { NormalBlending, type BufferGeometry, type Material, type Object3D, type SpriteMaterial } from 'three'

/** Observe the actual packed renderer so the lab can verify live style changes. */
export function NetworkStyleProbe() {
  const { gl, scene } = useThree()
  useFrame(() => {
    let flatStrokes = 0, customRoutes = 0, roadOverlays = 0
    const airports: string[] = [], trains: string[] = [], stopIndexes: number[] = [], heights: number[] = []
    const colors: number[] = [], labels: string[] = []
    scene.traverse((object: Object3D & { geometry?: BufferGeometry; material?: Material; isLineSegments?: boolean; isSprite?: boolean }) => {
      const material = object.material
      const metadata = scenePickMetadata(object)
      if (metadata?.target?.kind === 'airport' && object.visible) airports.push(metadata.target.value.id)
      if (object.userData.specimenRoutes) customRoutes += object.userData.specimenRoutes
      if (object.userData.specimenRoadOverlay) roadOverlays++
      if (object.geometry) {
        const pick = scenePickMetadata(object.geometry)
        stopIndexes.push(...pick?.stopIndexes ?? [])
        const position = object.geometry.getAttribute('position')
        for (let i = object.geometry.drawRange.start; i < Math.min(position?.count ?? 0, object.geometry.drawRange.start + object.geometry.drawRange.count); i++) {
          const train = pick?.trains?.[i]
          if (train) { trains.push(train.id); heights.push(Number(position.getY(i).toFixed(3))) }
        }
      }
      if (object.isLineSegments && material?.blending === NormalBlending && !material.depthTest && !material.depthWrite && [3, 4].includes(object.renderOrder)) flatStrokes++
      const color = object.geometry?.getAttribute('color')
      if (color) for (let i = 0; i < Math.min(color.array.length, 24); i++) colors.push(Number(color.array[i].toFixed(5)))
      if (object.isSprite && object.visible && [16, 21].includes(object.renderOrder)) labels.push((material as SpriteMaterial).map?.uuid ?? '')
    })
    gl.domElement.setAttribute('data-style-audit', JSON.stringify({ flatStrokes, colors, labels, airports, trains, stopIndexes, heights, customRoutes, roadOverlays }))
  })
  return null
}
