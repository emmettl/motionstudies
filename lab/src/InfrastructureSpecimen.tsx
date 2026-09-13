import { useEffect, useRef } from 'react'
import { setScenePickMetadata } from '@motionstudies/three/scene-picking'
import type { DiagramStationsProps, RoadOverlayProps } from '@motionstudies/three/scene-extensions'
import type { Points } from 'three'

export function SpecimenStations({ snapshot, projectedStops }: DiagramStationsProps) {
  const points = useRef<Points>(null)
  useEffect(() => {
    if (points.current) setScenePickMetadata(points.current.geometry, { stopIndexes: [0] })
  }, [projectedStops])
  return <points ref={points} userData={{ specimenRoutes: snapshot.trains.length }}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array(projectedStops[0] ?? [0, 0, 0]), 3]} /></bufferGeometry>
    <pointsMaterial color="#ffffff" size={5} sizeAttenuation={false} />
  </points>
}
export function SpecimenRoadOverlay({ topology }: RoadOverlayProps) {
  return <group userData={{ specimenRoadOverlay: topology.roads.length === 0 }} />
}
