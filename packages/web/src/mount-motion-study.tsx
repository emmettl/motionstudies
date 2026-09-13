import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import type { VisualTheme } from '@motionstudies/core/theme'
import { ButtonTooltips } from './components/ButtonTooltips.tsx'
import { applyVisualTheme } from './visual-theme.ts'

/** Mounting needs presentation identity only; data catalogues belong to the application. */
export interface MotionStudyMountOptions {
  readonly id: string
  readonly theme: VisualTheme
}

export function mountMotionStudy(
  edition: MotionStudyMountOptions,
  application: ReactNode,
): void {
  const root = document.getElementById('root')
  if (!root) throw new Error('Motion Studies entry point requires #root')

  document.documentElement.classList.add('motion-study')
  document.documentElement.dataset.edition = edition.id
  applyVisualTheme(edition.theme)
  createRoot(root).render(<StrictMode>{application}<ButtonTooltips /></StrictMode>)
}
