# Camera-dependent material policies

`NetworkMapStyle.materials` optionally supplies two stable callbacks. Both receive world-space camera height on the existing R3F frame loop; neither changes geometry or starts a timer.

- `borderOpacityScale(height)` multiplies the standard subdued border opacity and spatial-layout fade. A configured scale at or below 0.001 hides the border group. Without a callback, the existing visibility and opacity apply.
- `trafficFlowOverviewEmphasis(height)` replaces overview emphasis for weighted traffic strokes. Identity suppression and subdued opacity remain renderer-owned. Pulse timing, pulse opacity and its existing overview emphasis are unchanged.

Removing a callback restores the standard values on the next frame. Keep callbacks stable and return finite, nonnegative scales/emphasis. The renderer owns material instances and disposal.

Paris uses its smooth city-to-overview mix for both callbacks. This removes its border and traffic material source rewrites; its remaining adapter concerns geographic geometry morphing.
