# OpenBlue

**OpenBlue** is a free, MIT-licensed, local-first blueprint and schematic studio. It continues the original **OpenBlueprint Studio** project.

## Features

- SVG drawing surface for walls, doors, windows, outlets and network drops.
- Live, lazy-loaded Three.js concept preview.
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
