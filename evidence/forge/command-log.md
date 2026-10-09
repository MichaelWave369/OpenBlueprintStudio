# Forge Command and Local-Check Log

**Project:** OpenBlueprint Studio  
**Candidate:** v0.1.0-candidate.1  
**Environment:** Linux 6.12.13 x86_64; Node v24.14.0; npm 11.9.0; Python 3.12.13; UTC

## Dependency install

```bash
NPM_CONFIG_CACHE=/workspace/scratch/74bfbbfbb49a/.npm-cache npm install --no-audit --no-fund
```

Observed: exit code 0; 57 packages added; `package-lock.json` created. The npm environment emitted a non-failing warning about a future `http-proxy` config change.

## Unit tests

```bash
NPM_CONFIG_CACHE=/workspace/scratch/74bfbbfbb49a/.npm-cache npm test
```

Observed: exit code 0; Vitest v4.1.10; 3 test files passed; 9 tests passed; duration 188 ms in the retained final Forge run.

## Production build

```bash
NPM_CONFIG_CACHE=/workspace/scratch/74bfbbfbb49a/.npm-cache npm run build
```

Observed: exit code 0; Vite v8.2.0; 25 modules transformed. Output included a 213,770-byte initial JavaScript chunk, a separately lazy-loaded 547,896-byte Three.js preview chunk, 9,525 bytes of CSS, source maps, HTML, and favicon. No build warning remained after explicit code splitting and a documented 600 kB lazy-chunk threshold.

## Dependency audit

```bash
NPM_CONFIG_CACHE=/workspace/scratch/74bfbbfbb49a/.npm-cache npm audit --audit-level=high
```

Observed: exit code 0; npm reported 0 vulnerabilities. This is a point-in-time registry result, not a security certification.

## Static preview smoke

```bash
npm run preview -- --host 127.0.0.1
curl -fsS http://127.0.0.1:4173/
curl -fsSI http://127.0.0.1:4173/assets/index-DQnmYOxE.js
curl -fsSI http://127.0.0.1:4173/assets/ThreePreview-ZRAiq3jZ.js
```

Observed: preview served on port 4173; index HTML returned; both initial and lazy 3D JavaScript assets returned HTTP 200. This establishes static serving and asset resolution, not browser rendering or interaction.

## Static integrity and privacy-oriented source scan

```bash
node -e "JSON.parse(require('fs').readFileSync('package-lock.json','utf8'))"
rg -n "https?://|fetch\\(|XMLHttpRequest|WebSocket|sendBeacon" src public index.html
```

Observed: lockfile parsed. Matches were limited to SVG XML namespace literals; no fetch, XHR, WebSocket, sendBeacon, remote font, or application HTTP endpoint was detected in project-authored client source.

## Identified artifact hashes

- `package-lock.json`: `11b5ef41eff4c8c46213b37676421dd820dd0d8b927c48d42f9d5eab329154cf`
- `dist/index.html`: `53285be2fcb470934f7f7e1b72295db90fc712291b49708a4f32acc8a8d827c3`

## Capability boundary

No graphical browser executable was present. The Forge did not claim browser rendering, WebGL output, pointer/keyboard behavior, responsive layout, or accessibility conformance from unit tests, build output, or HTTP responses.
