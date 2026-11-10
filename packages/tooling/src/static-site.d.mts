export interface StaticReleaseFile {
  path: string
  bytes: number
  sha256: string
}
export interface StaticRelease {
  schema: 1
  source: { repository: string; commit: string; runId: string | null }
  files: StaticReleaseFile[]
  sha256: string
}
export interface StaticReleaseOptions {
  root?: string
  repository: string
  commit: string
  runId?: string | number
}
export interface StaticAssetOptions {
  root?: string
  assetDirectories?: string[]
}
export interface CheckedArtifactOptions extends StaticReleaseOptions {
  artifactName: string
  branch?: string
  workflow?: string
  token?: string
}
export interface StaticDeploymentOptions extends StaticReleaseOptions, StaticAssetOptions {
  siteUrl: string
  indexable: boolean
}
export function sourceCommit(): string
export function stampStaticRelease(options: StaticReleaseOptions): Promise<StaticRelease>
export function verifyStaticRelease(options: StaticReleaseOptions): Promise<StaticRelease>
export function writeStaticAssetHeaders(options?: StaticAssetOptions): Promise<{ assets: number }>
export function requireCurrentSource(options: CheckedArtifactOptions): Promise<void>
export function prepareCheckedArtifact(
  options: CheckedArtifactOptions,
): Promise<{ artifactId: number; runId: number; runUrl: string }>
export function verifyStaticDeployment(options: StaticDeploymentOptions): Promise<StaticRelease>
