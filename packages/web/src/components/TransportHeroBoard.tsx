import type { ReactNode } from 'react'
import { DotMatrixBoard, type DotMatrixBoardProps } from './DotMatrixBoard.tsx'
import { SplitFlapBoard } from './SplitFlapBoard.tsx'

/** Shared display options; each transport card supplies its own identity and columns. */
export interface TransportHeroOptions {
  readonly presentation?: 'dot-matrix' | 'uk-rail' | 'split-flap'
  readonly lineCount?: number | 'auto'
  readonly boardHeight?: number
  readonly minRowHeight?: number
  readonly clockLabel?: string
  readonly footerLabel?: string
  /** Source/freshness explanation owned by the consumer. */
  readonly note: ReactNode
  readonly loading?: boolean
  readonly error?: string
  readonly onRetry?: () => void
  readonly className?: string
}

interface TransportHeroBoardProps extends Omit<DotMatrixBoardProps, 'style' | 'className'> {
  readonly presentation: NonNullable<TransportHeroOptions['presentation']>
  readonly boardHeight: number
  readonly error?: string
  readonly onRetry?: () => void
  readonly retryLabel: string
  readonly detailLabel: string
}

/** Internal adapter: error handling and presentation switching shared by rail and bus. */
export function TransportHeroBoard({ presentation, boardHeight, error, onRetry, retryLabel, detailLabel, ...board }: TransportHeroBoardProps) {
  const height = Number.isFinite(boardHeight) ? Math.max(140, boardHeight) : 360
  if (error) return <div className="ms-transport-hero__error" role="status">{error}{onRetry && <button type="button" onClick={onRetry}>{retryLabel}</button>}</div>
  if (presentation !== 'split-flap') return <DotMatrixBoard {...board} variant={presentation === 'uk-rail' ? 'uk-rail' : 'bus'} style={{ height }} />
  const count = board.lineCount === 'auto' ? Math.floor((height - 60) / (board.minRowHeight ?? 34)) : board.lineCount ?? 6
  const limit = Number.isFinite(count) ? Math.max(1, Math.min(30, Math.floor(count))) : 6
  const hasDetails = board.rows.some((row) => row.note)
  return <div className="ms-transport-hero__flap" style={{ height }}>
    <SplitFlapBoard {...board} columns={hasDetails ? [...board.columns, { key: '__detail', label: detailLabel, characters: 32 }] : board.columns}
      rows={board.rows.slice(0, limit).map((row) => ({ ...row, cells: { ...row.cells, __detail: row.note } }))} loadingRows={limit} />
    {(board.footerLabel || board.clockLabel) && <div className="ms-transport-hero__flap-footer"><span>{board.footerLabel}</span><span>{board.clockLabel}</span></div>}
  </div>
}
