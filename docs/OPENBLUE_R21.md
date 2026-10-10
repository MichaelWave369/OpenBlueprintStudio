# OpenBlue R21 · Complete Dependency Security Audit Gate

## Motivation and evidence
R20 isolated production dependencies and reported 0 advisories on the shipped production dependency graph, but the full npm tree still reported 4 advisories (two moderate and two high). These involved build/test tooling and three actual vulnerable packages:

- **Vitest / @vitest/mocker 4.1.10**: moderate path-traversal/advisory GHSA-82fw-gwwq-j7x9; fixed in 4.1.11.
- **nanoid 3.3.16**: high, vulnerable custom zero-length generator, GHSA-2v37-7h3g-55p8; fixed in 3.3.18+. The updated lock resolves to 3.3.20.
- **source-map-js 1.2.1**: high source-map processing denial-of-service, GHSA-68fv-2mgg-jv7q; patched lock resolves to 1.2.2.

Npm counts some direct and transitive advisories separately; package names above are not intended to represent the total number of advisory records.

## Remediation
- Change the **exact** pinned Vitest version from 4.1.10 to 4.1.11; its mocker dependency also resolves to 4.1.11.
- Use npm's resolver on an isolated GitHub runner to regenerate, never fabricate integrity strings or patch dependencies by hand.
- Transitive nanoid becomes 3.3.20 and source-map-js 1.2.2. No application runtime, React, Three, Vite or plugin-react direct version bump.
- An isolated lockfile candidate workflow generated the new lock with **npm 11.6.2** because GitHub's stock npm 10.9.9 failed in `npm install` with `Cannot read properties of null (reading 'edgesOut')`. The temporary generator workflow is deliberately REMOVED from the final PR tree.
- The committed npm 11-generated lockfile is not compatible with stock npm 10.9.9: npm 10 `npm ci` requires optional `@emnapi/core` and `@emnapi/runtime` entries that npm 11 does not emit, and npm 10's attempts to recalculate the lockfile abort in Arborist (`null.edgesOut`), even when regenerating from scratch. **CI and Pages both pin npm 11.6.2** before `npm ci`. Local development should use Node 22+ and npm 11.6.2; npm 10 is not supported for this lockfile. This is a toolchain constraint, not a claim that npm 10 is insecure.

## Blocking CI policy
- Keep the existing production high-severity check.
- Replace nonblocking full audit with `npm audit --audit-level=low` after test/build. All current npm advisories, including low, now fail CI, not just production highs.
- Add pure lockfile regression tests for pinned/fixed versions and full-audit CI wiring. These tests alone do NOT check the advisory database; the online npm audit in CI does.

## Provenance and limitations
A zero-vulnerability npm audit is a snapshot against advisories currently indexed by the npm registry. It does not prove that packages contain no undiscovered defects, that a build environment or its CI account cannot be compromised, or that user-generated CAD/evidence inputs are trusted. Audit updates and pin review must continue regularly.

## Acceptance
1. Runner-generated lockfile and manifest agree; `npm ci` succeeds under Node 22+ and the explicitly pinned npm 11.6.2, in both PR CI and Pages build.
2. All existing project tests, browser-engine build and new R21 regression tests pass.
3. Production audit finds 0 vulnerabilities.
4. Full audit (including build/test dependencies) finds 0 vulnerabilities and blocks new findings.
5. Verify temporary candidate workflow is absent from final changed tree, existing GitHub Pages workflow unmodified, and no CAD/EVIE/R7–R20 runtime state schema changed.
