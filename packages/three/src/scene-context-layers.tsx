import { COPLANAR_MAP_SURFACE_Y } from './scene-style.ts'
import { mapSurfaceY, flattenMapTube } from './scene-surface.ts'
import { useNetworkScene } from './scene-extensions.ts'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber/legacy'
import { useEffect, useMemo, useRef } from 'react'
import { useMapStyle } from './scene-map-style.ts'
import { useSpatialGeometryMorph } from './use-spatial-geometry-morph.ts'
import type { ProjectedNetworkPath } from './network-paths.ts'
import type { MapBoundary } from '@motionstudies/core/domain/boundary'
import type { MapWaterBodies } from '@motionstudies/core/domain/lakes'
import type { MapReferencePaths } from '@motionstudies/core/domain/map-reference'
import type { NetworkProjection } from './NationalNetworkScene.tsx'
import { appendLineSegments, projectCoordinate } from './scene-path-geometry.ts'

export function NationalGround({ quiet = false }: { readonly quiet?: boolean }) {
  const { props } = useNetworkScene()
  const style = useMapStyle()
  const coplanar = style.coplanar
  const gridScale = style.materials?.groundGridOpacityScale?.(props.spatialLayoutMix ?? 0) ?? 1
  return (
    <group position={[0, coplanar ? -COPLANAR_MAP_SURFACE_Y : -0.11, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={coplanar ? -7 : 0}>
        <planeGeometry args={[66, 56, 64, 48]} />
        <meshBasicMaterial color="#090b1f" transparent opacity={0.7} depthWrite={!coplanar} />
      </mesh>
      {!quiet && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, coplanar ? 0.00002 : 0.015, 0]} renderOrder={coplanar ? -6 : 0}>
        <planeGeometry args={[66, 56, 64, 48]} />
        <meshBasicMaterial color="#424b98" transparent opacity={0.1 * gridScale} wireframe depthWrite={!coplanar} />
      </mesh>}
    </group>
  )
}

export function LakeLayer({
  lakes,
  projection,
  subdued,
  opacityScale = 1,
}: {
  readonly lakes: MapWaterBodies
  readonly projection: NetworkProjection
  readonly subdued: boolean
  readonly opacityScale?: number
}) {
  const coplanar = useMapStyle().coplanar
  const geometry = useMemo(() => {
    const shapes: THREE.Shape[] = []
    const shorelinePositions: number[] = []

    for (const lake of lakes.lakes) {
      for (const polygon of lake.polygons) {
        const [outerRing, ...holes] = polygon
        if (!outerRing || outerRing.length < 4) continue
        const outer = outerRing.map((coordinate) => {
          const [x, , z] = projectCoordinate(coordinate, projection)
          return new THREE.Vector2(x, z)
        })
        const shape = new THREE.Shape(outer)
        for (const holeRing of holes) {
          const hole = holeRing.map((coordinate) => {
            const [x, , z] = projectCoordinate(coordinate, projection)
            return new THREE.Vector2(x, z)
          })
          if (hole.length >= 4) shape.holes.push(new THREE.Path(hole))
        }
        shapes.push(shape)

        for (const ring of polygon) {
          const projected = ring.map((coordinate) =>
            projectCoordinate(coordinate, projection),
          )
          if (projected.length < 2) continue
          const isClosed =
            projected[0][0] === projected.at(-1)?.[0] &&
            projected[0][2] === projected.at(-1)?.[2]
          appendLineSegments(
            shorelinePositions,
            isClosed ? projected : [...projected, projected[0]],
            0,
          )
        }
      }
    }

    const fill = new THREE.ShapeGeometry(shapes)
    fill.rotateX(Math.PI / 2)
    const shoreline = new THREE.BufferGeometry()
    shoreline.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(shorelinePositions, 3),
    )
    return { fill, shoreline }
  }, [lakes.lakes, projection])
  useSpatialGeometryMorph(geometry)

  useEffect(
    () => () => {
      geometry.fill.dispose()
      geometry.shoreline.dispose()
    },
    [geometry],
  )

  return (
    <group position={[0, coplanar ? 0 : -0.072, 0]} visible={opacityScale > 0}>
      <mesh geometry={geometry.fill} renderOrder={coplanar ? -5 : 1}>
        <meshBasicMaterial
          color="#08233b"
          transparent
          opacity={(subdued ? 0.42 : 0.9) * opacityScale}
          depthWrite={false}
          side={THREE.DoubleSide}
          forceSinglePass
          fog={false}
        />
      </mesh>
      <mesh geometry={geometry.fill} position={[0, coplanar ? 0.00004 : 0.007, 0]} renderOrder={coplanar ? -4 : 1}>
        <meshBasicMaterial
          color="#20a9cb"
          transparent
          opacity={(subdued ? 0.035 : 0.13) * opacityScale}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          forceSinglePass
          toneMapped={false}
          fog={false}
        />
      </mesh>
      <lineSegments
        geometry={geometry.shoreline}
        position={[0, coplanar ? 0.00008 : 0.014, 0]}
        renderOrder={coplanar ? -3 : 2}
      >
        <lineBasicMaterial
          color="#54dff7"
          transparent
          opacity={(subdued ? 0.06 : 0.31) * opacityScale}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </lineSegments>
    </group>
  )
}

export function DiagramWaterLayer({
  paths,
  opacity,
}: {
  readonly paths: readonly ProjectedNetworkPath[]
  readonly opacity: number
}) {
  const coplanar = useMapStyle().coplanar
  const geometry = useMemo(() => {
    const positions: number[] = []
    paths.forEach((path) => appendLineSegments(positions, path.points, mapSurfaceY(coplanar, 0.025)))
    const line = new THREE.BufferGeometry()
    line.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    )
    const ribbons = paths
      .filter((path) => path.points.length >= 2)
      .map((path) => {
        const curve = new THREE.CatmullRomCurve3(
          path.points.map(([x, , z]) => new THREE.Vector3(x, mapSurfaceY(coplanar, 0.02), z)),
          false,
          'centripetal',
        )
        return flattenMapTube(new THREE.TubeGeometry(
          curve,
          Math.max(24, path.points.length * 6),
          0.085,
          5,
          false,
        ), coplanar)
      })
    return { line, ribbons }
  }, [paths, coplanar])

  useEffect(
    () => () => {
      geometry.line.dispose()
      geometry.ribbons.forEach((ribbon) => ribbon.dispose())
    },
    [geometry],
  )

  return (
    <group visible={opacity > 0}>
      {geometry.ribbons.map((ribbon, index) => (
        <mesh key={index} geometry={ribbon} renderOrder={1}>
          <meshBasicMaterial
            color="#075277"
            transparent
            opacity={opacity * 0.78}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </mesh>
      ))}
      <lineSegments geometry={geometry.line} renderOrder={2}>
        <lineBasicMaterial
          color="#55d6e8"
          transparent
          opacity={opacity * 0.28}
          blending={THREE.AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </lineSegments>
    </group>
  )
}

export function ReferencePathLayer({
  references,
  projection,
  subdued,
}: {
  readonly references: MapReferencePaths
  readonly projection: NetworkProjection
  readonly subdued: boolean
}) {
  const coplanar = useMapStyle().coplanar
  const paths = useMemo(
    () => references.references.map((reference) => {
      const positions: number[] = []
      for (const path of reference.paths) {
        appendLineSegments(
          positions,
          path.map((coordinate) => projectCoordinate(coordinate, projection)),
          mapSurfaceY(coplanar, 0.028),
        )
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3),
      )
      return { ...reference, geometry }
    }),
    [projection, references.references, coplanar],
  )
  useSpatialGeometryMorph(paths)

  useEffect(
    () => () => paths.forEach(({ geometry }) => geometry.dispose()),
    [paths],
  )

  return (
    <group>
      {paths.map(({ id, color, geometry }) => (
        <lineSegments key={id} geometry={geometry} renderOrder={1}>
          <lineBasicMaterial
            color={color ?? '#c9a9dd'}
            transparent
            opacity={subdued ? 0.04 : 0.2}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </lineSegments>
      ))}
    </group>
  )
}

export function CountryBorder({
  boundary,
  projection,
  subdued,
  opacityScale = 1,
}: {
  readonly boundary: MapBoundary
  readonly projection: NetworkProjection
  readonly subdued: boolean
  readonly opacityScale?: number
}) {
  const borderGroup = useRef<THREE.Group>(null)
  const style = useMapStyle()
  const coplanar = style.coplanar
  const opacityPolicy = style.materials?.borderOpacityScale
  useFrame(({ camera }) => {
    const group = borderGroup.current
    if (!group) return
    const scale = (opacityPolicy?.(camera.position.y) ?? 1) * opacityScale
    group.visible = scale > (opacityPolicy ? 0.001 : 0)
    for (const ring of group.children) {
      const glow = ring.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
      const core = ring.children[1] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
      glow.material.opacity = (subdued ? 0.018 : 0.12) * scale
      core.material.opacity = (subdued ? 0.13 : 0.84) * scale
    }
  })
  const tubes = useMemo(() => {
    return boundary.rings.flatMap((ring, index) => {
      const coordinates =
        ring.length > 1 &&
        ring[0][0] === ring[ring.length - 1][0] &&
        ring[0][1] === ring[ring.length - 1][1]
          ? ring.slice(0, -1)
          : ring
      if (coordinates.length < 4) return []
      const points = coordinates.map((coordinate) => {
        const [x, y, z] = projectCoordinate(coordinate, projection, mapSurfaceY(coplanar, 0.075))
        return new THREE.Vector3(x, y, z)
      })
      const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5)
      const segments = THREE.MathUtils.clamp(points.length * 2, 24, 8192)
      curve.arcLengthDivisions = segments
      return [{
        id: `${index}:${coordinates.length}`,
        glow: flattenMapTube(new THREE.TubeGeometry(curve, segments, 0.13, 5, true), coplanar),
        core: flattenMapTube(new THREE.TubeGeometry(curve, segments, 0.026, 5, true), coplanar),
      }]
    })
  }, [boundary.rings, projection, coplanar])
  useSpatialGeometryMorph(tubes)

  useEffect(
    () => () => {
      tubes.forEach(({ glow, core }) => {
        glow.dispose()
        core.dispose()
      })
    },
    [tubes],
  )

  return (
    <group ref={borderGroup} visible={opacityScale > 0}>
      {tubes.map(({ id, glow, core }) => (
        <group key={id}>
          <mesh geometry={glow} renderOrder={coplanar ? -2 : 0}>
            <meshBasicMaterial
              color="#56e9ff"
              transparent
              opacity={(subdued ? 0.018 : 0.12) * opacityScale}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
              fog={false}
            />
          </mesh>
          <mesh geometry={core} renderOrder={coplanar ? -1 : 2}>
            <meshBasicMaterial
              color="#b9fbff"
              transparent
              opacity={(subdued ? 0.13 : 0.84) * opacityScale}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
              fog={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

