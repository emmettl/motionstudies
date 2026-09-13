import { describe, expect, it } from 'vitest'
import { SERVICE_COLORS } from '@motionstudies/core/theme'
import { FLAT_NETWORK_MAP_STYLE, networkRouteColor, trainLabelCollisionBox } from './scene-style.ts'

describe('network palette', () => {
  it('falls back by category and keeps route identity independent', () => {
    const palette = { bus: '#ffcc00', other: undefined }
    expect(networkRouteColor('bus', '220', undefined, 1, palette)).toBe('#ffcc00')
    expect(networkRouteColor('other', 'A', undefined, 1, palette)).toBe(SERVICE_COLORS.other)
    expect(networkRouteColor('bus', '220', { '220': '#0000ff' }, 0, palette)).toBe('#ffcc00')
    expect(networkRouteColor('bus', '220', { '220': '#0000ff' }, 1, palette)).toBe('#0000ff')
    expect(networkRouteColor('bus', '220', { 'category:bus': '#ff0000' }, 1)).toBe(SERVICE_COLORS.bus)
  })
  it('clamps the route blend and mixes colours in linear space', () => {
    const palette = { bus: '#000000' }, routes = { '220': '#ffffff' }
    expect(networkRouteColor('bus', '220', routes, -1, palette)).toBe('#000000')
    expect(networkRouteColor('bus', '220', routes, 0.5, palette)).toBe('#bcbcbc')
    expect(networkRouteColor('bus', '220', routes, 2, palette)).toBe('#ffffff')
  })
})

it('keeps centred and raised label collision bounds aligned with their sprite anchors', () => {
  expect(trainLabelCollisionBox(100, 100, 40, 20, 0.5)).toEqual({ left: 80, right: 120, top: 90, bottom: 110 })
  expect(trainLabelCollisionBox(100, 100, 40, 20, FLAT_NETWORK_MAP_STYLE.trainLabels!.anchorY!))
    .toEqual({ left: 80, right: 120, top: 74, bottom: 94 })
})

it('keeps road defaults unless an explicit static or state-dependent style overrides them', async () => {
  const { roadStrokeOpacity } = await import('./scene-style.ts')
  expect(roadStrokeOpacity(undefined, 0.062, false, false)).toBe(0.062)
  expect(roadStrokeOpacity({ opacity: 0 }, 0.062, false, false)).toBe(0)
  const style = { opacity: ({ subdued, selected }: { subdued: boolean; selected: boolean }) => selected ? 0.25 : subdued ? 0.2 : 0.45 }
  expect(roadStrokeOpacity(style, 0.062, false, false)).toBe(0.45)
  expect(roadStrokeOpacity(style, 0.062, true, false)).toBe(0.2)
  expect(roadStrokeOpacity(style, 0.062, true, true)).toBe(0.25)
})
