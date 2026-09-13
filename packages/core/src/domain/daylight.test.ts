import {it,expect} from 'vitest'
import {DEFAULT_DAYLIGHT_ENVELOPES,daylightAt,solarPosition} from './daylight.ts'
const place=[48.0431,10.2204] as const
it('matches the reference solar algorithm to a thousandth of a degree at varied places, seasons and hemispheres',()=>{
 for(const [time,latitude,longitude,altitude,azimuth] of [
  ['2018-09-04T18:00:00Z',48.0431,10.2204,-1.522335,282.418126],['2018-09-05T04:45:00Z',48.0431,10.2204,-.395756,79.11624],
  ['2026-03-20T12:00:00Z',52.5,-1.5,37.198352,175.62179],['2026-06-21T23:00:00Z',-33.9,151.2,18.840598,42.636133],
  ['2026-12-21T09:30:00Z',60.1,25,5.883927,168.907995]] as const){
  const position=solarPosition(time,latitude,longitude)!
  expect(position.altitude).toBeCloseTo(altitude,3);expect(position.azimuth).toBeCloseTo(azimuth,3)
 }
})
it('evening afterglow is western and fades continuously into night',()=>{
 const start=Date.parse('2018-09-04T18:00:00Z'),dusk=daylightAt(start,...place)!
 expect(dusk.direction[0]).toBeLessThan(-.9);expect(dusk.altitude).toBeLessThan(0);expect(dusk.altitude).toBeGreaterThan(-3);expect(dusk.warmth).toBeGreaterThan(.9)
 let last=dusk
 for(let minute=1;minute<=120;minute++){
  const current=daylightAt(start+minute*60_000,...place)!
  expect(current.twilight).toBeLessThanOrEqual(last.twilight);expect(current.warmth).toBeLessThanOrEqual(last.warmth)
  expect(Math.abs(current.warmth-last.warmth)).toBeLessThan(.03);last=current
 }
 expect(last.twilight).toBe(0);expect(last.warmth).toBe(0);expect(last.daylight).toBe(0)
})
it('morning returns from the east, using the selected date and instant regardless of offset notation',()=>{
 const dawn=daylightAt('2018-09-05T04:45:00Z',...place)!
 expect(dawn.direction[0]).toBeGreaterThan(.8);expect(dawn.twilight).toBeGreaterThan(0)
 expect(daylightAt('2018-09-02T18:00:00Z',...place)!.altitude).not.toBe(daylightAt('2018-09-04T18:00:00Z',...place)!.altitude)
 expect(daylightAt('2018-09-02T18:00:00Z',...place)).toEqual(daylightAt('2018-09-02T20:00:00+02:00',...place))
 expect(daylightAt(new Date('2018-09-02T18:00:00Z'),...place)).toEqual(daylightAt('2018-09-02T18:00:00Z',...place))
})
it('a terminator sweeps across longitudes and the direction stays a unit vector with the sun south at noon',()=>{
 const noon=daylightAt('2026-03-20T12:10:00Z',52,0)!
 expect(Math.hypot(...noon.direction)).toBeCloseTo(1,9);expect(noon.direction[2]).toBeGreaterThan(.7);expect(noon.daylight).toBe(1)
 const west=daylightAt('2026-03-20T06:30:00Z',52,-6)!,east=daylightAt('2026-03-20T06:30:00Z',52,2)!
 expect(east.altitude).toBeGreaterThan(west.altitude)
 expect(daylightAt('2026-03-20T06:30:00Z',52,0,{...DEFAULT_DAYLIGHT_ENVELOPES,daylight:[-1,1]})!.daylight).toBeGreaterThan(daylightAt('2026-03-20T06:30:00Z',52,0)!.daylight)
 expect(daylightAt('nonsense',52,0)).toBeNull();expect(solarPosition(0,NaN,0)).toBeNull()
})
