export interface ProjectPolicy {
  root?: string
  sources?: string[]
  packages?: string[]
  manifests?: string[]
  allowWorkspaces?: boolean
  stack?: boolean
}
export function checkProject(policy?: ProjectPolicy): Promise<{
  packages: string[]
  sources: string[]
  manifests: number
}>
