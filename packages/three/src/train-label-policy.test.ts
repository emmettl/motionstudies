import { describe, expect, it } from 'vitest'
import { MAX_TRAIN_LABELS, styledTrainLabelBudget, styledTrainLabelScreenHeight, trainLabelBudget, trainLabelScreenHeight } from './train-labels.ts'

describe('train label style policies', () => {
  it('preserves defaults across modes, heights and viewport widths', () => {
    for (const mode of ['off', 'auto', 'on'] as const) for (const height of [3, 22, 30, 42]) for (const width of [390, 1440]) {
      expect(styledTrainLabelBudget(undefined, height, width, mode)).toBe(trainLabelBudget(height, mode))
      for (const selected of [false, true]) expect(styledTrainLabelScreenHeight(undefined, width, selected, height)).toBe(trainLabelScreenHeight(width, selected, height))
    }
  })
  it('passes semantic height, viewport and mode to density policies without overriding off or pool bounds', () => {
    const calls: unknown[] = []
    const style = { budget: (...args: [number, number, 'auto' | 'on' | 'off']) => { calls.push(args); return 3 } }
    expect(styledTrainLabelBudget(style, 3, 390, 'auto')).toBe(3)
    expect(calls).toEqual([[3, 390, 'auto']])
    expect(styledTrainLabelBudget(style, 3, 390, 'off')).toBe(0)
    expect(calls).toHaveLength(1)
    expect(styledTrainLabelBudget({ budget: () => 1000 }, 3, 390, 'on')).toBe(MAX_TRAIN_LABELS)
    expect(styledTrainLabelBudget({ budget: () => -1 }, 3, 390, 'auto')).toBe(0)
  })
  it('lets sizing policies retain focused-label and viewport behaviour', () => {
    const style = { screenHeight: (width: number, selected: boolean, height: number) => selected ? 52 : width / 100 + height }
    expect(styledTrainLabelScreenHeight(style, 390, false, 3)).toBe(6.9)
    expect(styledTrainLabelScreenHeight(style, 1440, true, 30)).toBe(52)
  })
})
