# OpenBlue R17: Governed Multi-Project Local Vault

## Purpose
Manage multiple whole-project workspaces without accidentally reusing one site's annotation, planning inventory, network hub, or human-reported field evidence on another site's CAD geometry.

## Data contract
- Vault `openblue.project-vault/1`, stored in a NEW browser localStorage key `openblue/project-vault-v1`.
- Per-slot independent `openblue.workspace-backup/1` JSON export/import.
- Every slot includes the complete original six mutable data documents (unmodified versions):
  - `openblueprint.project/1`
  - `openblue.room-annotations/1`
  - `openblue.pathway-proposals/1`
  - `openblue.rack-plan/1`
  - `openblue.logical-topology/1`
  - `openblue.field-evidence/1`
- Preferences: R5/R6 room analysis mode (`strict` or `connected`) and reference network hub ID. A nonexistent hub is cleared on validation, not silently rebound to a foreign network symbol.
- R8/R12/R14 review snapshots remain DERIVED from the restored documents and are not stored as independent mutable data.
- Six slots maximum, 1.5MB per snapshot, 3.5MB aggregate. Browser quota may impose even tighter limits.

## Explicit user workflow
1. **Save as new** captures all six currently active documents with a unique internal ID and user-visible name, without switching or changing the active editor.
2. **Overwrite snapshot** requires explicit confirmation and replaces exactly one named slot.
3. **Export backup** requires an operator's confirmation that sensitive geometry/evidence metadata is being shared and writes a portable JSON file. An export is vital: localStorage alone is not a durable backup.
4. **Import backup** validates schemas/size, refuses malformed evidence receipt chains, allocates a new slot ID, and stores the snapshot; never auto-activates imported data.
5. **Open snapshot** refuses if there is an unreviewed staged EVIE proposal, an unsaved R9 route draft, a corrupt library, or no spare vault slot. The operator must confirm replacement of the active project.
6. **Before opening**, store the CURRENT active documents in a separate, named pre-switch safety snapshot. If vault saving fails (e.g. quota), do not change the active documents.
7. **Restore**, in a guarded synchronous operation, the six previously canonical active localStorage keys plus preferences. Before any writes, read all previous values. After writes, compare all readbacks. If any write/readback fails, attempt rollback of each already written key and report whether rollback succeeded. Never claim a full transaction in the presence of catastrophic storage failure.
8. **Reload** reinitializes all existing active v1 and sidecar loaders from the restored set, avoiding mix-and-match. Save timers check the switching flag before writing stale state during the switch.
9. **Delete** only one snapshot after confirmation. The currently active workspace is untouched.

## Governance
- Vault is entirely local, no account, cloud synchronization, signed custody receipt or multi-tenant permissions.
- The saved project name, site geometry, technician/reviewer names, reported results, external report references may be sensitive; export only to appropriate recipients.
- R13 `reported-pass` is still a human-entered report, R14 `DOCUMENTATION_REVIEW_CANDIDATE` still not approval; opening a project never authenticates evidence, repairs stale geometry, probes a network device or permits installation.
- Never mutate EVIE staged proposals or change any established schema. Switching blocks while EVIE staged. Unsaved drawn geometry changes and operator submissions must be saved by an explicit snapshot action or the guarded pre-switch save.

## Test and QA
- Unit tests for two full isolated sites, separate hub IDs and evidence, six-slot limit, overwrite, delete, portable export/import and invalid R13 chain rejection.
- Unit test for a simulated mid-restore localStorage write failure and verification of complete rollback.
- Verify initial localStorage key failure is displayed and not silently overwritten.
- Browser smoke: active overview, save two snapshots, switch between them and confirm R7/R9/R10/R11/R13 state belongs to the correct site; inspect local storage warning, quota error, stale hub clearing, per-project analysis mode persistence, backup JSON restore, EVIE and pathway draft blocks.
- CI `npm ci`, `npm test`, `npm run build`.
