/** Explicit WebGL ownership on stable Fiber 9. The v10 port changes this one
 * boundary to /legacy; hooks and Canvas always come from the same typed entry. */
export { Canvas as WebGLStudyCanvas, useFrame as useWebGLStudyFrame, useThree as useWebGLStudyState } from '@react-three/fiber'
export type { CanvasProps as WebGLStudyCanvasProps, ThreeEvent } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import { frameRenderer, requireWebGLRenderer } from './frame-state.ts'

/** Fail at mount even when an edition supplied its own incompatible Canvas. */
export function useRequireWebGL(layer?: string): void {
  requireWebGLRenderer(frameRenderer(useThree()), layer)
}
