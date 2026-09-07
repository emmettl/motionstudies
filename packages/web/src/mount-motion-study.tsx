import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import type { MotionStudyEdition } from '@motionstudies/core/edition'
import { ButtonTooltips } from './components/ButtonTooltips.tsx'
import { applyVisualTheme } from './visual-theme.ts'

export function mountMotionStudy(
  edition: MotionStudyEdition,
  application: ReactNode,
): void {
  const root = document.getElementById('root')
  if (!root) throw new Error('Motion Studies entry point requires #root')

  document.documentElement.classList.add('motion-study')
  document.documentElement.dataset.edition = edition.id
  applyVisualTheme(edition.theme)
  createRoot(root).render(<StrictMode>{application}<ButtonTooltips /></StrictMode>)
}
