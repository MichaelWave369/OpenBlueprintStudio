# Wayne Requirements Register

| ID | Criterion | Authority/source | Test method | Evidence required | Initial status | Dependency |
|---|---|---|---|---|---|---|
| AC-001 | Controlling spec and Forge chain remain identifiable and internally valid | OBS-MPS-001 / handoff | Hash and packaged checkers | Matching hashes and zero checker errors | Candidate | Python/checker scripts |
| AC-002 | Locked install, all 9 unit tests, and production build repeat successfully | NFR-01, NFR-06 | Fresh command execution | Exit codes and output | Candidate | npm registry/Node |
| AC-003 | Project validation rejects corrupt/wrong/unsafe geometry without replacing accepted data | FR-08, NFR-05 | Unit/failure tests | Passing negative fixtures | Candidate | Vitest |
| AC-004 | Persistence adapter round-trips and contains corrupt storage | FR-07, NFR-05 | Unit tests | Passing valid/corrupt cases | Candidate | Vitest |
| AC-005 | SVG output is well-formed, escapes hostile title text, and retains concept boundary | FR-09 | Unit plus independent XML parse | Parser success and no script node | Candidate | Node/Python |
| AC-006 | Static package resolves initial and lazy 3D assets | FR-01, FR-05, NFR-01 | Preview HTTP smoke | HTTP 200 responses | Candidate | Vite/curl |
| AC-007 | Project-authored client has no external transfer or telemetry path | NFR-04 | Source scan | No fetch/XHR/WebSocket/beacon/remote asset | Candidate | ripgrep/manual review |
| AC-008 | GitHub Pages workflow is parseable, pinned, and structurally complete | FR-12 | YAML/static review | Parsed jobs and pinned actions | Candidate | Python YAML/source review |
| AC-009 | 2D wall/symbol/history/reset/status interactions work in a stranger flow | FR-02–FR-06, FR-10–FR-11 | Browser interaction | Observed user-flow receipts | Candidate | Graphical browser |
| AC-010 | 3D WebGL 2 view and forced fallback behave without project loss | FR-05, NFR-07 | Browser graphics/failure | Render/fallback observation | Candidate | WebGL 2 browser |
| AC-011 | Keyboard/focus/responsive behavior meets the defined v0.1 accessibility requirement | NFR-03 | Browser/manual audit | Focus and layout observations | Candidate | Browser/audit environment |
| AC-012 | Point-in-time dependency audit has no high-or-higher advisory | Supply-chain risk/NFR-08 | npm audit | Exit 0/current output | Candidate | npm registry |
