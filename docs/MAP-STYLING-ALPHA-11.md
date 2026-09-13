# Shared map styling — alpha.11

`0.1.0-alpha.11` introduces `NationalNetworkScene.mapStyle` and the public `@motionstudies/three/scene-style` entry point. All four packages retain a coordinated release version.

## Style options

```tsx
import { FLAT_NETWORK_MAP_STYLE, type NetworkMapStyle } from '@motionstudies/three/scene-style'

const style: NetworkMapStyle = {
  ...FLAT_NETWORK_MAP_STYLE,
  categoryColors: { bus: '#ffcc00' },
  trainLabels: {
    ...FLAT_NETWORK_MAP_STYLE.trainLabels,
    routeTextCategories: ['metro'],
  },
}

<NationalNetworkScene {...sceneProps} mapStyle={style} />
```

Keep styles stable outside the component or memoize them. Replace the style or palette object to update it; replacing styles invalidates paused label work, and the shared vehicle/trail palette updates both rendering paths.

- `surface: 'flat'` deduplicates exact rail and flow segments, preserves their strongest colours, and fixes compositing order and depth behaviour. Trails retain their additive glow. Omission keeps the existing luminous surface.
- `categoryColors` overrides category colours independently of `routeColors`. Vehicle points, trails, label halos and selections use the palette. Route identity still blends from the category colour according to `routeColorMix`; no artificial route entries or extra route meshes are needed.
- `trainLabels` controls elevation, vertical sprite anchor, collision width, station avoidance, selected-label order and optional route-coloured text. Comparison labels retain centred anchors.
- `FLAT_NETWORK_MAP_STYLE` combines flat surfaces with the label placement previously duplicated in London and Paris. Station boxes are published before train layout, scoped to each camera, and cleared when stations are hidden. Label textures include their resolved colours in the cache key, so colour changes cannot reuse stale textures.

The public `networkRouteColor` and `trainLabelCollisionBox` helpers let edition integrations follow the same palette and anchor calculations.

## Edition migration

All Change and Correspondances remove their entire cartography renderer plugins. London also removes its route-text colour rewrites; Paris removes its colour-cache rewrite. Both use the flat preset, with London's metro text policy supplied as an option.

Gleislicht removes its entire PostBus colour plugin. PostBus yellow and cogwheel cream are proper category palettes, replacing magic `category:bus` and `category:other` route keys. Its picking adapter still supplies Swiss pixel-gap and comparison stacking, and its surface adapter retains Swiss ground elevations.

The remaining adapters handle edition-specific geometry, glyphs, picking, road baselines, airport integration and layout/zoom policy. General UI CSS, station typography and Swiss surface heights are not migrated in this release.

## Verification and transfer cost

Palette fallback/blending and label-anchor bounds have unit coverage. A packed consumer imports and typechecks the API, switches palettes and surfaces on an already paused map, and observes actual material, geometry and sprite changes in Chromium and iPhone WebKit. Edition tests cover station caches, collision budgets, picking and PostBus operation. Desktop/phone geography, layout and selection captures were compared with alpha.10; map appearance is retained, apart from normal clock/pulse and asynchronous panel-loading differences.

The Swiss renderer grows by less than 1 KiB gzip. Its separate JavaScript (360 KiB), CSS (10 KiB) and data (450 KiB) ceilings are retained. The combined opening-load gate increases from 790 to 792 KiB to accommodate this API; this is a budget change, not a claimed payload reduction. London and Paris retain their existing budgets.

Publication and registry adoption are recorded below after verification.
