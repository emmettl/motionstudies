export interface StackManifest {
  readonly packageManager?: string
  readonly dependencies?: Readonly<Record<string, string>>
  readonly devDependencies?: Readonly<Record<string, string>>
}
export const stack: Readonly<{
  nodeMajor: 24
  packageManager: 'npm@11.21.1'
  dependencies: Readonly<Record<string, string>>
}>
export function checkStack(manifest: StackManifest): string[]
