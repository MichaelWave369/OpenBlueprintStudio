# OpenBlue

**OpenBlue** is a free, MIT-licensed, local-first blueprint and schematic studio. It continues the original **OpenBlueprint Studio** project.

## Features

- SVG drawing surface for walls, doors, windows, outlets and network drops.
- Live, lazy-loaded Three.js concept preview.
- **R15 portable field handoff packages:** consent-gated, nine-section offline JSON export for CAD, room annotations, pathway plans, racks, proposed topology, field evidence and R8/R12/R14 review snapshots. SHA-256 per-section/manifest integrity; import inspects without mutating local data. No signatures, external attachments, automatic approval or background network requests.
- **R14 field inspection checklist and review gate:** derive mandatory rack/switch/panel/drop/link/port-allocation checks from the R12 graph and R13 receipt ledger. Human-reviewed reported-PASS coverage, fail-closed design/scope blockers, latest-report precedence, and review-only JSON snapshot. A completion candidate is never installer authorization or independent physical verification.
- **R13 field evidence ledger:** record referenced, human-reported field observations on specific R12 nodes or edges; append human review receipts by a second person; automatically mark evidence stale when design fingerprints change. Separate local append-only receipt chain, schema-checked import/export; no automatic verification, signatures or real network tests.
- **R12 offline topology visualizer:** deterministic read-only SVG diagram of existing R8/R10/R11 proposals with clickable rack, switch, panel and drop nodes; separate rack membership, proposed logical links and panel/drop allocations. Local consistency ledger flags stale equipment, missing references, untraced pathways and unassigned room drops. No ping, SNMP, device execution or live diagnostics.
- **R11 governed logical topology:** create speculative switches in R10 rack slots, assign planned interface types per logical port, and propose unique switch-to-panel or switch-to-switch connections. Detect stale rack, U-slot conflicts, missing patch panels, incompatible interfaces and unallocated panel ports. Stored under an independent local sidecar; no live device discovery or operational link claims.
- **R10 conceptual rack and patch panel planning:** create virtual racks anchored to schematic network hubs, reserve 1U panel slots, allocate unique logical patch-panel ports to network symbols, and cross-check R9 pathway review status. Locally saved under its own versioned rack-plan sidecar. No actual link, switch, device, or installed-jack claims.
- **R9 operator-drawn pathway proposals:** choose a network hub/destination, click 2D waypoints (P), save an explicitly unapproved concept sketch, display derived polyline length and warn about wall-centerline contacts. Proposals are saved separately with an independent versioned localStorage contract; no implicit cable route or installation certification.
- **R8 IT planning:** read-only network-drop inventory by detected zone, reference-hub selection, minimum straight-line horizontal distances, optional noninteractive SVG guides and a portable review-only JSON snapshot. Exact shared-wall subsegments drive geometric adjacency, never implied doorways, network links or cable routes.
- **R7 room annotations:** select recognized regions on the 2D canvas or sidebar; edit name, planned use, and design notes. Annotated labels appear over zones. Metadata is saved locally as a separately versioned sidecar and can be exported/imported with explicit matching checks; blueprint and EVIE schema stay unchanged. Modified boundaries never silently inherit old notes.
- **R6 connected-room topology:** in-memory T-junction splitting and planar bounded-face detection handles shared partitions and the original sample layout without modifying stored walls. Switch to strict R5 analysis as a negative-control comparison. X-crossings, collinear overlaps, nested boundaries, and ambiguous interior spurs withhold area.
- **R5 conservative room analysis:** isolated, closed centerline wall loops yield approximate enclosed areas and optional noninteractive SVG region overlays. T-junctions, crossings, overlaps, nested loops, and degenerate geometry *withhold* misleading area claims. This is **not usable floor area** or certified survey output.
- **Fit 3D:** explicit camera framing based on wall and symbol bounds, including a recentered 3D ground plane; all camera movement stays outside project JSON and history.
- **R4 CAD editing:** drag selected wall endpoints with preview and one Undo step per drag; edit precise endpoint X/Y values in the inspector on blur/Enter.
- **True unit conversion:** feet ↔ meters scales wall coordinates, dimensions, symbols and grid as one validated edit. Out-of-range projects are rejected rather than silently clamped.
- **2D viewport:** zoom in/out, Fit, and Pan (H) are interface-only; they never change saved project geometry. SVG pointer mapping respects viewBox scaling and letterboxing.
- **Measure (M)**: click two grid points for a read-only distance and angle. A third click starts another measurement; Escape clears it. Measurements do not alter project history, JSON or autosave.
- Selected wall length and total wall centerline run, clearly distinct from certified perimeter/area calculations.
- Undo/redo, browser-local autosave, validated JSON import/export, scalable SVG export.
- EVIE CAD proposal-file review: read-only SVG preview, explicit approval/rejection and undo. **This is not a live EVIE agent connection or authenticated provenance.**
- Graceful 2D fallback when WebGL 2 is absent.

OpenBlue is a **concept** editor, not a professional CAD/BIM kernel, structural checker, building code engine or certified construction-document generator. Verify plans before field use.

## Local development

Requires Node.js 22+.

```bash
npm ci
npm run dev
npm test
npm run build
npm run preview
```

## GitHub Pages

Set **Settings → Pages → Source: GitHub Actions**. Merge to `main` or run **Deploy OpenBlue to Pages**. Vite uses a relative asset base for project Pages URLs.

The GitHub repository is still called `OpenBlueprintStudio` until manually renamed to `OpenBlue` under **Settings → General → Repository name**. After renaming, confirm the Pages URL and update links. See [R3 migration and measurement notes](docs/OPENBLUE_R3.md).

## Keyboard controls

| Key | Action |
|---|---|
| V | Select |
| W | Draw wall |
| M | Measure two points |
| H | Pan view (drag) |
| D | Door |
| I | Window |
| O | Outlet |
| N | Network drop |
| Delete / Backspace | Delete selection |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Y / Ctrl/Cmd + Shift + Z | Redo |
| Escape | Cancel a wall chain / clear measurement |

## R4 acceptance notes

- Unit conversions work for projects that remain within v1 numeric limits (wall thickness ≥ 0.1, height ≥ 0.5, finite coordinates, supported grid). Otherwise conversion is rejected without editing the plan.
- Drag wall endpoints in Select mode. The preview is not persisted until release; invalid geometry is rejected. Precise inspector edits are also validated.
- Zoom, pan and fit never enter JSON, browser autosave or undo history.
- Unit conversion is one undoable project edit, not a change of label.

## Data compatibility

The product and npm package are renamed, **not the saved data contract**. Existing `openblueprint.project/1` and `openblueprint.evie-proposal/1` schema versions and the `openblueprint-studio/project-v1` localStorage key are unchanged. Existing project exports remain importable.

See [EVIE CAD bridge documentation](docs/EVIE_CAD_BRIDGE_V1.md). The `examples/` proposal is **synthetic**, not a verified EVIE execution.

## License

[MIT](LICENSE). Dependencies have their own upstream terms.

## R5 area analysis safety

Area readouts are **conceptual areas enclosed by wall centerlines**, not net usable room measurements; door/window openings, wall thickness, jurisdictional codes, connected rooms and structural constraints are not modeled. The current sample plan intentionally produces a **topology warning** because it contains unsplit T-junctions. For an example of a supported rectangle, draw a four-wall loop sharing actual start/end coordinates, with no crossings or overlapping segments. See [R5 design gate](docs/OPENBLUE_R5.md).

## R6 topology limitations

The default **Connected wall faces (R6)** engine analyzes room-like *regions*, not authenticated rooms, structural partitions, or net usable floor area. Shared-wall statistics count actual normalized subsegments with bounded faces on both sides. **Isolated closed loops (R5)** remains available as a stricter comparison. In ambiguous geometry, it is safer to show no area than a false area. Analysis is calculated locally and never saved to project JSON, evie-proposal files, or the network. See [R6 topology contract](docs/OPENBLUE_R6.md).

## R7 local annotation sidecar

Select a recognized zone to assign a **name**, **planned use**, and **design notes**. These represent conceptual operator intent, not verified architectural room classifications. Labels are stored in local browser storage under `openblue/room-annotations-v1` and can be backed up as `*.rooms.json` using Export notes. Blueprints remain `openblueprint.project/1`; EVIE proposal files remain `openblueprint.evie-proposal/1`. Rooms are anchored by original wall IDs and cyclic boundary geometry normalized to meters, so feet-to-meters conversion preserves labels but boundary changes intentionally orphan old metadata. Incoming plan replacement clears the current active sidecar, so **export annotations before importing another plan or approving EVIE**. Room note imports only apply anchors matching the current project and current analysis mode, with confirmation. See [R7 data contract](docs/OPENBLUE_R7.md).

## R8 IT planning and false-precision boundary

Add `Network (N)` symbols, assign room labels through R7, and open the **Network drops** section of the inspector. Select any placed network drop as a proposed hub reference to show straight-line distances to other symbols. These are **horizontal geometric lower bounds only**. They are not wire-length estimates, cable paths, routing recommendations, connectivity graphs, building permission, capacity or standards certifications. On ambiguous topology, drop-to-room assignments are withheld. Review snapshot JSON is derived locally and does not alter the original project or EVIE proposal schemas. [R8 acceptance contract](docs/OPENBLUE_R8.md).

## R9 pathway proposals

Set a **reference hub** in R8, choose a **destination**, select *Trace/edit pathway (P)* in the Pathway Designer, click intermediate locations on the plan and press *Save proposal*. Paths are human-drawn and are not automatically routed or approved. Readout is total **horizontal 2D polyline length**, not cable length. Walls touched by any segment produce a review warning; "no centerline hits" does not establish a physically clear path. Route endpoints use existing network symbols; moving endpoint symbols makes saved routes stale until re-traced. Waypoints are stored in meters so unit conversion does not change their physical location. Explicit export/import is available for `openblue.pathway-proposals/1` JSON. Import requires matching live network endpoints and human confirmation. Replacing the plan clears the local pathway sidecar, so export first. See [R9 design notes](docs/OPENBLUE_R9.md).

## R10 rack and patch-port planning

Select an R8 reference hub, create a conceptual rack and add nominal 12/24/48-port patch panels. One patch panel consumes an **assumed** 1U slot; actual equipment dimensions are not verified. Select a free port and an existing unallocated network symbol to make an explicit, proposed one-to-one mapping. Each symbol may occupy at most one patch-panel port across the plan.

The optional R9 path review is associated by rack hub and drop ID: `untraced`, `wall-review`, `stale-pathway`, or `proposal-clear`. Even a clear result means only that the operator's drawn 2D sketch has no detected wall-centerline contact, **never** that a real cable, patch cord, switch port or network link exists.

Rack records use independent `openblue.rack-plan/1` localStorage and JSON exports. Move/remove an anchor network symbol and the corresponding rack flags stale or missing instead of remapping. Import validates the live project references and requires confirmation. Clearing/importing a plan or accepting EVIE resets the active rack sidecar, so export before replacing the drawing. Existing project/EVIE schema contracts are unchanged. See [R10 data contract](docs/OPENBLUE_R10.md).

## R11: Logical Switches and Topology

The **Switches & Links** panel builds on R10 racks and patch panels. Add an *unverified* switch in a free 1U slot, choose 8/16/24/48 nominal ports, and set per-port **assumed** RJ45 1G, RJ45 2.5G, or SFP+ 10G interfaces. Select ports to propose patch-panel terminations or switch-to-switch uplinks. The pure validator rejects incompatible interfaces, duplicate port occupancy and links to invalid switches, and the live review flags deleted panels, stale rack anchors and rack U-slot collisions caused by subsequent R10 edits.

**Every single connection is an operator-drawn intention, NOT actual connectivity.** R11 does not probe devices, retrieve hardware models, check switch/patch-cord compatibility, provision VLANs, measure PoE, test Ethernet reachability or establish cable certification. UI actions cannot change R10 port allocations, R9 pathways, R7 room annotations or the v1 blueprint and EVIE contracts.

Topology saves in a separate local-only `openblue.logical-topology/1` sidecar, with versioned JSON export/import and human confirmation. Import is refused if rack/panel references no longer match. Replacing a blueprint or approving an EVIE proposal clears active topology, so export first. Read the [R11 topology data contract](docs/OPENBLUE_R11.md).

## R12: Network Topology Map and static findings

The **Network Topology Map** joins currently loaded R8 network drops, R10 rack / patch-panel records and R11 logical switch and link proposals into an accessible, clickable SVG. Nodes carry their existing IDs and proposal state; the graph distinguishes rack membership (never a network edge), speculative switch or patch links, and R10's proposed panel-to-drop allocations. Select nodes to inspect their source record and related proposal edges.

The static findings ledger looks for missing referenced objects, stale rack anchors, switch U-slot conflicts, panel mapping inconsistencies, network drops without confidently detected rooms, and R9 paths that were not traced. **These are local consistency diagnostics, not network health tests.** A zero-warning graph proves neither cable continuity nor a working link. The diagram caps rendering at 28 nodes per category to protect browser performance, but the findings and JSON snapshot cover the complete in-memory proposal dataset.

Export **`openblue.topology-review/1` JSON** for a read-only review receipt. This is a derived snapshot, not a new editable sidecar. It never writes to or imports from CAD, EVIE or R7-R11 records; no network calls or device probes occur. See [R12 verification contract](docs/OPENBLUE_R12.md).

## R13: Field Evidence Ledger

The **Field Evidence Ledger** accepts an **operator-reported** observation against a specific current R12 node or edge. The operator must provide a name, method, claimed outcome (reported pass/fail/inconclusive), external evidence pointer (e.g. photo filename, field-test report ID, notebook reference), and optional notes. This does **not** upload a report, perform a network test, or establish an independent fact.

Every submission appends a receipt with sequence number, UTC timestamp, design-target fingerprint and prior receipt checksum and document-head checksum. Another named reviewer, different from the reporter, can explicitly append a decision to accept or reject the **report record**. Reports and earlier review events remain in the ledger; no edit-in-place or silent promotion of a proposed connection to live/verified status. Subsequent changes to the targeted design object flag its prior receipts stale. Removed targets become orphaned. New review of stale evidence is disallowed until fresh evidence is submitted.

The local browser sidecar is `openblue.field-evidence/1` at `openblue/field-evidence-v1`; exports capture the full append-only history, up to 400 events and 500 KB. Imports validate the event chain and require operator confirmation; no targets are silently remapped. The checksum is **noncryptographic** and only catches accidental corruption, NOT deliberate manipulation or proof of authorship, timestamps or physical installation. Back up before replacing/importing a blueprint or approving EVIE: those plan replacement operations reset the active evidence ledger.

All existing CAD, EVIE, room, pathway, rack and logical topology schemas are unchanged. [R13 evidence governance contract](docs/OPENBLUE_R13.md).

## R14: Field Inspection Checklist & Documentation Gate

The **Field Inspection Checklist** is a read-only, deterministic assessment of R12's proposed racks, switches, patch panels, network drops, logical links and panel-to-drop allocations together with R13's operator-entered reports and independent record reviews. Every required item has an explicit accepted report method: visual inspection for equipment, a reported link test for logical connections, and a reported cable test for panel/drop allocations. These methods are **reported by humans**, never run by OpenBlue.

The gate stays `HOLD_FOR_DOCUMENTATION` if any required component category is absent, a static R12 review issue exists, a planned route has not been drawn, a reported test fails, a report is inconclusive, a reviewer rejected it, its target has changed, or the newest report still awaits independent review. An older accepted PASS cannot override newer evidence.

Only when all six component categories exist, there are **zero static planning blockers**, and every item has a current, separately reviewed reported-PASS claim does OpenBlue show `DOCUMENTATION_REVIEW_CANDIDATE`. This means **ready to be inspected by an authorized human**, *not* construction authorization, independent device/cable verification, permission to drill, network connectivity or regulatory compliance.

R14 uses no new writable sidecar and changes no existing CAD/EVIE/R7-R13 schemas. Export `openblue.field-readiness-review/1` JSON for a read-only checklist receipt, including evidence receipt IDs and unresolved actions. See [R14 readiness criteria](docs/OPENBLUE_R14.md).

## R15: Portable Field Handoff Package

The **Field Handoff Package** panel exports the active project into a single operator-authorized `*.openblue-field-handoff.json` file, including the v1 blueprint, R7 annotations, R9 pathways, R10 rack inventory, R11 logical topology, R13 human-reported evidence receipt ledger, and read-only snapshots from R8 network planning, R12 topology and R14 documentation checklist. The export includes exactly **nine schema-checked sections**. The R13 ledger references external evidence as filenames/IDs, **not embedded attachments**.

Each section has an independent **SHA-256** digest and byte count; a manifest digest is also checked on inspection. This is a **consistency check**, not proof of origin, reporter identity, signing, tamper-resistant history or independently observed field conditions. A malicious editor can rewrite data and all included hashes. Recipients need a trusted out-of-band source for authenticating authorship and checking actual photos/test reports.

**Import is PREVIEW ONLY:** the inspector validates nested formats and hash matches, shows inventory/report counts, embedded readiness state, and known missing blueprint network references. It does not change project geometry, localStorage sidecars, EVIE proposals, route drawings, approvals, or ledger events. R8/R12/R14 derived snapshots are retained as authored, not independently recomputed or certified on import. No network calls or automatic device probes.

Packages are bounded to 7MB, with 2.5MB per section. Export requires explicit privacy acknowledgment and browser confirmation because technician/reviewer names, project layouts and evidence references may be sensitive. Uses browser WebCrypto SHA-256 with secure context required. See [R15 data and handoff contract](docs/OPENBLUE_R15.md).
