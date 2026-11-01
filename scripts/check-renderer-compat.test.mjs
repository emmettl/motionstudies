import { expect, test } from 'vitest'
import { rendererCompatibilityViolations as check, rendererRoots } from './check-renderer-compat.mjs'

test('guards aliases, selector/frame parameters, brackets, destructuring and renamed hook imports', () => {
  const failures = check('lab/src/probe.tsx', `
    import {useWebGLStudyState as useState, useWebGLStudyFrame as tick} from '@motionstudies/three/webgl-study'
    const s = useState(); const alias = s; alias.gl; s['clock']
    useState(st => st.gl)
    const { gl: renderer } = useState()
    tick(frame => { frame.clock.elapsedTime })
    tick(({clock}) => { void clock })
    tick(() => {}, -1)
  `)
  expect(failures.filter(s => s.includes('frame-state'))).toHaveLength(6)
  expect(failures.filter(s => s.includes('ordered frame'))).toHaveLength(1)
})
test('allows helper reads, unrelated clocks and lexically shadowed bindings', () => {
  expect(check('lab/src/probe.tsx', `
    import {useWebGLStudyState, useWebGLStudyFrame} from '@motionstudies/three/webgl-study'
    import {frameRenderer,frameElapsed} from '@motionstudies/three/frame-state'
    const s = useWebGLStudyState(); frameRenderer(s)
    useWebGLStudyFrame(frame => { frameElapsed(frame); frame.camera.position.x=1 })
    function application(s) { return s.clock.elapsedTime }
    const study={clock:{elapsedTime:1}}; study.clock.elapsedTime
  `)).toEqual([])
})
test('covers lab and extension fixtures and rejects direct Fiber imports there', () => {
  expect(rendererRoots).toContain('lab/src'); expect(rendererRoots).toContain('e2e/fixtures')
  expect(check('e2e/fixtures/probe.tsx', `import {useThree} from '@react-three/fiber'`)[0]).toContain('WebGL study boundary')
})
