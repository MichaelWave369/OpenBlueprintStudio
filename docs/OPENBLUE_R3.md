# OpenBlue R3: rename and measurement

## Rebrand boundary

- Product name: **OpenBlue** (UI: OpenBlue Studio).
- Previous name: OpenBlueprint Studio.
- Package: `openblue`; proposed version `0.2.0`.
- Repo remains `MichaelWave369/OpenBlueprintStudio` until the owner renames it via **Settings → General → Repository name → OpenBlue**.
- Recheck the Pages published URL, deploy workflow, README, FieldAtlas and EVIE links after repo rename. An old repository redirect does **not** guarantee the old Pages path will work.
- Historical frozen specifications and evidence retain their original names.

## Compatibility gate

Do not silently change `openblueprint.project/1`, `openblueprint.evie-proposal/1`, or `openblueprint-studio/project-v1`. No project reserialization, schema migration, or storage migration is necessary for a brand rename.

## Ruler behavior

1. Choose Measure (M), then click start/end grid-snapped points.
2. Display length and angle in declared project units. Zero-length second clicks are ignored; a third click starts again.
3. Escape or switching tools clears the measurement. Neither a preview nor a completed measurement is saved to the model, undo stack, JSON or localStorage.
4. Angles are in degrees with Y increasing down the SVG/model canvas.
5. Wall run sums all wall centerline lengths and is not a floor perimeter, floor area, material estimate, or code validation.
6. Existing units dropdown **relabels without converting numbers**. Future rung must implement actual unit conversion with tests.

## Manual acceptance

- Load a saved legacy project and import a legacy JSON export.
- Measure horizontal, vertical, diagonal and reverse spans.
- Measure across wall/symbol hit areas and empty canvas.
- Switch tools and press Escape, then check undo/redo and autosave unchanged.
- Test 2D-only fallback, mobile/narrow layout and PR CI (`npm ci`, `npm test`, `npm run build`).

## Next work

Accurate unit conversion, editable wall endpoints, zoom/fit, polygon room-area calculation with geometry ambiguity checks and verified EVIE producer receipts.
