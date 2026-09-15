import { Suspense, lazy } from 'react'

// Desktop button help is not needed for the first view; keep it out of the opening bundle.
const ButtonTooltips = lazy(() =>
  import('./ButtonTooltips.tsx').then((module) => ({ default: module.ButtonTooltips })),
)

/** Button help in its own Suspense boundary, so the application never waits for it. */
export function LazyButtonTooltips() {
  return <Suspense fallback={null}><ButtonTooltips /></Suspense>
}
