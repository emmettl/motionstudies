import { Suspense } from 'react'
import { findStudy } from './studies.ts'
export function StudyView({ id }: { id: string }) {
  const { View } = findStudy(id)
  return <Suspense fallback={<p role="status">Loading specimen…</p>}><View /></Suspense>
}
