import { useMemo } from 'react'
import { adjacentDayChunks, dayChunkForTime, networkSnapshotForDayChunk } from '@motionstudies/core/domain/network-day'
import type { PatternChunkOptions } from '@motionstudies/core/domain/network-patterns'
import type { NetworkDayChunk, NetworkDayChunkDescriptor, NetworkDayManifest } from '@motionstudies/core/domain/network'
import type { DataUrlResolver } from './data-url.ts'
import { useProgressiveChunks, type ProgressiveChunkAdapter } from './use-progressive-chunks.ts'

export interface PatternNetworkManifest extends NetworkDayManifest { readonly format: string }

export async function verifiedPatternNetworkChunk(response: Response, descriptor: NetworkDayChunkDescriptor, options: PatternChunkOptions = {}): Promise<NetworkDayChunk> {
  const bytes = await response.arrayBuffer()
  if (!Number.isSafeInteger(descriptor.bytes) || bytes.byteLength !== descriptor.bytes || !/^[a-f0-9]{64}$/.test(descriptor.sha256 ?? '')) throw new Error('Pattern chunk integrity metadata missing or size mismatch')
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('')
  if (hash !== descriptor.sha256) throw new Error('Pattern chunk integrity mismatch')
  const { decodeNetworkPatterns } = await import('@motionstudies/core/domain/network-patterns')
  const chunk = decodeNetworkPatterns(JSON.parse(new TextDecoder().decode(bytes)), options)
  if (chunk.windowStart !== descriptor.windowStart || chunk.windowEnd !== descriptor.windowEnd || chunk.trains.length !== descriptor.tripCount) throw new Error('Pattern chunk descriptor mismatch')
  return chunk
}

/** Fetch and decode only the current and adjacent chunks; keep the manifest independent. */
export function usePatternNetworkDay(manifestFile: string, active: boolean, time: number, resolveAssetUrl: DataUrlResolver, options: PatternChunkOptions = {}) {
  const format = options.format ?? 'network-patterns-v1', categories = options.categories
  const adapter = useMemo<ProgressiveChunkAdapter<PatternNetworkManifest, NetworkDayChunkDescriptor, NetworkDayChunk>>(() => ({
    chunkForTime: dayChunkForTime, adjacentChunks: adjacentDayChunks, retainAdjacentOnly: true,
    validateManifest(manifest) {
      if (manifest.format !== format || !manifest.metadata || !Array.isArray(manifest.stops) || !Array.isArray(manifest.edges)) throw new Error('Invalid pattern manifest')
      const ids = new Set<string>()
      let previous = -Infinity
      for (const chunk of manifest.chunks) {
        if (!chunk.id || ids.has(chunk.id) || !chunk.path || !Number.isFinite(chunk.windowStart) || !Number.isFinite(chunk.windowEnd) ||
          chunk.windowStart < previous || chunk.windowEnd <= chunk.windowStart || !Number.isSafeInteger(chunk.tripCount) || chunk.tripCount < 0 ||
          !Number.isSafeInteger(chunk.bytes) || chunk.bytes! < 1 || !/^[a-f0-9]{64}$/.test(chunk.sha256 ?? '')) throw new Error('Invalid pattern descriptor')
        ids.add(chunk.id); previous = chunk.windowEnd
      }
    },
    readChunk: (response, descriptor) => verifiedPatternNetworkChunk(response, descriptor, { format, categories }),
  }), [format, categories])
  const { chunk, ...state } = useProgressiveChunks(manifestFile, active, time, resolveAssetUrl, adapter)
  const network = useMemo(() => state.manifest ? networkSnapshotForDayChunk(state.manifest, chunk) : undefined, [state.manifest, chunk])
  return { ...state, network }
}
