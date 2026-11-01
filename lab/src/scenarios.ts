/** Named, deterministic consumer configurations shared by UI and browser checks. */
export const scenarios = [
  { id: 'default', label: 'Default', study: '*', values: {} },
  { id: 'stress-picker', label: 'Shared Unicode and unbroken labels', study: 'controls', values: { stress: true } },
  { id: 'long-picker', label: 'Long picker labels', study: 'controls', values: { long: true, up: true } },
  { id: 'overnight-gap', label: 'Overnight timeline with evidence gap', study: 'timeline', values: { overnight: true, time: 75600, variant: 'line' } },
  { id: 'dense-paused', label: 'Dense paused network', study: 'network-policies', values: { dense: true, time: 120, mix: .5, coplanar: true } },
  { id: 'terrain-adapter', label: 'Swapped south-first terrain', study: 'terrain', values: { phase: 1, southFirst: true, progress: .5, exaggeration: 2 } },
  { id: 'power-repeat', label: 'Repeated autumn hour', study: 'power-days', values: { kind: 'long', time: 7200 } },
  { id: 'loader-error', label: 'Loader integrity failure', study: 'data', values: { enabled: true, file: 'bad-digest.json' } },
  { id: 'polling', label: 'Observed operations polling', study: 'data', values: { observing: true, endpoint: 'observations-a.json' } },
  { id: 'long-vehicle', label: 'Long vehicle calls', study: 'vehicle-heroes', values: { long: true, width: 320 } },
] as const
export function scenarioPatch(study: string, id: string, search: string) {
  const patch: Record<string, string | null> = { scenario: id }
  for (const key of new URLSearchParams(search).keys()) if (key.startsWith(`v.${study}.`) || key.startsWith(`v1.${study}.`)) patch[key] = null
  const found = scenarios.find(s => s.id === id && (s.study === '*' || s.study === study)) ?? scenarios[0]
  for (const [key, value] of Object.entries(found.values)) patch[`v.${study}.${key}`] = JSON.stringify(value)
  return patch
}

/** Apply preset defaults once on entry; explicit URL controls always win. */
export function seedScenario(study: string) {
  const url = new URL(location.href), id = url.searchParams.get('scenario')
  const found = scenarios.find(s => s.id === id && (s.study === '*' || s.study === study))
  if (!found) return
  for (const [key, value] of Object.entries(found.values)) if (!url.searchParams.has(`v.${study}.${key}`)) url.searchParams.set(`v.${study}.${key}`, JSON.stringify(value))
  history.replaceState(null, '', url)
}
