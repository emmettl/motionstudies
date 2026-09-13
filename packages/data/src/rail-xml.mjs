import {XMLParser,XMLValidator} from 'fast-xml-parser'
const parser=new XMLParser({preserveOrder:true,ignoreAttributes:false,parseTagValue:false,parseAttributeValue:false,trimValues:false,ignoreDeclaration:true,ignorePiTags:true})
export function parseRailXml(bytes){
 const xml=Buffer.from(bytes).toString('utf8')
 if(/<!DOCTYPE|<!ENTITY/i.test(xml)||XMLValidator.validate(xml)!==true)throw new Error('Unsupported or invalid source XML')
 return parser.parse(xml)
}
const local=name=>name.split(':').at(-1)
export function xmlChildren(nodes,name){return (nodes??[]).filter(n=>Object.keys(n).some(k=>k!==':@'&&local(k)===name))}
export function xmlContent(node){const key=Object.keys(node).find(k=>k!==':@');return node[key]}
export function xmlText(nodes){return (nodes??[]).map(n=>Object.entries(n).filter(([k])=>k!==':@').map(([k,v])=>k==='#text'?String(v):Array.isArray(v)?xmlText(v):'').join('')).join('')}
export function xmlAttribute(node,name){const attributes=node[':@']??{};const key=Object.keys(attributes).find(k=>local(k.replace(/^@_/,''))===name);return key===undefined?undefined:attributes[key]}
