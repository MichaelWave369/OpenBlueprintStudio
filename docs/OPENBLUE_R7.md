# OpenBlue R7: selectable room annotations

## Scope and provenance
R7 adds editable conceptual room metadata (name, planned use, design notes) to the existing computed R5/R6 bounded-face analysis. User-entered labels do NOT certify construction compliance, habitation status or usable area. No remote requests or agent execution.

## Storage and compatibility
- Separate versioned local-only sidecar: `openblue.room-annotations/1`, stored as `openblue/room-annotations-v1`.
- Export `*.rooms.json` for backup; import requires a user-controlled JSON file and explicit confirmation.
- Original `openblueprint.project/1` schema and `openblueprint.evie-proposal/1` unchanged. Room annotations do not appear in CAD JSON, SVG export or EVIE files.
- Bounded parsing: 350 KB, max 300 records, name 80 chars, notes 500 chars, planned-use enumeration, room key 12k chars. Untrusted JSON parsed as data, never rendered as HTML.
- New/imported/replaced/cleared/sample/approved EVIE plan resets active sidecar. Export notes before replacement; restoring a blueprint through geometry Undo does not automatically restore annotations.

## Face anchoring
- R5 strict and R6 connected analysis use separate anchors.
- Face anchor encodes sorted original wall IDs + cycle-normalized polygon vertices converted to SI meters at 10 micrometer precision. This survives face ordering, reversed winding, and ft/m conversion.
- A meaningful boundary change changes the key, so old notes become unmatched rather than attaching to a different region.
- Geometric matching is structural rather than cryptographic identity. Two intentionally identical plans with identical IDs can yield the same anchor; import still requires explicit user approval. No authenticated external provenance is claimed.
- When analysis is ambiguous, computed rooms disappear and labels stay inactive until topology resolves. The sidebar shows unmatched counts and an explicit discard action; never silently reassign.

## User actions
- With Select mode active, click the colored zone interior or its sidebar row. Wall/symbol hit areas remain above zone polygons.
- Edit display name, proposed usage, notes; these use the independent room-annotations save path, not CAD undo history.
- Annotation edits do not modify wall geometry or measurements. Optional overlays can be hidden without deleting notes.
- Export notes separately before replacing a plan; import notes only when their keys match current calculated zones.

## Validation gate
- Unit tests: cyclic rotation/reversal, ft↔m identity, geometry edit mismatch, parse/save/load, hostile/malformed/oversized entries, mismatched label import, no CAD project mutation.
- GitHub CI: npm ci, npm test, npm run build.
- Manual browser: click region in 2D mode and sidebar, edit notes, reload, export/import, toggle R5/R6, zoom/pan, select walls above overlays, show unmatched after moving endpoints, import a new CAD plan or approve EVIE and confirm annotations reset.
