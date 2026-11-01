import { beforeEach, expect, it, vi } from 'vitest'
import { Children, isValidElement, type ReactElement } from 'react'
import * as THREE from 'three'
import type { RoadTrafficSnapshot, RoadTopologySnapshot } from '@motionstudies/core/domain/road'
import { scenePickMetadata } from './scene-picking.ts'
import { RoadTrafficLayer, type RoadCurveFactory } from './RoadTrafficLayer.tsx'

const hooks = vi.hoisted(() => ({ cleanups: [] as (() => void)[], frames: [] as ((state: unknown, delta: number) => void)[] }))
vi.mock('react', async original => ({ ...await original<typeof import('react')>(),
  useMemo: (build: () => unknown) => build(), useRef: (current: unknown) => ({current}),
  useEffect: (effect: () => void | (() => void)) => { const cleanup = effect(); if (cleanup) hooks.cleanups.push(cleanup) },
}))
vi.mock('./webgl-study.ts', () => ({ useWebGLStudyFrame: (frame: typeof hooks.frames[number]) => hooks.frames.push(frame) }))
vi.mock('./glow-point-texture.ts', () => ({ createGlowPointTexture: () => new THREE.Texture() }))
vi.mock('@motionstudies/core/domain/road', () => ({
  roadDistanceTravelledKm: () => 0.9199,
  visualVehicleCount: (flow: number) => flow ? 1 : 0,
  roadConditionsAtTime: () => ({lightFlowPerHour: 1, heavyFlowPerHour: 0}),
}))
const snapshot: RoadTrafficSnapshot = {
  metadata: { publisher: 'test', serviceDate: '2026-10-25', windowStart: 0, windowEnd: 100,
    sourceUrl: '', measurementSiteUrl: '', measurementSiteTableVersion: 1,
    measurementSitePublishedAt: '', measurementKind: 'recorded', model: '', note: '', sampleIntervalSeconds: 60, visualSampleRate: 1 },
  corridors: [{ id: 'one', road: 'N1', name: 'One', distanceKm: 1, path: [[0,0],[1,1]],
    directions: [{id: 'forward',label: '',reverse:false,detectorIds:[],samples:[]}]}],
}
const props = {snapshot, projection: {centreLongitude:0,centreLatitude:0,longitudeScale:1,scale:1},time:0,isPlaying:false,playbackRate:1}
type Element = ReactElement<Record<string, any>>
function descendants(element: Element): Element[] {
  return Children.toArray(element.props.children).filter(isValidElement).flatMap(child => [child as Element, ...descendants(child as Element)])
}
beforeEach(() => { hooks.cleanups.splice(0).forEach(cleanup => cleanup()); hooks.frames.length=0 })

it('uses the source path by default, accepts resolved paths, omits null paths and disposes owned corridor geometry', () => {
  let geometry = descendants(RoadTrafficLayer(props)).find(child => child.type === 'lineSegments')!.props.geometry as THREE.BufferGeometry
  expect(geometry.getAttribute('position').getY(0)).toBeCloseTo(0.11)
  const dispose = vi.spyOn(geometry, 'dispose')
  hooks.cleanups.splice(0).forEach(cleanup => cleanup()); expect(dispose).toHaveBeenCalledOnce()
  const factory = vi.fn<RoadCurveFactory>(points => new THREE.LineCurve3(points[0], points.at(-1)!))
  const resolvePath = vi.fn(() => [[2,3],[4,5]] as const)
  geometry = descendants(RoadTrafficLayer({...props,surfaceY:0.0002,resolvePath,createCurve:factory})).find(child => child.type === 'lineSegments')!.props.geometry
  expect(resolvePath.mock.calls[0]).toBeDefined()
  expect(factory.mock.calls[0][0].map(p=>p.toArray())).toEqual([[2,0.0002,-3],[4,0.0002,-5]])
  expect(geometry.getAttribute('position').getX(0)).toBe(2)
  expect(descendants(RoadTrafficLayer({...props,resolvePath:()=>null})).some(child=>child.type==='lineSegments')).toBe(false)
})

it.each([false,true])('keeps open-path heading samples at the endpoint for reverse=%s', reverse => {
  const samples: number[]=[]
  const curve = new THREE.LineCurve3(new THREE.Vector3(),new THREE.Vector3(1,0,0))
  const getPointAt = curve.getPointAt.bind(curve)
  curve.getPointAt = (progress,target) => {samples.push(progress);return getPointAt(progress,target)}
  const element = RoadTrafficLayer({...props,snapshot:{...snapshot,corridors:[{...snapshot.corridors[0],directions:[{...snapshot.corridors[0].directions[0],reverse}]}]},createCurve:()=>curve})
  const flow=descendants(element).find(child=>typeof child.type==='function')!
  const rendered=(flow.type as (props: any)=>Element)(flow.props)
  const mesh=descendants(rendered).find(child=>child.type==='instancedMesh')!
  mesh.props.ref.current=new THREE.InstancedMesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial(),1)
  hooks.frames.at(-1)!({},0)
  expect(samples.slice(-2)).toEqual(reverse ? [expect.closeTo(0.0001,5),0] : [expect.closeTo(0.9999,5),1])
  mesh.props.ref.current.geometry.dispose();mesh.props.ref.current.material.dispose()
})


it('publishes vertex-aligned road IDs only for mainline paths and releases topology geometry', () => {
  const topology: RoadTopologySnapshot = {
    metadata: {publisher:'test',sourceUrl:'',sourceAsset:'',sourceCrs:'WGS84',sourceDate:'',sourceUpdated:'',measurementSiteUrl:'',measurementSiteTableVersion:1,measurementSitePublishedAt:'',model:'',coverage:{federalStations:0,federalDetectorRecords:0,usableDirectionalGroups:0,matchedDirectionalGroups:0,highConfidenceDirectionalGroups:0,continuityResolvedDirectionalGroups:0,authoritativeResolvedDirectionalGroups:0,reviewDirectionalGroups:0,unmatchedDirectionalGroups:0,matchedStations:0,medianMatchDistanceMetres:0,p95MatchDistanceMetres:0,roads:1,axisSegments:2}},
    roads:[],sites:[],sections:[],paths:[
      {id:'main',road:'N1',axisName:'',position:'',mainline:true,points:[[0,0],[1,1],[2,1]]},
      {id:'link',road:'N2',axisName:'',position:'',mainline:false,points:[[0,0],[1,0]]},
    ],
  }
  const child=descendants(RoadTrafficLayer({...props,topology,surfaceY:0.0002})).find(child=>typeof child.type==='function')!
  const rendered=(child.type as (props: any)=>Element)(child.props)
  const geometries=descendants(rendered).flatMap(child=>child.props.geometry ? [child.props.geometry as THREE.BufferGeometry] : [])
  const main=geometries.find(geometry=>scenePickMetadata(geometry)?.roadIds)!
  expect(scenePickMetadata(main)?.roadIds).toEqual(['N1','N1','N1','N1'])
  expect(main.getAttribute('position').count).toBe(4)
  expect(main.getAttribute('position').getY(0)).toBeCloseTo(0.0002)
  const disposals=geometries.map(geometry=>vi.spyOn(geometry,'dispose'))
  hooks.cleanups.splice(0).forEach(cleanup=>cleanup())
  disposals.forEach(dispose=>expect(dispose).toHaveBeenCalledOnce())
})
