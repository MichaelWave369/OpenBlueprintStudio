# OpenBlue

**OpenBlue** is a free, MIT-licensed, local-first blueprint and schematic studio. It continues the original **OpenBlueprint Studio** project.

## Features

- SVG drawing surface for walls, doors, windows, outlets and network drops.
- Live, lazy-loaded Three.js concept preview.
- **R24 Mobile & Keyboard Accessibility:** responsive 360–390px layouts, first-focus skip link, visibly outlined keyboard focus and native coordinate-based wall entry with Undo; seven real Chromium E2E scenarios now gate regressions. This is not full WCAG certification.
- **R22 Operator Self-Test:** explicit privacy-safe, read-only health checks for active schema, local autosave comparison, R17 vault and R19 checkpoint integrity, R18 static consistency, R20 isolated recovery, browser capabilities and approximate storage headroom. No telemetry, uploads, repairs or real-device checks.
- **R21 complete dependency security cleanup:** Vitest and its mocker, nanoid and source-map-js updated via a tool-generated lockfile; the full npm audit (including development/build tools) is now a blocking CI gate, with pinned-version regression tests. No application/CAD behavior changes.
- **R20 Recovery Confidence Drill & Dependency Gates:** run a read-only isolated seven-key restore/load/rollback rehearsal against any active project, saved checkpoint or named project; export a simulated result, not an authorized backup. CI gates high-severity production npm audit results, while reporting full dev/build advisories separately without falsely claiming them fixed.
- **R19 Project Timeline & Recovery Checkpoints:** explicit local full-workspace checkpoints, bounded four-entry history with off-browser JSON backups, read-only ID-level version comparison, and governed restore with mandatory pre-recovery safety checkpoint, R18 audit and R17 rollback-on-write-failure. No automatic changes, merges, trusted timestamps or field certification.
- **R18 recovery and integrity audit:** schema-validate all six documents and reconcile saved room, pathway, rack, topology and human-field-evidence relationships before opening a snapshot. Pure read-only findings and JSON reports; block malformed restores, explicitly acknowledge inconsistent-but-loadable snapshots, and allow verbatim export of an unreadable raw browser vault before reset.
- **R17 multi-project local vault:** save up to six full, versioned project snapshots including CAD, room annotations, pathways, racks, switches, R13 evidence and room/hub preferences. Explicit save/overwrite/delete, individual JSON backup/import, and confirmed restore with pre-switch safety snapshot, guarded active-storage rollback and reload. Browser storage is not cloud backup.
- **R16 focused workspace navigation:** five inspector workspaces (Overview, Design, Network, Field, Handoff) replace a giant all-tools stack. An overview summarizes the one current local project and its governed sidecars. Session-only handoff browser indexes up to 12 validated or rejected JSON summaries with no raw file retention, import, or automatic approval.
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

## R16: Workspace & Session Handoff Browser

R16 organizes the right-side OpenBlue inspector into five focused areas: **Overview** (active project summary and direct links), **Design** (selected geometry, room notes and project settings), **Network** (R8–R12 paths, racks, logical topology and the interactive diagram), **Field** (R13 evidence reports and R14 documentation gate), and **Handoff** (R15 export plus a session handoff browser). The left-side blueprint and 3D preview stay present while navigating workspaces.

The overview summarizes **only the current active browser-saved blueprint and its loaded sidecars**. It is not a multi-project database, doesn't silently back up or switch project slots, and doesn't change existing CAD/EVIE/storage formats. Use manual JSON import/export for active blueprint changes.

The **Handoff Browser** allows a user to select up to twelve local handoff JSON files at a time; each is validated using the existing R15 nine-part SHA-256 inspector. A bounded, **in-memory-only** shelf holds filename, inspected timestamp, validation outcome and safe derived summary. It does not retain source JSON bytes, embedded project contents, attached files or cloud state, and disappears on reload. Duplicate successful manifest digests are collapsed. Failed files appear with a clear reason. The user can inspect, remove or clear entries; none of these actions applies any imported sections to the active project. File contents remain where the user saved them.

Integrity checks are consistency checks against an **unsigned** manifest, never proof of identity, origin, measured connectivity or approval. See [R16 navigation and browser contract](docs/OPENBLUE_R16.md).

## R17: Local Multi-Project Workspace Vault

The Overview workspace now provides a **Project Library** for up to six operator-named saved snapshots. Each snapshot is a complete, validated capture of exactly six mutable documents: the canonical blueprint, R7 room metadata, R9 pathways, R10 rack/port inventory, R11 logical topology, and R13 append-only human evidence report/review receipts. It also records room-analysis mode and the current schematic network-hub selection (if that network symbol still exists).

Saving or updating a named snapshot is **explicit**, not an implicit background change to that snapshot. The active editor continues to autosave under existing v1/sidecar keys. Opening a different saved workspace first attempts to save a separate **pre-switch safety snapshot** of the active workspace, then writes all six active document storage keys and the preferences key as a guarded group, validates readback and reloads the page. On write failure, the code attempts rollback to the previous values and does not intentionally activate the target. Opening is blocked when the library has no spare slot for the safety snapshot, or an EVIE review/draft route is unfinished.

The vault uses new `openblue.project-vault/1` records under `openblue/project-vault-v1`, with a conservative cap of six snapshots, 1.5 MB each and 3.5 MB total to reduce browser quota problems. Per-slot `openblue.workspace-backup/1` JSON exports provide **off-browser backup**; imports validate all documents and add a new snapshot only, never auto-activate. Browser storage may be cleared, unavailable or reach quota, and vault exports can contain identifying site details and manually entered technician information.

Existing source schemas and EVIE review contracts are unchanged, and project opening does not import R15 unsigned handoff packages or upgrade reported-pass claims to certified results. See [R17 vault and switching contract](docs/OPENBLUE_R17.md).

## R18: Project Recovery & Integrity Audit

The Overview workspace now includes **Project Recovery & Integrity**, a read-only audit for the active design or any R17 saved project snapshot. The audit validates every original source schema (blueprint, room annotations, operator pathways, rack inventory, conceptual logical topology and field evidence), then recreates the relevant room/network/topology/evidence analyses from the saved records. It surfaces orphaned room labels, stale hub IDs, moved/removed pathway endpoints, rack-anchor problems, broken logical references and human evidence receipts tied to stale/missing design objects.

- `STRUCTURALLY_CONSISTENT`: all documents parse and no recognized *review-severity* cross-document inconsistencies were found. Informational warnings and `HOLD_FOR_DOCUMENTATION` may still apply. **NOT** proof of physical installation, real device connectivity or safety approval.
- `RESTORABLE_WITH_FINDINGS`: six documents parse, but there are reference issues requiring a separate explicit acknowledgment before the R17 safety-backup/open workflow. Nothing is auto-repaired or silently rebound.
- `RESTORE_BLOCKED`: document validation or full reconciliation failed. An invalid snapshot cannot be opened from this flow. Retain the original backup and investigate.
- Derived audit export `openblue.workspace-audit/1` is review-only and introduces **no new persistent source schema**.
- If the R17 vault itself cannot be parsed, **Download original unreadable vault** allows verbatim operator-owned preservation before the preexisting explicit reset action; it does not fix or trust the damaged data.

On Open, the R18 preflight runs automatically *before* R17 takes its independent pre-switch snapshot and performs its guarded local-storage restoration. A valid-but-inconsistent snapshot requires additional user confirmation; corrupted schemas are blocked. See [R18 restore preflight contract](docs/OPENBLUE_R18.md).

## R19: Project Timeline & Recovery Checkpoints

The Overview workspace offers an explicit **Project Timeline & Recovery** panel. Each local checkpoint stores the same six mutable source documents and per-project room analysis/network hub preferences as an R17 complete workspace. The timeline deliberately captures **manual save points only**, not every UI edit, and does not create a fake cryptographic history.

Users can compare the active design or any checkpoint against another saved checkpoint. The `openblue.project-diff/1` review-only result reports ID-level additions, removals and changed records across CAD walls/symbols, room annotations, R9 operator routes, R10 racks/allocations, R11 switches/links, R13 evidence receipts and relevant project/analysis settings. Updated timestamps alone do not count as changes. The comparison is a **logical record diff**, not a visual/physical change measurement or record of authenticated authorship. Differences between project titles or missing evidence receipts are explicitly warned about.

Checkpoint recovery is **always a complete workspace replacement**, never a selective merge, and requires:

1. No staged EVIE approval or unfinished R9 path draft.
2. Successful source validation, R18 preflight and additional acknowledgment of any review findings.
3. A free timeline slot to save a NEW, independent pre-recovery snapshot of all active source documents first.
4. Explicit confirmation of changes and full-document replacement.
5. Successful timeline save, then R17's existing guarded seven-key localStorage restoration with readback/rollback on failure; finally full editor reload to prevent mixed React state.

A full timeline **blocks recovery** until the operator exports/deletes an older checkpoint. The archive uses new `openblue.project-timeline/1` JSON at `openblue/project-timeline-v1`, max four checkpoints, 1.5 MB per complete workspace and 3.5 MB per timeline. Individual `openblue.project-checkpoint/1` backup files can be downloaded and explicitly imported **to the timeline only**, without applying active data. Corrupt stored timelines remain untouched unless the operator elects to download original bytes and explicitly reset.

This archive is shared across browser projects; matching title/ID alone does **not prove versions represent the same site**. Browser storage is limited and may be cleared; critical data needs external backups. No existing blueprint/EVIE or R7–R18 source schema is changed. See [R19 checkpoint & comparison contract](docs/OPENBLUE_R19.md).

## R20: Recovery Confidence Drill & Dependency Security Gates

OpenBlue's Overview now includes **Recovery Confidence Drill**, a deliberately **memory-only** dry run of a complete project recovery. Select the active project, an R19 saved checkpoint, or an R17 named project snapshot. The drill validates the six source documents (including the R13 receipt chain), runs the R18 static reference audit, creates a private in-memory Storage implementation, writes a disposable baseline, then invokes **the real R17 seven-key `restoreWorkspaceInStorage` code** to stage and reload the selected workspace with all standard source loaders. It compares the normalized complete state. Finally it deliberately makes the fourth storage write throw, checks the original complete baseline survived the existing rollback path, and reports each test outcome.

No live `localStorage`, actual user-file backup, active React project, server, network device or physical installation is changed. The report format `openblue.recovery-drill/1` is an unsigned **simulation result**, not proof of real browser quota behavior, disk durability, original author identity or field-certified evidence. The operator can export the review-only JSON report.

In GitHub Actions, R20 adds a **gating** `npm audit --omit=dev --audit-level=high` check for high/critical advisories in packages used by the shipped application, plus a separate **nonblocking** full `npm audit --audit-level=high` to visibly record unresolved build/test dependency advisories. The full audit's warnings are **not fixed or excused by a green production audit**; they require follow-up security review and selective dependency upgrades. The existing `npm ci`, `npm test`, `npm run build` still gate the PR. See [R20 recovery and security contract](docs/OPENBLUE_R20.md).

## R21: Complete Dependency Security Cleanup

The dependency remediation eliminates the four R20 advisory reports by patching Vitest/mocker to 4.1.11, nanoid to 3.3.20, and source-map-js to 1.2.2. Lockfile generated by npm on a temporary GitHub runner, checked into source control, and verified by the normal CI runner. `npm ci`, `npm test`, `npm run build`, the high-severity production audit, and a **blocking full `npm audit --audit-level=low`** must all pass. No R1–R20 CAD, EVIE, evidence, project vault, handoff or recovery schema changed. See [R21 dependency security notes](docs/OPENBLUE_R21.md).

**Toolchain note (R21):** Use Node 22+ and **npm 11.6.2** for local installs (`npm install --global npm@11.6.2`, then `npm ci`). GitHub CI and Pages both pin this npm version. Stock npm 10.9.9 does not accept the npm 11-generated lockfile and cannot regenerate it reliably. Do not manually modify lockfile integrity hashes.

## R22: Operator Self-Test

The Overview workspace has a new **Run complete local self-test** control. No checks are initiated silently at startup: operator explicitly clicks the button, and every diagnostic reads the current in-memory project and browser's existing saved copies **without writing to localStorage**. It also runs the R18 read-only reference review and R20 *isolated-memory-only* recovery/rollback test of the active complete workspace. Browser capability checks cover file import/export, secure-context SHA-256, and optional WebGL2. Where supported, an estimated storage quota and usage ratio are read without attempting a write.

The self-test reports `LOCAL_CHECKS_PASSED`, `OPERATOR_ATTENTION`, or `OPERATOR_REVIEW_REQUIRED`. It does not confuse missing first-run/autosave keys with corrupt data; a current-vs-persisted mismatch is **WARN** because an autosave may be pending. Corrupt stored source, project vault, or timeline remain untouched and fail visibly. A full audit displays generic status codes and counts, and its `openblue.operator-self-test/1` JSON export deliberately omits project geometry, site titles, reporter identities, file contents, and field evidence receipts.

A passing health check is **not proof of durability, device connectivity, construction authorization, an actual browser restore, cryptographic authenticity, or installer approval**. It cannot detect all browser storage failures or guarantee external backup safety. See [R22 Self-Test contract](docs/OPENBLUE_R22.md).

## R23: Real Chromium regression gate

R23 adds a blocking production-preview Playwright browser suite covering wall drawing + autosave reload + SVG export, R17 Project Library isolation/safety snapshots, R19 checkpoint restore and R22 private diagnostics export. Run `npm run build`, `npx playwright install chromium`, then `npm run test:e2e` under Node 22+ and npm 11.6.2. See [R23 E2E contract](docs/OPENBLUE_R23.md).

## R24: Keyboard Wall Entry & Compact Mobile Layout

Use the **Keyboard wall entry** disclosure under the 2D canvas to create a wall by entering start/end X/Y coordinates, snapped to the current grid. Tab through the inputs and press Enter to add a normal wall; use Undo as usual. A first-Tab skip link jumps to workspace navigation, and focus indicators stay visible. On narrow 360–390px browsers, OpenBlue retains horizontally scrollable drawing tools and two-column actions while preventing page-wide overflow. Chromium tests verify mobile checkpoint usage and keyboard wall creation. See [R24 accessibility test contract](docs/OPENBLUE_R24.md).
