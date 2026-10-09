# Milestone Build Plan

**Project:** OpenBlueprint Studio  
**Milestone ID:** OBS-M1  
**Candidate version:** v0.1.0-candidate.1  
**Autonomy level:** Level 2 — Bounded local implementation

## User outcome

A user can open a free static browser app, draw and edit a basic floor plan in 2D, inspect its live conceptual 3D extrusion, retain it locally, and export portable JSON or SVG files.

## In scope

- Canonical versioned project model and validation.
- Grid-snapped wall creation, selection, parameter edit, deletion, and history.
- Door, window, outlet, and network-drop symbols.
- Live lazy-loaded Three.js/WebGL 2 wall extrusion and graceful 2D fallback path.
- Local autosave, JSON round-trip, SVG export, sample/reset flow.
- Unit tests, static production build, preview smoke, MIT license, and GitHub Pages workflow.

## Out of scope / deferred

- Live GitHub publication, DWG/DXF/BIM, compliance decisions, collaboration, accounts, server storage, native packages, and professional domain validation.

## Deliverables

- React/Vite source and locked dependencies.
- `dist` static candidate.
- Tests, README, MIT license, Pages workflow.
- Forge evidence and Wayne handoff.

## File and component plan

| Path or component | Action | Requirement IDs | Notes |
|---|---|---|---|
| `src/model.js` | Create | FR-02–FR-10, NFR-05–NFR-06 | Canonical schema and pure geometry/mutations |
| `src/BlueprintCanvas.jsx` | Create | FR-02, FR-06, FR-10–FR-11 | SVG interaction surface |
| `src/ThreePreview.jsx` | Create | FR-05, NFR-02, NFR-07 | Derived lazy-loaded Three.js preview |
| `src/storage.js`, `src/svgExport.js` | Create | FR-07–FR-09, NFR-04–NFR-05 | Local adapters and portable output |
| `src/App.jsx`, `src/styles.css` | Create | FR-01–FR-12, NFR-03 | Shell, history, inspector, responsive UI |
| `src/*.test.js` | Create | NFR-05–NFR-06 | Model, persistence, and export checks |
| `.github/workflows/deploy.yml` | Create | FR-12, NFR-01 | Human-controlled Pages workflow |
| `README.md`, `LICENSE` | Create | NFR-08 | Usage, boundaries, license |

## Implementation sequence

1. Freeze specification and requirement register.
2. Implement canonical model, storage, and export helpers.
3. Implement 2D editor and application history.
4. Implement derived 3D preview and fallback status.
5. Add tests, documentation, license, and deployment workflow.
6. Install locked dependencies, test, build, serve, inspect, receipt, and hand off.

## Dependencies and capability gate

- **Available:** Node.js 24.14.0, npm 11.9.0, Python 3.12.13, local network access to npm registry, shell execution, static HTTP smoke capability.
- **Unavailable:** Graphical browser executable, live GitHub repository/Pages settings, cross-device matrix, qualified CAD/domain reviewer.
- **Authorization required:** Public repository push and GitHub Pages deployment.

## Local checks

- Vitest unit suite; Vite production build; package-lock parse; npm audit; source network-call scan; static HTTP response and lazy chunk response.

## Risks and blockers

- UI, WebGL scene, keyboard, and responsive visual behavior cannot be independently exercised without a browser runtime.
- Live Pages deployment is blocked by absent repository identity and publish authority.

## Stopping condition

All in-scope source exists, unit tests and build execute, static assets serve, evidence is captured, and the candidate is handed to Wayne without a release claim.

## Rollback path

Delete the isolated `openblueprint-studio` candidate directory; the frozen specification remains independently identifiable by hash.

## Wayne handoff requirements

- Verify specification coverage, repeat build/tests, inspect static package, exercise browser flows when capability exists, preserve failures, and classify release readiness separately from implementation completeness.
