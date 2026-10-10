# OpenBlue R19 · Project Timeline & Recovery Checkpoints

## Purpose
Recover complete previously saved local project states while preserving human evidence provenance and the strict distinction between source data, static review, and certified physical work.

## Timeline contract
- New independent local key: `openblue/project-timeline-v1`, schema `openblue.project-timeline/1`.
- Max 4 operator-created checkpoints, 1.5MB per complete project and 3.5MB aggregate; storage quota can impose tighter limits.
- Each checkpoint captures the complete six R17 documents (CAD, R7 room notes, R9 pathway sketches, R10 racks and allocations, R11 logical topology, R13 human receipt ledger) plus room-analysis method and network hub selection.
- Created-at is a **browser-provided timestamp**, not trusted signed time. No implicit autosnapshot on every drawing edit; pressing Save explicitly persists all six documents.
- This is a browser-wide local archive. It does not automatically prove project version lineage. A changed project title or no shared CAD symbol IDs is a warning that designs may be different sites.
- Per-checkpoint backup schema `openblue.project-checkpoint/1`. Import validates the six native schemas and R13 checksum chain, adds a *new* local checkpoint ID and does not apply or automatically trust imported contents.

## Version comparison
- Compare CURRENT active vs checkpoint or checkpoint vs checkpoint.
- Deterministic `openblue.project-diff/1` review-only snapshot. Sectioned ID-level additions, removals and modified records: walls, symbols, R7 annotation anchors, R9 route endpoints, R10 rack IDs/port allocation keys, R11 switches/links, R13 receipt IDs and current title/units/grid/room mode/hub.
- Treat purely transient project `updatedAt` field changes as noise; never hide altered source entities or evidence receipts.
- Export bounded changed-ID samples and counts, plus warnings for cross-project title differences and evidence receipts present in the earlier state but removed in the later state.
- Diff is NOT a physical engineering delta, tamper-proof source signature or verified identity link.

## Safe recovery
1. Do not recover if EVIE has a staged proposal or R9 has an unfinished operator route draft.
2. Validate the target full workspace and run R18 integrity audit. Block `RESTORE_BLOCKED`; require additional confirmation for `RESTORABLE_WITH_FINDINGS`.
3. Compare all current active documents to the selected checkpoint. If no ID/setting changes are visible, skip unnecessary recovery.
4. Require at least one free checkpoint slot before attempting to recover. A full timeline must be pruned **after exporting backups**, never silently overwritten.
5. User confirmation must mention the complete six-document replacement, possible project identity difference, loss of newer R13 receipts and the pre-recovery safety checkpoint.
6. Independently save the current active complete workspace as a new `Before recovery · ...` checkpoint. If storage fails, STOP without touching the active project.
7. Set existing R17 `switchingRef` guard and invoke `restoreWorkspaceInStorage` to update all six canonical localStorage documents + preferences with readback. On write error, R17 attempts rollback and reports any rollback failure; never promise ACID semantics.
8. Reload so all React state reinitializes from the same recovered document set. Previously saved timeline entries remain intact and the pre-recovery backup provides a reversal path.
9. No automatic ID remapping, topology reconciliation writes, evidence deletion by individual receipt, imported handoff promotion or construction approval.

## Corruption and governance
An unreadable timeline is not overwritten automatically. Operator may download the original raw text, or explicitly confirm destructive timeline reset. Local browser storage is not durable cloud backup; exported checkpoint files may include site layout and technician/evidence identifiers.

R13 receipt checksums are noncryptographic; an accepted human report is still testimony, not independent live cabling/port certification. Neither an R18 consistency PASS nor an R14 documentation candidate is installer authorization.

## QA
1. Full six-document checkpoint round trip; bounded 4-slot capacity, schema rejection, invalid R13 history block.
2. Deterministic diff for added/removed/changed CAD objects, R7-R13 sidecars and evidence receipt loss.
3. Cross-project warning on titles/IDs; identical records ignore updated timestamp only.
4. Pre-recovery safety checkpoint saved before restoring, block full timeline, block EVIE/uncommitted route drafts, R18 preflight and confirmation.
5. Simulated R17 mid-restore failure already tested; recovery path must preserve active data on failed storage write.
6. Browser smoke for save, compare, exported diff, external checkpoint import/export, recover/undo via pre-recovery checkpoint and corrupted timeline raw backup.
7. CI `npm ci`, `npm test`, `npm run build`.
