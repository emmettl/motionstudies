/** Explicit WebGL ownership on stable Fiber 9. The v10 port changes this one
 * boundary to /legacy; hooks and Canvas always come from the same typed entry. */
export { Canvas as WebGLStudyCanvas, useFrame as useWebGLStudyFrame, useThree as useWebGLStudyState } from '@react-three/fiber'
export type { CanvasProps as WebGLStudyCanvasProps, ThreeEvent } from '@react-three/fiber'
