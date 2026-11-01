import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ButtonTooltips } from '@motionstudies/web/components/ButtonTooltips'
import { seedScenario } from './scenarios.ts'
import { findStudy } from './studies.ts'
import { App } from './App.tsx'
import '@motionstudies/web/fonts.css'
import '@motionstudies/web/tokens.css'
import '@motionstudies/web/mobile-picker.css'
import './lab.css'

seedScenario(findStudy(new URLSearchParams(location.search).get('study')).id)
createRoot(document.getElementById('root')!).render(<StrictMode><App /><ButtonTooltips /></StrictMode>)
