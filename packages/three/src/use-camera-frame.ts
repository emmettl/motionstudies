import { useWebGLStudyFrame } from './webgl-study.ts'

/** Camera must settle before default-priority vehicle, label and pick updates.
 * Fiber 9 requires a negative priority. The v10 port replaces this boundary with
 * its input phase; no other layer should depend on numeric ordering. */
export function useCameraFrame(callback: Parameters<typeof useWebGLStudyFrame>[0]): void {
  useWebGLStudyFrame(callback, -1)
}
