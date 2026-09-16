# Shared study timeline

The activity chart and time scrubber are one instrument: the chart, playhead, tick labels and input share a time window. LUFT first consumes it in alpha.22. GLEISLICHT supplies the map-first layout reference; adoption by other editions is separate.

## Package boundary

- `@motionstudies/core/timeline`: interval types, validation, normalized chart geometry, binary-search lookup, time/position conversion and service-time formatting. No React, browser, aircraft or date assumptions.
- `@motionstudies/web/components/StudyTimeline` and `@motionstudies/web/study-timeline.css`: controlled React chart, native keyboard/touch range input, readout, explicit scale and optional scrubbing lifecycle callbacks.

```tsx
import { StudyTimeline } from '@motionstudies/web/components/StudyTimeline'
import '@motionstudies/web/study-timeline.css'

<StudyTimeline
  bins={[{ start: 0, end: 300, value: 12 }, { start: 300, end: 600, value: null }]}
  windowStart={0} windowEnd={86400} time={time} onSeek={seek}
  label="Observed aircraft · five-minute snapshots" ariaLabel="Time of day UTC"
  description="The complete study window; gaps mean missing observations."
  formatValue={n => `${n} aircraft`} variant="line"
/>
```

Bins use explicit, half-open intervals in the same units as the clock. They may be unsorted on input, must not overlap and are clipped to the displayed window. Values are non-negative or `null`. Missing intervals and explicit nulls break lines; measured zero remains zero. At the exclusive end of the window, there is no observation. Consumers decide whether seeking there clamps or wraps.

The default vertical scale uses the greatest visible value and is printed beside the chart. Set `maximum` to hold it fixed across comparisons. Values above a supplied maximum clip at the top. The line joins interval midpoints and should be understood as an activity overview, not additional observations. There is no synthetic smoothing or gap filling. Use interval widths that correctly describe the evidence; for sampled data, disclose the sampling interval.

`formatTime` and `formatValue` provide labels; the default time formatter preserves `24:00` and service times beyond midnight. It does not infer a timezone. `missingLabel`, `emptyLabel` and `scaleLabel` support translated copy. `onScrubStart` and `onScrubEnd` let a consumer pause or resume, but the component never owns a clock, loop, fetch, filter or playback state.

## Interaction and theme

The entire chart is a seek target. A native range input supplies keyboard and touch behavior. The visible chart leaves half the thumb width at each edge so its axis and the range travel align. Hover inspection is separate from the selected time. Focus remains visible; scrubbing has a minimum 44px touch height. Consumers supply an accessible `ariaLabel`; the input exposes the formatted time and observation via `aria-valuetext`.

Override `--ms-timeline-ink`, `--ms-timeline-muted`, `--ms-timeline-accent`, `--ms-timeline-chart` and `--ms-timeline-height` on a containing element. Importing the component does not install its stylesheet globally; the stylesheet only targets namespaced classes.

The lab exercises bars, line, zero, missing intervals, empty data, disabled controls and a 20:00–28:00 service window. Core tests check clipping, fixed scales and gap semantics; browser checks cover keyboard endpoints, mouse drag, touch seeking and responsive width. The packed-consumer check compiles the lab against published-shape exports.
