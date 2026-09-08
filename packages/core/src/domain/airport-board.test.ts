import { expect, it } from 'vitest'
import { airportBoardMovements, type StudyAirport } from './airport.ts'
import type { AirSearchTrack } from '../air-search.ts'

it('maps same-airport endpoint evidence to board rows without fabricating destinations', () => {
  const airport = { icao: 'AAAA' } as StudyAirport
  const endpoint = { icao: 'AAAA', iata: 'AAA', name: 'West Field', city: 'West', time: 30000, evidence: 'observed-endpoint' as const }
  const tracks: AirSearchTrack[] = [
    { id: 'out', icaoAddress: 'abc123', callsign: 'EX 1', start: 30010, end: 31000, origin: endpoint, destination: { ...endpoint, icao: 'BBBB', iata: 'BBB', city: 'East', time: 34000 } },
    { id: 'duplicate-chunk', icaoAddress: 'abc123', callsign: 'EX 1', start: 31000, end: 32000, origin: endpoint },
    { id: 'in', callsign: 'EX 2', start: 29000, end: 30000, destination: endpoint },
    { id: 'unclassified', callsign: 'EX 3', start: 29000, end: 30000 },
  ]
  expect(airportBoardMovements(tracks, airport)).toEqual({
    departures: [{ id: 'out', service: 'EX 1', time: 30000, place: 'East BBB' }],
    arrivals: [{ id: 'in', service: 'EX 2', time: 30000, place: undefined }],
  })
})
