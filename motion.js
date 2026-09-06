const canvas = document.querySelector('.motion-field')
const context = canvas?.getContext('2d')
const year = document.querySelector('[data-year]')

if (year) year.textContent = String(new Date().getFullYear())

if (canvas && context) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const palette = ['#84f7fb', '#84f7fb', '#84f7fb', '#fc4fc4', '#ffd075']
  const paths = Array.from({ length: 13 }, (_, index) => ({
    phase: index * 0.91,
    speed: 0.000035 + (index % 5) * 0.000007,
    height: 0.13 + (index % 7) * 0.105,
    amplitude: 18 + (index % 4) * 16,
    color: palette[index % palette.length],
  }))

  let width = 0
  let height = 0
  let scale = 1

  function resize() {
    scale = Math.min(devicePixelRatio || 1, 2)
    width = innerWidth
    height = innerHeight
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    context.setTransform(scale, 0, 0, scale, 0, 0)
  }

  function trace(path, time) {
    const baseline = height * path.height
    const drift = reducedMotion ? path.phase : path.phase + time * path.speed
    context.beginPath()
    for (let x = -30; x <= width + 30; x += 24) {
      const y = baseline
        + Math.sin(x * 0.006 + drift) * path.amplitude
        + Math.sin(x * 0.0019 - drift * 0.7) * path.amplitude * 0.65
      if (x === -30) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    context.strokeStyle = `${path.color}24`
    context.lineWidth = 0.7
    context.stroke()

    const progress = ((drift * 0.16) % 1 + 1) % 1
    const pointX = progress * width
    const pointY = baseline
      + Math.sin(pointX * 0.006 + drift) * path.amplitude
      + Math.sin(pointX * 0.0019 - drift * 0.7) * path.amplitude * 0.65
    context.beginPath()
    context.arc(pointX, pointY, 1.8, 0, Math.PI * 2)
    context.fillStyle = path.color
    context.shadowColor = path.color
    context.shadowBlur = 14
    context.fill()
    context.shadowBlur = 0
  }

  function draw(time = 0) {
    context.clearRect(0, 0, width, height)
    for (const path of paths) trace(path, time)
    if (!reducedMotion) requestAnimationFrame(draw)
  }

  addEventListener('resize', resize, { passive: true })
  resize()
  draw()
}
