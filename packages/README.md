# Motion Studies packages

Shared packages for the Motion Studies transport instrument. The source workspace and compiled distributions expose the same explicit, extensionless module subpaths. The initial release is `0.1.0-alpha.0` under npm’s `next` tag.

- `@motionstudies/core`: transport contracts, indexing, interpolation and visual theme contracts; no browser or Node dependencies.
- `@motionstudies/three`: `NationalNetworkScene`, `HubPulseScene`, `StationFlowScene`, camera framing and label-mode contracts. React, React Three Fiber and Three.js are peers; rendering internals are not public subpaths.
- `@motionstudies/web`: picker, button tooltips, theme application, mounting, progressive loaders, observed operations and recording. Import `tokens.css` and `mobile-picker.css` for isolated widgets. `shell.css` is an optional full-page study shell scoped to `.motion-study`; `mountMotionStudy` applies that class. Fonts and edition layouts belong to consumers.
- `@motionstudies/data`: Node-only GTFS readers, network chunking, merging and station ranking. ZIP reading requires `unzip` on the host. Source selection, provenance overrides and compilation commands belong to each edition.

```tsx
import { MobilePicker } from '@motionstudies/web/components/MobilePicker'
import { createDataUrlResolver } from '@motionstudies/web/data-url'
import { useProgressiveNetworkDay } from '@motionstudies/web/use-progressive-network-day'
import '@motionstudies/web/tokens.css'
import '@motionstudies/web/mobile-picker.css'

const resolveData = createDataUrlResolver('/my-edition/data/')
// Inside a React component:
// const day = useProgressiveNetworkDay('day.json', enabled, time, resolveData)
```

Keep the resolver stable across renders. Manifest paths and their chunk paths are relative to the supplied asset root. Changing the resolved manifest URL resets the loader; disabling cancels requests, and re-enabling retries failures. Optional road manifests distinguish a 404 from an error. Observations poll serially; changing their endpoint drops the previous source's state, and disabling/unmounting cancels the request and timer.

Build release candidates with `npm run build:packages`. Distribution manifests and compiled ESM/declarations are written to `.package-dist/`; workspace manifests continue to point at source for fast local iteration. `npm run check:packed` packs and installs those distributions into a separate consumer, builds the lab and validates the public exports. No source aliases or workspace links are used in that consumer.

Source workspace manifests always stay private. `npm run check:release` builds public candidates, tests their packed consumer and records the tested tarball hashes; `npm run release:dry-run` inspects the publication without writing to npm. The manual main-branch `release.yml` workflow publishes those same tarballs with public access and provenance. See [release instructions](https://github.com/emmettl/motionstudies/blob/main/docs/RELEASING.md) for bootstrap-token and trusted-publisher setup. All four shared packages are MIT-licensed; each distribution includes `LICENSE`.

## Selection labels

`NationalNetworkScene` gives the selected station first label priority, followed by the selected route's terminal stops (including branches), then intermediate stops. Selected services use their own endpoints. Priority precedes retained labels and ordinary rank/tier admission; clearing selection restores edition ranking. This is built in for every consumer, including geographic and diagram layouts. Supply complete enabled infrastructure as `referenceSnapshot` to preserve endpoints through timetable gaps; its stop indexes need not match the active snapshot. See the [edition behaviour contract](https://github.com/emmettl/motionstudies/blob/main/docs/EDITIONS.md#selection-and-station-labels).

## Button help

`mountMotionStudy` installs one shared tooltip surface. Independent consumers such as the lab can render `ButtonTooltips` from `@motionstudies/web/components/ButtonTooltips` once instead. Put concise, action-oriented help in each button’s `data-tooltip`; icon buttons fall back to their `aria-label`. An empty `data-tooltip` opts out. Avoid native `title` attributes on these buttons, which can also appear during touch interaction.

Help appears after a short mouse hover or on keyboard focus when the primary pointer is fine and supports hover. Touch input suppresses it, including on hybrid devices. Escape, activation, scrolling and blur dismiss it. The tooltip stays inside the viewport, can itself be hovered, and temporarily extends `aria-describedby` without replacing existing descriptions. Copy and translations stay in the edition; rendering and input handling stay in this package. The Controls specimen and packed-consumer tests exercise this contract.
