# OpenBlue R13: Human-Reported Field Evidence and Review Ledger

## Mission
Allow real-world inspection results to be *documented* without manufacturing proof of tested or installed network infrastructure. Reports are entered manually. OpenBlue **does not perform** cable testing, link checks, device discovery, photo verification, external signature verification, or independent certification.

## Receipt model
- Independent local-only sidecar `openblue.field-evidence/1`, storage key `openblue/field-evidence-v1`, 500 KB JSON and 400-event limits.
- **Immutable append-only event array** with explicit sequential IDs `receipt-000001`, UTC ISO timestamps, previous event checksum, deterministic local checksum and document-head checksum (which can catch accidental tail truncation). No event update/delete API is exposed.
- `report`: target ID referencing an existing **R12 graph node or edge**, snapshot fingerprint, named human reporter, method (visual, cable test, link test, other), outcome (reported-pass, reported-fail, inconclusive), REQUIRED external reference, notes.
- `review`: previous report receipt ID, a different named human reviewer, decision to accept/reject the **report record**, optional reviewer notes. The latest review is the visible disposition; earlier decisions remain immutable events.
- An accepted report is shown as `reviewed-claim`. It does NOT mark a topology link installed, certified, connected, tested by OpenBlue, operational, or safe.
- Any design-target fingerprint change yields `stale`; a removed graph target yields `orphaned`. Review of stale/orphaned evidence is refused. A new report must be submitted for the current target.
- Noncryptographic FNV-style 32-bit chained checksums detect likely accidental storage corruption only. They are **not** digital signatures, cryptographic authentication, secure timestamps, edit-proof audit storage or evidence of human identity. Attackers can deliberately rewrite and recompute them.

## Boundaries
- No network requests, pings, SNMP, LLDP, real switch or cable diagnostics, external file uploads, attachment storage, photo inspection, embedded file data, or automatic source trust escalation.
- Evidence references are manual plain-text pointers such as a local photo filename, notebook record or measured-cable report ID. Actual referenced material must be stored and authenticated elsewhere.
- Import verifies sequence, event IDs, checksums, review references and distinct reviewers; the user must explicitly confirm replacement. Rejects imports where no report target matches the current plan and never automatically reattaches evidence to a different design.
- Blueprint import, sample restore, clear or approved EVIE replacement resets the active evidence sidecar. Export before replacement. CAD undo/redo does not roll back field ledger events.
- Existing contracts `openblueprint.project/1`, EVIE `openblueprint.evie-proposal/1`, R7 room notes, R9 pathways, R10 racks, R11 topology, and derived R12 graph stay unchanged.

## Acceptance gate
1. Select an existing R12 graph node or edge and manually submit report with evidence reference. Validate allowed method/result and bounded text. Reject missing target/reference.
2. Confirm report appears `awaiting-review` despite reporting PASS; only a different human reviewer may append `accepted-report` or `rejected-report` review. Both actions preserve original report and any earlier decisions.
3. Edit or delete linked blueprint/topology object; previous receipt marks stale/orphaned. New review is rejected until fresh evidence exists.
4. JSON import/export round-trip, including checksum prefix, sequential IDs and all human review events; reject tampering, truncation, reordering, duplicate receipts and oversized data.
5. Reload browser state, import valid sidecar with explicit confirmation, replace CAD plan and confirm reset. Verify no mutation or automatic promotion in the R12 topology graph.
6. CI: `npm ci`, `npm test`, `npm run build`; manual browser smoke for input fields, keyboard navigation, selected-node handoff and history filtering.
