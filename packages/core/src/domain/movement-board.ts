/** All values use the study's time coordinate, in seconds (including times beyond midnight). */
export interface MovementBoardStudy {
  readonly time: number
  readonly windowStart: number
  readonly windowEnd: number
}

export interface MovementBoardHorizon {
  readonly lookBehindSeconds?: number
  readonly lookAheadSeconds?: number
}

export interface MovementBoardWindow {
  readonly start: number
  readonly end: number
}

/** Keep recent movements briefly, then show the next hour, clipped to the selected study. */
export function movementBoardWindow(
  study: MovementBoardStudy,
  { lookBehindSeconds = 600, lookAheadSeconds = 3600 }: MovementBoardHorizon = {},
): MovementBoardWindow | undefined {
  const { time, windowStart, windowEnd } = study
  if (![time, windowStart, windowEnd, lookBehindSeconds, lookAheadSeconds].every(Number.isFinite)
    || windowStart > windowEnd || time < windowStart || time > windowEnd
    || lookBehindSeconds < 0 || lookAheadSeconds < 0) return undefined
  return {
    start: Math.max(windowStart, time - lookBehindSeconds),
    end: Math.min(windowEnd, time + lookAheadSeconds),
  }
}

/** Unknown times cannot be placed in a time-windowed board. Never mutate the caller's rows. */
export function movementsForBoard<T extends { readonly id: string; readonly time?: number }>(
  movements: readonly T[],
  window: MovementBoardWindow | undefined,
  maxRows = 8,
): readonly T[] {
  if (!window || ![window.start, window.end, maxRows].every(Number.isFinite)
    || window.start > window.end || maxRows < 1) return []
  return movements
    .filter((entry) => entry.time !== undefined && Number.isFinite(entry.time)
      && entry.time >= window.start && entry.time <= window.end)
    .sort((first, second) => first.time! - second.time! || (first.id < second.id ? -1 : first.id > second.id ? 1 : 0))
    .slice(0, Math.floor(maxRows))
}
