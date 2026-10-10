# OpenBlue R23 · Real Browser End-to-End Regression Gate

## Purpose
R1–R22 exercised parsing, static reviews, recovery and field evidence heavily in Vitest, but those tests did not prove the assembled production user interface can complete workflows end-to-end.

R23 adds a **real Chromium browser test gate** against the **built Vite production preview**, using `@playwright/test` and a pinned npm lockfile. It has an isolated fresh browser context for each test, a private temporary localStorage store and no external API credentials.

## Test scenarios
1. Launch production bundle, verify the Blueprint and workspace navigation mount, then choose Design, explicitly confirm Clear, draw a wall with pointer input on the real SVG, verify autosave survives a page reload and export an SVG download.
2. Save project Alpha with one wall in the R17 Project Library; change geometry and title to project Beta with two walls and save a second slot; open Alpha through the real R18 preflight/consent/reload path; verify the entire editor returns to Alpha and a separate pre-switch safety slot contains Beta's complete blueprint, not a mixed document.
3. Create an R19 complete checkpoint, change active project title, recover the previous checkpoint via the real confirmation, and verify the active project and independent pre-recovery snapshot were both persisted.
4. Trigger R22 Operator Self-Test from the actual browser, verify all nine check rows render, export the JSON result and prove it excludes a private site title and known geometry IDs.

## CI contract
- `verify` retains npm ci, full Vitest, production build, production dependency audit and full blocking audit.
- `browser-e2e` is a **separate required job after verify** with Node 22, npm 11.6.2, pinned `@playwright/test`, Chromium + system dependencies, a fresh production build and `npm run test:e2e`.
- Playwright config uses the Vite production preview on localhost port 4173, one worker for deterministic localStorage tests, one CI retry, screenshots and traces on failed runs, and a test report artifact only on failure. Each test has a new browser context; no live user projects are loaded.
- The temporary npm lockfile generation workflow used during authoring must be removed before merge.

## What this does NOT establish
- Passing browser E2E is not proof of accessibility conformance across browsers, real field safety, device testing, malicious-proof evidence, multi-tab quota resilience or persistent offsite backups.
- Chromium on one desktop viewport is an intentionally narrow regression gate; future rungs can add responsive mobile, alternate browser engines, keyboard accessibility and live deployment smoke.
- The tests auto-accept dialogs *only in an isolated testing profile*. Production confirms and human approval boundaries are unchanged.

## Developer
Use **Node 22+ and npm 11.6.2**:
```sh
npm ci
npm run build
npx playwright install chromium
npm run test:e2e
```
Playwright opens the built app via `npm run preview`. For traces, inspect `test-results` and `playwright-report`.
