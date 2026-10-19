# Paris station policy — alpha.35

19 October 2026

This delivery removes one coherent set of Paris renderer transforms. Station
ordering, semantic height during a layout morph, tier/zoom admission, screen
sizing and viewport clipping are supplied through `NetworkMapStyle`. Station tap
acceptance uses `NetworkSceneExtensions`; Paris keeps its existing priority for
independent airport labels. See the [policy contract](STATION-LABEL-POLICY.md).

Paris no longer transforms the private station component or picking modules, or
rewrites the corresponding station-label expressions in `NationalNetworkScene`.
Existing editorial groups, source station identities, focused-label priority,
collision budgets, cache invalidation and pointer cancellation remain intact.
The new package options are opt-in; only Paris adopts alpha.35 in this delivery.
Other editions retain their checked alpha.34 pins.

## Validation

The declared Node 24 toolchain passes 469 shared unit checks, 11 hosting checks,
public type/architecture/lint gates and the packed-consumer/release checks. Paris
passes 26 unit checks and 18 Chromium/WebKit journeys covering station discovery,
selection, airport priority, layout reversal, reduced motion and retries.

All existing Paris payload gates remain unchanged. The eight-line opening is
628.7 KiB gzip / 630 KiB; the ten-line option is 680.8 KiB / 681 KiB. The initial
check accidentally used the host Node 26 after a temporary Node 24 installation
had disappeared; restoring Node 24 restored the reproducible gzip measurements.
No size limit was changed.

## Remaining adapter boundaries

The camera journey/framing, train-label budget and sizing, material opacity and
geometry-morph transforms remain guarded in Paris. They require their own bounded
contracts and behavioural checks. This delivery does not claim the entire build
adapter has been removed.

## Hosted rollout review

The preceding alpha.34 rollout completed Pages and Cloudflare deployment for
London, Paris, Switzerland, NORIKAE and Berlin, and the shared catalogue deployed
successfully. Local / Express and Underfall passed code validation but their
artifact uploads remain blocked by GitHub's Actions storage quota. This work does
not bypass those deployment gates.

Publication and exact Paris adoption evidence are recorded after the trusted
alpha.35 workflow and clean registry checks finish.
