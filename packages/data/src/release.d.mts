/** A file a release describes: its release-relative path and the size and SHA-256 of its stored bytes. */
export interface ReleaseDescriptor { path: string; sha256: string; bytes: number; [field: string]: unknown }
export declare const RELEASE_DIGEST: RegExp
export function isReleasePath(path: unknown): path is string
export function readDescriptor(value: unknown, label?: string): ReleaseDescriptor
/** Every descriptor in a manifest's `files` (array or map), `objects`, `chunks`, `list` and named top-level descriptors, sorted by path. */
export function releaseDescriptors(manifest: unknown): ReleaseDescriptor[]
export function checkReleaseManifest<T extends object>(manifest: T, options: { kind?: string; schemaVersions?: readonly number[] }): T
export function digestHex(bytes: ArrayBuffer | ArrayBufferView): Promise<string>
export function verifyDescriptorBytes<T extends ArrayBuffer | ArrayBufferView>(bytes: T, descriptor: ReleaseDescriptor): Promise<T>
