# @motionstudies/web

Browser controls, React widgets, progressive loaders and study styles. ESM with TypeScript declarations. React and React DOM ^19.3.0 are peer dependencies.

```sh
npm install --save-exact @motionstudies/web@1.0.1 react@19.3.1 react-dom@19.3.1
```

```ts
import { observeLayout } from '@motionstudies/web/observe-layout'

const dispose = observeLayout([document.documentElement], () => {
  // Measure your layout and update edition-owned presentation.
})
// Before removing observed elements:
dispose()
```

## Included contracts

- Controlled timelines, pickers, airport/rail/bus/vehicle cards and deferred button help.
- Progressive network, repeated-pattern, air and road loading; JSON assets and observed operations.
- Now clock, browser location, recording, theme application and mounting.

Import styles explicitly from exported subpaths: `tokens.css`, `study-layout.css`, `study-timeline.css`, `timeline-scrubber.css` or the corresponding widget stylesheet. `shell.css` is an optional full-page shell scoped to `.motion-study`. `fonts.css` supplies self-hosted Inter and DM Mono with their SIL OFL licences.

Keep resolvers and loader options stable. Consumers own playback, service-time mapping, loading presentation and accepted snapshots. Cancel/dispose observers and other owned resources on replacement or unmount; optional loading should preserve a usable scene.

## Imports and compatibility

Use explicit extensionless subpaths; there is no root barrel import. The package's `exports` map lists supported entry points. The four runtime packages share exact version 1.0.1; upgrade them together where used. Published public exports and documented behaviour follow semantic versioning from 1.0. Internal files are not an API. Editions adopt releases explicitly with their own checks.

See [the complete package contracts](https://github.com/emmettl/motionstudies/blob/main/packages/README.md), [release instructions](https://github.com/emmettl/motionstudies/blob/main/docs/RELEASING.md) and [the widget lab](https://motionstudies.app/lab/). Node 26 and npm 12 are the repository's development target; browser modules require a modern ESM build pipeline.

MIT. [Source and issues](https://github.com/emmettl/motionstudies).

Version 1.0.1 preserves pending and visible keyboard help when an unrelated element leaves the pointer during scene/layout changes. Pointer exits from controls and the tooltip retain their existing dismissal behaviour.
