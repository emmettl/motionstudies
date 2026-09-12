export interface AirportConfig { iata: string; name: string; city: string; timeZone: string }
export interface FeedConfig {
  enabled: boolean
  credentialVersion: number
  origins: string[]
  editions: Record<string, { enabled: boolean; airports: string[] }>
  airports: Record<string, AirportConfig>
  refreshSeconds: number
  staleSeconds: number
  dailyUnitBudget: number
  monthlyUnitBudget: number
}
export function readConfig(raw: string | FeedConfig): FeedConfig {
  const c = (typeof raw === 'string' ? JSON.parse(raw) : raw) as FeedConfig
  if (!Number.isInteger(c.credentialVersion) || c.credentialVersion < 1 || Object.keys(c.airports ?? {}).length > 50 || typeof c.enabled !== 'boolean' || !Array.isArray(c.origins) || !c.editions || !c.airports
    || !Number.isInteger(c.refreshSeconds) || c.refreshSeconds < 300
    || !Number.isInteger(c.staleSeconds) || c.staleSeconds < c.refreshSeconds || c.staleSeconds > 3600
    || !Number.isInteger(c.dailyUnitBudget) || c.dailyUnitBudget < 0 || c.dailyUnitBudget > 1000
    || !Number.isInteger(c.monthlyUnitBudget) || c.monthlyUnitBudget < 0 || c.monthlyUnitBudget > 30000) throw new Error('Invalid airport configuration')
  for (const origin of c.origins) if (new URL(origin).origin !== origin || !origin.startsWith('https://')) throw new Error('Exact HTTPS origins required')
  for (const [code, a] of Object.entries(c.airports)) {
    if (!/^[A-Z]{3}$/.test(code) || a.iata !== code || !a.name || !a.city) throw new Error('Invalid airport')
    new Intl.DateTimeFormat('en', { timeZone: a.timeZone }).format()
  }
  for (const e of Object.values(c.editions)) if (typeof e.enabled !== 'boolean' || !Array.isArray(e.airports) || e.airports.some((a) => !Object.hasOwn(c.airports, a))) throw new Error('Invalid edition')
  return c
}
export function airportEnabled(c: FeedConfig, edition: string, code: string) {
  const e = Object.hasOwn(c.editions, edition) ? c.editions[edition] : undefined
  return !!(c.enabled && e?.enabled && e.airports.includes(code))
}
