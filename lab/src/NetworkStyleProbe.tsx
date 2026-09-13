import { useFrame, useThree } from '@react-three/fiber'
import { NormalBlending, type BufferGeometry, type Material, type Object3D, type SpriteMaterial } from 'three'

/** Observe the actual packed renderer so the lab can verify live style changes. */
export function NetworkStyleProbe() {
  const { gl, scene } = useThree()
  useFrame(() => {
    let flatStrokes = 0
    const colors: number[] = [], labels: string[] = []
    scene.traverse((object: Object3D & { geometry?: BufferGeometry; material?: Material; isLineSegments?: boolean; isSprite?: boolean }) => {
      const material = object.material
      if (object.isLineSegments && material?.blending === NormalBlending && !material.depthTest && !material.depthWrite && [3, 4].includes(object.renderOrder)) flatStrokes++
      const color = object.geometry?.getAttribute('color')
      if (color) for (let i = 0; i < Math.min(color.array.length, 24); i++) colors.push(Number(color.array[i].toFixed(5)))
      if (object.isSprite && object.visible && [16, 21].includes(object.renderOrder)) labels.push((material as SpriteMaterial).map?.uuid ?? '')
    })
    gl.domElement.setAttribute('data-style-audit', JSON.stringify({ flatStrokes, colors, labels }))
  })
  return null
}
