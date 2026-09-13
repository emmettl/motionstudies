import { describe, expect, it } from 'vitest'
import type { NetworkTrain, TrainPosition } from './network.ts'
function positionForTrain(
  train: NetworkTrain,
  time: number,
): TrainPosition | undefined {
  if (
    train.realtime?.status === 'cancelled' ||
    time < train.start ||
    time > train.end ||
    train.stops.length < 2
  ) {
    return undefined
  }

  for (let index = 1; index < train.stops.length; index += 1) {
    const previous = train.stops[index - 1]
    const next = train.stops[index]
    if (time <= previous[2]) {
      return { fromStop: previous[0], toStop: previous[0], progress: 0 }
    }
    if (time <= next[1]) {
      const duration = Math.max(1, next[1] - previous[2])
      return {
        fromStop: previous[0],
        toStop: next[0],
        progress: Math.min(1, Math.max(0, (time - previous[2]) / duration)),
        segmentIndex: index - 1,
      }
    }
    if (time <= next[2]) {
      return { fromStop: next[0], toStop: next[0], progress: 0 }
    }
  }

  const last = train.stops.at(-1)!
  return { fromStop: last[0], toStop: last[0], progress: 0 }
}


import { positionForTrain as indexedPositionForTrain } from './network.ts'

const train: NetworkTrain = {
  id: 'test', route: '26', category: 'bus', headsign: 'Test', shortName: '26', start: 0, end: 100,
  stops: [[0, 0, 5], [1, 20, 25], [2, 25, 25], [3, 50, 60], [4, 80, 90]],
}

describe('indexed vehicle motion', () => {
  it('matches the published interpolation at every boundary, both scrub directions, and after the final stop', () => {
    const times = [NaN, Infinity, -Infinity, -1, 0, 1, 5, 5.001, 19.999, 20, 20.001, 25, 25.001, 50, 60, 80, 90, 95, 100, 101]
    for (const time of [...times, ...[...times].reverse()]) {
      expect(indexedPositionForTrain(train, time)).toEqual(positionForTrain(train, time))
    }
  })
  it('retains cancelled, incomplete and unordered observation semantics', () => {
    const variants: NetworkTrain[] = [
      { ...train, realtime: { status: 'cancelled', delaySeconds: 0, skippedStops: 0, generatedAt: '' } },
      { ...train, stops: [train.stops[0]] },
      { ...train, stops: [[0, 0, 5], [1, 20, 30], [2, 25, 26], [3, 50, 60]] },
    ]
    for (const variant of variants) for (let time = -1; time < 102; time += 0.5) {
      expect(indexedPositionForTrain(variant, time)).toEqual(positionForTrain(variant, time))
    }
  })
  it('matches long routes at fractional playback times without rescanning prior stops', () => {
    const long: NetworkTrain = { ...train, end: 10000,
      stops: Array.from({ length: 150 }, (_, i) => [i, i * 60, i * 60 + (i % 3) * 5]),
    }
    for (let time = 0; time < 10000; time += 7.37) {
      expect(indexedPositionForTrain(long, time)).toEqual(positionForTrain(long, time))
    }
  })
})
