# Paris material policies — alpha.40 candidate

19 October 2026

Paris's administrative-border fade and weighted traffic emphasis now use optional `NetworkMapStyle.materials` callbacks. The callbacks mutate existing material opacity on the existing frame loop. Geometry, pulse animation, subdued styling and layout attenuation remain renderer-owned. See the [contract](MATERIAL-POLICY.md).

The material source transforms and their injected Paris import are removed. The remaining adapter performs geometry morphing. A behavioural test executes the actual compiled border and traffic components, exercising camera heights, subdued values, layout suppression, pulse preservation, callback removal and geometry identity.

Shared type checks, 476 unit tests, 11 hosting checks and architecture checks pass. Paris passes 32 unit tests, type/lint/boundary checks, production build and every payload/data gate, including the previously approved 682 KiB ten-line cap. The isolated packed consumer passes declarations, Node tooling and 100 browser checks (two existing skips). All 18 Paris Chromium/WebKit journeys pass. Loader checks pass 33 cases on the full Metal run, with the single WebKit loader timeout passing on isolated retry (34 cases covered). All four publication dry runs are required before dispatch.

Alpha.39 is now published and registry-verified; Paris's alpha.39 adoption is pushed to main. GitHub's Actions status was delayed during its incident. Alpha.40 is a prepared candidate, not a published registry release; its Paris lock integrities currently identify local candidate tarballs. Final registry verification and the adoption's main-branch push must follow trusted publication.
