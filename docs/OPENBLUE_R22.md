# OpenBlue R22 · Operator Self-Test and Release-Readiness Checklist

## Goal
Help operators detect local record/data trouble *before* project switching, handoff or recovery. Keep operational readiness separate from field readiness and avoid unsafe, silent data repair.

## Trigger and privacy
- The operator explicitly selects **Run complete local self-test** in the Overview workspace.
- No startup monitoring, telemetry or background network requests are added.
- Existing active localStorage documents, R17 library and R19 timeline are read via their established parser contracts. This test does not set, remove, or rewrite any real localStorage key; the R20 recovery drill runs only against its own temporary Map storage clone.
- Export schema: `openblue.operator-self-test/1`. Includes only check codes, general explanations, aggregate saved-item counts and caveats. Deliberately excludes raw JSON, wall coordinates, blueprint title, network IDs, reporter names and evidence references.
- Self-test may use the browser's local `navigator.storage.estimate()` (when implemented). Its quota estimate is not a guarantee of writable space, disk endurance or application-specific space.

## Checks and interpretation
1. **ACTIVE_SCHEMA:** validate all six native active source documents plus per-project preferences, including R13 manually reported evidence chain. Invalid source is a blocker; preserve original backup before repair.
2. **REFERENCE_REVIEW:** run R18 reference consistency. An unreviewed rack/hub/annotation/evidence reference is a warning, not proof of incorrect physical installation.
3. **RECOVERY_SIMULATION:** run R20's seven-key sandbox restore, full-source readback and injected storage fault with rollback verification. A pass does not test live localStorage writes, browser tab concurrency, OS storage or real quota.
4. **ACTIVE_STORAGE:** read each of six persisted active documents plus preferences using actual schema parsers. Missing first-run keys are `WARN`; parse errors or storage exceptions are `FAIL`. Never auto-create missing documents.
5. **ACTIVE_SYNC:** compare complete normalized in-memory source with all validated browser-saved source. An autosave-pending difference is `WARN`, not corruption.
6. **VAULT_STORAGE:** parse existing R17 vault, including all saved snapshots, or warn that none exists. An unreadable vault is `FAIL` and must be preserved before destructive reset.
7. **TIMELINE_STORAGE:** parse existing R19 checkpoint timeline or warn that no local history exists. An unreadable timeline is `FAIL`.
8. **BROWSER_FEATURES:** inspect support for native file import/export, secure WebCrypto SHA-256 for R15 packages and WebGL2 for the optional 3D viewer. Missing features are `WARN`.
9. **STORAGE_HEADROOM:** report high estimated origin-wide storage usage (90%+) as `WARN`, or absent/invalid quota API as `WARN`. Do not test capacity by writing into storage.

## Status vocabulary
- `LOCAL_CHECKS_PASSED`: every available check reports PASS. Means only the implemented local tests passed, not that the environment is guaranteed safe.
- `OPERATOR_ATTENTION`: some checks are missing/uncertain, reference warnings or autosave may need operator review.
- `OPERATOR_REVIEW_REQUIRED`: one or more source/storage/sandbox checks failed. No automatic reset or repair is attempted.
- `SKIP`: an upstream failed check prevents safe dependent evaluation; never relabeled PASS.

## Acceptance tests
- Real six-document localStorage roundtrip and saved R17/R19 snapshots produce PASS while storage writes remain exactly unchanged during audit.
- Missing localStorage and optional browser capability API produce WARN, not fabricated PASS.
- Corrupt active sidecar or vault are detected without overwriting original browser bytes.
- An in-memory project changed before delayed autosave is flagged WARN rather than incorrectly treated as corrupt.
- Invalid R13 receipt chain blocks active schema and skips downstream run; private project title/IDs never appear in exported report.
- CI `npm ci`, all `npm test`, production build, production security audit, **blocking full npm audit**, and manual browser Overview/3D/sidecar smoke after merge.

## Non-goals
No authenticated login, real network discovery, device installation check, cloud monitoring, emergency auto-repair, field certification, automatic project restore or permanent data-transfer service. A local health report is not the same as a signed release attestation.
