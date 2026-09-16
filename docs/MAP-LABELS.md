# Shared hierarchical map labels

Released in the coordinated `0.1.0-alpha.25` package set.
`@motionstudies/core/map-labels` exposes the renderer-independent ordering,
zoom budgets, rank limits and collision rules used by the shared station labels.
The existing Three.js station renderer delegates to these helpers; its priorities,
retention, tier limits, padding and typography remain unchanged.

`compareMapLabelCandidates` sorts by selection priority, retained visibility,
ordinary rank, distance and stable name. Lower priority/rank numbers win. The
edition owns ordinary ranks and maps its zoom to semantic camera height.
`mapLabelBudget` and `mapLabelRankLimit` retain the existing 8/20/48/96 progression.
Selected labels should bypass ordinary rank admission before collision allocation.

`selectMapLabels(candidates, budget, viewport, obstacles)` returns the visible
candidates. Their boxes must include actual interactive hit areas, not just text
ink. Every label, including selected labels, respects the viewport, UI obstacles,
other accepted labels and budget. Candidates keep their edition data through the
generic result type. Rendering and accessible pointer/keyboard activation remain
consumer responsibilities. Reuse the result until view, selection, ranking or UI
occlusion changes; do not lay out static labels on every playback frame.

LUFT will consume this API for airport labels ranked by observed endpoint activity
in the pinned day. Those ranks describe observation coverage, not airport capacity,
passenger traffic or a complete flight census. No airport or renderer data is fetched
by the core label engine.
