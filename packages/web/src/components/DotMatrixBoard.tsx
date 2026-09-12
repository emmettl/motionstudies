import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import type { SplitFlapBoardProps, SplitFlapColumn, SplitFlapRow } from './SplitFlapBoard.tsx'
import { matrixPath } from './dot-matrix-font.ts'

export interface DotMatrixColumn extends SplitFlapColumn {
  /** Space reserved before distributing the remaining width by `characters`. */
  readonly minCharacters?: number
  readonly align?: 'left' | 'right'
}

export interface DotMatrixRow extends SplitFlapRow {
  /** Optional detail line; also included in the accessible departure description. */
  readonly note?: string
}

export interface DotMatrixBoardProps extends Omit<SplitFlapBoardProps, 'columns' | 'rows' | 'loadingRows'> {
  readonly columns: readonly DotMatrixColumn[]
  readonly rows: readonly DotMatrixRow[]
  readonly variant?: 'bus' | 'uk-rail'
  /** Optional matrix heading spanning the first `headingColumnSpan` columns. */
  readonly heading?: string
  readonly headingColumnSpan?: number
  readonly footerLabel?: string
  /** Consumer-formatted clock, updated by the consumer; never inferred as live. */
  readonly clockLabel?: string
  /** Fixed display slots, or fit as many rows as possible into the board height. */
  readonly lineCount?: number | 'auto'
  /** Target minimum row height in auto mode, in CSS pixels. Default 34. */
  readonly minRowHeight?: number
  readonly className?: string
  /** Set height here, or through CSS, to fit a panel. Default height is 320px. */
  readonly style?: CSSProperties
}

function bounded(value: number, fallback: number, min: number, max: number) {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value))) : fallback
}

function MatrixText({ value, characters, align = 'left', preserveCase = false }: { value: string; characters: number; align?: 'left' | 'right'; preserveCase?: boolean }) {
  const patternId = useId()
  const letters = Array.from(preserveCase ? value : value.toLocaleUpperCase())
  const visible = letters.length > characters ? [...letters.slice(0, characters - 1), '…'] : letters
  const text = visible.join('')
  const path = matrixPath(text)
  const offset = align === 'right' ? (characters - visible.length) * 6 : 0
  return <span className="ms-matrix-text" title={value}>
    <span className="ms-matrix-sr-only">{value}</span>
    <svg aria-hidden="true" viewBox={`0 0 ${characters * 6} 7`} preserveAspectRatio={align === 'right' ? 'xMaxYMid meet' : 'xMinYMid meet'}>
      <defs><pattern id={patternId} width="1" height="1" patternUnits="userSpaceOnUse"><circle cx=".5" cy=".5" r=".36" /></pattern></defs>
      <rect width="100%" height="7" fill={`url(#${patternId})`} className="ms-matrix-text__unlit" />
      {path === undefined
        ? <text x={align === 'right' ? characters * 6 : 0} y="6.2" textAnchor={align === 'right' ? 'end' : 'start'} fontSize="7" fontFamily="ui-monospace, monospace" textLength={Math.max(1, visible.length * 6 - 1)} lengthAdjust="spacingAndGlyphs" fill="currentColor">{text}</text>
        : <path transform={`translate(${offset},0)`} d={path} fill="currentColor" />}
    </svg>
  </span>
}

/** The consumer owns row order, arrival estimates and freshness, as with SplitFlapBoard. */
export function DotMatrixBoard({ label, columns, rows, lineCount = 6, minRowHeight = 34,
  loading = false, loadingMessage = 'Loading departures…', emptyMessage = 'No departures.',
  onSelectRow, selectedRowId, selectionColumn, className = '', style,
  variant = 'bus', heading, headingColumnSpan = 1, footerLabel, clockLabel }: DotMatrixBoardProps) {
  const screen = useRef<HTMLDivElement>(null)
  const boardId = useId()
  const [size, setSize] = useState({ width: 640, height: 244 })
  useEffect(() => {
    const element = screen.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width)
      const height = Math.floor(entry.contentRect.height)
      setSize((previous) => previous.width === width && previous.height === height ? previous : { width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const count = lineCount === 'auto'
    ? bounded(size.height / bounded(minRowHeight, 34, 20, 120), 6, 1, 30)
    : bounded(lineCount, 6, 1, 30)
  const rowHeight = size.height / count
  const weights = columns.map((column) => bounded(column.characters, 12, 1, 80))
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const characterWidth = Math.min(15, Math.max(7, rowHeight * .45),
    Math.max(9, (size.width - columns.length * 16) / Math.max(1, totalWeight)))
  const minimums = columns.map((column) => bounded(column.minCharacters ?? 3, 3, 1, 40) * characterWidth + 16)
  const totalMinimum = minimums.reduce((sum, width) => sum + width, 0)
  const widths = columns.map((_, index) => size.width < totalMinimum
    ? size.width * minimums[index] / totalMinimum
    : minimums[index] + (size.width - totalMinimum) * weights[index] / totalWeight)
  const empty = !loading && rows.length === 0
  const message = loading ? loadingMessage : empty ? emptyMessage : ''
  const rail = variant === 'uk-rail'
  const span = bounded(headingColumnSpan, 1, 1, Math.max(1, columns.length))
  const capacity = (width: number) => bounded((width - 16) / characterWidth, 1, 1, 80)
  const slots: { row?: DotMatrixRow; detail?: boolean }[] = []
  if (!loading && !empty) {
    for (const row of rows) {
      if (slots.length >= count) break
      // Keep a departure and its detail together unless the board has only one slot.
      if (row.note && count > 1 && slots.length === count - 1) break
      slots.push({ row })
      if (row.note && slots.length < count) slots.push({ row, detail: true })
    }
  }
  while (slots.length < count) slots.push({})
  return <div className={`ms-dot-matrix-board ${className}`} style={{ ...style, '--matrix-text-height': `${Math.max(0, Math.min(26, rowHeight - 8))}px` } as CSSProperties} data-variant={variant} data-lines={count} data-loading={loading || undefined}>
    <div className="ms-dot-matrix-board__head" aria-hidden="true">{columns.map((column, index) => {
      if (heading && index > 0 && index < span) return null
      const width = heading && index === 0 ? widths.slice(0, span).reduce((sum, value) => sum + value, 0) : widths[index]
      const value = heading && index === 0 ? heading : column.label
      return <span className={heading && index === 0 ? 'ms-dot-matrix-board__heading' : undefined} key={column.key} style={{ width: `${size.width ? width / size.width * 100 : 0}%`, textAlign: column.align }}>
        {rail ? <MatrixText value={value} characters={capacity(width)} align={column.align} preserveCase /> : value}
      </span>
    })}</div>
    <div className="ms-dot-matrix-board__screen" ref={screen}>
      <table aria-busy={loading}>
        <caption className="ms-matrix-sr-only">{label}</caption>
        <colgroup>{columns.map((column, index) => <col key={column.key} style={{ width: `${size.width ? widths[index] / size.width * 100 : 0}%` }} />)}</colgroup>
        <thead className="ms-matrix-sr-only"><tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead>
        <tbody>{slots.map(({ row, detail }, index) => {
          const noteId = `${boardId}-note-${index}`
          if (detail && row) return <tr key={`${row.id}-detail`} className="ms-dot-matrix-board__detail" aria-hidden="true" style={{ height: `${100 / count}%` }}>
            <td colSpan={columns.length}><MatrixText value={row.note!} characters={capacity(size.width)} preserveCase={rail} /></td>
          </tr>
          return <tr key={row?.id ?? `blank-${index}`} aria-hidden={!row || undefined} data-tone={row?.tone} data-selected={row && row.id === selectedRowId || undefined} style={{ height: `${100 / count}%` }}>
            {columns.map((column, columnIndex) => {
              const text = <MatrixText value={row ? row.cells[column.key] || '—' : ''} characters={capacity(widths[columnIndex])} align={column.align} preserveCase={rail} />
              const selection = selectionColumn ? column.key === selectionColumn : columnIndex === 0
              return <td key={column.key}>{row && onSelectRow && selection
                ? <button type="button" aria-pressed={row.id === selectedRowId} aria-describedby={row.note ? noteId : undefined} onClick={() => onSelectRow(row.id)}>{text}</button> : text}
                {row?.note && selection && <span className="ms-matrix-sr-only" id={noteId}>{row.note}</span>}
              </td>
            })}
          </tr>
        })}</tbody>
      </table>
      {message && <div className="ms-dot-matrix-board__message" role="status">{message}</div>}
    </div>
    {(footerLabel || clockLabel) && <div className="ms-dot-matrix-board__footer">
      {footerLabel && <MatrixText value={footerLabel} characters={capacity(size.width * .6)} preserveCase={rail} />}
      {clockLabel && <div className="ms-dot-matrix-board__clock"><MatrixText value={clockLabel} characters={Math.max(1, Array.from(clockLabel).length)} align="right" preserveCase={rail} /></div>}
    </div>}
  </div>
}
