# OpenBlue R16: Focused Workspaces and Session Handoff Browser

## Mission
Turn fifteen incremental inspector workflows into navigable, consistent operating surfaces without weakening the R1–R15 local-first governance contracts.

## Workspace navigation
- **Overview**: the only current active project's title/units, walls, symbols, region/annotation counts, proposed pathways, racks, patch panels, switches/links, static review findings, R13 evidence report/review counts and R14 documentation checklist. No inferred physical installation or live device claims.
- **Design**: original selected-wall/symbol inspector, connected-room annotations and grid/unit/sample/clear controls.
- **Network**: R8 network reference hub + schematic drops, R9 operator path proposals, R10 racks/panels, R11 switch topology, R12 read-only diagram.
- **Field**: R14 human-documentation gate + R13 append-only reports and independent review receipts. R12 node selection and checklist action navigate here to target evidence without auto-submitting a report.
- **Handoff**: R15 explicit private-data acknowledgment for local export, bounded JSON inspection and R16 session-only browser.
- A dedicated five-way navigation strip and Overview shortcut keep the editor and lazy 3D viewer accessible.
- Switching away from an unfinished R9 pathway sketch asks before discarding it. Saved records remain unchanged.
- Switching workspaces never mutates blueprints, imports foreign records, invokes EVIE approvals, or triggers network probes.

## Session browser policy
- Multi-select at most 12 local JSON files per browse action, with the original R15 <=7MB per-file cap; nested existing sidecar and SHA-256 checks remain authoritative.
- Each success stores only a **validated summary** from `inspectFieldHandoff`: source filename, local inspection timestamp, counts, external evidence references **counts only**, SHA-256 manifest digest and unsigned provenance caveats. No raw JSON, drawings, reviewer names or photo bytes retained in the session shelf.
- Rejected entries store only the filename, failure reason and inspection timestamp. Invalid, malformed and oversized files never produce a success preview or modify active project.
- Maximum 12 shelf summaries total, most recent first. Duplicate successfully inspected manifest digest replaces an earlier entry. Explicit remove/clear controls, no localStorage or IndexedDB.
- An R15 export also enters the current session shelf after integrity check. Nothing is automatically uploaded, applied or executed.
- Closing/reloading the page clears this session shelf; previously downloaded files remain solely under operator control.

## No additional source of truth
R16 makes zero changes to `openblueprint.project/1`, the EVIE proposal format, all R7–R13 sidecars, R14 derived readiness, or R15 portable package schema. It adds **no new persistent data schema** and no servers. R15 inspector reports a verified manifest digest as UI metadata for deduplicating the browser's bounded list, not as an authenticated origin signature.

## Acceptance tests
1. Overview counts reflect current in-memory project/sidecars, not previously imported package metadata.
2. Five inspector workspaces route to existing working controls, preserve independent local sidecars and keep geometry/3D tools mounted.
3. Selecting an R12 item for evidence opens Field; clicking a readiness row targets the R13 entry; draft-path navigation requires confirmation.
4. Browse valid/invalid/malformed and oversized R15 JSON files: statuses are distinct, no false success, deduplicate manifest digests, max 12 entries, clear/remove.
5. Export local R15 package with explicit privacy acknowledgement; inspect-only import cannot change project, sidecars, EVIE state or evidence receipts.
6. CI `npm ci`, `npm test`, `npm run build`; manual browser smoke for 2D/3D persistence, five-way navigation, mobile overflow, field handoff navigation and file picker.
