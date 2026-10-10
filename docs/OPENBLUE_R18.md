# OpenBlue R18: Project Recovery & Integrity Audit

## Scope and verification policy
R18 implements a pure, read-only `auditWorkspace` evaluator and Overview inspection panel. It can audit the active editor's six documents plus analysis/network-hub preferences, or inspect each named R17 saved project BEFORE activation. All results are human-readable, JSON-exportable, and deliberately non-authoritative for physical network or construction work.

### Audit stages
1. **Validate complete stored schema.** R17 `validateWorkspace` confirms all six existing mutable documents and R13 receipt checksum chain. Corrupt, unknown, oversized or incomplete input immediately yields `RESTORE_BLOCKED`.
2. **Inspect original hub reference.** A stale saved hub must be reported even though the R17 validator clears it in its returned normalized copy. No automatic reattachment.
3. **Recompute room geometry** in the snapshot's saved strict/connected analysis mode; derive current room annotation anchors. Report unmatched annotations without rewriting or dropping them.
4. **Evaluate saved R9 operator routes** against original geometry, including stale endpoints and wall-crossing warnings. Derived route geometry remains a proposal, never a feasible/certified cable run.
5. **Reconcile R10 racks/ports and R11 logical switches** with schematic network symbols, rack anchors, unallocated panels and proposed links; rebuild R12 static graph.
6. **Reconcile R13 human field evidence** by target fingerprint and explicit reviewer event, identifying stale/orphaned references. A reviewed PASS is still a human report, not independently authenticated field measurement.
7. **Recompute R14 documentation readiness** as a separately derived checklist. An `HOLD_FOR_DOCUMENTATION` produces an informational finding, not a block on restoring an otherwise consistent archived plan.

### Outcomes
- `STRUCTURALLY_CONSISTENT`: all six schemas and reference checks pass, regardless of field readiness. Does NOT imply installed infrastructure.
- `RESTORABLE_WITH_FINDINGS`: source documents parse, but reference review issues exist. Can only open after an additional explicit inconsistency acknowledgment and normal R17 safety-snapshot consent.
- `RESTORE_BLOCKED`: schema or reconciliation fails. Opening that saved slot is refused. No implicit fallback or repair.
- Export `openblue.workspace-audit/1` plain JSON, containing document check results, findings, next actions, counts and warnings, but no signing or external verification.

### Local corrupted-vault recovery
If R17 localStorage vault parsing fails, original bytes remain untouched. A separate operator-confirmed raw download is available before the existing explicit destructive reset. This download might be malformed JSON and is **not a restored or certified project**, and may contain sensitive site information/reporter details.

### Non-goals and safety
No cloud accounts, file-system scanner, third-party device probe, remote software update, PDF certification, automatic topology or evidence repair, cryptographic signature or privileged approval. Does not modify CAD or R7–R17 data schemas. Existing R17 guarded pre-switch snapshot, write readback, rollback and reload remain the actual restoration path.

### QA
- Valid empty/new project remains structurally consistent, while R14 documentation stays held.
- Missing/misbound hub is surfaced even if normalization clears the selector.
- Stale rack anchors, missing network endpoints, unmatched room annotations and field evidence failure are surfaced without mutating saved source.
- R13 checksum-chain corruption blocks a restore preflight.
- Verify R18 cannot silently approve an installation, create a network connection, or repair a stale ID.
- CI `npm ci`, `npm test`, `npm run build`; manual browser smoke of active audit, slot audit, audit download, preflight blocks/warnings and unreadable-vault raw export.
