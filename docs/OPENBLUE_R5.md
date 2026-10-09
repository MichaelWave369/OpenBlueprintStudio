# OpenBlue R5: governed centerline region analysis and 3D framing

## Purpose
Report *only* defensible approximate centerline-enclosed area. Never claim certified net floor area or room classification.

### Algorithm
- Enumerate at most 300 wall segments (bounded O(N²) collision checks).
- Endpoint joining uses a 1e-6 native-unit quantization for floating-point stability; it does not remodel or snap user geometry.
- Reject all area output on intersections, interior-wall T-junctions, collinear overlaps, invalid wall coordinates, nested/touching loops, degenerate enclosed areas or inconsistent traversal.
- Recognize connected components where every endpoint has graph degree two and the loop has three or more segments.
- Use shoelace area/perimeter and area-weighted centroid; display optional SVG color fills with pointerEvents disabled.
- If valid closed loops coexist with disconnected open wall segments, output **partial** per-loop areas, never an all-project total.
- The frozen `openblueprint.project/1` project schema, EVIE proposal schema and localStorage key remain unchanged.
- Count and centerline values are recalculated from current project state; never saved as authoritative facts.

### Known limitations
- This is not a general planar graph face extractor. Adjacent rooms sharing a wall, walls meeting at interiors, or nested regions require a future normalized topological wall model.
- Coordinates differing by less than 1e-6 units may collapse into one analysis vertex. Results remain concept-only.
- Wall thickness and openings are not subtracted. Numeric coordinate inputs may require geometry normalization before rooms are detected.
- Full-resolution 2D overlay is noninteractive to preserve wall selection/drag, panning and measurement.
- Large projects (over 300 walls) show a bounded limit warning instead of attempting unbounded analysis.

### 3D camera
- Fit 3D control computes model envelope center/radius, adjusts OrbitControls target and camera distance, near/far viewing range, ground plane and grid center.
- Auto-fitting on import/EVIE approval/unit switch tracks the existing `fitRequest`; ordinary wall edits must **not** reset user orbit.
- Calculations are pure and unit-tested; camera controls do not enter JSON, history, EVIE handoff, or browser autosave.

### Test gate
- Closed rectangle; disjoint rooms; open wall; partial geometry; crosses/T-junctions/overlap/nested loops; degenerate input; maximum wall count; ft²→m² conversion, and frozen sample-plan fail-closed.
- Browser: overlays behind walls with no pointer capture, room labels at zoom/pan, sidebar statuses, 3D Fit on sample and distant plan.
- CI: `npm ci && npm test && npm run build`. Manual pointer/WebGL smoke tests still required.
