/** Sun position and smooth lighting envelopes for a place and instant. The position follows the
 * low-precision solar algorithm published by Astronomy Answers (as popularised by SunCalc), good
 * to a fraction of a degree: enough to light a scene and place a terminator, not for astronomy.
 * The envelopes are artistic colour responses to sun altitude; they encode no weather or sky observation.
 */
export interface SolarPosition {
 /** Degrees above the horizon; negative below. */
 readonly altitude:number
 /** Degrees clockwise from north. */
 readonly azimuth:number
}
/** Sun-altitude thresholds in degrees. Each envelope rises smoothly between its bounds; warmth also falls again between its last two. */
export interface DaylightEnvelopes {
 readonly twilight:readonly [from:number,to:number]
 readonly warmth:readonly [from:number,to:number,fallFrom:number,fallTo:number]
 readonly daylight:readonly [from:number,to:number]
}
export const DEFAULT_DAYLIGHT_ENVELOPES:DaylightEnvelopes={twilight:[-18,-1],warmth:[-12,-1,3,15],daylight:[-1,12]}
export interface Daylight extends SolarPosition {
 /** Unit vector towards the sun in a scene frame with +x east, +y up and +z south. */
 readonly direction:readonly [number,number,number]
 /** 0 in full night, 1 once the sun nears the horizon. */
 readonly twilight:number
 /** Peaks around sunrise and sunset, 0 at night and in full day. */
 readonly warmth:number
 /** 0 below the horizon, 1 once the sun is well up. */
 readonly daylight:number
}

const rad=Math.PI/180,dayMs=86_400_000,J1970=2440588,J2000=2451545,obliquity=rad*23.4397
const smooth=(a:number,b:number,value:number)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t)}
const instant=(time:number|string|Date)=>typeof time==='number'?time:time instanceof Date?time.getTime():Date.parse(time)

/** Sun altitude and azimuth for an instant, or null for an invalid instant or place. */
export function solarPosition(time:number|string|Date,latitude:number,longitude:number):SolarPosition|null {
 const ms=instant(time)
 if(!Number.isFinite(ms)||!Number.isFinite(latitude)||!Number.isFinite(longitude))return null
 const days=ms/dayMs-.5+J1970-J2000,phi=rad*latitude
 const anomaly=rad*(357.5291+.98560028*days)
 const eclipticLongitude=anomaly+rad*(1.9148*Math.sin(anomaly)+.02*Math.sin(2*anomaly)+.0003*Math.sin(3*anomaly))+rad*102.9372+Math.PI
 const declination=Math.asin(Math.sin(obliquity)*Math.sin(eclipticLongitude))
 const rightAscension=Math.atan2(Math.sin(eclipticLongitude)*Math.cos(obliquity),Math.cos(eclipticLongitude))
 const hourAngle=rad*(280.16+360.9856235*days)+rad*longitude-rightAscension
 const altitude=Math.asin(Math.sin(phi)*Math.sin(declination)+Math.cos(phi)*Math.cos(declination)*Math.cos(hourAngle))
 const fromSouth=Math.atan2(Math.sin(hourAngle),Math.cos(hourAngle)*Math.sin(phi)-Math.tan(declination)*Math.cos(phi))
 return {altitude:altitude/rad,azimuth:((fromSouth/rad+180)%360+360)%360}
}
/** Sun direction and lighting envelopes for a place and instant, or null for an invalid instant or place. */
export function daylightAt(time:number|string|Date,latitude:number,longitude:number,envelopes:DaylightEnvelopes=DEFAULT_DAYLIGHT_ENVELOPES):Daylight|null {
 const position=solarPosition(time,latitude,longitude)
 if(!position)return null
 const altitude=position.altitude*rad,fromSouth=(position.azimuth-180)*rad
 const [tw0,tw1]=envelopes.twilight,[w0,w1,w2,w3]=envelopes.warmth,[d0,d1]=envelopes.daylight
 return {...position,
  direction:[-Math.sin(fromSouth)*Math.cos(altitude),Math.sin(altitude),Math.cos(fromSouth)*Math.cos(altitude)],
  twilight:smooth(tw0,tw1,position.altitude),
  warmth:smooth(w0,w1,position.altitude)*(1-smooth(w2,w3,position.altitude)),
  daylight:smooth(d0,d1,position.altitude)}
}
