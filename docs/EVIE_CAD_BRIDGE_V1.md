# EVIE to OpenBlueprint CAD Bridge: Rung 1

Status: Local file handoff only. Not a live EVIE job runner or authenticated agent connection.

## Source audit 2026-10-09
Inspected EVIE repo at 59e9f24905c1a728a0eb318fb69f88aca466db39: app/modules/__init__.py, app/modules_v2/registry.py, configs/workflows.json, feature manifest and repository tree.
EVIE has a functioning modular Python workflow architecture. However the named CAD cards concept_parser, floor_plan_generator and elevation_generator are not exposed as runnable modules by those registries, and a committed CAD workflow was not found. Cards may exist on a separate Sovereign Shelf that is not in this repository. Treat those as unverified until actual job-card records and execution receipts are provided.

## Contract
File schema: openblueprint.evie-proposal/1
Envelope: schemaVersion, source and project.
Source: system EVIE, cardId, runId and mode (fixture or generated). Claimed source information is untrusted.
Project: a fully valid openblueprint.project/1 project (metadata, walls, symbols).
Example: examples/evie-floorplan-demo.proposal.json. It is synthetic test data, not a real EVIE output.

## Review gate
1. Click EVIE CAD and select a JSON proposal locally; no network requests.
2. Validate envelope, labels, geometry, unique IDs and limits (5 MB; 400 total elements).
3. Display a non-editable SVG preview and show the proposed/current counts and unit system.
4. Reject leaves the current project untouched. Approve replaces it in a single undoable mutation; autosave then follows existing project behavior.
5. Export the current plan JSON before any replacement. Check all geometry for field safety.

Limitations: replacement rather than merge; 2D preview only; no authenticated producer evidence or run verification; no live EVIE card execution; no certified engineering dimensional checks. The plain JSON import button is an unrelated, less-governed feature.

Next rung: verify real Sovereign Shelf CAD cards, add a native EVIE producer, authenticate receipts, test producer/consumer interoperability, consider a read-only 3D preview and preserve provenance after approval.