# Verification Plan

**Artifact:** OpenBlueprint Studio static web application  
**Candidate:** v0.1.0-candidate.1  
**Controlling version:** OBS-MPS-001 v0.1 Draft, SHA-256 `3db8154c63d70379186b04dd8e10ef413025afa91fc0b21ad4d232bbce37ad59`  
**Autonomy level:** Level 2 — Non-destructive verification  
**Plan status:** Approved by the user's direct Wayne Rider invocation

## Scope

### Included

- Controlling-specification and Forge chain-of-custody checks.
- Clean locked dependency install, unit suite, production build, point-in-time audit, and package integrity.
- Core model, malformed input, persistence adapter, geometry, SVG escaping/export, and static HTTP smoke.
- Source-level checks for external data transfer, WebGL 2 fallback branch, accessibility labels/focus, and GitHub Pages workflow structure.
- Browser/WebGL/interaction checks only if a genuine graphical browser capability exists.

### Excluded

- Source repair, public GitHub push, live Pages deployment, professional CAD/domain validation, cross-device lab, formal accessibility/security certification, and product-market research.

## Verification modes

| Test ID | Requirement | Mode | Preconditions | Procedure | Expected result | Evidence |
|---|---|---|---|---|---|---|
| T-001 | Chain of custody | Contradiction/release | Spec, handoff, candidate | Re-hash spec and validate Forge receipts | Hash matches; receipt checks pass | `test-receipts.json` |
| T-002 | NFR-01, NFR-06 | Smoke/regression | Node/npm | `npm ci`, unit tests, build | Exit 0; locked install; tests/build pass | Command log |
| T-003 | FR-07–FR-09, NFR-05 | Core/edge/failure | Unit suite and XML parser | Repeat tests; parse generated hostile-title SVG | Round trip works; malformed data rejected; SVG parses without script | Command log |
| T-004 | FR-01, FR-05, FR-12 | Smoke/release | Built `dist` | Serve and request HTML, initial JS, lazy Three chunk | HTTP 200 and relative asset resolution | Command log |
| T-005 | NFR-04 | Claim/security | Candidate source | Scan for network APIs/remote assets | No project-authored external transfer path detected | Command log |
| T-006 | FR-12 | Contradiction/release | Workflow and official guide evidence | Parse YAML and inspect SHA-pinned actions | Workflow parses and required job/steps exist | Command log |
| T-007 | FR-02–FR-06, FR-10–FR-11, NFR-02–NFR-03 | Core/stranger/accessibility | Graphical browser | Exercise mouse/keyboard/responsive layout | Defined user flows observed | Capability finding |
| T-008 | FR-05, NFR-07 | Failure/recovery | WebGL 2 and forced-unavailable browser cases | Render scene, suppress capability, preserve 2D | 3D works or clear fallback with no project loss | Capability finding |
| T-009 | Supply chain | Claim/release | npm registry | `npm audit --audit-level=high` | No current high-or-higher finding | Command log |

## Tool and access gates

- **Confirmed executable tools:** Node.js, npm, Python, shell, Vite/Vitest from locked install, curl, static HTTP preview.
- **Unconfirmed or absent tools:** Graphical browser executable, screen renderer, live GitHub repository and Pages settings, assistive-technology test environment.
- **Authorization required:** Public deployment and any repair.

## Stop conditions

- Destructive action outside isolated dependencies/build output.
- Controlling artifact hash mismatch.
- A discovered mandatory failure requiring source modification.
- Missing browser evidence prevents a release verdict; classify Unable to Verify rather than passing.
