import { expect, it } from 'vitest'
import { decodeWeatherBytes } from './weather-assets.ts'
const descriptor={decodedBytes:3,sha256:'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'}
it('verifies identity and gzip responses against decoded bytes',async()=>{const bytes=new TextEncoder().encode('abc');expect(new TextDecoder().decode(await decodeWeatherBytes(bytes.buffer,descriptor))).toBe('abc');const gz=await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();expect([...await decodeWeatherBytes(gz,descriptor)]).toEqual([...bytes]);await expect(decodeWeatherBytes(gz,{...descriptor,decodedBytes:2})).rejects.toThrow();await expect(decodeWeatherBytes(bytes.buffer,{...descriptor,sha256:'a'.repeat(64)})).rejects.toThrow('hash')})
