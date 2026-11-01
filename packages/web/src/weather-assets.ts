import { readWeatherField, type WeatherField } from '@motionstudies/core/domain/weather-field'
export interface WeatherAssetDescriptor { sha256: string; decodedBytes: number }
/** Verify decoded bytes, whether the host has already removed Content-Encoding or not. */
export async function decodeWeatherBytes(input: ArrayBuffer, descriptor: WeatherAssetDescriptor, maximumBytes=64*1024*1024): Promise<Uint8Array<ArrayBuffer>> {
  if(!Number.isSafeInteger(maximumBytes)||maximumBytes<=0||!Number.isSafeInteger(descriptor.decodedBytes)||descriptor.decodedBytes<1||descriptor.decodedBytes>maximumBytes||!/^[a-f0-9]{64}$/.test(descriptor.sha256)||input.byteLength>maximumBytes)throw new Error('Invalid weather asset descriptor or size')
  const prefix=new Uint8Array(input),compressed=prefix[0]===0x1f&&prefix[1]===0x8b
  let bytes:Uint8Array<ArrayBuffer>
  if(compressed){
    const reader=new Blob([input]).stream().pipeThrough(new DecompressionStream('gzip')).getReader()
    const chunks:Uint8Array[]=[];let length=0
    try {
      while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>descriptor.decodedBytes)throw new Error('Weather asset exceeds decoded size');chunks.push(value)}
    } finally { await reader.cancel() }
    bytes=new Uint8Array(length);let offset=0
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
  }else bytes=new Uint8Array(input)
  if(bytes.length!==descriptor.decodedBytes)throw new Error('Weather asset size mismatch')
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('')
  if(digest!==descriptor.sha256)throw new Error('Weather asset hash mismatch')
  return bytes
}
/** Static release bytes only; provider collection and retries remain outside the browser. */
export async function decodeWeatherField(input:ArrayBuffer,descriptor:WeatherAssetDescriptor,maximumBytes?:number):Promise<WeatherField> {
  const bytes=await decodeWeatherBytes(input,descriptor,maximumBytes)
  return readWeatherField(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)))
}
