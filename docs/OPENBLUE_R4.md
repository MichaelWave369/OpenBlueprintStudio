# OpenBlue R4: real CAD editing

- `convertProjectUnits(project, target)` converts all model-space wall positions, thicknesses, heights, symbols and grid. No schema rename or unit-label sleight of hand.
- Conversion returns a new validated project or throws; no clamping, partial commits or silent range widening. One Undo restores prior geometry. Zero edits if cancelled or rejected.
- Supported values remain bounded by schema `openblueprint.project/1`. Valid source documents near the numeric extrema can be non-convertible; report the rejected constraint to the operator.
- Select a wall to reveal start/end control points. Drag with grid snapping, see a transient preview, and release to commit once. Invalid collapsed walls do not persist. Coordinate fields in the inspector allow exact values, committing on blur or Enter.
- 2D Pan (H), zoom (+/− buttons) and Fit affect only viewBox state. They are never exported, sent to EVIE, saved in localStorage or included in drawing Undo/Redo.
- Client XY → SVG coordinates use `getScreenCTM().inverse()`, handling SVG letterboxing; snapping uses native project grid (not the previous hard-coded 0.25 minimum).
- Converting between feet and meters changes the coordinate magnitudes on the concept-only Three.js preview, consistent with the original numeric data model, not a normalized real-world unit engine.

## Manual test checklist
1. Export legacy project; change ft→m, inspect walls, thickness, height, network symbols and grid; Undo and Redo; export and reload.
2. Convert back m→ft; verify geometry returns within rounding tolerance.
3. Try a valid ft wall thickness 0.1, then switch to m; expect explicit rejection and unchanged project.
4. Select wall and drag end handle, verify one undo and valid saved geometry; collapse to other endpoint, expect rejection.
5. Enter exact X1/Y1/X2/Y2 in inspector, blur and verify; enter out-of-range value, expect visible error and unchanged geometry.
6. Zoom in/out, fit, pan with H; draw and measure with letterboxed SVG view; verify visual controls do not alter project export.
7. Test 2D fallback without WebGL 2 and verify EVIE proposal approval/rejection flow survives.
8. Run `npm ci`, `npm test`, `npm run build`; use manual browser smoke for pointer capture interactions.

## Intentional scope limits
- No automatic joint constraints when two walls share endpoint coordinates. Editing one wall endpoint does not move other coincident endpoints.
- No BIM / structural / code-compliance assertion.
- No authenticated EVIE execution or unsolicited data transmission.
- Imported `openblueprint.project/1` format and browser localStorage key remain unchanged.
