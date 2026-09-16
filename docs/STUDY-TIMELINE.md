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

## Visible scrubber · alpha.23

England contributes the broad rail and round grab handle used by both its recorded bus and power clocks. `StudyTimeline` now uses the same `TimelineScrubber` underneath its activity chart. Plain clocks can import `@motionstudies/web/components/TimelineScrubber` and `@motionstudies/web/timeline-scrubber.css` without inventing an activity series:

```tsx
<TimelineScrubber windowStart={start} windowEnd={end} time={time}
  step={1} onSeek={seek} ariaLabel="Explore the recording"
  ariaValueText={formattedTime} />
```

The rail is 8px high, the visible handle 20px across and the native grab target 44×44px, including on mobile. The entire chart or plain rail also accepts touch seeking. The chart and thumb share 22px end insets. A pointer drag completes even when released outside the control; keyboard and touch retain native range behavior. Both epoch seconds and relative/service seconds work, provided all inputs use the same units. Each control has a unique generated input ID.

Colors inherit the timeline accent; plain clocks may also override `--ms-timeline-track`, `--ms-timeline-track-border` and `--ms-timeline-halo`. The default plain scrubber uses England's pale green accent. Playback buttons, clock readout, date/timezone formatting, capture coverage and play/pause policy stay with the edition. This shares the instrument across full-screen maps without imposing one study's temporal interpretation on another.

The plain scrubber preserves the caller’s clock precision; `step` governs native seeking, not playback updates. This matters for clocks such as GLEISLICHT Now, which advance every second even when manual seeking uses ten-second steps.

## Density-sensitive bars · design reference

Zugunruhe Seasons contributes another presentation reference: its passage score varies each night's bar height and opacity together. `drawScore` in `zugunruhe/src/season.js` uses `sqrt(min(meanDensity / densityCap, 1))` for normalized height and opacity `0.18 + 0.6 × normalizedDensity`, beneath a canvas-wide opacity of 0.8. Small gaps keep individual nights legible; unavailable nights receive a separate grey baseline mark. Its altitude calendar uses the same square-root scale for light within each night/altitude cell, with coverage marks distinguishing measured zero from missing observations.

For the shared activity chart, consider an optional value-dependent bar-opacity treatment alongside the existing uniform bars and line. This is a proposed extension, not part of alpha.23. Keep linear bar height as the default quantitative scale; adopting Seasons' square-root height mapping would be a separate, explicitly labelled scale choice. Use a fixed maximum when comparing dates or places so equal values retain equal visual weight. Brightness should encode the stated activity measure, not imply confidence or completeness; missing observations need their own treatment and exact values remain available in the readout.

Bar appearance must remain independent of interaction geometry: even a faint or narrow bar sits within the continuous chart seek surface and the shared 44×44px grab target. Editions retain their palette. The effect belongs in `StudyTimeline` presentation; `TimelineScrubber` continues to work without activity data, and the original observation values remain unchanged.

### Thin track option · unreleased

Seasons also contributes its fine track as a presentation option. Set `--ms-timeline-track-height: 1px` on an edition container for that treatment, or choose an intermediate thickness such as `3px`. Omit the variable to retain England's broad 8px rail. This option applies to both `TimelineScrubber` and `StudyTimeline`; the rail remains centred beneath the same 20px visible handle, and the native 44×44px grab target and chart seek surface are unchanged. The lab's Thin track toggle exercises both treatments. This addition is not yet published in alpha.23.
