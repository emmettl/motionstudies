import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber/legacy'

/** Opt-in CPU frame cadence and Three counters. Does not claim GPU timing or create a second canvas. */
export function DebugPerformance({ className = 'ms-edition-perf' }: { className?: string }) {
  const { renderer } = useThree()
  const output = useRef<HTMLOutputElement | null>(null), sample = useRef({ seconds: 0, frames: 0 })
  useEffect(() => {
    const panel = document.createElement('output')
    panel.className = className; panel.setAttribute('aria-label', 'Renderer performance')
    panel.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;padding:8px;background:#080d10dd;color:#dffeff;font:12px monospace;z-index:20;max-width:100%'
    panel.textContent = 'Measuring frame cadence…'
    renderer.domElement.parentElement?.append(panel); output.current = panel
    return () => { output.current = null; panel.remove() }
  }, [renderer, className])
  useFrame((_, delta) => {
    sample.current.seconds += delta; sample.current.frames++
    if (sample.current.seconds < .5 || !output.current) return
    const { render, memory } = renderer.info
    output.current.textContent = `${(sample.current.frames / sample.current.seconds).toFixed(0)} fps · ${render.calls} calls · ${memory.geometries} geometries · ${memory.textures} textures · CPU cadence, not GPU time`
    sample.current = { seconds: 0, frames: 0 }
  })
  return null
}
