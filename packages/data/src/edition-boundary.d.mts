export interface EditionBoundaryOptions {
  /** Repository root; defaults to the working directory. */
  root?: string
  /** Required source directories, relative to root. Defaults to src and scripts. */
  directories?: readonly string[]
  /** Extra registry packages whose exact pins and public exports must be checked. */
  additionalPackages?: readonly string[]
}
export function checkEditionBoundary(options?: EditionBoundaryOptions): Promise<void>
