import { useId, type CSSProperties } from 'react'

export interface SplitFlapColumn {
  readonly key: string
  readonly label: string
  /** Fixed number of flaps. Full values remain available to assistive technology. */
  readonly characters: number
}

export interface SplitFlapRow {
  readonly id: string
  readonly cells: Readonly<Record<string, string | undefined>>
  readonly tone?: 'neutral' | 'accent' | 'warning'
}

export interface SplitFlapBoardProps {
  readonly label: string
  readonly columns: readonly SplitFlapColumn[]
  readonly rows: readonly SplitFlapRow[]
  readonly emptyMessage?: string
  readonly loading?: boolean
  readonly loadingMessage?: string
  readonly loadingRows?: number
  readonly onSelectRow?: (id: string) => void
  readonly selectedRowId?: string
  readonly selectionColumn?: string
}

function flapCount(characters: number): number {
  return Math.max(1, Math.min(40, Math.floor(characters) || 1))
}

/** Keep the message in the widest display column, wrapping without losing localized text. */
function emptyBoardRows(message: string, columns: readonly SplitFlapColumn[]): readonly SplitFlapRow[] {
  const column = columns.reduce<SplitFlapColumn | undefined>((widest, next) =>
    !widest || flapCount(next.characters) > flapCount(widest.characters) ? next : widest, undefined)
  if (!column) return []
  const width = flapCount(column.characters)
  const lines: string[] = []
  let line: string[] = []
  for (const word of message.toLocaleUpperCase().trim().split(/\s+/u)) {
    const letters = Array.from(word)
    if (line.length && line.length + 1 + letters.length > width) {
      lines.push(line.join(''))
      line = []
    }
    while (letters.length > width) lines.push(letters.splice(0, width).join(''))
    if (line.length && letters.length) line.push(' ')
    line.push(...letters)
  }
  if (line.length) lines.push(line.join(''))
  return lines.map((text, index) => ({ id: `empty-${index}`, cells: { [column.key]: text } }))
}

function FlapText({ value, characters, offset = 0 }: { value: string; characters: number; offset?: number }) {
  const count = flapCount(characters)
  const letters = Array.from(value.toLocaleUpperCase())
  const visible = letters.length > count ? [...letters.slice(0, count - 1), '…'] : letters
  return <span className="ms-flap-text" title={value}>
    <span className="ms-board-sr-only">{value}</span>
    <span className="ms-flap-text__tiles" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const character = visible[index] ?? ' '
        const phase = index + offset
        return <span className="ms-flap" key={`${index}:${character}`} style={{
          '--flap-delay': `${Math.min(phase * 18, 360)}ms`,
          '--flap-phase': `${-(phase % 8) * 240}ms`,
          '--flap-motion-phase': `${-((phase * 37) % 240)}ms`,
        } as CSSProperties}>
          <span className="ms-flap__face">
            {character === ' ' ? '\u00a0' : character}
            <span className="ms-flap__drum" />
          </span>
        </span>
      })}
    </span>
  </span>
}

/** Transport-neutral display: consumers own ordering, time formatting and data provenance. */
export function SplitFlapBoard({ label, columns, rows, emptyMessage = 'No movements in this window.', loading = false, loadingMessage = 'Loading movements…', loadingRows = 5, onSelectRow, selectedRowId, selectionColumn }: SplitFlapBoardProps) {
  const hintId = useId()
  const empty = !loading && rows.length === 0
  const displayedRows: readonly SplitFlapRow[] = loading
    ? Array.from({ length: Number.isFinite(loadingRows) ? Math.max(1, Math.min(20, Math.floor(loadingRows))) : 5 }, (_, index) => ({ id: `loading-${index}`, cells: {} }))
    : empty ? emptyBoardRows(emptyMessage, columns) : rows
  return <div className="ms-split-flap-board" data-loading={loading || undefined} data-empty={empty || undefined}>
    <span className="ms-board-sr-only" id={hintId}>Scroll horizontally to read all columns.</span>
    <div className="ms-split-flap-board__scroll" role="region" aria-label={label} aria-describedby={hintId} aria-busy={loading} tabIndex={0}>
      <table className="ms-split-flap-board__table">
        <caption className="ms-board-sr-only">{label}</caption>
        <thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead>
        <tbody aria-hidden={loading || empty || undefined}>{displayedRows.map((row, rowIndex) => <tr key={row.id} data-tone={row.tone ?? 'neutral'} data-selected={!loading && !empty && row.id === selectedRowId || undefined}>
          {columns.map((column, index) => {
            const text = <FlapText value={loading ? ' ' : row.cells[column.key] || (empty ? ' ' : '—')} characters={column.characters} offset={rowIndex * 3 + index * 2} />
            return <td key={column.key}>{!loading && !empty && onSelectRow && (selectionColumn ? column.key === selectionColumn : index === 0)
              ? <button className="ms-split-flap-board__select" type="button" aria-pressed={row.id === selectedRowId} onClick={() => onSelectRow(row.id)}>{text}</button>
              : text}</td>
          })}
        </tr>)}</tbody>
      </table>
    </div>
    {loading ? <p className="ms-split-flap-board__loading" role="status">{loadingMessage}</p>
      : empty && <span className="ms-board-sr-only" role="status">{emptyMessage}</span>}
  </div>
}
