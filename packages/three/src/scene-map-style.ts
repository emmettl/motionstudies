import { useNetworkScene } from './scene-extensions.ts'
import type { NetworkMapStyle } from './scene-style.ts'

const DEFAULT_MAP_STYLE: NetworkMapStyle = {}
export function useMapStyle(): NetworkMapStyle {
  return useNetworkScene().props.mapStyle ?? DEFAULT_MAP_STYLE
}

