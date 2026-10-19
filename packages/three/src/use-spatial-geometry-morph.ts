import { useLayoutEffect, useRef } from 'react'
import { useNetworkScene } from './scene-extensions.ts'
import { prepareGeometryMorph } from './spatial-morph.ts'

/** Internal layer hook: layout cleanup restores source data before another projection is prepared. */
export function useSpatialGeometryMorph(resource: unknown, enabled = true) {
  const { props, projection } = useNetworkScene()
  const project = enabled ? props.extensions?.spatialMorph : undefined
  const mix = props.spatialLayoutMix ?? 0
  const current = useRef<ReturnType<typeof prepareGeometryMorph> | null>(null)
  useLayoutEffect(() => {
    if (!project) return
    const morph = prepareGeometryMorph(resource, projection, project)
    current.current = morph
    return () => { morph.restore(); current.current = null }
  }, [resource, projection, project])
  useLayoutEffect(() => { current.current?.update(mix) }, [resource, projection, project, mix])
}
