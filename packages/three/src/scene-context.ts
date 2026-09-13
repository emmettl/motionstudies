import { createContext } from 'react'
import type { NetworkSceneContext } from './scene-extensions.ts'
export const NetworkSceneProviderContext = createContext<NetworkSceneContext | undefined>(undefined)
