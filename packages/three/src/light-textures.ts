import { DataTexture, RGBAFormat, UnsignedByteType, type CanvasTexture } from 'three'
import { trainLightTexture } from './scene-light-texture.ts'
import { createGlowPointTexture as paintGlowPointTexture } from './glow-point-texture.ts'

/** Snapshot the authored gradient as explicit unpremultiplied RGBA bytes.
 * This avoids backend-dependent external-canvas colour/alpha conversion. Rows are
 * stored bottom-first so DataTexture's default flipY=false retains the authored UV orientation. */
function snapshotLightTexture(source: CanvasTexture): DataTexture {
  try {
    const canvas = source.image as HTMLCanvasElement, context = canvas.getContext('2d')
    if (!context) throw Error('Cannot paint the motion light texture')
    const image = context.getImageData(0, 0, canvas.width, canvas.height), data = new Uint8Array(image.data.length)
    const stride = canvas.width * 4
    for (let y = 0; y < canvas.height; y++) data.set(image.data.subarray(y * stride, (y + 1) * stride), (canvas.height - 1 - y) * stride)
    const texture = new DataTexture(data, canvas.width, canvas.height, RGBAFormat, UnsignedByteType)
    texture.colorSpace = source.colorSpace; texture.minFilter = source.minFilter; texture.magFilter = source.magFilter
    texture.generateMipmaps = false; texture.needsUpdate = true
    return texture
  } finally { source.dispose() }
}
/** Same authored family gradients on every backend. Caller owns each returned texture. */
export function createMotionLightTexture(kind: 'halo' | 'orb' | 'spark'): DataTexture {
  return snapshotLightTexture(trainLightTexture(kind))
}
export function createGlowPointTexture(): DataTexture {
  return snapshotLightTexture(paintGlowPointTexture())
}
