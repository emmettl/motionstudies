# Train-label density and sizing policies

`NetworkMapStyle.trainLabels` accepts two optional stable callbacks:

- `budget(semanticCameraHeight, viewportWidth, mode)` supplies the ambient label count. It receives CSS viewport width and the existing `auto`/`on` mode. `off` returns zero without invoking the policy. Counts are rounded down and bounded between zero and the renderer's 56-label pool.
- `screenHeight(viewportWidth, selected, semanticCameraHeight)` supplies CSS-pixel height for ambient and focused labels.

Omitting either callback preserves existing behaviour. Keep the style object and callbacks stable; changing the style invalidates cached frame work. Semantic camera height uses the existing regional framing conversion.

Selected trains and comparison sets retain their existing label budgets independently of ambient density. Non-rail category suppression, category height limits, arrival fading, selection priority, collision rejection, viewport padding and frame/GPU resource ownership stay with the renderer.

Paris supplies its existing functions: ambient labels are hidden at semantic heights of five or above and otherwise limited to three on phones or eight on desktops. Focused labels retain 34-pixel height; ambient labels use 26 pixels on phones and 30 on desktops. This removes only the two train-label source replacements and their injected imports. Camera, geometry and material transforms remain guarded.
