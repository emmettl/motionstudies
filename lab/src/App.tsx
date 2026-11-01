import { StudyView } from './StudyView.tsx'
import { studies, findStudy } from './studies.ts'
import { updateQuery, useSearch } from './scenario-state.tsx'
import { ValidationHarness } from './ValidationHarness.tsx'

export function App() {
  const params = new URLSearchParams(useSearch()), study = findStudy(params.get('study')), validating = params.get('validate') === '1'
  return <div className="lab"><aside className="lab-sidebar"><a className="lab-wordmark" href="./">Motion<br />Studies <span>Lab</span></a><nav aria-label="Specimens">{studies.map((item, index) => <button key={item.id} aria-current={study.id === item.id ? 'page' : undefined} onClick={() => updateQuery({ study: item.id, scenario: null }, true)}><small>{String(index + 1).padStart(2, '0')}</small>{item.label}</button>)}</nav><p>Shared instrument<br /><span>Synthetic fixtures · v0</span></p></aside>
    <main className="lab-main"><header><div><p className="kicker">Package specimens</p><h1>{study.label}</h1></div><button aria-pressed={validating} onClick={() => updateQuery({ study: study.id, validate: validating ? null : '1' }, true)}>{validating ? 'Return to gallery' : 'Validate in isolation'}</button></header>
      {validating ? <ValidationHarness key={study.id} studyId={study.id} /> : <StudyView key={study.id} id={study.id} />}
    </main></div>
}
