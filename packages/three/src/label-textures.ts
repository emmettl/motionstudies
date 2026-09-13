import * as THREE from 'three'

// Canvas construction is private. Each mounted label layer owns and disposes its textures.
export interface StationLabelTexture {
  readonly texture: THREE.CanvasTexture
  readonly aspect: number
  readonly anchorX: number
}

export function stationLabelTexture(
  name: string,
  style: 'atlas' | 'line-map' = 'atlas',
): StationLabelTexture {
  const canvas = document.createElement('canvas')
  const measuringContext = canvas.getContext('2d')
  const font = `${style === 'line-map' ? '600 27px' : '500 30px'} "Helvetica Neue", Helvetica, Arial, sans-serif`
  measuringContext?.save()
  if (measuringContext) measuringContext.font = font
  const measuredWidth = measuringContext?.measureText(name).width ?? name.length * 19
  measuringContext?.restore()
  canvas.width = Math.ceil(
    THREE.MathUtils.clamp(
      measuredWidth + (style === 'line-map' ? 28 : 86),
      style === 'line-map' ? 100 : 150,
      760,
    ),
  )
  canvas.height = style === 'line-map' ? 68 : 92

  const context = canvas.getContext('2d')
  if (context) {
    context.font = font
    context.textBaseline = 'middle'
    const textX = style === 'line-map' ? 13 : 62
    const textY = canvas.height / 2
    context.shadowColor = 'rgba(5, 4, 16, 0.96)'
    context.shadowBlur = style === 'line-map' ? 3 : 10
    context.lineWidth = style === 'line-map' ? 5 : 7
    context.strokeStyle = 'rgba(5, 4, 16, 0.96)'
    context.strokeText(name, textX, textY)
    context.fillStyle = '#f8f7ff'
    context.fillText(name, textX, textY)
    if (style === 'atlas') {
      context.beginPath()
      context.arc(31, 46, 6, 0, Math.PI * 2)
      context.fillStyle = '#8dfaff'
      context.shadowColor = '#8dfaff'
      context.shadowBlur = 18
      context.fill()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return {
    texture,
    aspect: canvas.width / canvas.height,
    anchorX: style === 'line-map' ? 0 : 31 / canvas.width,
  }
}

export interface TrainLabelTexture {
  readonly texture: THREE.CanvasTexture
  readonly aspect: number
}

export function createTrainLabelTexture(label: string, color: string, textColor = '#f8f7ff'): TrainLabelTexture {
  const canvas = document.createElement('canvas')
  const measuringContext = canvas.getContext('2d')
  const font = '500 27px "DM Mono", monospace'
  if (measuringContext) measuringContext.font = font
  const measuredWidth = measuringContext?.measureText(label).width ?? label.length * 17
  canvas.width = Math.ceil(THREE.MathUtils.clamp(measuredWidth + 88, 190, 720))
  canvas.height = 74

  const context = canvas.getContext('2d')
  if (context) {
    context.fillStyle = 'rgba(5, 4, 16, 0.82)'
    context.beginPath()
    context.roundRect(5, 6, canvas.width - 10, canvas.height - 12, 10)
    context.fill()
    context.strokeStyle = 'rgba(193, 204, 255, 0.35)'
    context.lineWidth = 2
    context.stroke()

    context.beginPath()
    context.arc(31, 37, 6, 0, Math.PI * 2)
    context.fillStyle = color
    context.shadowColor = color
    context.shadowBlur = 15
    context.fill()

    context.font = font
    context.textBaseline = 'middle'
    context.shadowColor = 'rgba(5, 4, 16, 0.95)'
    context.shadowBlur = 7
    context.fillStyle = textColor
    context.fillText(label, 56, 38)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return { texture, aspect: canvas.width / canvas.height }
}

