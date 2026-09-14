import type {Buffer} from 'node:buffer'
export interface CaptureSource {id:string;publisher:string;kind:string;documentation:string;license:string;attribution?:string;origins:readonly string[]}
export interface CaptureRecord {schemaVersion:1;source:Omit<CaptureSource,'origins'>;url:string;sha256:string;bytes:number;storedBytes?:number;encoding?:'gzip'|null;retrievedAt:string|null;importedAt?:string;acquisition:'http'|'local-import';validation:string;httpStatus?:number;contentType?:string|null;lastModified?:string|null;etag?:string|null}
export interface CaptureResult {bytes:Buffer;record:CaptureRecord;cached:boolean}
export type CaptureValidator=(bytes:Buffer)=>unknown|Promise<unknown>
export interface CaptureOptions {store:string;source:CaptureSource;url:string;offline?:boolean;refresh?:boolean;maxBytes?:number;timeoutMs?:number;retries?:number;validate?:CaptureValidator;fetchImpl?:typeof fetch;userAgent?:string;compression?:'gzip'}
export function sha256(bytes:string|Uint8Array):string
export function publicSourceUrl(source:CaptureSource,value:string):string
export function atomicJson(path:string,value:unknown):Promise<void>
export function readCapture(store:string,source:CaptureSource,url:string,validate?:CaptureValidator):Promise<CaptureResult>
export function importCapture(options:Pick<CaptureOptions,'store'|'source'|'url'|'maxBytes'|'validate'|'compression'>&{input:string}):Promise<CaptureResult>
export function readObject(store:string,hash:string,expectedBytes?:number):Promise<Buffer>
export function compactObjects(store:string,options?:{minimumSaving?:number}):Promise<{examined:number;compressed:number;kept:number;rawBytes:number;storedBytes:number}>
export function capture(options:CaptureOptions):Promise<CaptureResult>
export function jsonDocument(bytes:Buffer):Record<string,unknown>|unknown[]
