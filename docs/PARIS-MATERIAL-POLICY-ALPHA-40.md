# Paris material policies — alpha.40

19 October 2026

Paris's administrative-border fade and weighted traffic emphasis now use optional `NetworkMapStyle.materials` callbacks. The callbacks mutate existing material opacity on the existing frame loop. Geometry, pulse animation, subdued styling and layout attenuation remain renderer-owned. See the [contract](MATERIAL-POLICY.md).

The material source transforms and their injected Paris import are removed. The remaining adapter performs geometry morphing. A behavioural test executes the actual compiled border and traffic components, exercising camera heights, subdued values, layout suppression, pulse preservation, callback removal and geometry identity.

Shared type checks, 476 unit tests, 11 hosting checks and architecture checks pass. Paris passes 32 unit tests, type/lint/boundary checks, production build and every payload/data gate, including the previously approved 682 KiB ten-line cap. The isolated packed consumer passes declarations, Node tooling and 100 browser checks (two existing skips). All 18 Paris Chromium/WebKit journeys pass. Loader checks pass 33 cases on the full Metal run, with the single WebKit loader timeout passing on isolated retry (34 cases covered). All four publication dry runs pass.

All four packages were published under public `next` from `eb3629e4e2c10f2d966ad57db5a82875d563ed50` through [trusted run 39285058900](https://github.com/emmettl/motionstudies/actions/runs/39285058900). Registry metadata, SHA-512 integrities, downloaded archives and next tags match. Every package file matches the checked candidates.

Paris passed an empty-cache registry install, lock integrity and installed-file comparisons, 32 units, type/lint/boundary checks, production build and all payload/data gates. Its 18 browser journeys exercised byte-identical package contents before publication. Adoption commit: `ff091aed7c6e43f461259e644cd67c80e1f9122e`.

The remaining private renderer adaptation is geometry morphing. See [release evidence](evidence/paris-material-policy-alpha40.json).
