export interface EditionBoundaryOptions {
  /** Repository root; defaults to the working directory. */
  root?: string
  /** Required source directories, relative to root. Defaults to src and scripts. */
  directories?: readonly string[]
  /** Extra registry packages whose exact pins and public exports must be checked. */
  additionalPackages?: readonly string[]
  /** Explicitly audited local generators only. Exact source hash and computed-reference
   * count are required; static references remain checked. Never use for untrusted URLs. */
  verifiedGeneratedReferences?: readonly {
    file: string
    sourceSha256: string
    dynamicReferences: number
  }[]
}
export function checkEditionBoundary(options?: EditionBoundaryOptions): Promise<void>
