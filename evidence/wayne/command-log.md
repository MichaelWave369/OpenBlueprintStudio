# Wayne Rider Independent Command Log

**Candidate:** OpenBlueprint Studio v0.1.0-candidate.1  
**Execution date:** 2026-08-02 UTC  
**Autonomy:** Level 2 — Non-destructive verification

## Intake and chain of custody

The controlling specification re-hashed to `3db8154c63d70379186b04dd8e10ef413025afa91fc0b21ad4d232bbce37ad59`. Its strict final checker returned 0 errors and 0 warnings. Forge build-receipt validation passed; coverage reported 20 total requirements, 15 mandatory, all 20 covered by receipts; the Forge report checker returned 0 errors and 0 warnings.

## Clean install

```bash
NPM_CONFIG_CACHE=/workspace/scratch/74bfbbfbb49a/.npm-cache npm ci --no-audit --no-fund
```

Observed exit code 0; 59 packages installed from the lockfile. The environment emitted a non-failing npm `http-proxy` deprecation warning.

## Independent unit/regression run

```bash
NPM_CONFIG_CACHE=/workspace/scratch/74bfbbfbb49a/.npm-cache npm test
```

Observed exit code 0; Vitest v4.1.10; 3 files passed; 9 tests passed; duration 292 ms. The fixtures cover project round-trip, invalid schema/JSON/geometry, unique IDs, wall geometry, immutable mutations, local persistence/corrupt storage, SVG fields, concept notice, and hostile-title escaping.

## Independent production build

```bash
NPM_CONFIG_CACHE=/workspace/scratch/74bfbbfbb49a/.npm-cache npm run build
```

Observed exit code 0; Vite v8.2.0; 25 modules transformed; initial JS 213,770 bytes; lazy Three preview JS 547,896 bytes; CSS 9,525 bytes; build completed in 784 ms with no Vite warning.

## Edge and failure probes

- Generated an SVG from a project titled `<script>wayne-check</script>`, piped it directly into Python ElementTree, and asserted that the XML parsed with zero `script` elements. Observed: `SVG XML parsed; script elements: 0`.
- Parsed `.github/workflows/deploy.yml` with Python YAML and asserted both `build` and `deploy` jobs. Observed: `Workflow YAML parsed; jobs: ['build', 'deploy']`.
- Scanned project-authored client source for fetch, XHR, WebSocket, sendBeacon, remote font, and application HTTP endpoint patterns. Only SVG XML namespace literals matched the broad URL expression.
- Located the explicit `getContext('webgl2')` capability check, 2D fallback status message, ARIA labels, and visible focus rule. This is source evidence, not browser behavior evidence.

## Static package smoke

Started `vite preview` on 127.0.0.1:4173. The HTML contained relative initial JS/CSS paths. HTTP 200 was observed for the initial JavaScript, lazy Three preview JavaScript, and favicon. Final hashes remained:

- `dist/index.html`: `53285be2fcb470934f7f7e1b72295db90fc712291b49708a4f32acc8a8d827c3`
- `package-lock.json`: `11b5ef41eff4c8c46213b37676421dd820dd0d8b927c48d42f9d5eab329154cf`

## Dependency claim check

```bash
NPM_CONFIG_CACHE=/workspace/scratch/74bfbbfbb49a/.npm-cache npm audit --audit-level=high
```

Observed exit code 0; npm reported `found 0 vulnerabilities`. This is time-bound registry evidence, not a security certification.

## Capability finding

`chromium`, `chromium-browser`, and `google-chrome` were not present. Therefore no actual DOM rendering, WebGL frame, pointer/keyboard flow, responsive viewport, focus traversal, reload persistence, file download dialog, or forced WebGL-failure behavior was observed. Those criteria are classified Unable to verify, not Passed.
