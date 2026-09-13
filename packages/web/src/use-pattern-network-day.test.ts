import { expect, it } from 'vitest'
import { verifiedPatternNetworkChunk } from './use-pattern-network-day.ts'
import { encodeNetworkPatterns } from '@motionstudies/core/domain/network-patterns'

const encoded = encodeNetworkPatterns({ windowStart: 0, windowEnd: 10, trains: [] })
const bytes = JSON.stringify(encoded)
const wire = new TextEncoder().encode(bytes)
const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', wire))].map(value => value.toString(16).padStart(2, '0')).join('')
const descriptor = { id: '0', path: '0.json', windowStart: 0, windowEnd: 10, tripCount: 0, bytes: wire.byteLength, sha256 }
it('verifies the original wire bytes before decoding and reconciles counts/window', async () => {
  await expect(verifiedPatternNetworkChunk(new Response(bytes), descriptor)).resolves.toEqual({ windowStart: 0, windowEnd: 10, trains: [] })
  await expect(verifiedPatternNetworkChunk(new Response(bytes), { ...descriptor, sha256: '0'.repeat(64) })).rejects.toThrow('integrity')
  await expect(verifiedPatternNetworkChunk(new Response(bytes), { ...descriptor, tripCount: 1 })).rejects.toThrow('descriptor')
  await expect(verifiedPatternNetworkChunk(new Response(bytes), { ...descriptor, windowEnd: 20 })).rejects.toThrow('descriptor')
})
