# Vehicle cards · 0.1.0-alpha.12

The coordinated release includes vehicle hero cards, the shared snapshot calling-point adapter, and the merged aggregate-road, source capture, UK service-day and WebTRIS modules from transport PR #6.

`VehicleHeroCard` presents service identity, destination when known, next stop and remaining calls. UK bus, UK rail, yellow bus and SBB treatments share accessible text, selection, error/loading states and compact layouts. `NetworkVehicleHeroCard` resolves the selected train against the current snapshot; call indexes are never read from a stale selected chunk. It follows playback and backward seeks, distinguishes a current dwell from the next arrival, and preserves supplied adjusted times. Frequency-based consumers can hide times. A final available call is labelled as destination only when its name matches the explicit headsign.

All four packages are pinned to `0.1.0-alpha.12`, under the npm `next` tag. Publication uses the existing trusted GitHub workflow and its validated tarballs. Edition-specific data interpretation, labels and release gates remain in their repositories.

Publication and edition adoption results will be recorded after verification.
