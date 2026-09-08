import { describe, expect, it } from 'vitest'
import { inferAirEndpoints, parseAirports } from './air-endpoints.mjs'

const airports = [
  { icao: 'AAAA', iata: 'AAA', name: 'West Field', city: 'West', longitude: 0, latitude: 0, elevation: 0 },
  { icao: 'BBBB', iata: 'BBB', name: 'East Field', city: 'East', longitude: 2, latitude: 0, elevation: 0 },
]
const samples = [[0, 0, 0, 100, 120], [10, .01, 0, 600, 150], [20, .5, 0, 6000, 300], [30, 1.5, 0, 5000, 300], [40, 1.99, 0, 500, 150], [50, 2, 0, 100, 120]]

describe('observed air endpoints', () => {
  it('uses low approach boundaries for times and labels both endpoints as inferred evidence', () => {
    const result = inferAirEndpoints(samples, airports)
    expect(result.origin).toMatchObject({ icao: 'AAAA', time: 10, evidence: 'observed-endpoint' })
    expect(result.destination).toMatchObject({ icao: 'BBBB', time: 40, evidence: 'observed-endpoint' })
  })
  it('does not turn a regional cruise boundary into a destination', () => {
    expect(inferAirEndpoints(samples.slice(0, 4), airports).destination).toBeUndefined()
    expect(inferAirEndpoints(samples.slice(2), airports).origin).toBeUndefined()
    expect(inferAirEndpoints(samples.map(row => [row[0], row[1], row[2], 30000, 450]), airports)).toEqual({})
  })
  it('rejects ambiguous airports and ground-only movement', () => {
    expect(inferAirEndpoints(samples, [...airports, { ...airports[1], icao: 'CCCC', longitude: 2.01 }]).destination).toBeUndefined()
    expect(inferAirEndpoints(samples.map(row => [row[0], row[1], row[2], 100, 20]), airports)).toEqual({})
  })
  it('reads quoted names and excludes closed airports', () => {
    expect(parseAirports('ident,type,name,latitude_deg,longitude_deg,elevation_ft,iata_code,municipality\nAAAA,large_airport,"West, Field",0,0,50,AAA,West\nBBBB,closed,Closed,1,1,20,BBB,East\n')).toEqual([{ ...airports[0], name: 'West, Field', elevation: 50 }])
  })
})
