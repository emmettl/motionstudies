import { mapSurfaceY } from './scene-surface.ts'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { useMapStyle } from './scene-map-style.ts'
import { useSpatialGeometryMorph } from './use-spatial-geometry-morph.ts'
import type { ProjectedNetworkPath } from './network-paths.ts'
import { useThree } from '@react-three/fiber'
import type { NetworkSnapshot } from '@motionstudies/core/domain/network'
import type { ProjectedStop } from './station-picking.ts'
import { setScenePickMetadata } from './scene-picking.ts'
import { compactMapLines } from './map-cartography.ts'
import { edgeTrafficWeights } from './traffic-weights.ts'
import { localNetworkDetailAtZoom } from './regional-lod.ts'
import type { MapCameraFraming } from './map-camera.ts'
import { lakeAvoidingPathForStops, type LakeAvoidingPathMap } from './lake-aware-paths.ts'
import { useNetworkScene } from './scene-extensions.ts'
import { appendLineSegments, segmentPoints, routeSegmentKey, offsetProjectedPath } from './scene-path-geometry.ts'
import { trainLightTexture } from './scene-light-texture.ts'

import { STATION_SURFACE_Y } from './scene-layer-order.ts'

function canonicalInterchangeName(name: string): string {
  return name
    .replace(/\s+\([^)]*\)$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function RailGraph({
  morph = false,
  pickable = true,
  snapshot,
  infrastructureSnapshot = snapshot,
  projectedStops,
  projectedPaths,
  cameraFraming,
  subdued,
  lakeAvoidingPaths,
  showTraffic = true,
  routeColors,
  routeColorMix = 0,
  trafficOverviewEmphasis = 0,
  lineMapStyle = false,
}: {
  readonly infrastructureSnapshot?: NetworkSnapshot
  readonly morph?: boolean
  readonly pickable?: boolean
  readonly snapshot: NetworkSnapshot
  readonly projectedStops: readonly ProjectedStop[]
  readonly projectedPaths: readonly ProjectedNetworkPath[]
  readonly cameraFraming: MapCameraFraming
  readonly subdued: boolean
  readonly lakeAvoidingPaths: LakeAvoidingPathMap
  readonly showTraffic?: boolean
  readonly routeColors?: Readonly<Record<string, string>>
  readonly routeColorMix?: number
  readonly trafficOverviewEmphasis?: number
  readonly lineMapStyle?: boolean
}) {
  const style = useMapStyle()
  const flat = style.surface === 'flat'
  const coplanar = style.coplanar
  const DiagramStations = useNetworkScene().props.extensions?.DiagramStations
  const { camera } = useThree()
  const stationMaterial = useRef<THREE.PointsMaterial>(null)
  const interchangeMaterial = useRef<THREE.PointsMaterial>(null)
  const localNetworkMaterial = useRef<THREE.LineBasicMaterial>(null)
  const stationTexture = useMemo(() => trainLightTexture('orb'), [])
  const diagramStationTexture = useMemo(() => diagramStopTexture(), [])
  const interchangeTexture = useMemo(() => diagramInterchangeTexture(), [])
  const railGeometry = useMemo(() => {
    const structuralPositions: number[] = []
    const localPositions: number[] = []
    snapshot.edges.forEach(([fromIndex, toIndex], edgeIndex) => {
      const from = projectedStops[fromIndex]
      const to = projectedStops[toIndex]
      if (!from || !to) return
      const pathIndex = snapshot.edgePaths?.[edgeIndex]
      const path =
        pathIndex === undefined || pathIndex === null
          ? undefined
          : projectedPaths[pathIndex]
      const detour = lakeAvoidingPathForStops(
        lakeAvoidingPaths,
        fromIndex,
        toIndex,
      )
      appendLineSegments(
        pathIndex === undefined || pathIndex === null
          ? structuralPositions
          : localPositions,
        path?.points ?? detour?.points ?? [from, to],
        mapSurfaceY(coplanar, 0),
      )
    })
    const structural = new THREE.BufferGeometry()
    structural.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(structuralPositions, 3),
    )
    const local = new THREE.BufferGeometry()
    local.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(localPositions, 3),
    )
    if (flat) { compactMapLines(structural); compactMapLines(local) }
    return { structural, local }
  }, [
    flat, coplanar, lakeAvoidingPaths,
    projectedPaths,
    projectedStops,
    snapshot.edgePaths,
    snapshot.edges,
  ])

  const stationGeometry = useMemo(() => {
    const positions = new Float32Array(projectedStops.length * 3)
    projectedStops.forEach((stop, index) => positions.set(stop, index * 3))
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    setScenePickMetadata(geometry, pickable ? { stopIndexes: projectedStops.map((_, index) => index) } : undefined)
    return geometry
  }, [projectedStops, pickable])

  const diagramStationGeometries = useMemo(() => {
    const stationRoutes = new Map<
      string,
      { routes: Set<string>; stopIndex: number; rank: number }
    >()
    for (const train of infrastructureSnapshot.trains) {
      for (const [stopIndex] of train.stops) {
        const stop = snapshot.stops[stopIndex]
        if (!stop) continue
        const name = canonicalInterchangeName(stop[2])
        const rank = stop[5] ?? Number.MAX_SAFE_INTEGER
        const record = stationRoutes.get(name) ?? {
          routes: new Set<string>(),
          stopIndex,
          rank,
        }
        record.routes.add(train.route)
        if (rank < record.rank) {
          record.stopIndex = stopIndex
          record.rank = rank
        }
        stationRoutes.set(name, record)
      }
    }
    const stopPositions: number[] = []
    const interchangePositions: number[] = []
    const stopIndexes: number[] = [], interchangeIndexes: number[] = []
    for (const { routes, stopIndex } of stationRoutes.values()) {
      const stop = projectedStops[stopIndex]
      if (!stop) continue
      const positions = routes.size < 2 ? stopPositions : interchangePositions
      positions.push(stop[0], stop[1], stop[2])
      ;(routes.size < 2 ? stopIndexes : interchangeIndexes).push(stopIndex)
    }
    const stops = new THREE.BufferGeometry()
    stops.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(stopPositions, 3),
    )
    const interchanges = new THREE.BufferGeometry()
    interchanges.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(interchangePositions, 3),
    )
    setScenePickMetadata(stops, pickable ? { stopIndexes } : undefined)
    setScenePickMetadata(interchanges, pickable ? { stopIndexes: interchangeIndexes } : undefined)
    return { stops, interchanges }
  }, [projectedStops, snapshot.stops, infrastructureSnapshot.trains, pickable])

  const morphGeometry = useMemo(() => ({ railGeometry, stationGeometry, diagramStationGeometries }), [railGeometry, stationGeometry, diagramStationGeometries])
  useSpatialGeometryMorph(morphGeometry, morph)
  useEffect(() => () => stationGeometry.dispose(), [stationGeometry])

  useEffect(
    () => () => {
      stationTexture.dispose()
      diagramStationTexture.dispose()
      interchangeTexture.dispose()
    },
    [diagramStationTexture, interchangeTexture, stationTexture],
  )

  useEffect(
    () => () => {
      railGeometry.structural.dispose()
      railGeometry.local.dispose()
      diagramStationGeometries.stops.dispose()
      diagramStationGeometries.interchanges.dispose()
    },
    [diagramStationGeometries, railGeometry],
  )

  useFrame(() => {
    if (!stationMaterial.current || !localNetworkMaterial.current) return
    const cameraScale = THREE.MathUtils.clamp(camera.position.y / 37, 0.02, 1)
    stationMaterial.current.size = 0.065 * cameraScale
    stationMaterial.current.opacity =
      (subdued ? 0.055 : 0.4) *
      (lineMapStyle ? 1 - routeColorMix : 1 - routeColorMix * 0.9)
    if (interchangeMaterial.current) {
      interchangeMaterial.current.opacity =
        routeColorMix * (subdued ? 0.38 : 0.94)
    }
    const detail = localNetworkDetailAtZoom(camera.position.y, cameraFraming)
    const identityAttenuation = lineMapStyle
      ? 1 - routeColorMix
      : 1 - routeColorMix * 0.88
    localNetworkMaterial.current.opacity =
      (subdued ? 0.008 + detail * 0.025 : 0.025 + detail * 0.115) *
      identityAttenuation
  })

  return (
    <>
      <lineSegments geometry={railGeometry.structural} renderOrder={flat ? 3 : 0} visible={!lineMapStyle || routeColorMix < 1}>
        <lineBasicMaterial
          color="#7296bb"
          transparent
          opacity={
            (subdued ? 0.035 : 0.14) *
            (lineMapStyle ? 1 - routeColorMix : 1 - routeColorMix * 0.88)
          }
          blending={flat ? THREE.NormalBlending : THREE.AdditiveBlending}
          depthTest={!flat} depthWrite={!flat} toneMapped={!flat}
        />
      </lineSegments>
      <lineSegments geometry={railGeometry.local} renderOrder={flat ? 3 : 0} visible={!lineMapStyle || routeColorMix < 1}>
        <lineBasicMaterial
          ref={localNetworkMaterial}
          color="#7296bb"
          transparent
          opacity={subdued ? 0.035 : 0.14}
          blending={flat ? THREE.NormalBlending : THREE.AdditiveBlending}
          depthTest={!flat} depthWrite={!flat} toneMapped={!flat}
        />
      </lineSegments>
      {showTraffic && (
        <TrafficFlowLayer
          morph={morph}
          snapshot={snapshot}
          projectedStops={projectedStops}
          projectedPaths={projectedPaths}
          lakeAvoidingPaths={lakeAvoidingPaths}
          subdued={subdued}
          identityMix={routeColorMix}
          overviewEmphasis={trafficOverviewEmphasis}
          suppressAtIdentity={lineMapStyle}
        />
      )}
      {routeColors && routeColorMix > 0.001 && (
        <>
          <RouteIdentityLayer
            morph={morph}
            snapshot={infrastructureSnapshot}
            projectedStops={projectedStops}
            projectedPaths={projectedPaths}
            lakeAvoidingPaths={lakeAvoidingPaths}
            routeColors={routeColors}
            opacity={routeColorMix}
            subdued={subdued}
            lineMapStyle={lineMapStyle}
          />
          {lineMapStyle && (DiagramStations ? <DiagramStations snapshot={infrastructureSnapshot}
            projectedStops={projectedStops} projectedPaths={projectedPaths} routeColors={routeColors}
            opacity={routeColorMix * (subdued ? 0.48 : 0.98)} /> : (
            <>
              <points
                geometry={diagramStationGeometries.stops}
                position={[0, mapSurfaceY(coplanar, STATION_SURFACE_Y + 0.09), 0]}
                renderOrder={5}
              >
                <pointsMaterial
                  color="#fffdf4"
                  map={diagramStationTexture}
                  size={4.2}
                  transparent
                  opacity={routeColorMix * (subdued ? 0.42 : 0.96)}
                  alphaTest={0.08}
                  depthTest={false}
                  depthWrite={false}
                  sizeAttenuation={false}
                  toneMapped={false}
                  fog={false}
                />
              </points>
              <points
                geometry={diagramStationGeometries.interchanges}
                position={[0, mapSurfaceY(coplanar, STATION_SURFACE_Y + 0.1), 0]}
                renderOrder={6}
              >
                <pointsMaterial
                  ref={interchangeMaterial}
                  color="#fffdf4"
                  map={interchangeTexture}
                  size={11}
                  transparent
                  opacity={routeColorMix * (subdued ? 0.5 : 0.98)}
                  alphaTest={0.08}
                  depthTest={false}
                  depthWrite={false}
                  sizeAttenuation={false}
                  toneMapped={false}
                  fog={false}
                />
              </points>
            </>
          ))}
          {!lineMapStyle && (
            <points
              geometry={diagramStationGeometries.interchanges}
              position={[0, mapSurfaceY(coplanar, STATION_SURFACE_Y + 0.08), 0]}
              renderOrder={4}
            >
              <pointsMaterial
                ref={interchangeMaterial}
                color="#fffdf4"
                map={interchangeTexture}
                size={0.32}
                transparent
                opacity={routeColorMix * (subdued ? 0.38 : 0.94)}
                alphaTest={0.08}
                depthTest={false}
                depthWrite={false}
                sizeAttenuation
                toneMapped={false}
                fog={false}
              />
            </points>
          )}
        </>
      )}
      <points visible={!lineMapStyle || routeColorMix < 1} geometry={stationGeometry} position={[0, mapSurfaceY(coplanar, STATION_SURFACE_Y), 0]}>
        <pointsMaterial
          ref={stationMaterial}
          color="#a18cff"
          map={stationTexture}
          size={0.065}
          transparent
          opacity={subdued ? 0.055 : 0.4}
          alphaTest={0.015}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          toneMapped={false}
        />
      </points>
    </>
  )
}

function diagramRibbonGeometry(
  segments: readonly number[],
  halfWidth: number,
  height: number,
): THREE.BufferGeometry {
  const positions: number[] = []
  for (let index = 0; index < segments.length; index += 6) {
    const fromX = segments[index]
    const fromZ = segments[index + 2]
    const toX = segments[index + 3]
    const toZ = segments[index + 5]
    const deltaX = toX - fromX
    const deltaZ = toZ - fromZ
    const length = Math.hypot(deltaX, deltaZ)
    if (length < 0.0001) continue
    const normalX = (-deltaZ / length) * halfWidth
    const normalZ = (deltaX / length) * halfWidth
    const capX = (deltaX / length) * halfWidth * 0.45
    const capZ = (deltaZ / length) * halfWidth * 0.45
    const ax = fromX - capX + normalX
    const az = fromZ - capZ + normalZ
    const bx = fromX - capX - normalX
    const bz = fromZ - capZ - normalZ
    const cx = toX + capX - normalX
    const cz = toZ + capZ - normalZ
    const dx = toX + capX + normalX
    const dz = toZ + capZ + normalZ
    positions.push(
      ax, height, az,
      bx, height, bz,
      cx, height, cz,
      ax, height, az,
      cx, height, cz,
      dx, height, dz,
    )
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  return geometry
}

function RouteIdentityLayer({
  morph = false,
  snapshot,
  projectedStops,
  projectedPaths,
  lakeAvoidingPaths,
  routeColors,
  opacity,
  subdued,
  lineMapStyle = false,
}: {
  readonly morph?: boolean
  readonly snapshot: NetworkSnapshot
  readonly projectedStops: readonly ProjectedStop[]
  readonly projectedPaths: readonly ProjectedNetworkPath[]
  readonly lakeAvoidingPaths: LakeAvoidingPathMap
  readonly routeColors: Readonly<Record<string, string>>
  readonly opacity: number
  readonly subdued: boolean
  readonly lineMapStyle?: boolean
}) {
  const style = useMapStyle()
  const diagram = style.diagram
  const coplanar = style.coplanar
  const { diagramSegmentKey, diagramOrderedPoints } = useNetworkScene().props.extensions ?? {}
  const routes = useMemo(() => {
    const segmentRoutes = new Map<string, Set<string>>()
    for (const train of snapshot.trains) {
      if (!routeColors[train.route]) continue
      for (let index = 1; index < train.stops.length; index += 1) {
        const key = lineMapStyle && diagramSegmentKey ? diagramSegmentKey(train, index - 1, projectedStops) : routeSegmentKey(train, index - 1)
        const names = segmentRoutes.get(key) ?? new Set<string>()
        names.add(train.route)
        segmentRoutes.set(key, names)
      }
    }
    const records = new Map<
      string,
      { color: string; positions: number[]; segments: Set<string> }
    >()

    for (const train of snapshot.trains) {
      const color = routeColors[train.route]
      if (!color) continue
      const record = records.get(train.route) ?? {
        color,
        positions: [],
        segments: new Set<string>(),
      }
      for (let index = 1; index < train.stops.length; index += 1) {
        const key = lineMapStyle && diagramSegmentKey ? diagramSegmentKey(train, index - 1, projectedStops) : routeSegmentKey(train, index - 1)
        if (record.segments.has(key)) continue
        const points = segmentPoints(
          train,
          index - 1,
          projectedStops,
          projectedPaths,
          lakeAvoidingPaths,
        )
        if (points.length < 2) continue
        record.segments.add(key)
        const sharedRoutes = [...(segmentRoutes.get(key) ?? [])].sort()
        const laneIndex = sharedRoutes.indexOf(train.route)
        const laneOffset =
          sharedRoutes.length < 2 || laneIndex < 0
            ? 0
            : (laneIndex - (sharedRoutes.length - 1) / 2) *
              (lineMapStyle ? diagram?.laneSpacing ?? 0.24 : 0.11)
        appendLineSegments(
          record.positions,
          offsetProjectedPath(lineMapStyle && diagramOrderedPoints ? diagramOrderedPoints(points) : points, laneOffset),
          mapSurfaceY(coplanar, 0.075),
        )
      }
      records.set(train.route, record)
    }

    return [...records.entries()].map(([name, record]) => {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(record.positions, 3),
      )
      return {
        name,
        color: record.color,
        geometry,
        casing: lineMapStyle
          ? diagramRibbonGeometry(record.positions, diagram?.casingWidth ?? 0.16, mapSurfaceY(coplanar, 0.072))
          : undefined,
        core: lineMapStyle
          ? diagramRibbonGeometry(record.positions, diagram?.coreWidth ?? 0.1, mapSurfaceY(coplanar, 0.078))
          : undefined,
      }
    }).sort((first, second) => first.name.localeCompare(second.name, 'en'))
  }, [
    coplanar, diagram, diagramSegmentKey, diagramOrderedPoints, lakeAvoidingPaths,
    lineMapStyle,
    projectedPaths,
    projectedStops,
    routeColors,
    snapshot,
  ])

  useSpatialGeometryMorph(routes, morph)

  useEffect(
    () => () => routes.forEach(({ geometry, casing, core }) => {
      geometry.dispose()
      casing?.dispose()
      core?.dispose()
    }),
    [routes],
  )

  if (lineMapStyle) {
    return (
      <group>
        {routes.map(({ name, casing }) =>
          casing ? (
            <mesh key={`casing:${name}`} geometry={casing} renderOrder={3}>
              <meshBasicMaterial
                color="#050510"
                side={THREE.DoubleSide}
                forceSinglePass
                transparent
                opacity={opacity * (subdued ? 0.52 : 0.96)}
                depthTest={false}
                depthWrite={false}
                toneMapped={false}
                fog={false}
              />
            </mesh>
          ) : null,
        )}
        {routes.map(({ name, color, core }) =>
          core ? (
            <mesh key={name} geometry={core} renderOrder={4}>
              <meshBasicMaterial
                color={color}
                side={THREE.DoubleSide}
                forceSinglePass
                transparent
                opacity={opacity * (subdued ? 0.28 : 0.94)}
                depthTest={false}
                depthWrite={false}
                toneMapped={false}
                fog={false}
              />
            </mesh>
          ) : null,
        )}
      </group>
    )
  }

  return (
    <group>
      {routes.map(({ name, color, geometry }) => (
        <lineSegments key={name} geometry={geometry} renderOrder={3}>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={opacity * (subdued ? 0.12 : 0.74)}
            blending={THREE.AdditiveBlending}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </lineSegments>
      ))}
    </group>
  )
}

function TrafficFlowLayer({
  morph = false,
  snapshot,
  projectedStops,
  projectedPaths,
  lakeAvoidingPaths,
  subdued,
  identityMix = 0,
  overviewEmphasis = 0,
  suppressAtIdentity = false,
}: {
  readonly morph?: boolean
  readonly snapshot: NetworkSnapshot
  readonly projectedStops: readonly ProjectedStop[]
  readonly projectedPaths: readonly ProjectedNetworkPath[]
  readonly lakeAvoidingPaths: LakeAvoidingPathMap
  readonly subdued: boolean
  readonly identityMix?: number
  readonly overviewEmphasis?: number
  readonly suppressAtIdentity?: boolean
}) {
  const style = useMapStyle()
  const flat = style.surface === 'flat'
  const coplanar = style.coplanar
  const emphasisPolicy = style.materials?.trafficFlowOverviewEmphasis
  const weightedMaterial = useRef<THREE.LineBasicMaterial>(null)
  const pulseMaterial = useRef<THREE.LineBasicMaterial>(null)
  const geometries = useMemo(() => {
    const { strengths } = edgeTrafficWeights(snapshot)
    const weightedPositions: number[] = []
    const weightedColors: number[] = []
    const pulsePositions: number[] = []
    const pulseColors: number[] = []
    const quiet = new THREE.Color('#18204a')
    const busy = new THREE.Color('#8dfaff')

    snapshot.edges.forEach(([fromIndex, toIndex], edgeIndex) => {
      const strength = strengths[edgeIndex] ?? 0
      const from = projectedStops[fromIndex]
      const to = projectedStops[toIndex]
      if (!strength || !from || !to) return
      const pathIndex = snapshot.edgePaths?.[edgeIndex]
      const path =
        pathIndex === undefined || pathIndex === null
          ? undefined
          : projectedPaths[pathIndex]
      const detour = lakeAvoidingPathForStops(
        lakeAvoidingPaths,
        fromIndex,
        toIndex,
      )
      const points = path?.points ?? detour?.points ?? [from, to]

      const color = quiet.clone().lerp(busy, strength)
      color.multiplyScalar(0.2 + strength * 0.8)
      appendLineSegments(weightedPositions, points, 0)
      for (let index = 1; index < points.length; index += 1) {
        weightedColors.push(color.r, color.g, color.b, color.r, color.g, color.b)
      }

      if (strength >= 0.82) {
        appendLineSegments(pulsePositions, points, 0)
        for (let index = 1; index < points.length; index += 1) {
          pulseColors.push(color.r, color.g, color.b, color.r, color.g, color.b)
        }
      }
    })

    const weighted = new THREE.BufferGeometry()
    weighted.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(weightedPositions, 3),
    )
    weighted.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(weightedColors, 3),
    )
    const pulse = new THREE.BufferGeometry()
    pulse.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(pulsePositions, 3),
    )
    pulse.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(pulseColors, 3),
    )
    if (flat) { compactMapLines(weighted); compactMapLines(pulse) }
    return { weighted, pulse }
  }, [flat, lakeAvoidingPaths, projectedPaths, projectedStops, snapshot])

  useSpatialGeometryMorph(geometries, morph)

  useEffect(
    () => () => {
      geometries.weighted.dispose()
      geometries.pulse.dispose()
    },
    [geometries],
  )

  const identityAttenuation = suppressAtIdentity
    ? 1 - identityMix
    : 1 - identityMix * 0.78

  useFrame(({ clock, camera }) => {
    if (weightedMaterial.current) {
      weightedMaterial.current.opacity = (subdued ? 0.045 : 0.62) * identityAttenuation *
        (1 + (emphasisPolicy?.(camera.position.y) ?? overviewEmphasis) * 1.2)
    }
    if (!pulseMaterial.current) return
    const wave = 0.5 + Math.sin(clock.elapsedTime * 1.35) * 0.5
    const pulseAttenuation = suppressAtIdentity
      ? 1 - identityMix
      : 1 - identityMix * 0.72
    pulseMaterial.current.opacity =
      (subdued ? 0.012 + wave * 0.012 : 0.1 + wave * 0.12) *
      pulseAttenuation *
      (1 + overviewEmphasis * 1.15)
  })

  return (
    <group position={[0, mapSurfaceY(coplanar, 0.055), 0]} visible={identityAttenuation > 0}>
      <lineSegments geometry={geometries.weighted} renderOrder={flat ? 4 : 1}>
        <lineBasicMaterial
          ref={weightedMaterial}
          vertexColors
          transparent
          opacity={
            (subdued ? 0.045 : 0.62) *
            identityAttenuation *
            (1 + overviewEmphasis * 1.2)
          }
          blending={flat ? THREE.NormalBlending : THREE.AdditiveBlending}
          depthTest={!flat}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
      <lineSegments geometry={geometries.pulse} renderOrder={flat ? 4 : 2}>
        <lineBasicMaterial
          ref={pulseMaterial}
          vertexColors
          transparent
          opacity={subdued ? 0.035 : 0.16}
          blending={flat ? THREE.NormalBlending : THREE.AdditiveBlending}
          depthTest={!flat}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  )
}

function diagramStopTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 48
  canvas.height = 48
  const context = canvas.getContext('2d')
  if (context) {
    context.fillStyle = 'rgba(255, 253, 244, 1)'
    context.beginPath()
    context.arc(24, 24, 18, 0, Math.PI * 2)
    context.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

function diagramInterchangeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 96
  canvas.height = 96
  const context = canvas.getContext('2d')
  if (context) {
    context.fillStyle = 'rgba(255, 253, 244, 0.98)'
    context.beginPath()
    context.arc(48, 48, 31, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = 'rgba(5, 6, 18, 0.98)'
    context.beginPath()
    context.arc(48, 48, 18, 0, Math.PI * 2)
    context.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

