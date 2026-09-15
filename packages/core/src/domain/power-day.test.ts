import { describe, expect, it } from 'vitest'
import { fuelMixAt, plannedPower, powerPeriod, readPowerDay, sumPower, unitPower, type PowerDay } from './power-day'
const source = 'a'.repeat(64)
function fixture(start = '2026-09-04T23:00:00Z', end = '2026-09-05T23:00:00Z', date = '2026-09-05'): PowerDay {
  const count = (Date.parse(end) - Date.parse(start)) / 1800000
  return { kind: 'power-day', schemaVersion: 1, date, timezone: 'Europe/London', startUtc: start, endUtc: end, periodSeconds: 1800, quantityUnit: 'MWh', powerUnit: 'MW', scope: 'Test', population: 'Synthetic fixture',
    sources: [{ sha256: source, url: 'https://example.org/fixture', retrievedAt: '2026-09-14T00:00:00Z', publisher: 'Test' }], settlementSources: Array(count).fill(source), planSources: Array(count).fill(source), attribution: [{ statement: 'Synthetic', licence: 'https://example.org/licence' }],
    demandMw: Array(count).fill(null), fuelMix: [{ time: 0, byFuel: { WIND: 0, GAS: null } }, { time: 600, byFuel: { WIND: 20 } }],
    units: [{ id: 'test', name: 'Test unit', fuelType: 'WIND', capacityMw: 10, settledMwh: Array.from({ length: count }, (_, i) => i === 0 ? -2 : i === 1 ? 0 : null), runs: Array.from({ length: count }, (_, i) => i < 2 ? 'II' : null), plan: [[0, 1800, 0, 10]] }] }
}
describe('power day', () => {
  it('keeps negative, zero and absent settlement distinct; derives interval average MW', () => {
    const day = readPowerDay(fixture()), u = day.units[0]
    expect(unitPower(day, u, 900)).toEqual({ period: 0, settledMwh: -2, averageMw: -4, plannedMw: 5, run: 'II' })
    expect(unitPower(day, u, 1800).averageMw).toBe(0)
    expect(unitPower(day, u, 3600).averageMw).toBeNull()
    expect(powerPeriod(day, 86400)).toBeNull(); expect(powerPeriod(day, -1)).toBeNull()
    expect(sumPower(day, [u], 3600)).toEqual({ averageMw: null, available: 0, missing: 1 })
  })
  it('accepts both DST day lengths and rejects shifted or mismatched civil dates', () => {
    expect(readPowerDay(fixture('2026-03-29T00:00:00Z','2026-03-29T23:00:00Z','2026-03-29')).demandMw).toHaveLength(46)
    expect(readPowerDay(fixture('2026-10-24T23:00:00Z','2026-10-26T00:00:00Z','2026-10-25')).demandMw).toHaveLength(50)
    expect(() => readPowerDay({ ...fixture(), date: '2026-09-06' })).toThrow('civil date')
    expect(() => readPowerDay(fixture('2026-09-05T00:00:00Z','2026-09-06T00:00:00Z'))).toThrow('civil date')
  })
  it('does not extrapolate national samples, plans or ambiguous declarations', () => {
    const d = fixture(), u = d.units[0]
    expect(fuelMixAt(d, 299)?.byFuel.WIND).toBe(0); expect(fuelMixAt(d, 300)).toBeNull()
    expect(fuelMixAt(d, 86400)).toBeNull(); expect(plannedPower(u, 1800)).toBeNull()
    u.plan.push([0, 1800, 10, 10]); expect(plannedPower(u, 200)).toBeNull()
  })
  it('rejects broken links, quantities, duplicates, placement and unsafe evidence paths', () => {
    const mutations: ((d: PowerDay) => void)[] = [d => { d.settlementSources[0] = 'b'.repeat(64) }, d => { d.units.push(d.units[0]) }, d => { d.units[0].settledMwh[0] = NaN }, d => { d.units[0].runs[0] = null }, d => { d.units[0].placement = { method: 'site' } }, d => { d.units[0].evidence = { path: '../private.json', sha256: source, bytes: 1 } }]
    for (const mutate of mutations) { const d = fixture(); mutate(d); expect(() => readPowerDay(d)).toThrow() }
  })
})
