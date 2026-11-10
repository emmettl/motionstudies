export interface StackManifest {
  readonly packageManager?: string
  readonly dependencies?: Readonly<Record<string, string>>
  readonly devDependencies?: Readonly<Record<string, string>>
}
export const stack: Readonly<{
  nodeMajor: 26
  packageManager: 'npm@12.2.2'
  dependencies: Readonly<Record<string, string>>
}>
export function checkStack(manifest: StackManifest): string[]
