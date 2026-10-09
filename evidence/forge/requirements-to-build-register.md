# Requirements-to-Build Register

| Requirement ID | Faithful summary | Class | Implementation target | Verification hook | Forge status | Dependency | Evidence / limitation | Deviation |
|---|---|---|---|---|---|---|---|---|
| FR-01 | Responsive unauthenticated SPA | Normative Must | App shell | Build and browser smoke | Implemented; static HTTP demonstrated | React/Vite | `command-log.md`; graphical browser unavailable | None |
| FR-02 | Grid-snapped wall drawing | Normative Must | SVG editor/model | Pointer flow | Implemented; unable to verify interaction | Browser pointer | Source/build only | None |
| FR-03 | Select/edit/delete wall | Normative Must | SVG editor/inspector | Core path | Implemented; unable to verify interaction | Browser | Source/build only | None |
| FR-04 | Undo/redo mutations | Normative Must | App history | Keyboard/core path | Implemented; unable to verify UI | Browser | Source/build only | None |
| FR-05 | Live orbitable 3D preview | Normative Must | Lazy Three.js preview | Scene/browser observation | Implemented; build integrated; unable to verify graphics | WebGL 2/browser | Three.js chunk built and served | None |
| FR-06 | Sample and safe clear/reset | Normative Must | Model/App | Recovery flow | Implemented; sample model tested | Browser confirm | Model tests; UI unverified | None |
| FR-07 | Local autosave/restore | Normative Must | Storage adapter/App | Persistence tests | Demonstrated locally at adapter level | localStorage | 2 persistence tests pass; reload UI unverified | None |
| FR-08 | Validated JSON import/export | Normative Must | Model/App | Round-trip/malformed tests | Demonstrated locally at model level | File API | Model tests pass; download UI unverified | None |
| FR-09 | SVG export with title/unit/note | Normative Must | SVG exporter/App | Export fixture | Demonstrated locally | Blob/File API | SVG tests pass, including hostile title | None |
| FR-10 | Four symbol types with move/delete | Candidate Should | Model/SVG/inspector | Symbol interaction | Implemented; unable to verify interaction | Browser pointer | Build-integrated source | None |
| FR-11 | Tool, coordinate, count, graphics status | Normative Should | App/status bar | UI inspection | Implemented; unable to visually verify | Browser | Build-integrated source | None |
| FR-12 | Pages workflow and instructions | Candidate Must | Workflow/README | Static review/live job | Implemented; hosted execution unavailable | GitHub repository | Pinned workflow matches current official Vite guide pattern | None |
| NFR-01 | Static production assets | Normative Must | Vite build | `npm run build` | Executed locally | Node/npm | Exit 0; `dist` served | None |
| NFR-02 | Responsive sample and retained renderer | Candidate Should | App/Three lifecycle | Profiling/code review | Implemented; not benchmarked | Browser profiler | Initial UI and lazy 3D chunks separated | None |
| NFR-03 | Labeled/focusable controls | Candidate Must | JSX/CSS | Accessibility review | Implemented; formal audit unavailable | Browser/audit | Manual source review only | None |
| NFR-04 | No telemetry/account/upload | Normative Must | Whole client | Source/network inspection | Implemented | Source review | Network-call pattern scan found none | None |
| NFR-05 | Reject corrupt data/recover | Normative Must | Model/storage | Failure tests | Demonstrated locally | Vitest | Malformed JSON/storage tests pass | None |
| NFR-06 | Separated modules and unit tests | Candidate Should | Repository | Test/architecture review | Executed locally | Vitest | 3 files, 9 tests pass | None |
| NFR-07 | WebGL 2 fallback retains 2D | Normative Must | Three preview/App | Forced-unavailable browser test | Implemented; unable to verify fallback UI | Controllable browser | Capability branch exists; no browser | None |
| NFR-08 | MIT terms and dependencies | Normative Must | License/README/package | File inspection | Implemented | Upstream licenses | MIT file and dependency list present | None |
