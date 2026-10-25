import { createContext } from 'react'
import { type LakeAvoidingPathMap } from './lake-aware-paths.ts'

export const EMPTY_LAKE_AVOIDING_PATHS: LakeAvoidingPathMap = new Map()

export const LakeAvoidingPathsContext = createContext<LakeAvoidingPathMap>(
  EMPTY_LAKE_AVOIDING_PATHS,
)

