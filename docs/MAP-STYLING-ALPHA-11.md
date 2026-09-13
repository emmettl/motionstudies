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

## Publication and adoption

All four packages were published under the npm `next` tag on 13 September 2026. [PR #5](https://github.com/emmettl/motionstudies/pull/5) merged as `99f4805`; [trusted publication](https://github.com/emmettl/motionstudies/actions/runs/34750255248) passed both verification and publication with npm provenance. Registry metadata and all four published versions were verified before adoption.

| Edition | Adoption on main | Local verification |
| --- | --- | --- |
| All Change | `ac6f3a2` | 280 unit tests; 10 Chromium/WebKit renderer and airport checks; build, lint, registry boundaries and budgets |
| Correspondances | `8b81371` | 25 unit tests; 12 Chromium/WebKit station-label, renderer and airport checks; build, lint, registry boundaries and budgets |
| Gleislicht | `4f49ee0` | 1,410 unit tests; 10 final Chromium/WebKit worker, paused geometry, picking and PostBus cases; build, lint, registry boundaries and budgets |

Shared verification passed 226 unit tests, 74 packed-consumer browser checks (2 touch-inapplicable checks skipped), and 32 loader/extension browser checks. All 84 compiled JavaScript modules in every edition's clean registry installation match the tested candidate byte for byte. The local London first view measures 343.9 KiB JavaScript against 345 KiB; Gleislicht measures 358.0 KiB JavaScript and 790.9 KiB combined against 360/792 KiB.

Gleislicht's previous hosted run failed because the combined PostBus scenario exhausted its 120-second overall timeout near the final selection assertions. Adoption splits playback/seek and selection/disable checks into independent cases while retaining the assertions and timeouts. Both cases pass on desktop and iPhone locally.

All three ordinary edition checkouts are updated. Gleislicht's 16 existing local files were preserved: 14 unrelated file hashes match their backups, the local App changes are identical, and its package edits differ only by the alpha.11 pins. Its restored checkout passes typecheck and registry boundaries. The shared checkout has concurrent vehicle-card work; its owner was notified to incorporate main safely, and those files were left untouched.

The edition deployment workflows run separately: [London](https://github.com/emmettl/allchange/actions/runs/34750607717), [Paris](https://github.com/emmettl/correspondances/actions/runs/34750608580), and [Gleislicht](https://github.com/emmettl/gleislicht/actions/runs/34750615431). London's hosted check/build/budget gate has passed; deployment and the remaining hosted checks were still running when this record was written. Other editions retain their existing package pins in this pass.

The Bristol transport and vehicle-card tasks were notified that alpha.11 is complete and that subsequent versions need coordination. No pending transport payload was included in this release.
