import type { ReleaseDescriptor } from './release.mjs'
export interface ReleaseOpenOptions { kind?: string; schemaVersions?: readonly number[]; manifestSha256?: string; maxManifestBytes?: number; manifest?: string }
export interface OpenedRelease<M = Record<string, unknown>> {
  manifest: M
  manifestBytes: Buffer
  descriptors: ReleaseDescriptor[]
  /** Read a file the manifest describes, by path or descriptor, checking size and digest. */
  read(file: string | ReleaseDescriptor, options?: { maxBytes?: number }): Promise<Buffer>
}
/** Bounded read without following a final symlink or blocking on a FIFO. */
export function readOperationalFile(path: string, limit: number): Promise<Buffer>
export function readReleaseFile(root: string, descriptor: ReleaseDescriptor, options?: { maxBytes?: number }): Promise<Buffer>
export function openRelease<M = Record<string, unknown>>(root: string, options?: ReleaseOpenOptions): Promise<OpenedRelease<M>>
export function verifyRelease<M = Record<string, unknown>>(root: string, options?: ReleaseOpenOptions & { maxTotalBytes?: number }): Promise<{ manifest: M; manifestSha256: string; files: number; bytes: number }>
