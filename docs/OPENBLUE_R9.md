# OpenBlue R9: operator-drawn pathway proposals

## Contract
- Proposals are operator-entered sketches, not automation-derived routes, permission to penetrate walls, or field-approved construction plans.
- Data sidecar `openblue.pathway-proposals/1`, browser key `openblue/pathway-proposals-v1`; maximum 100 hub/drop proposals, maximum 60 waypoints each, JSON limit 500 KB.
- SI meter-coordinate waypoints and SI-anchored endpoint stamps; feet/meters conversions don't relocate waypoint geometry.
- Hub and destination are valid, distinct existing network symbols. The current hub comes from R8's human-selected reference point.
- Clicking the blueprint in Pathway mode adds grid-snapped 2D waypoints. Editing existing proposals uses the same trace/edit button; confirm explicitly with Save. Undo waypoint only affects transient draft; CAD undo/history is unchanged.
- Segment lengths sum horizontal Euclidean lengths between hub, waypoints and destination. This omits elevation, bends, termination, installation slack, pathway restraints and other real cable-run effects.
- Cross/touch against original wall centerline segments, flag *all* affected wall IDs. Doors/windows are schematic symbols and **do not** grant penetrations or openings.
- A moved/retyped/removed network endpoint invalidates the saved proposal as **stale**. Moving/adding walls recomputes conflict warnings rather than auto-repairing a saved path. A clear collision scan is **not** path certification.
- Saved polyline overlays are pointer-events none so walls, symbols and room selections remain editable.
- Proposals serialize separately from legacy project JSON, room sidecar and EVIE proposal. Replacing a plan resets local proposals; export first. Imported proposals are bounded JSON and require matching current endpoints with explicit human confirmation.
- Proposal exports are not uploaded or sent to external services. They do not constitute an EVIE action or field approval.

## Validation
1. Hub → target with one waypoint: sum component lengths and show draft polyline.
2. Direct line across sample room partition: crossing/touch wall warning even when a door symbol is nearby.
3. Move the target symbol: route becomes stale; re-tracing is required.
4. Switch ft→m: SI waypoints and endpoint stamps stay physically consistent.
5. Pointer click on a wall or symbol while Pathway mode is active: adds a waypoint rather than selecting or moving other geometry.
6. Import malformed JSON, oversized route list, duplicate hub/drop pair, non-finite coordinates, invalid/missing endpoints: reject safely.
7. Reload localStorage, export/import sidecar, replace plan (clears proposals), and verify CAD/EVIE schema unchanged.
8. GitHub CI `npm ci && npm test && npm run build` plus interactive browser and keyboard Escape smoke checks.
