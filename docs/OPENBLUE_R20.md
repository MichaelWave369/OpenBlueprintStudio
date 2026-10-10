# OpenBlue R20: Recovery Confidence Drill & Dependency Security Gates

## Scope
R20 adds a repeatable **sandbox-only** recovery rehearsal for all complete R17 project workspaces including R19 checkpoint sources. It does not perform real recovery or alter anything outside its own short-lived JS memory objects. It also strengthens the GitHub Actions dependency audit signal.

## Recovery drill policy
1. Operator selects an **active** complete workspace, R17 saved Project Library entry, or R19 saved timeline checkpoint. No unknown/invalid selection falls back silently.
2. Validate all six existing source docs and per-project room/hub preferences via R17 `validateWorkspace`. Invalid/malformed R13 report-chain or other data fails closed.
3. Run the pure R18 `auditWorkspace` reference check. `RESTORE_BLOCKED` refuses simulation; `RESTORABLE_WITH_FINDINGS` permits the drill but surfaces reference review findings, not an approval.
4. Create ephemeral **Map-backed Storage**, seed with an unrelated blank project. No interaction with browser `localStorage` is permitted. That distinction is critical: test storage itself is not a real browser quota/disk test.
5. Invoke actual R17 `restoreWorkspaceInStorage` with the selected complete workspace to stage all six known active document keys plus the preference key. Re-read with **real** project/room/pathway/rack/topology/evidence loaders and compare the full normalized data, not merely one title or timestamp.
6. Recreate the unrelated baseline. Deliberately throw on the fourth `setItem` operation while calling the exact same R17 restore implementation. Assert that the exception was reported, the earlier writes were rolled back, and every original Map entry remains byte-for-byte equal.
7. Produce `SANDBOX_PASS` only when all five checks pass: input validation, decoded seven-key readback, exact complete data equality, tested rollback, untouched initial baseline.
8. A `SANDBOX_FAIL` never triggers automatic repair, restart, full restore or retry. Export `openblue.recovery-drill/1` JSON for further operator review. Tests are deterministic for a given input and include no trusted timestamps or signatures.

## Security gate
- CI executes `npm ci`, `npm test`, `npm run build`, then **gates** on `npm audit --omit=dev --audit-level=high`.
- A separate **nonblocking but visible** full `npm audit --audit-level=high` reports dev/build/test dependency advisories. Known npm install vulnerabilities are not concealed or asserted repaired by this project change.
- The production-only gate does NOT prove build-system integrity. Resolve development advisories in follow-up PRs with careful lockfile upgrades and new CI checks rather than forcing breaking upgrades blindly.
- No new browser dependencies, private tokens, cloud permissions or runtime network connections required by R20.

## Explicit nonclaims
- A passing drill does not prove successful restore under real browser storage quota failures, concurrent browser tabs, process termination, power loss, filesystem corruption or malicious tampering.
- R13 reports and R15 unsigned handoffs remain untrusted human claims. An R14 documentation review candidate is not installation permission. No physical device testing is performed.

## Acceptance
1. Test active/saved workspaces (including nonempty R13 receipts) roundtrip through **all six real source loaders** and preferences without touching live localStorage.
2. Corrupt receipt chain; drill fails without claiming restoration.
3. Inject a mid-write storage fault; rollback preserves every original key (including unrelated plan data and preferences).
4. Repeated identical drills produce stable review-only reports and zero active project mutation.
5. Browser QA: select all three kinds of workspace; run rehearsal; export and read JSON report; no active editor state or saved timeline changes.
6. CI npm installation, all tests, production build, high-severity production dependency audit; informational full dependency audit remains visible.
