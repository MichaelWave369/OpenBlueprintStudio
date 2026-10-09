# OpenBlue R6: governed connected-wall face detection

## Scope
This rung creates a non-mutating graph *view* from existing v1 wall centerlines and computes bounded planar regions. Existing editable wall objects, coordinate values and ids are never split or modified. EVIE approval continues unchanged. No new schema is introduced.

## Method
1. Limit input to 300 original walls and 2,000 normalized subsegments, with pairwise topology validation.
2. Reject coincident/collinear overlapping walls and proper interior X-crossings, which need explicit author decisions.
3. Discover original wall endpoints lying strictly on other wall interiors (T-junctions). Normalize those walls into temporary directed graph segments.
4. At each node, sort outgoing half-edges by angle; follow each directed edge's preceding neighbor at its destination to trace candidate faces.
5. Accept positive signed-area simple face walks only. Discard unbounded exterior walks. Reject repeated-vertex faces, nested closed contours, and inconsistent traversals.
6. Use shoelace area and centroid and sum centerline edge lengths for each recognized zone.
7. A normalized edge used by two bounded faces is a shared boundary. Report original wall IDs contributing shared segments.
8. If unassigned wall segments remain, show **partial** room areas without a project total. If topology is ambiguous, withhold ALL area results.

## Controls
- Connected faces (R6) is the default, with a switch back to strict isolated R5 loops for comparison.
- Read-only overlays occupy the existing 2D blueprint SVG behind walls, with pointer-events disabled.
- All graph, zone IDs, geometry, and measurements are derived in memory and never sent to external services or persisted.
- Stable v1 project and EVIE proposal schema identifiers are unchanged.

## Non-goals and limitations
- Concept-only wall **centerline** enclosed area, never usable interior square footage, building-code compliance, structural verification, or certified dimensions.
- No automatic door opening cuts, room naming, wall-construction thickness deduction, physical thermal/acoustic boundary interpretation, or accounting for explicit holes.
- Geometric tolerance 1e-6 in current native plan units; near-coincident walls require operator confirmation.
- Interior dangling spurs, ambiguous faces, X-crossing walls, and nested standalone rings are conservatively rejected.
- Room faces share wall centerlines only; the app does NOT change how wall endpoints are edited or how connected geometry is constrained.

## QA
- Two adjacent rectangles sharing one interior partition where partition endpoints form T-junctions.
- Original sample plan has multiple bounded zones without rewriting or moving original wall endpoints; sum of computed faces matches known enclosing rectangle for the fixture.
- Disjoint rectangles, ft→m conversion, no mutation, shared-edge counts.
- X-crossings, duplicates, collinear overlaps, nested rooms, spur within room, disconnected open geometry and wall-count limit negative controls.
- CI test/build plus interactive 2D overlay and EVIE proposal review check required before merge.
