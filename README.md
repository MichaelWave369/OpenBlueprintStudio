# OpenBlue

**OpenBlue** is a free, MIT-licensed, local-first blueprint and schematic studio. It continues the original **OpenBlueprint Studio** project.

## Features

- SVG drawing surface for walls, doors, windows, outlets and network drops.
- Live, lazy-loaded Three.js concept preview.
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
| D | Door |
| I | Window |
| O | Outlet |
| N | Network drop |
| Delete / Backspace | Delete selection |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Y / Ctrl/Cmd + Shift + Z | Redo |
| Escape | Cancel a wall chain / clear measurement |

## Data compatibility

The product and npm package are renamed, **not the saved data contract**. Existing `openblueprint.project/1` and `openblueprint.evie-proposal/1` schema versions and the `openblueprint-studio/project-v1` localStorage key are unchanged. Existing project exports remain importable.

See [EVIE CAD bridge documentation](docs/EVIE_CAD_BRIDGE_V1.md). The `examples/` proposal is **synthetic**, not a verified EVIE execution.

## License

[MIT](LICENSE). Dependencies have their own upstream terms.
