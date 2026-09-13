import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { usePatternNetworkDay } from '@motionstudies/web/use-pattern-network-day'
const asset = (path: string) => `/patterns/${path}`
export function PatternDay() {
  const [active, setActive] = useState(false), [time, setTime] = useState(5), [name, setName] = useState('a')
  const state = usePatternNetworkDay(`${name}.json`, active, time, asset)
  return <>
    <button onClick={() => setActive(value => !value)}>Toggle</button>
    <button onClick={state.retry}>Retry</button>
    <input aria-label="Time" type="number" value={time} onChange={event => setTime(Number(event.target.value))} />
    <select aria-label="Source" value={name} onChange={event => setName(event.target.value)}>{['a', 'b', 'invalid'].map(value => <option key={value}>{value}</option>)}</select>
    <output data-testid="state" data-ready={state.chunkReady} data-error={state.error} data-loading={state.loading}>{state.network?.trains.map(train => train.id).join(',')}</output>
  </>
}
createRoot(document.getElementById('root')!).render(<StrictMode><PatternDay /></StrictMode>)
