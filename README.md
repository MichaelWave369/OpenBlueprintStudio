# OpenBlueprint Studio

OpenBlueprint Studio is a free, MIT-licensed, local-first blueprint and schematic editor. The v0.1 candidate provides a grid-snapped SVG drafting surface and a live Three.js/WebGL 2 concept preview in a static React app.

## What the v0.1 candidate does

- draw and select walls on a configurable grid;
- edit wall height and thickness;
- place and move door, window, outlet, and network-drop symbols;
- undo and redo drawing mutations;
- autosave to browser local storage;
- import/export a validated, versioned JSON project;
- export a standalone SVG concept drawing;
- degrade to a usable 2D editor when WebGL 2 is unavailable;
- build as static assets suitable for GitHub Pages.

It is not a professional CAD kernel, BIM platform, engineering-analysis tool, code-compliance checker, or certified construction-document system. Verify dimensions and requirements before field use.

## Run locally

Requirements: Node.js 22 or newer and npm.

```bash
npm ci
npm run dev
```

Then open the local URL printed by Vite.

## Test and build

```bash
npm test
npm run build
npm run preview
```

The production assets are written to `dist/`. Vite uses a relative asset base so the package works under a GitHub project-pages path as well as a local static preview.

## GitHub Pages

1. Push this repository to GitHub with the default branch named `main`.
2. Open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` or manually run the included **Deploy OpenBlueprint Studio to Pages** workflow.

The workflow tests and builds before uploading `dist`. Publication remains a human-controlled repository action.

## Keyboard controls

| Key | Action |
|---|---|
| V | Select |
| W | Draw wall |
| D | Place door |
| I | Place window |
| O | Place outlet |
| N | Place network drop |
| Delete / Backspace | Delete selection |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z | Redo |
| Escape | End/cancel wall chain |

## Project data

The JSON interface is versioned as `openblueprint.project/1`. Imports are parsed as data, validated, and rejected before replacing the current project if the schema is malformed or unsupported. No project telemetry or automatic cloud upload is included.

## License

Project-authored source is available under the [MIT License](LICENSE). React, Three.js, Vite, Vitest, and GitHub Actions retain their own upstream licenses and terms.