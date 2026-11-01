import { frameElapsed } from './frame-state.ts'
import { mapSurfaceY, flattenMapTube } from './scene-surface.ts'
import { selectionMarkerScale } from './selection-marker-scale.ts'
import { useMapStyle } from './scene-map-style.ts'
import { segmentPoints, appendLineSegments } from './scene-path-geometry.ts'
import { trainLightTexture } from './scene-light-texture.ts'
import { stationCentre, type ProjectedStop } from './station-picking.ts'
import { useWebGLStudyFrame as useFrame } from './webgl-study.ts'
import { useContext, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  type NetworkSnapshot,
  type NetworkRouteIndexEntry,
  type NetworkTrain,
  type ServiceCategory,
  type StationIndexEntry,
} from '@motionstudies/core/domain/network'
import { SERVICE_COLORS } from '@motionstudies/core/theme'
import { STATION_SELECTION_PULSE_COUNT, stationSelectionPulseFrame } from './map-camera.ts'
import { type ProjectedNetworkPath } from './network-paths.ts'
import { MAP_LAYER } from './scene-layer-order.ts'
import { LakeAvoidingPathsContext } from './scene-lake-paths.ts'
import { useProjectedTrainPosition } from './scene-train-position.ts'

export function SelectedRoute({
  train,
  projectedStops,
  projectedPaths,
  color = SERVICE_COLORS[train.category],
  comparisonLayer,
}: {
  readonly train: NetworkTrain
  readonly projectedStops: readonly ProjectedStop[]
  readonly projectedPaths: readonly ProjectedNetworkPath[]
  readonly color?: string
  readonly comparisonLayer?: 'foundation' | 'foreground'
}) {
  const coplanar = useMapStyle().coplanar
  const lakeAvoidingPaths = useContext(LakeAvoidingPathsContext)
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let index = 0; index < train.stops.length - 1; index += 1) {
      segmentPoints(
        train,
        index,
        projectedStops,
        projectedPaths,
        lakeAvoidingPaths,
      ).forEach(
        ([x, , z], pointIndex) => {
          if (index > 0 && pointIndex === 0) return
          const previous = points.at(-1)
          if (previous && Math.hypot(previous.x - x, previous.z - z) < 0.0001) {
            return
          }
          points.push(new THREE.Vector3(x, mapSurfaceY(coplanar, 0.12), z))
        },
      )
    }
    const line = new THREE.BufferGeometry().setFromPoints(points)
    if (!comparisonLayer || points.length < 2) return { line }
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal')
    const coreRadius = comparisonLayer === 'foundation' ? 0.045 : 0.022
    const glowRadius = comparisonLayer === 'foundation' ? 0.15 : 0.085
    const segments = THREE.MathUtils.clamp(points.length * 2, 32, 720)
    return {
      line,
      core: flattenMapTube(new THREE.TubeGeometry(curve, segments, coreRadius, 5, false), coplanar),
      glow: flattenMapTube(new THREE.TubeGeometry(curve, segments, glowRadius, 5, false), coplanar),
    }
  }, [coplanar, comparisonLayer, lakeAvoidingPaths, projectedPaths, projectedStops, train])
  const material = useMemo(() => {
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      blending: THREE.NormalBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    })
    return material
  }, [color])
  const line = useMemo(
    () => new THREE.Line(geometry.line, material),
    [geometry.line, material],
  )

  useEffect(
    () => () => {
      geometry.line.dispose()
      geometry.core?.dispose()
      geometry.glow?.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  return (
    <group>
      {geometry.glow && (
        <mesh
          geometry={geometry.glow}
          renderOrder={MAP_LAYER.selectionGlow + (comparisonLayer === 'foreground' ? 2 : 0)}
        >
          <meshBasicMaterial
            color={color}
            transparent
            opacity={comparisonLayer === 'foundation' ? 0.16 : 0.2}
            blending={THREE.AdditiveBlending}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </mesh>
      )}
      {geometry.core && (
        <mesh
          geometry={geometry.core}
          renderOrder={MAP_LAYER.selectionCore + (comparisonLayer === 'foreground' ? 2 : 0)}
        >
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.88}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </mesh>
      )}
      <primitive
        object={line}
        renderOrder={MAP_LAYER.selectionCore + (comparisonLayer === 'foreground' ? 3 : 1)}
      />
    </group>
  )
}

export function SelectedLinePaths({
  route,
  snapshot,
  projectedStops,
  projectedPaths,
  color = SERVICE_COLORS[route.category],
}: {
  readonly route: NetworkRouteIndexEntry
  readonly snapshot: NetworkSnapshot
  readonly projectedStops: readonly ProjectedStop[]
  readonly projectedPaths: readonly ProjectedNetworkPath[]
  readonly color?: string
}) {
  const coplanar = useMapStyle().coplanar
  const lakeAvoidingPaths = useContext(LakeAvoidingPathsContext)
  const glowMaterial = useRef<THREE.LineBasicMaterial>(null)
  const stopTextures = useMemo(
    () => ({
      halo: trainLightTexture('halo'),
      core: trainLightTexture('spark'),
    }),
    [],
  )
  const geometries = useMemo(() => {
    const trainIds = new Set(route.trainIds)
    const usedEdges = new Set<string>()
    const pathPositions: number[] = []

    for (const train of snapshot.trains) {
      if (!trainIds.has(train.id)) continue
      for (let index = 1; index < train.stops.length; index += 1) {
        const firstIndex = train.stops[index - 1][0]
        const secondIndex = train.stops[index][0]
        const pathIndex = train.pathSegments?.[index - 1]
        const key =
          pathIndex === undefined || pathIndex === null
            ? firstIndex < secondIndex
              ? `${firstIndex}:${secondIndex}`
              : `${secondIndex}:${firstIndex}`
            : `path:${pathIndex}`
        if (usedEdges.has(key)) continue
        const points = segmentPoints(
          train,
          index - 1,
          projectedStops,
          projectedPaths,
          lakeAvoidingPaths,
        )
        if (points.length < 2) continue
        usedEdges.add(key)
        appendLineSegments(pathPositions, points, mapSurfaceY(coplanar, 0.15))
      }
    }

    const stopPositions = route.stopIndexes.flatMap((stopIndex) => {
      const stop = projectedStops[stopIndex]
      return stop ? [stop[0], mapSurfaceY(coplanar, 0.19), stop[2]] : []
    })
    const path = new THREE.BufferGeometry()
    path.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(pathPositions, 3),
    )
    const stops = new THREE.BufferGeometry()
    stops.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(stopPositions, 3),
    )
    return { path, stops }
  }, [
    coplanar, projectedPaths,
    projectedStops,
    lakeAvoidingPaths,
    route.stopIndexes,
    route.trainIds,
    snapshot.trains,
  ])

  useEffect(
    () => () => {
      geometries.path.dispose()
      geometries.stops.dispose()
    },
    [geometries],
  )

  useEffect(
    () => () => {
      stopTextures.halo.dispose()
      stopTextures.core.dispose()
    },
    [stopTextures],
  )

  useFrame((state) => {
    const elapsed = frameElapsed(state)
    if (!glowMaterial.current) return
    glowMaterial.current.opacity =
      0.12 + (Math.sin(elapsed * 1.8) * 0.5 + 0.5) * 0.12
  })

  return (
    <group>
      <lineSegments
        geometry={geometries.path}
        renderOrder={MAP_LAYER.selectionCore}
      >
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.96}
          blending={THREE.NormalBlending}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </lineSegments>
      <lineSegments
        geometry={geometries.path}
        renderOrder={MAP_LAYER.selectionGlow}
      >
        <lineBasicMaterial
          ref={glowMaterial}
          color={color}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </lineSegments>
      <points
        geometry={geometries.stops}
        renderOrder={MAP_LAYER.selectionStopGlow}
      >
        <pointsMaterial
          color={color}
          map={stopTextures.halo}
          size={5.2}
          transparent
          opacity={0.3}
          alphaTest={0.01}
          blending={THREE.AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          sizeAttenuation={false}
          toneMapped={false}
          fog={false}
        />
      </points>
      <points
        geometry={geometries.stops}
        renderOrder={MAP_LAYER.selectionStopCore}
      >
        <pointsMaterial
          color={color}
          map={stopTextures.core}
          size={2.1}
          transparent
          opacity={0.9}
          alphaTest={0.02}
          blending={THREE.NormalBlending}
          depthTest={false}
          depthWrite={false}
          sizeAttenuation={false}
          toneMapped={false}
          fog={false}
        />
      </points>
    </group>
  )
}

export function SelectedStationRouteLayer({
  category,
  pathGeometry,
  stopGeometry,
  haloTexture,
  coreTexture,
}: {
  readonly category: ServiceCategory
  readonly pathGeometry: THREE.BufferGeometry
  readonly stopGeometry: THREE.BufferGeometry
  readonly haloTexture: THREE.Texture
  readonly coreTexture: THREE.Texture
}) {
  const glowMaterial = useRef<THREE.LineBasicMaterial>(null)

  useFrame((state) => {
    const elapsed = frameElapsed(state)
    if (!glowMaterial.current) return
    const pulse = Math.sin(elapsed * 1.55) * 0.5 + 0.5
    glowMaterial.current.opacity = 0.18 + pulse * 0.13
  })

  const color = useMapStyle().categoryColors?.[category] ?? SERVICE_COLORS[category]
  return (
    <group>
      <lineSegments
        geometry={pathGeometry}
        renderOrder={MAP_LAYER.selectionCore}
      >
        <lineBasicMaterial
          color={color}
          transparent
          opacity={1}
          blending={THREE.NormalBlending}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </lineSegments>
      <lineSegments
        geometry={pathGeometry}
        renderOrder={MAP_LAYER.selectionGlow}
      >
        <lineBasicMaterial
          ref={glowMaterial}
          color="#ffffff"
          transparent
          opacity={0.24}
          blending={THREE.AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </lineSegments>
      <points
        geometry={stopGeometry}
        renderOrder={MAP_LAYER.selectionStopGlow}
      >
        <pointsMaterial
          color={color}
          map={haloTexture}
          size={4.2}
          transparent
          opacity={0.36}
          alphaTest={0.01}
          blending={THREE.AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          sizeAttenuation={false}
          toneMapped={false}
          fog={false}
        />
      </points>
      <points
        geometry={stopGeometry}
        renderOrder={MAP_LAYER.selectionStopCore}
      >
        <pointsMaterial
          color="#ffffff"
          map={coreTexture}
          size={1.7}
          transparent
          opacity={0.88}
          alphaTest={0.02}
          blending={THREE.NormalBlending}
          depthTest={false}
          depthWrite={false}
          sizeAttenuation={false}
          toneMapped={false}
          fog={false}
        />
      </points>
    </group>
  )
}

export function SelectedStationPulse({ centre }: { readonly centre: THREE.Vector3 }) {
  const coplanar = useMapStyle().coplanar
  const meshes = useRef<Array<THREE.Mesh | null>>([])
  const materials = useRef<Array<THREE.MeshBasicMaterial | null>>([])
  const origin = useMemo(
    () => new THREE.Vector3(centre.x, mapSurfaceY(coplanar, 0.29), centre.z),
    [centre, coplanar],
  )

  useFrame((state) => {
    const { camera, size } = state, elapsed = frameElapsed(state)
    if (!(camera instanceof THREE.PerspectiveCamera) || size.height <= 0) return
    const distance = camera.position.distanceTo(origin)
    const visibleWorldHeight =
      2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))
    const worldUnitsPerPixel = visibleWorldHeight / size.height

    for (let index = 0; index < STATION_SELECTION_PULSE_COUNT; index += 1) {
      const mesh = meshes.current[index]
      const material = materials.current[index]
      if (!mesh || !material) continue
      const frame = stationSelectionPulseFrame(elapsed, index)
      mesh.scale.setScalar(frame.radiusPixels * worldUnitsPerPixel)
      material.opacity = frame.opacity
    }
  })

  return (
    <group position={origin}>
      {Array.from({ length: STATION_SELECTION_PULSE_COUNT }, (_, index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            meshes.current[index] = mesh
          }}
          rotation={[Math.PI / 2, 0, 0]}
          renderOrder={MAP_LAYER.focusMarkerGlow}
        >
          <torusGeometry args={[1, 0.026, 6, 72]} />
          <meshBasicMaterial
            ref={(material) => {
              materials.current[index] = material
            }}
            color="#8dfaff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  )
}

export function SelectedStationRoutes({
  station,
  snapshot,
  projectedStops,
  projectedPaths,
  selectedCategory,
}: {
  readonly station: StationIndexEntry
  readonly snapshot: NetworkSnapshot
  readonly projectedStops: readonly ProjectedStop[]
  readonly projectedPaths: readonly ProjectedNetworkPath[]
  readonly selectedCategory?: ServiceCategory
}) {
  const mapStyle = useMapStyle()
  const coplanar = mapStyle.coplanar
  const maxRadius = mapStyle.selectionMarkers?.stationMaxRadiusPixels
  const selectionMarker = useRef<THREE.Group>(null)
  useFrame(({ camera, size }) => {
    if (selectionMarker.current) selectionMarker.current.scale.setScalar(maxRadius === undefined ? 1 :
      selectionMarkerScale(camera, selectionMarker.current.position, size.height, 0.535, maxRadius))
  })
  const lakeAvoidingPaths = useContext(LakeAvoidingPathsContext)
  const textures = useMemo(
    () => ({
      halo: trainLightTexture('halo'),
      core: trainLightTexture('spark'),
    }),
    [],
  )
  const lines = useMemo(() => {
    const trainIds = new Set(station.trainIds)
    const pathsByCategory = new Map<ServiceCategory, Map<string, number[]>>()
    const stopsByCategory = new Map<ServiceCategory, Set<number>>()
    for (const train of snapshot.trains) {
      if (!trainIds.has(train.id)) continue
      if (selectedCategory && train.category !== selectedCategory) continue
      const categoryPaths = pathsByCategory.get(train.category) ?? new Map()
      const categoryStops = stopsByCategory.get(train.category) ?? new Set()
      train.stops.forEach(([stopIndex]) => categoryStops.add(stopIndex))
      for (let index = 1; index < train.stops.length; index += 1) {
        const firstIndex = train.stops[index - 1][0]
        const secondIndex = train.stops[index][0]
        const pathIndex = train.pathSegments?.[index - 1]
        const key =
          pathIndex === undefined || pathIndex === null
            ? firstIndex < secondIndex
              ? `${firstIndex}:${secondIndex}`
              : `${secondIndex}:${firstIndex}`
            : `path:${pathIndex}`
        if (categoryPaths.has(key)) continue
        const points = segmentPoints(
          train,
          index - 1,
          projectedStops,
          projectedPaths,
          lakeAvoidingPaths,
        )
        if (points.length < 2) continue
        const positions: number[] = []
        appendLineSegments(positions, points, mapSurfaceY(coplanar, 0.14))
        categoryPaths.set(key, positions)
      }
      pathsByCategory.set(train.category, categoryPaths)
      stopsByCategory.set(train.category, categoryStops)
    }

    return [...pathsByCategory.entries()].map(([category, paths]) => {
      const pathGeometry = new THREE.BufferGeometry()
      pathGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([...paths.values()].flat(), 3),
      )
      const stopPositions = [...(stopsByCategory.get(category) ?? [])].flatMap(
        (stopIndex) => {
          const stop = projectedStops[stopIndex]
          return stop ? [stop[0], mapSurfaceY(coplanar, 0.2), stop[2]] : []
        },
      )
      const stopGeometry = new THREE.BufferGeometry()
      stopGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(stopPositions, 3),
      )
      return { category, pathGeometry, stopGeometry }
    })
  }, [
    coplanar, projectedPaths,
    projectedStops,
    lakeAvoidingPaths,
    selectedCategory,
    snapshot.trains,
    station.trainIds,
  ])

  useEffect(
    () => () =>
      lines.forEach(({ pathGeometry, stopGeometry }) => {
        pathGeometry.dispose()
        stopGeometry.dispose()
      }),
    [lines],
  )

  useEffect(
    () => () => {
      textures.halo.dispose()
      textures.core.dispose()
    },
    [textures],
  )

  const centre = useMemo(
    () => stationCentre(station, projectedStops),
    [projectedStops, station],
  )
  const centreGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([centre.x, mapSurfaceY(coplanar, 0.3), centre.z], 3),
    )
    return geometry
  }, [centre, coplanar])

  useEffect(() => () => centreGeometry.dispose(), [centreGeometry])

  return (
    <>
      {lines.map(({ category, pathGeometry, stopGeometry }) => (
        <SelectedStationRouteLayer
          key={category}
          category={category}
          pathGeometry={pathGeometry}
          stopGeometry={stopGeometry}
          haloTexture={textures.halo}
          coreTexture={textures.core}
        />
      ))}
      <SelectedStationPulse centre={centre} />
      <points
        geometry={centreGeometry}
        renderOrder={MAP_LAYER.focusMarkerGlow}
      >
        <pointsMaterial
          color="#8dfaff"
          map={textures.halo}
          size={25}
          transparent
          opacity={0.78}
          alphaTest={0.01}
          blending={THREE.AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          sizeAttenuation={false}
          toneMapped={false}
          fog={false}
        />
      </points>
      <points
        geometry={centreGeometry}
        renderOrder={MAP_LAYER.focusMarkerCore}
      >
        <pointsMaterial
          color="#ffffff"
          map={textures.core}
          size={5.4}
          transparent
          opacity={1}
          alphaTest={0.02}
          blending={THREE.AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          sizeAttenuation={false}
          toneMapped={false}
          fog={false}
        />
      </points>
      <group ref={selectionMarker} position={[centre.x, mapSurfaceY(coplanar, 0.28), centre.z]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.48, 0.055, 8, 48]} />
          <meshBasicMaterial color="#ffffff" blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial color="#ffffff" emissive="#8dfaff" emissiveIntensity={5} />
        </mesh>
        <pointLight color="#8dfaff" intensity={7} distance={5} />
      </group>
    </>
  )
}

export function SelectedTrainMarker({
  train,
  time,
  projectedStops,
  projectedPaths,
  color = SERVICE_COLORS[train.category],
}: {
  readonly train: NetworkTrain
  readonly time: number
  readonly projectedStops: readonly ProjectedStop[]
  readonly projectedPaths: readonly ProjectedNetworkPath[]
  readonly color?: string
}) {
  const lakeAvoidingPaths = useContext(LakeAvoidingPathsContext)
  const resolveTrainPosition = useProjectedTrainPosition()
  const maxRadius = useMapStyle().selectionMarkers?.trainMaxRadiusPixels
  const marker = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!marker.current) return
    const position = resolveTrainPosition(
      train,
      time,
      projectedStops,
      projectedPaths,
      lakeAvoidingPaths,
    )
    marker.current.visible = Boolean(position)
    if (!position) return
    marker.current.position.set(...position)
    const pulse = 1 + Math.sin(frameElapsed(state) * 4) * 0.12
    marker.current.scale.setScalar(pulse * (maxRadius === undefined ? 1 : selectionMarkerScale(state.camera, marker.current.position, state.size.height, 0.24 * pulse, maxRadius)))
  })

  return (
    <group ref={marker}>
      <mesh renderOrder={MAP_LAYER.focusMarkerCore}>
        <sphereGeometry args={[0.24, 12, 12]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={color}
          emissiveIntensity={4}
          transparent
          opacity={1}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <pointLight color={color} intensity={7} distance={4.5} />
    </group>
  )
}

