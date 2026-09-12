import { useState } from 'react'
import { DotMatrixBoard, type DotMatrixColumn } from '@motionstudies/web/components/DotMatrixBoard'
import { SplitFlapBoard, type SplitFlapRow } from '@motionstudies/web/components/SplitFlapBoard'
import '@motionstudies/web/dot-matrix-board.css'
import '@motionstudies/web/split-flap-board.css'

const columns: readonly DotMatrixColumn[] = [
  { key: 'route', label: 'Route', characters: 4, minCharacters: 4 },
  { key: 'destination', label: 'Destination', characters: 24, minCharacters: 5 },
  { key: 'time', label: 'Due', characters: 6, minCharacters: 6, align: 'right' },
]
const services = [
  ['71', 'Northfield Campus', 'Due'], ['903', 'Long Ashton P+R', '2 min'],
  ['Port', 'Harbour Park & Ride', '5 min'], ['X9', 'Nailsea', '7 min'],
  ['X2', 'Weston-super-Mare', '12 min'], ['X6', 'Clevedon', '12 min'],
  ['X4', 'Portishead', '13 min'], ['903', 'Long Ashton P+R', '14 min'],
  ['Port', 'Harbour Park & Ride', '16 min'], ['X3', 'Portishead', '18 min'],
  ['73', 'City Centre', '21 min'], ['X8', 'Bristol Bus Station', '24 min'],
]

export function BusBoardStudy() {
  const [presentation, setPresentation] = useState('matrix')
  const [lines, setLines] = useState('auto')
  const [height, setHeight] = useState(380)
  const [state, setState] = useState('ready')
  const [selected, setSelected] = useState<string>()
  const [updated, setUpdated] = useState(false)
  const [long, setLong] = useState(false)
  const rows: readonly SplitFlapRow[] = state === 'empty' ? [] : services.map(([route, destination, time], index) => ({
    id: `bus-${index}`, cells: { route, destination: long && index === 0 ? 'Saint-Étienne — Gare routière / 中央駅' : destination,
      time: updated && index === 1 ? '3 min' : time }, tone: index === 0 ? 'accent' : updated && index === 1 ? 'warning' : 'neutral',
  }))
  const props = { label: 'Anchor Road bus departures', columns, rows, onSelectRow: setSelected, selectedRowId: selected,
    loading: state === 'loading', loadingMessage: 'Fetching bus departures…', emptyMessage: 'No buses expected.' }
  return <>
    <div className="toolbar">
      <label>Presentation <select value={presentation} onChange={(event) => setPresentation(event.target.value)}><option value="matrix">Dot matrix</option><option value="flap">Split flap</option></select></label>
      <label>Lines <select value={lines} onChange={(event) => setLines(event.target.value)}><option value="auto">Fit available height</option>{[3, 6, 10, 15, 30].map((count) => <option key={count} value={count}>{count} lines</option>)}</select></label>
      <label>Display height <input type="range" min="180" max="640" step="10" value={height} onChange={(event) => setHeight(Number(event.target.value))} /></label>
      <label>Bus board state <select value={state} onChange={(event) => setState(event.target.value)}><option value="ready">Ready</option><option value="loading">Loading</option><option value="empty">Empty</option></select></label>
      <button onClick={() => setUpdated(!updated)}>Update bus</button>
      <label><input type="checkbox" checked={long} onChange={(event) => setLong(event.target.checked)} /> Long / multilingual destination</label>
    </div>
    <section className="bus-stop-specimen" aria-label="Bus stop display">
      <div className="bus-stop-heading"><span className="bus-stop-symbol" aria-hidden="true">↗</span><div><span>Bus departures from</span><h2>Anchor Road</h2></div><span className="bus-stop-code">STOP<br /><strong>A1</strong></span></div>
      <div className="bus-board-frame" style={{ height }}>
        {presentation === 'matrix' ? <DotMatrixBoard {...props} lineCount={lines === 'auto' ? 'auto' : Number(lines)} style={{ height: '100%' }} />
          : <SplitFlapBoard {...props} rows={rows.slice(0, lines === 'auto' ? Math.max(1, Math.floor((height - 60) / 34)) : Number(lines))} loadingRows={lines === 'auto' ? 6 : Number(lines)} />}
      </div>
      <div className="bus-stop-footer"><span>LOCAL SERVICES</span><span>Synthetic timetable · Bristol-inspired</span></div>
    </section>
    <output className="airport-selection" data-testid="selected-bus">{selected ? `Selected bus: ${selected}` : 'Select a route to inspect its departure.'}</output>
    <p className="note">Drag the bottom-right corner to resize the display, or use the height control. Automatic mode fits the available height; a fixed line count scales the rows to fit. Route and due-time columns reserve space as destinations shorten. Both presentations use the same rows and selection.</p>
  </>
}
