import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useMediaQuery } from '@motionstudies/web/use-media-query'

// Count actual subscriptions, including StrictMode cleanup and resubscription.
const nativeMatchMedia = window.matchMedia.bind(window)
let active = 0, subscriptions = 0
const report = () => {
  document.body.dataset.listeners = String(active)
  document.body.dataset.subscriptions = String(subscriptions)
}
window.matchMedia = query => {
  if (query === '(test: subscription-race)') {
    let matches = false
    return {
      get matches() { return matches }, media: query,
      // Change after React's render read, without an event: subscription must recheck.
      addEventListener() { matches = true }, removeEventListener() {},
    } as unknown as MediaQueryList
  }
  const media = nativeMatchMedia(query)
  const add = media.addEventListener.bind(media), remove = media.removeEventListener.bind(media)
  media.addEventListener = (...args: Parameters<MediaQueryList['addEventListener']>) => { active++; subscriptions++; add(...args); report() }
  media.removeEventListener = (...args: Parameters<MediaQueryList['removeEventListener']>) => { active--; remove(...args); report() }
  return media
}

export function Query({ query, id }: { query: string; id: string }) {
  const matches = useMediaQuery(query)
  return <output data-testid={id}>{String(matches)}</output>
}
export function Fixture() {
  const [query, setQuery] = useState('(max-width: 700px)')
  const [mounted, setMounted] = useState(true)
  const [count, setCount] = useState(0)
  return <>
    <button onClick={() => setQuery('(min-width: 701px)')}>Replace query</button>
    <button onClick={() => setMounted(v => !v)}>Toggle consumers</button>
    <button onClick={() => setCount(v => v + 1)}>Render {count}</button>
    {mounted && <><Query query={query} id="first" /><Query query={query} id="second" />
      <Query query="(prefers-reduced-motion: reduce)" id="motion" />
      <Query query="(test: subscription-race)" id="race" /></>}
  </>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Fixture /></StrictMode>)
