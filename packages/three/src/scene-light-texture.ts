import * as THREE from 'three'

export function trainLightTexture(kind: 'halo' | 'orb' | 'spark'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 96
  canvas.height = 96
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createRadialGradient(43, 39, 0, 48, 48, 46)
    if (kind === 'halo') {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
      gradient.addColorStop(0.12, 'rgba(255, 255, 255, 0.72)')
      gradient.addColorStop(0.34, 'rgba(255, 255, 255, 0.3)')
      gradient.addColorStop(0.72, 'rgba(255, 255, 255, 0.07)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    } else if (kind === 'orb') {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
      gradient.addColorStop(0.18, 'rgba(255, 255, 255, 0.98)')
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.78)')
      gradient.addColorStop(0.76, 'rgba(255, 255, 255, 0.3)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    } else {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
      gradient.addColorStop(0.32, 'rgba(255, 255, 255, 0.96)')
      gradient.addColorStop(0.68, 'rgba(255, 255, 255, 0.18)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    }
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

