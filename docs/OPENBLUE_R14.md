# OpenBlue R14: Field inspection checklist and documentation review gate

## Mission
Combine R12's proposed topology and static consistency findings with R13's separately reviewed human-submitted field reports. Show exactly which documentation is missing, stale or unresolved, without ever declaring an installation approved or a network link operational.

## Checklist policy
- Derive required rows from existing R12 nodes: racks, switches, patch panels, network drops.
- Derive required rows from existing **proposed** R12 edges: logical switch/patch links and patch-panel/drop allocations. Rack membership edges are not cables, and do not create duplicate connection inspection requirements.
- Required report method: `visual-inspection` for rack, switch, panel; `visual-inspection` or `cable-test` for schematic drop; `link-test` for logical link; `cable-test` for panel/drop allocation.
- An eligible row requires the **latest** associated R13 report to remain current (matching design fingerprint), to assert `reported-pass`, to use a required method, and to have a separate `accepted-report` reviewer event.
- Even an eligible `reviewed-report` is a *human-reviewed PASS claim*, **not independent certification**. No automatic change to connection status, CAD geometry, installation readiness or permit status occurs.
- **Latest report precedence**: if a newer report is unreviewed, failed, inconclusive, stale, method-mismatched, or rejected, the row is blocked even if an older report was accepted.
- Design states marked `review`, `missing`, `stale`, `u-slot-conflict` or `unknown` cannot be cleared by writing evidence receipts.

## Review gate
- Require at least one of each six component categories: `rack`, `switch`, `panel`, `drop`, `logical`, and `allocation`. An empty plan MUST fail closed.
- Block on all R12 **review-severity** findings and informational missing-path, missing-room-assignment or switch-without-links findings.
- All required rows must have `reviewed-report` status before `DOCUMENTATION_REVIEW_CANDIDATE` appears.
- Otherwise display `HOLD_FOR_DOCUMENTATION`. Provide category counts, reported claim coverage, scope gaps, planning findings and per-target next actions.
- Checklists and filter/summary UI are **read-only**; Record Evidence navigates to R13 to make a new, separately governed append-only report.
- No automatic sign-off, ticket closure, construction permit, network testing, cable certification, SNMP/LLDP or external data calls.

## Data / governance
- R14 is purely derived from `buildTopologyDiagram` / `reviewEvidenceLedger`; it introduces **no new mutable storage format**.
- Explicit download: `openblue.field-readiness-review/1` review-only JSON, with required rows, receipt links, findings, next actions and provenance warnings.
- Existing schemas `openblueprint.project/1`, EVIE proposal, R7 room metadata, R9 pathways, R10 racks, R11 logical topology, R12 review, and R13 evidence ledger remain unchanged.
- **Noncryptographic** R13 checksum chains are not signatures or tamper resistance. Evidence must be authenticated and compared to actual external test artifacts by authorized people.

## Acceptance
1. Empty graph and partially modeled network remain HOLD even if individual reports claim PASS.
2. Full planned graph + current human-reviewed reported-PASS receipts for every required row, suitable methods, and no static blockers is only a DOCUMENTATION_REVIEW_CANDIDATE, not approved.
3. A newer unreviewed report or reported FAIL overrides older accepted PASS; wrong method and inconclusive reports fail.
4. Stale/removed design targets fail, even when an earlier report was reviewed; geometry conflicts and missing R9 routes fail separately.
5. Export deterministic snapshot, including receipt references and explicit caution text. No mutation of R13 or CAD; UI supports filtering and opening the relevant evidence target.
6. CI `npm ci && npm test && npm run build`; browser smoke for review progression, filter, evidence navigation, independent reviewer flow and JSON export.
