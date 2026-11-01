import { DiagnosticPerf } from './DiagnosticPerf.tsx'
import { useEffect } from 'react'
import { observeRenderer } from './renderer-observation.ts'
import { useNetworkScene } from '@motionstudies/three/scene-extensions'
import { scenePickMetadata } from '@motionstudies/three/scene-picking'
import { useFrame, useThree } from '@react-three/fiber/legacy'
import { NormalBlending, type PerspectiveCamera, type BufferGeometry, type Material, type Object3D, type SpriteMaterial } from 'three'

/** Observe the actual packed renderer so the lab can verify live style changes. */
export function NetworkStyleProbe() {
  const { renderer, scene, camera, invalidate } = useThree()
  const context = useNetworkScene()
  useEffect(() => observeRenderer(renderer, invalidate), [renderer, invalidate])
  useFrame(() => {
    let flatStrokes = 0, customRoutes = 0, roadOverlays = 0, gridOpacity: number | undefined
    const airports: string[] = [], trains: string[] = [], stopIndexes: number[] = [], heights: number[] = []
    const trainPositions: { id: string; x: number; z: number }[] = []
    const trainColors: Record<string, number[]> = {}
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
          const color = object.geometry.getAttribute('color')
          if (train && color) {
            trainColors[train.id] = [color.getX(i), color.getY(i), color.getZ(i)].map(n => Number(n.toFixed(5)))
            colors.push(...trainColors[train.id])
          }
          if (train) { trainPositions.push({ id: train.id, x: position.getX(i), z: position.getZ(i) }); trains.push(train.id); heights.push(Number(position.getY(i).toFixed(3))) }
        }
      }
      if (object.isLineSegments && material?.blending === NormalBlending && !material.depthTest && !material.depthWrite && [3, 4].includes(object.renderOrder)) flatStrokes++
      if (object.isSprite && object.visible && [16, 21].includes(object.renderOrder)) labels.push((material as SpriteMaterial).map?.uuid ?? '')
    })
    renderer.domElement.setAttribute('data-style-audit', JSON.stringify({ selectedTrain: context.props.selectedTrain?.id, trainColors, trainPositions, projectedStops: context.projectedStops, cameraZoom: (camera as PerspectiveCamera).zoom, gridOpacity, flatStrokes, colors, labels, airportResources, airportLabels, airports, trains, stopIndexes, heights, customRoutes, roadOverlays }))
  })
  return <DiagnosticPerf />
}
