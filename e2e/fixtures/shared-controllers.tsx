import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useJsonAsset } from '@motionstudies/web/use-json-asset'
import { useTransitionValue } from '@motionstudies/web/use-transition-value'
const parse = (raw: unknown) => {
  const value = raw as { name: string }
  if (typeof value.name !== 'string') throw new Error('Invalid asset')
  return value
}
function Controllers() {
  const [url, setUrl] = useState('a')
  const [enabled, setEnabled] = useState(false)
  const [target, setTarget] = useState(0)
  const asset = useJsonAsset(`/assets/${url}.json`, enabled, parse, true)
  const transition = useTransitionValue(target, { durationMs: 1000 })
  return <>
    <button onClick={() => setEnabled(v => !v)}>Toggle asset</button>
    <button onClick={asset.retry}>Retry asset</button>
    <select aria-label="Asset" value={url} onChange={e => setUrl(e.target.value)}>{['a','b','slow','fail','missing','invalid'].map(v => <option key={v}>{v}</option>)}</select>
    <output data-testid="asset" data-loading={asset.loading} data-error={asset.error} data-unavailable={asset.unavailable}>{asset.data?.name ?? ''}</output>
    <button onClick={() => setTarget(v => 1 - v)}>Transition</button>
    <output data-testid="transition" data-active={transition.transitioning}>{transition.value.toFixed(3)}</output>
  </>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Controllers /></StrictMode>)
