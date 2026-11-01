/** Fixed host conditions used by the component audit; widths include the host's 16px margins. */
export const auditHosts = [
  { id: 'bare', host: 'bare', width: 760, text: 100 },
  { id: 'light', host: 'light', width: 760, text: 100 },
  { id: 'narrow', host: 'bare', width: 312, text: 100 },
  { id: 'constrained', host: 'constrained', width: 760, text: 100 },
  { id: 'large-text', host: 'serif', width: 352, text: 200 },
] as const
export const auditPresentations = [
  { id: 'rail-sbb', study: 'transport-heroes', values: { transport: 'rail', presentation: 'sbb', long: true, lines: '6' } },
  { id: 'bus-matrix', study: 'transport-heroes', values: { transport: 'bus', presentation: 'dot-matrix', long: true } },
  { id: 'bus-flap', study: 'transport-heroes', values: { transport: 'bus', presentation: 'split-flap', long: true } },
  { id: 'airport-hero', study: 'transport-heroes', values: { transport: 'airport', long: true } },
  ...['uk-bus', 'uk-rail', 'yellow-bus'].map(presentation => ({ id: `vehicle-${presentation}`, study: 'vehicle-heroes', values: { presentation, long: true } })),
] as const
