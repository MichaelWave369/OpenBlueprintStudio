# OpenBlue R15: Portable Field Handoff Package

## Purpose
Carry one inspectable, human-authorized, OFFLINE handoff from conceptual blueprint design through field documentation review, while preserving clear differences between design intent, reported evidence, and independently validated facts.

## Included parts
Nine sections, each retaining its existing schema exactly:
1. `openblueprint.project/1` canonical blueprint with walls, network symbols and units.
2. `openblue.room-annotations/1` R7 notes.
3. `openblue.pathway-proposals/1` R9 operator-drawn unapproved paths.
4. `openblue.rack-plan/1` R10 conceptual racks/panels/port assignments.
5. `openblue.logical-topology/1` R11 proposed switches and links.
6. `openblue.field-evidence/1` R13 manual report/review receipts.
7. `openblue.network-review/1` R8 derived-only snapshot.
8. `openblue.topology-review/1` R12 derived-only graph and static issues.
9. `openblue.field-readiness-review/1` R14 derived-only checklist with evidence references.

## Integrity and privacy
- Package schema: `openblue.field-handoff/1`, manifest entry for each part with schema, raw JSON byte size, SHA-256, plus separate manifest header digest.
- Browser WebCrypto SHA-256 required. No dependency, server, account, network API, or private key.
- **Not signed**. Hashes inside the same mutable JSON detect mismatches to the included manifest. They do NOT prove who created or tested the data. No independent timestamp or field identity certification.
- JSON must be 7MB or smaller; each normalized part <=2.5MB. Validator enforces the existing source parsers for v1 blueprint and each mutable sidecar, plus known schema and typed review snapshot fields.
- Existing R13 receipt chain (noncryptographic) must validate as a nested part. External reports/photos referenced by the ledger are not embedded.
- Export needs explicit privacy acknowledgment plus browser confirmation. Some details can contain location information, operators' names and observational notes. Operators must choose recipients appropriately.
- All nine sections and exact manifest order are required; unknown or missing top-level/section/manifest keys are rejected. Oversized or malformed files fail closed.

## Inspection-only import
- Uploading a handoff JSON invokes `inspectFieldHandoff`; only a validation summary is returned.
- Absolutely no changes to CAD project, existing sidecars, EVIE, evidence history or approvals; no silent rebinding of foreign IDs.
- Reports missing R10 rack anchor IDs or drop IDs relative to bundled blueprint without fabricating a repair.
- Derived R8/R12/R14 snapshots are *preserved as authored* but not independently recalculated or promoted to trusted. The displayed readiness state is `embedded/read-only`, not local system readiness.
- Imported data never triggers an automatic browser download, server upload, network probe, or agent action.

## Acceptance
1. Build nine-section package from a blank current blueprint with empty governed sidecars; inspection validates all hashes and schemas and leaves source objects immutable.
2. Corrupt a section, alter manifest, reorder/miss/duplicate entries or add unknown data: reject safely.
3. Malformed, >7MB, invalid nested R13 or invalid timestamps: refuse.
4. Show original `HOLD_FOR_DOCUMENTATION` or `DOCUMENTATION_REVIEW_CANDIDATE` as unsigned metadata only, never construction authorization.
5. React handoff panel can export only after explicit privacy acknowledgment and confirmation; inspect a local file, display per-part checks, clear preview.
6. Confirm no modification to old project/EVIE schemas or room/pathway/rack/topology/evidence persistence; no API access.
7. CI `npm ci && npm test && npm run build`. Manual browser smoke download, inspect good/modified file, privacy checkbox, state isolation.
