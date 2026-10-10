# OpenBlue R8: network-drop inventory and geometric room adjacency

## Goal
Give field/network designers a bounded **concept review** of existing schematic network symbols, without pretending that floor-plan geometry establishes real Ethernet routes, wired connectivity, a legal wall penetration, or physical cable lengths.

## Data and provenance
- Computes drop inventory from `project.symbols` where `type === 'network'`. Other symbol classes are never counted as network drops.
- Assigns a symbol to a face only when R5/R6 topology is `ready` or `partial` and its point is strictly inside exactly one polygon. A position on a boundary, outside, in overlapping faces, or during ambiguous topology remains unassigned.
- Room display names use matching R7 annotations; otherwise display current `Zone N` as a nonpersistent visualization.
- Adds `sharedBoundaries` to R6's readonly face-analysis output, with true shared normalized subedge ownership. Original wall IDs alone are not adjacency evidence.
- Reads project metadata units; straight-line separation from an explicitly selected network symbol is computed as `hypot(dx, dy)`. Conversion ft→m changes the magnitude by 0.3048. A reference hub is **not automatically selected**.
- Optional dashed SVG links are read-only, pointer-events none, explicitly *not routed cables*. They may visually cross walls.
- Export a read-only `openblue.network-review/1` JSON snapshot containing source schema, concepts, room counts, topology summary, adjacency and warnings. No credentials, saved room-notes sidecar, remote calls or authenticated provenance.
- `openblueprint.project/1`, `openblueprint.evie-proposal/1` and the original localStorage project schema remain unchanged.

## Limitations and fail-closed behavior
- No cable routing around obstacles, risers, conduits, cable slack, wall or floor penetrations, cable type, switch capacity or port counts, topology protocols, fire ratings, jurisdictional code checks, or installer takeoffs.
- One model-space network symbol represents one *schematic point*, not a known number of physical jacks, cable runs, or enabled ports.
- Shared wall means planar face adjacency only, not a physical passageway.
- If the R6 analyzer returns ambiguous/limit/open, all room assignments are withheld, even if a polygon-like shape is visible.
- Boundary points and the ambiguous/unresolved/outside classes are flagged and excluded from zone counts.
- Network review is derived on demand; hub and overlay state are UI-only, and blueprint edits/undo continue independently.

## QA
1. Sample R6 plan with multiple detected regions; add two network symbols to different room interiors, one on a dividing wall and one outside. Confirm room assignments, boundary warnings, no false jack counts.
2. Select a hub symbol and verify distances are straight-line only, zero for hub, and correctly scale with ft→m.
3. Select another hub, toggle guides, drag existing symbols in Select mode; guides and inventory update without changing underlying geometry by themselves.
4. Use strict R5 analysis with sample T-junctions; all room assignments withheld. Return to R6 without moving symbols.
5. Export snapshot JSON, verify schema/read-only warnings, stable project compatibility and unchanged EVIE handoff. No remote calls.
6. Check neighboring rooms are based on **same normalized edge owners**, not original wall ID or center proximity.
7. CI: `npm ci`, `npm test`, `npm run build`; interactive browser verification of 2D selection and no guide pointer interception.
