import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { editionDebugOptions, registerDebugRenderer } from './debug.ts'

const Perf = lazy(() => import('r3f-perf').then(module => ({ default: module.Perf })))
/** Optional child inside an edition-owned Fiber Canvas; normal frame policy is preserved. */
export function EditionDebug({ label, metadata = {} }: { label: string; metadata?: Record<string, unknown> }) {
  const { gl, invalidate, get } = useThree(), current = useRef(metadata)
  useLayoutEffect(() => { current.current = metadata }, [metadata])
  const options = editionDebugOptions()
  useEffect(() => {
    if (!options.perf && !options.capture) return
    const original = get().frameloop
    if (options.continuous) get().setFrameloop('always')
    const stop = registerDebugRenderer(gl, { label, redraw: invalidate, supportsContinuous: true, metadata: () => {
      const { camera, frameloop } = get()
      return { ...current.current, frameloop, camera: { position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), projection: camera.projectionMatrix.toArray(), zoom: 'zoom' in camera ? camera.zoom : null } }
    } })
    return () => { stop(); if (options.continuous) get().setFrameloop(original) }
  }, [gl, invalidate, get, label, options.perf, options.capture, options.continuous])
  return options.perf ? <Suspense fallback={null}><Perf className="ms-edition-perf" position="top-left" style={{ position: 'absolute', maxWidth: '100%', overflow: 'auto' }} /></Suspense> : null
}
