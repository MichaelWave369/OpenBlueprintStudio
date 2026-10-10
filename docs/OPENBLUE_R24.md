# OpenBlue R24 · Responsive UI and Keyboard Accessibility

## Goal
Make OpenBlue Studio more usable at small browser widths and make basic CAD wall creation available when pointer drawing is inaccessible. CI now exercises real Chromium keyboard and mobile-layout interactions in addition to R23's desktop workflows.

## Implemented
- **Skip link:** first focusable element links directly to the existing five-way workspace navigation. The navigation has a stable fragment ID and is programmatically focusable for native keyboard movement.
- **Keyboard wall entry:** a collapsed native `details/summary` control below the 2D canvas. Press Enter or Space to open, Tab between start/end X/Y numeric inputs, then submit via Enter. Input values are bounded to the native model's ±10000 coordinate range, snapped to the current project grid, and checked for nonzero separation.
- **One native CAD source:** the form creates an ordinary `createWall` model object, passes through the existing `addWall` validator and `commit` Undo history, sets the Design workspace, and leaves the 2D pointer tools intact. No parallel shadow geometry or new persistent schema.
- **Visible keyboard focus:** stronger 3px focus rings for actionable inputs, summary, canvas and navigation. Project title retains visible focus despite its custom borderless appearance.
- **Compact responsive layouts:** 360–390px viewport top actions wrap to two usable columns, drawing tools remain horizontally scrollable, editor grid preserves both canvas and coordinate form, and inspector/headers allow content to wrap without document-level horizontal overflow.

## Browser acceptance tests
The R23 production-preview Chromium job adds:
1. Keyboard-only navigation using a first-Tab skip link, native summary activation, four coordinate fields, Enter-to-create and keyboard Undo. Verify real browser autosave count.
2. 390px viewport: document has no unexpected horizontal overflow, core navigation and toolbar remain available, and an R19 checkpoint can be saved and read back from browser storage.
3. 360px viewport: project title, keyboard wall-entry control and workspace navigation remain accessible without document-wide horizontal overflow.

R23's existing real desktop workflows (SVG download, R17 project switching and safety snapshot, R19 recovery and R22 self-test export) remain required. Total R24 browser gate: seven E2E scenarios.

## Explicit limitations
- Keyboard wall entry supports basic line-wall creation, not complete keyboard access to every 2D canvas operation, 3D interaction or semantic room geometry.
- Passing 360/390px Chromium browser tests is not a WCAG conformance assessment, iOS/Android test, screen-reader audit or touchscreen precision study.
- Device/browser accessibility settings and zoom can affect layout. Focus rings and CSS compactness are first usability gates, not a universal accessibility certification.
- All human field evidence remains human-reported; no automatic network scans, installed-site verification, security privilege change or document repair is introduced.

## Local validation
Node 22+, npm 11.6.2:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

All R21 dependency audits remain blocking, the R23 Chromium job runs automatically in CI, and GitHub Pages continues deploying the same output after merge.
