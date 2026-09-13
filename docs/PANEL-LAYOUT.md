# Shared panel layout

Import `@motionstudies/web/study-layout.css`, put `ms-study-layout` on a positioned,
explicitly sized study container, and add `ms-study-panel` to selected-detail panels.
The stylesheet does not import the full-page shell or change global document styles.

Each edition supplies its surrounding control clearances through CSS properties:

```css
.my-study {
  --ms-layout-top: 210px;
  --ms-layout-bottom: 170px;
  --ms-layout-gutter: 16px;
  --ms-layout-end: 72px;
}
.my-airport { --ms-panel-width: 620px; }
```

Panel width and maximum height are calculated from the containing study, including
safe-area minimums. Content scrolls inside the available space. Editions can override
`--ms-panel-top`, `--ms-panel-bottom`, `--ms-panel-start`, `--ms-panel-end`, and
`--ms-layer-panel` for specific panels. Clearances remain edition-owned and can use
existing measured values, such as a playback container's height. Set
`data-ms-chrome="hidden"` on a containing element to hide panels and their focusable
contents together.

`ms-control`, `ms-control-group`, `ms-control-strip`, and `ms-panel-dismiss` provide
opt-in button geometry, focus indicators, wrapping or horizontally scrollable groups,
and a sticky dismiss control. Native button semantics still belong in the markup.
Control colour, border, radius and size use `--ms-control-*` properties; coarse pointer
devices receive 44px controls. Theme values are scoped to the study rather than global
document defaults.

`AirportHeroCard` accepts `density="compact"`. Its compact typography, spacing and
board rows now live alongside the component. The identity layout responds to card
width, and touch rows retain a 44px target. Omission preserves the original comfortable
presentation. Both densities keep the same study clock, direction controls and source
evidence.

The lab's Panel layout specimen checks resized containers, scrolling to evidence,
hidden chrome, density changes, keyboard focus and touch targets from packed packages.
Edition checks cover station, vehicle and airport panels at desktop and phone sizes.
