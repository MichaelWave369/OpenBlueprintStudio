# OpenBlueprint Studio
## Master Product Specification v0.1 Draft

## Document control

**Document ID:** OBS-MPS-001  
**Prior version:** None — new baseline  
**Current version:** v0.1 Draft  
**Version:** v0.1  
**Status:** Draft  
**Artifact type:** Master product specification and system architecture  
**Date:** 2026-08-02  
**Prepared for:** Michael Hughes, prospective maintainers, contributors, and users  
**Prepared by:** Parallax 3–6–9 Pipeline, under human authority  
**Supersedes:** None — new baseline  
**Source artifact:** User-supplied product idea in the 2026-08-02 conversation; no prior file  
**Checker receipt reference:** Section 31 and Section 32; detached execution log `OpenBlueprint_Studio_Master_Specification_v0.1_Draft_Checker_Execution_Log.md`  
**Final artifact hash:** The final whole-file SHA-256 is recorded in the detached execution log to avoid self-reference.  
**Source basis:** The user's request for an MIT-licensed, free CAD and blueprint/schematic designer using React, Three.js, WebGL 2, and GitHub Pages; official React, Three.js, and Vite documentation reviewed on 2026-08-02; labeled engineering synthesis in this document.

## 1. Status and classification legend

Epistemic classes describe what a statement is: **Fact**, **Assumption**, **Hypothesis**, **Engineering proposal**, or **Symbolic interpretation**. Maturity labels describe authority in this version: **Normative**, **Candidate**, **Exploratory**, or **Deferred**. Normative means controlling for this specification; it does not establish implementation, engineering fitness, certification, or truth outside this document.

## 2. Executive summary

OpenBlueprint Studio is a proposed free, MIT-licensed, browser-based drafting application for people who need to create clear floor plans, field sketches, and basic blueprint/schematic layouts without paid desktop CAD software. The first candidate is a static React application that pairs an SVG-based 2D editor with a live Three.js/WebGL 2 preview, stores projects locally, and exports portable files. It is intended to deploy on GitHub Pages with no mandatory account, server, or cloud database.

The v0.1 milestone is deliberately bounded. It is a working drafting vertical slice, not a professional solid-modeling kernel, BIM platform, DWG/DXF compatibility layer, engineering-analysis tool, or code-compliance authority. Dimensions are user-entered design information, not certified measurements. The name, default imperial units, and exact visual style are Candidate assumptions that may be changed by Michael Hughes without invalidating the product architecture.

## 3. Problem and context

The user identified a need for a free CAD and blueprint/schematic designer that can run on a static web host. Many field technicians, homeowners, students, artists, and small teams need a fast way to communicate spatial intent, yet full desktop CAD packages can impose cost, installation, file-format, training, or platform burdens. No market study, user interviews, comparative benchmark, or demand measurement was supplied, so the breadth and commercial significance of this problem remain unvalidated.

The proposed response is a local-first browser application whose primary path is: draw in 2D, inspect the live 3D interpretation, save locally, and export a portable project or drawing. This is an Engineering proposal, not evidence that the chosen interaction model is optimal.

## 4. Intended users and stakeholders

| ID | User or stakeholder | Need or interest | Authority | Risks or burdens | Status |
|---|---|---|---|---|---|
| U-01 | Field technicians and surveyors | Fast floor/room sketches and equipment symbols | Control their own project data | Incorrect dimensions may mislead downstream work | Candidate |
| U-02 | Homeowners, makers, and students | Accessible spatial drafting without paid software | Control their own project data | May mistake concept drawings for approved plans | Candidate |
| U-03 | Designers and artists | Lightweight visual ideation with a live 3D view | Control creative output | Feature limits may block professional workflows | Candidate |
| U-04 | Maintainers and contributors | Clear architecture, license, tests, and contribution path | Govern accepted code changes | Dependency and security maintenance burden | Candidate |
| U-05 | Downstream reviewers or tradespeople | Legible exports with units and provenance | Decide whether an export is fit for their task | Ambiguous scale or unsupported claims | Candidate |

No named institution, standards body, engineer, architect, or trade authority is asserted to approve or participate in this project.

## 5. Goals and success criteria

| ID | Goal | Success criterion | Evidence required | Priority | Maturity |
|---|---|---|---|---|---|
| G-01 | Make the primary drafting path immediately usable | A new user can load a sample plan, draw and select walls, and see the 3D view update | Stranger test and interaction receipt | Must | Normative |
| G-02 | Keep the first release free and portable | Source contains an MIT license and builds as static files | License inspection and production build receipt | Must | Normative |
| G-03 | Preserve user control of data | Project can persist locally and export/import a documented JSON file without an account | Persistence and round-trip test | Must | Normative |
| G-04 | Produce useful shareable output | User can export a scalable 2D SVG with drawing title and scale note | Export test and artifact inspection | Must | Normative |
| G-05 | Establish an extensible foundation | Model, editor, renderer, persistence, and exporters have separated responsibilities | Architecture/code review | Should | Candidate |

## 6. Non-goals

| ID | Non-goal | Reason | Revisit condition |
|---|---|---|---|
| NG-01 | Professional DWG, DXF, IFC, STEP, or BIM fidelity in v0.1 | Requires mature parsers, geometry semantics, and compatibility testing | A later accepted format roadmap and fixtures exist |
| NG-02 | Structural, electrical, fire, accessibility, zoning, or code compliance determination | The candidate lacks authoritative rules, qualified review, and jurisdiction data | Separate governed compliance module with qualified oversight |
| NG-03 | Parametric solid modeling, constraints, assemblies, or manufacturing CAM | Outside the bounded floor-plan vertical slice | Core drawing model and interaction evidence are stable |
| NG-04 | Real-time multi-user collaboration, accounts, or cloud storage | GitHub Pages is a static host and local-first operation is preferred | A privacy and backend architecture is explicitly approved |
| NG-05 | Mobile-native application or offline install package | The initial target is a responsive browser application | Web candidate is verified and packaging is prioritized |

## 7. Operating principles

| ID | Principle | Meaning in practice | Trade-off or consequence | Maturity |
|---|---|---|---|---|
| PR-01 | Human authority | The user controls edits, deletion, import, export, and release decisions | Automation may suggest but cannot silently alter plans | Normative |
| PR-02 | Local first | Core editing and persistence require no account or backend | Browser storage has quota and device-loss limits | Normative |
| PR-03 | Honest capability | The interface labels conceptual output and does not imply professional certification | Marketing language must remain restrained | Normative |
| PR-04 | Open and forkable | Source is MIT licensed and dependencies are disclosed | Maintainers accept public reuse and derivative works | Normative |
| PR-05 | Reversible interaction | Destructive edits support undo or explicit confirmation | Additional state-history complexity | Normative |
| PR-06 | Progressive capability | The v0.1 core stays understandable while later tools can be added through stable model contracts | Some advanced formats and tools remain Deferred | Candidate |

## 8. Scope and system boundary

Inside the v0.1 boundary are a single-page React interface, SVG drafting canvas, typed project model, Three.js scene, browser local storage, JSON import/export, SVG export, sample project, help text, and GitHub Pages build/deploy configuration. The browser and graphics driver provide the WebGL 2 runtime. GitHub Actions may build and publish static artifacts after a human configures a repository and Pages settings.

Outside the boundary are authentication, remote data storage, collaboration servers, payments, telemetry, professional certification, native operating-system integration, and third-party CAD conversion services. The trust boundary is the user's browser: imported JSON is untrusted input and must be parsed and validated without executing content. No design leaves the device unless the user explicitly downloads or separately shares it.

Assumption: “gitpage” means GitHub Pages. Consequence if false: deployment configuration must be revised, but the browser application architecture remains viable.

## 9. Canon, terminology, and inherited decisions

### 9.1 Canon register

| Canon ID | Canonical item | Source | Authority in this version | Change allowed? | Notes |
|---|---|---|---|---|---|
| CAN-001 | The product is free and MIT licensed | Current user instruction | Normative | Only by explicit human instruction | Applies to project-authored source; dependency licenses remain their own |
| CAN-002 | The product is a CAD and blueprint/schematic designer | Current user instruction | Normative product direction | Scope may be phased, not silently removed | v0.1 implements a bounded architectural drafting slice |
| CAN-003 | React, Three.js, and WebGL 2 are core technologies | Current user instruction | Normative | Only by explicit architecture decision | SVG is also used for precise 2D interaction/export |
| CAN-004 | The candidate targets GitHub Pages | Current user instruction interpreted as “gitpage” | Candidate | Yes, if interpretation is corrected | Static hosting constrains backend features |

### 9.2 Terminology register

| Term | Definition | Allowed abbreviation | Avoid or distinguish from | Source/status |
|---|---|---|---|---|
| OpenBlueprint Studio | Candidate product name for this baseline | OBS | Not a claim of trademark availability | Candidate assumption |
| Project | Versioned JSON-serializable drawing data and metadata | None | Git repository | Normative |
| Wall | A linear 2D segment with thickness and height, rendered as a 3D box | None | Certified construction assembly | Normative |
| Symbol | A 2D semantic marker such as door, window, outlet, or network drop | None | Fully simulated building component | Candidate |
| Live 3D preview | A visual interpretation regenerated from the current 2D model | None | BIM or physical simulation | Normative |
| Static deployment | Built files served without an application backend | None | Server-side application | Normative |

### 9.3 Inherited decisions

There is no prior specification. The user instruction establishes licensing, product category, core browser technologies, and static deployment direction. All other design selections in v0.1 are explicitly Candidate or Engineering proposal unless promoted by this document's Normative requirements.

## 10. Claim-boundary register

| Claim ID | Statement | Epistemic class | Maturity | Support | Permitted wording | Prohibited overreach | Validation need |
|---|---|---|---|---|---|---|---|
| CL-001 | React can host the single-page editing UI | Fact | Normative | Official React client documentation and observable package/API | “React application” | “React guarantees CAD correctness” | Build and runtime test |
| CL-002 | Current Three.js WebGLRenderer uses WebGL 2 | Fact | Normative | Official Three.js WebGLRenderer documentation reviewed 2026-08-02 | “Three.js/WebGL 2 preview” | “Works on every device” | Capability and fallback test |
| CL-003 | Vite can build a GitHub Pages static deployment through GitHub Actions | Fact | Candidate | Official Vite static deployment guide reviewed 2026-08-02 | “GitHub Pages-ready workflow” | “Already deployed” | Repository deployment receipt |
| CL-004 | The proposed editor will reduce friction for target users | Hypothesis | Exploratory | No user study supplied | “Designed to reduce friction” | “Proven easier than CAD alternatives” | Stranger/usability study |
| CL-005 | A 3D box extrusion faithfully represents a wall for early visualization | Engineering proposal | Candidate | Geometric mapping defined in this specification | “Live conceptual preview” | “Construction-accurate building model” | Geometry fixtures and expert review if promoted |
| CL-006 | 3–6–9 describes the workflow stages | Symbolic interpretation | Candidate | Parallax organizational convention | “Pipeline organization model” | Physical or scientific significance | No physical validation intended |

## 11. Requirements

### 11.1 Functional requirements

| ID | Requirement | Rationale | Source | Acceptance or verification method | Priority | Maturity |
|---|---|---|---|---|---|---|
| FR-01 | The system shall render a responsive single-page drafting workspace without authentication | Fast, free access | User direction plus synthesis | Production build and browser smoke check | Must | Normative |
| FR-02 | The system shall let the user draw grid-snapped wall segments in 2D | Primary CAD interaction | Engineering proposal | Pointer interaction test | Must | Normative |
| FR-03 | The system shall let the user select a wall, edit thickness and height, and delete it | Basic correction and parameter control | Engineering proposal | Core-path test | Must | Normative |
| FR-04 | The system shall provide undo and redo for drawing mutations | Reversible change | `PR-05` | History unit and interaction tests | Must | Normative |
| FR-05 | The system shall generate a live orbitable 3D wall preview from the current 2D project | Requested Three.js/WebGL 2 use | User direction | Model-to-scene test and browser observation | Must | Normative |
| FR-06 | The system shall provide a sample plan and a safe clear/reset action | Immediate discoverability and recovery | Synthesis | Stranger and recovery tests | Must | Normative |
| FR-07 | The system shall autosave the current project to browser local storage and restore valid saved data | Local-first continuity | `PR-02` | Reload persistence test | Must | Normative |
| FR-08 | The system shall export and import a versioned JSON project after schema validation | Portability and user control | `G-03` | Round-trip and malformed-input tests | Must | Normative |
| FR-09 | The system shall export the current 2D drawing as SVG with project title, unit, scale note, walls, dimensions, and symbols | Shareable output | `G-04` | Export fixture inspection | Must | Normative |
| FR-10 | The system shall allow placement, selection, movement, and deletion of door, window, outlet, and network-drop symbols | Schematic usefulness | User's schematic direction plus synthesis | Symbol interaction tests | Should | Candidate |
| FR-11 | The system shall display active tool, pointer coordinates, wall count, and graphics capability/failure state | Operator visibility | Synthesis | UI inspection | Should | Normative |
| FR-12 | The repository shall include a GitHub Actions workflow for Pages and human-readable deployment instructions | GitHub Pages handoff | User direction | Workflow/static review | Must | Candidate |

### 11.2 Non-functional requirements

| ID | Quality attribute | Requirement or threshold | Measurement method | Operating condition | Priority | Maturity |
|---|---|---|---|---|---|---|
| NFR-01 | Portability | Production output consists only of static assets | Inspect `dist` and workflow | `npm run build` | Must | Normative |
| NFR-02 | Performance | Sample plan interaction remains responsive and 3D redraw does not intentionally allocate a new renderer per state update | Code review and browser profiling | Current desktop browser | Should | Candidate |
| NFR-03 | Accessibility | Tool controls are keyboard focusable, labeled, and maintain visible focus; non-canvas actions are operable without pointer-only gestures | Automated and manual review | Desktop browser | Must | Candidate |
| NFR-04 | Privacy | No telemetry, account, or automatic network upload of project content | Source/network inspection | Default build | Must | Normative |
| NFR-05 | Reliability | Invalid stored/imported JSON is rejected and the sample/default project remains recoverable | Failure tests | Corrupt or unsupported data | Must | Normative |
| NFR-06 | Maintainability | Core project/model helpers have unit tests and source modules have separated responsibilities | Test and architecture review | Repository candidate | Should | Candidate |
| NFR-07 | Compatibility | The app detects unavailable WebGL 2 and keeps the 2D editor usable with a clear message | Capability/fallback test | Browser without WebGL 2 | Must | Normative |
| NFR-08 | Licensing | Project-authored source and bundled release identify MIT terms; dependencies are listed with their own licenses | File inspection | Candidate package | Must | Normative |

### 11.3 Constraints

| ID | Constraint | Origin | Consequence | Workaround or response | Status |
|---|---|---|---|---|---|
| CON-01 | GitHub Pages provides static hosting | User direction | No server-side persistence or collaboration in v0.1 | Local storage and file export | Candidate |
| CON-02 | WebGL 2 availability varies by device/driver policy | Browser environment | 3D preview may be unavailable | Retain functional 2D mode and show reason | Normative |
| CON-03 | Browser local storage is not a durable backup | Platform property | Data may be cleared or device-bound | Prominent JSON export | Normative |
| CON-04 | Product name clearance has not been performed | Missing evidence | Name may need revision | Keep naming replaceable | Candidate |

### 11.4 Requirement traceability

| Goal | Requirement | Component/interface | Risk/failure mode | Validation |
|---|---|---|---|---|
| `G-01` | `FR-01`–`FR-06` | `C-01`, `C-02`, `C-04` | `FM-01`, `FM-03` | `VAL-01`, `VAL-02` |
| `G-02` | `FR-12`, `NFR-01`, `NFR-08` | `C-07` | `FM-07` | `VAL-08` |
| `G-03` | `FR-07`–`FR-08` | `C-05`, `IF-03` | `FM-04`, `FM-05` | `VAL-04`, `VAL-05` |
| `G-04` | `FR-09` | `C-06`, `IF-04` | `FM-06` | `VAL-06` |
| `G-05` | `NFR-06` | `C-03`, `IF-01`, `IF-02` | `FM-08` | `VAL-07` |

## 12. Architecture overview

The v0.1 architecture is a static, local-first single-page application. React owns application state and interface composition. The SVG editor maps pointer and keyboard actions into domain commands. A pure project model validates, normalizes, and serializes project data. The Three.js preview consumes the same model and rebuilds scene objects without becoming the source of truth. Persistence and exporters sit behind explicit interfaces. Vite builds relative static assets for GitHub Pages, and a repository workflow packages `dist` for Pages deployment.

Required architecture: one canonical project model, 2D editor as authoritative input surface, 3D view as derived output, no required backend, validated imports, graceful WebGL 2 degradation, and explicit human-controlled export. Illustrative choices that may change without a specification revision include CSS layout details, icon library, colors, and exact module names.

## 13. Components and responsibilities

| ID | Component | Purpose | Inputs | Outputs | Responsibilities | State owned | Dependencies | Failure behavior | Maturity |
|---|---|---|---|---|---|---|---|---|---|
| C-01 | Application shell | Compose workspace, commands, status, and responsive layout | User events and project state | Rendered UI and commands | Tool selection, history coordination, dialogs, status | Active tool, selection, history | React | Preserve model and show recoverable error | Normative |
| C-02 | SVG blueprint editor | Precise 2D drawing and interaction | Project, tool, pointer/keyboard input | Domain commands, coordinates | Grid, walls, dimensions, symbols, selection | Ephemeral draw gesture | React/SVG | Cancel gesture; do not corrupt project | Normative |
| C-03 | Project model | Canonical schema and geometry helpers | Commands or imported JSON | Valid project state, derived measurements | IDs, validation, defaults, normalization | Project document | Browser JavaScript | Reject invalid state and return bounded error | Normative |
| C-04 | Three.js preview | Derived 3D visualization | Valid project model | WebGL 2 scene | Wall extrusion, ground grid, camera/orbit, resize/disposal | Camera and renderer state | Three.js, WebGL 2 | Disable 3D, retain 2D, display reason | Normative |
| C-05 | Persistence adapter | Local continuity and import/export bytes | Valid project model or user file | Restored project or error | localStorage, JSON serialization, schema/version check | Stored project copy | Browser storage/file APIs | Ignore corrupt save after warning; offer sample | Normative |
| C-06 | SVG exporter | Portable vector drawing | Valid project model | Downloadable SVG | Scale, title block, walls, dimensions, symbols | None | Browser Blob API | Report failure without mutating project | Normative |
| C-07 | Build/deploy layer | Reproducible static package | Source and dependency lock | `dist` and Pages artifact | Build, tests, GitHub Actions workflow | Build artifacts | Vite, npm, GitHub Actions | Fail workflow; do not publish partial build | Candidate |

## 14. Interfaces and contracts

| ID | Interface | Producer | Consumer | Payload or action | Preconditions | Postconditions | Error behavior | Owner | Versioning | Maturity |
|---|---|---|---|---|---|---|---|---|---|---|
| IF-01 | Domain command | `C-01`/`C-02` | `C-03` | Add/update/delete element, replace project | Valid command shape | New immutable valid project state | Reject/no-op with message | Application | Internal v1 | Normative |
| IF-02 | Preview model | `C-03` | `C-04` | Valid walls, symbols, units, metadata | Schema-valid project | Scene matches current accepted state | Render fallback, preserve editor | Application | Schema v1 | Normative |
| IF-03 | Project JSON | `C-05` | `C-03` and user | UTF-8 JSON with `schemaVersion`, metadata, walls, symbols | Explicit import/export or autosave | Round-trip data or bounded validation error | Never evaluate script; reject unsupported schema | User/Application | `openblueprint.project/1` | Normative |
| IF-04 | Drawing SVG | `C-06` | User/downstream tools | Standalone SVG text with metadata and geometry | Valid project | Download initiated; project unchanged | Surface error and allow retry | User/Application | Export profile v1 | Normative |
| IF-05 | Pages artifact | `C-07` | GitHub Pages | Static `dist` directory | Passing build; human repo configuration | Hosted asset candidate | Deployment job fails visibly | Human maintainer | Workflow v1 | Candidate |

## 15. Data flows and control flows

### 15.1 Data-flow register

| ID | Source | Data | Transformation | Destination | Storage/retention | Provenance | Sensitivity | Failure response |
|---|---|---|---|---|---|---|---|---|
| DF-01 | Pointer/keyboard | Draft action | Snap and convert to domain command | Project model | History during session | Local user action | User design | Cancel invalid gesture |
| DF-02 | Project model | Walls and symbols | Derive mesh transforms | Three.js scene | Ephemeral GPU/runtime state | Current project revision | User design | Disable/rebuild preview |
| DF-03 | Project model | Versioned JSON | Serialize | localStorage or downloaded file | Until browser/user deletion or file deletion | Local project | User design | Warn; preserve in-memory state |
| DF-04 | Imported file | Untrusted JSON bytes | Parse, validate, normalize | Project model | Only after acceptance | User-selected file | Potentially hostile input | Reject with no state change |
| DF-05 | Project model | 2D geometry | Escape text and render SVG | Downloaded SVG | User-controlled file | Current project | User design | Report failure |

### 15.2 Control-flow register

| ID | Trigger | Authority | Decision or command | Target | Preconditions | Confirmation/receipt | Timeout/escalation |
|---|---|---|---|---|---|---|---|
| CF-01 | User completes wall gesture | User | Add wall | Project model | Two distinct snapped points | Wall count/status update | Cancel on Escape or invalid length |
| CF-02 | User changes selected parameters | User | Update wall | Project model | Wall selected; bounded numeric input | Inspector and preview update | Reject invalid number |
| CF-03 | Project state changes | Application under user action | Autosave and refresh derived view | Storage and preview | Valid project | Saved/status indicator | Warn on storage/render failure |
| CF-04 | User requests clear | User | Replace with empty project | Project model | Confirmation | Empty state visible and undoable | No action if cancelled |
| CF-05 | Maintainer pushes to main | Human maintainer | Build and deploy candidate | GitHub Actions/Pages | Repository configuration | Workflow receipt | Human investigates failed job |

### 15.3 State transitions

The editor transitions among `ready`, `drawing-wall`, `placing-symbol`, `selection`, and `error-notice` interaction states. A project transitions from `default/sample` to `modified`, `autosaved`, `exported`, or `replaced-by-import`. Invalid imports and failed exports do not transition the canonical project. Undo and redo move between accepted project snapshots; they do not replay external side effects such as downloads.

## 16. Governance and authority

| Governance ID | Decision or action | Authorized role | Required evidence/receipt | Override path | Review cadence |
|---|---|---|---|---|---|
| GOV-01 | Edit, delete, import, export, or clear a project | Current user | Direct UI action; confirmation for clear | Undo or restore exported file | Each action |
| GOV-02 | Change normative product scope or claim boundaries | Michael Hughes or explicitly delegated human maintainer | Decision ledger entry and versioned specification | New accepted specification | Each material change |
| GOV-03 | Accept code into a release branch | Human maintainer | Build/test/proving receipt and known issues | Revert or superseding release | Each release candidate |
| GOV-04 | Publish to GitHub Pages | Human maintainer | Successful workflow and explicit repository action | Disable Pages or revert | Each deployment |
| GOV-05 | Treat an exported drawing as suitable for regulated construction | Qualified downstream authority, not the application | External review appropriate to jurisdiction/use | Reject or revise drawing | Per use case |

Computational collaborators may draft, implement, test, and report within authorized scope. They may not self-authorize publication, licensing changes, certification claims, or material scope changes. Final release authority remains human-owned.

## 17. Safety, security, privacy, and ethics

The primary safety risk is misuse of a conceptual drawing as a construction-approved plan. The UI and exports must identify the output as user-authored design information and must not claim code compliance or professional approval. Imported files are untrusted: the application parses JSON, validates allowed fields and numeric bounds, and never evaluates imported content. SVG export must escape user-provided text.

The v0.1 application has no authentication because it has no remote account or shared backend. Project data remains in the browser unless the user explicitly downloads or shares it. No telemetry is included. Dependency versions are locked for the candidate and require periodic maintainer review; this specification does not certify supply-chain security. Accessibility is a design requirement, but conformance to WCAG or another formal standard is not established without a separate audit.

## 18. Failure modes and recovery

| ID | Failure mode | Cause or trigger | Detection | Effect | Severity | Containment | Recovery | Residual risk | Validation |
|---|---|---|---|---|---|---|---|---|---|
| FM-01 | App fails to load | Bad build/base path or unsupported syntax | Blank/error page or workflow failure | No use | High | Deployment job blocks | Correct build/path and redeploy | Browser differences | `VAL-01` |
| FM-02 | WebGL 2 unavailable | Device, driver, browser policy | Capability/renderer error | No 3D preview | Medium | Keep 2D editor active | Explain requirement; use compatible device | User may miss 3D context | `VAL-03` |
| FM-03 | Accidental deletion | User input | History change | Lost element | Medium | Undo and clear confirmation | Undo or import backup | History is session-bound | `VAL-02` |
| FM-04 | Local save corrupt or unavailable | Quota, privacy mode, manual edit | Parse/storage exception | Lost continuity | High | Preserve in-memory project | Warn and export JSON | Device loss remains possible | `VAL-04` |
| FM-05 | Malicious or malformed import | Untrusted file | Schema validation | Potential crash or bad model | High | Reject before state replacement | Keep existing project | Novel parser defects | `VAL-05` |
| FM-06 | Export text injection or malformed SVG | User title or unsupported data | Fixture inspection/parser | Unsafe or unusable output | High | Escape and whitelist generated markup | Correct exporter and re-export | Downstream viewer behavior | `VAL-06` |
| FM-07 | Pages deployment fails | Workflow/repository configuration | GitHub job status | No hosted update | Medium | Existing site remains | Fix settings/workflow | External service dependency | `VAL-08` |
| FM-08 | 2D/3D geometry disagreement | Transform/unit defect | Fixture comparison | Misleading preview | High | Label preview conceptual | Correct mapping and regress | Complex future geometry | `VAL-07` |

The system fails closed for invalid imports and publication workflows, degrades gracefully to 2D when WebGL 2 is unavailable, and preserves in-memory work when persistence/export fails where technically possible.

## 19. Validation and evidence strategy

### 19.1 Validation already performed

No validation evidence was supplied for this version before pipeline execution. Official documentation review supports framework feasibility only; it does not validate this product, implementation, usability, security, or deployment. Build and test results, if later produced, belong to separate Forge and Wayne evidence bundles and do not retroactively become source evidence for the initial problem claim.

### 19.2 Proposed validation

| ID | Claim/requirement | Method | Input or setup | Expected observation | Pass/fail rule | Evidence artifact | Owner | Dependency | Maturity |
|---|---|---|---|---|---|---|---|---|---|
| VAL-01 | `FR-01`, `NFR-01` | Production build and browser smoke | Clean dependency install, built static assets | App loads with workspace | Build exit 0 and visible shell without fatal console error | Command log and screenshot | Wayne Rider | Node/browser | Normative |
| VAL-02 | `FR-02`–`FR-06` | Core/edge interaction tests | Sample and empty project | Draw/select/edit/delete/undo/redo behave as defined | All mandatory interaction criteria observed | Test receipts | Wayne Rider | Browser automation or manual review | Normative |
| VAL-03 | `FR-05`, `NFR-07` | Capability/failure test | WebGL 2 available and forced-unavailable cases | Live scene or explicit 2D fallback | No project loss; clear state | Browser/test receipt | Wayne Rider | Controllable browser environment | Normative |
| VAL-04 | `FR-07` | Persistence/recovery test | Save, reload, corrupt saved value | Valid restore; invalid value does not replace project | Exact model round-trip and safe recovery | Test log | Wayne Rider | Browser storage | Normative |
| VAL-05 | `FR-08` | JSON round-trip and fuzz fixtures | Valid, missing, oversized, wrong-version files | Valid import matches; invalid rejected | No unvalidated replacement or execution | Unit/browser logs | Wayne Rider | Test fixtures | Normative |
| VAL-06 | `FR-09` | SVG export inspection | Sample plan and hostile title text | Well-formed SVG with escaped text and expected geometry | XML parses; no injected node/script | Export fixture and log | Wayne Rider | XML parser | Normative |
| VAL-07 | `FR-05`, `NFR-06` | Geometry unit tests | Known horizontal, vertical, diagonal walls | Length, midpoint, angle, and scale match | Numeric tolerances met | Unit-test output | Wayne Rider | Test runtime | Normative |
| VAL-08 | `FR-12` | Build/workflow review and optional live deploy | Repository configured for Pages | Workflow produces/publishes `dist` | Static review passes; hosted proof requires actual run | Workflow file/job URL | Human maintainer/Wayne | GitHub repo authority | Candidate |

### 19.3 Missing evidence and unavailable conclusions

| Evidence gap | Why it matters | Conclusion that cannot yet be made | Acquisition path | Blocking dependency |
|---|---|---|---|---|
| No user research | Workflow assumptions may be wrong | Product is easier or desired | Observe target users and record task outcomes | Representative participants |
| No cross-browser/device matrix | WebGL and pointer behavior vary | Broad compatibility | Test supported browser/device matrix | Device/browser access |
| No accessibility audit | Keyboard labels alone are insufficient | Formal accessibility conformance | Automated plus qualified manual audit | Audit resources |
| No security review | Import/export and dependencies may contain defects | Security fitness | Threat-focused code review and dependency audit | Candidate implementation |
| No live GitHub Pages run | Configuration can be statically correct but unexecuted | Hosted deployment is operational | Human-authorized repository deploy | GitHub repository and Pages settings |
| No professional-domain review | Symbols and dimensions may not meet trade conventions | Suitability for regulated design | Architect/engineer/trade review by use case | Qualified reviewer |

## 20. Observability and evidence receipts

The interface exposes active tool, snapped pointer coordinate, selection, wall/symbol counts, autosave result, and WebGL 2 state. The application avoids remote telemetry. Local runtime errors may appear in an in-app notice and developer console without including project content in network reports. Build, test, dependency, deviation, and release receipts are stored in the repository evidence directory. Users may delete local project data by clearing the plan and browser storage; downloaded files remain under their control.

## 21. Implementation phases and readiness gates

| Phase | Objective | In scope | Deliverables | Entry criteria | Exit/readiness gate | Dependencies | Risks | Status |
|---|---|---|---|---|---|---|---|---|
| P0 | Govern intent | Master specification and receipts | v0.1 Draft and checker log | User idea | Final static checker passes; Forge handoff recorded | Master Spec skill/runtime | Scope ambiguity | In progress |
| P1 | Candidate vertical slice | `FR-01`–`FR-12` within stated maturity | React app, tests, license, workflow, Forge evidence | Frozen v0.1 specification | Clean build/tests and candidate package | npm dependencies | Interaction/graphics defects | Planned |
| P2 | Independent proving | Mandatory acceptance criteria | Wayne plan, receipts, failures, regression, readiness report | Forge candidate handoff | Evidence-backed readiness classification | Test/browser capabilities | Unverified visual behavior | Planned |
| P3 | Human release | Repository publication and optional Pages deploy | Tagged source and hosted build | Human accepts known issues | Explicit human release action and successful deploy | GitHub authority | Public support/maintenance | Deferred |
| P4 | Advanced CAD roadmap | Formats, constraints, layers, richer symbols, collaboration as separately approved | Subsequent specifications | v0.1 evidence and user priorities | New controlling version | Domain expertise | Scope explosion | Deferred |

## 22. Dependencies and constraints

| ID | Dependency or constraint | Type | Owner/source | Required by | Failure impact | Mitigation | Status |
|---|---|---|---|---|---|---|---|
| DEP-01 | React and React DOM | Runtime dependency | Upstream project | C-01/C-02 | UI cannot build | Lock version; disclose license | Candidate |
| DEP-02 | Three.js | Runtime dependency | Upstream project | `C-04` | 3D unavailable | Lock version; graceful 2D mode | Candidate |
| DEP-03 | Vite and test tooling | Development dependency | Upstream projects | `C-07` | Cannot build/test reproducibly | Lockfile and documented Node version | Candidate |
| DEP-04 | WebGL 2 browser capability | Platform dependency | User environment | `C-04` | 3D unavailable | Capability check and 2D fallback | Normative |
| DEP-05 | GitHub repository, Actions, and Pages settings | Deployment dependency | Human maintainer/GitHub | `IF-05` | No hosted site | Keep local/static package usable | Deferred until authorized |

## 23. Risks, trade-offs, and alternatives

### 23.1 Risk register

| ID | Risk | Likelihood | Impact | Exposure rationale | Mitigation | Contingency | Owner | Residual risk |
|---|---|---|---|---|---|---|---|---|
| R-01 | Users infer professional approval | Medium | High | Blueprint language carries authority | Persistent disclaimer and export note | Domain-specific editions with review | Human maintainer | Misuse cannot be eliminated |
| R-02 | Feature scope expands into an unmaintainable CAD clone | High | High | “CAD” spans many mature domains | Versioned milestones and non-goals | Split modules or retain narrow product | Michael Hughes | Market expectations |
| R-03 | Browser storage loss | Medium | High | localStorage is device-bound | Autosave status and JSON export | Future file-system adapter | User | User may skip backups |
| R-04 | 2D/3D mismatch | Medium | High | Separate rendering systems consume shared data | Pure geometry helpers and fixtures | Disable questionable preview feature | Maintainer | Complex future geometry |
| R-05 | Dependency or supply-chain issue | Medium | High | Public packages/build actions | Lock versions, audit, update policy | Pin/revert/remove dependency | Maintainer | Absence of risk is not established |
| R-06 | Product name conflict | Unknown | Medium | No clearance performed | Candidate naming and easy replacement | Rename before public release | Michael Hughes | Discoverability impact |

### 23.2 Trade-off register

| ID | Decision tension | Option A | Option B | Chosen balance | Consequence | Revisit trigger |
|---|---|---|---|---|---|---|
| TR-01 | 2D renderer | Canvas performance | SVG inspectability/accessibility/export affinity | SVG for v0.1 | Very large drawings may need virtualization | Performance evidence shows limit |
| TR-02 | 3D integration | React wrapper library | Direct Three.js lifecycle | Direct Three.js | Less dependency, more manual lifecycle code | Scene complexity grows materially |
| TR-03 | Persistence | Cloud sync | Local storage/files | Local first | No cross-device sync | Explicit backend/privacy decision |
| TR-04 | Units | Imperial default | Metric default | Imperial Candidate default with model unit field | Initial UX may not fit all regions | User research or explicit instruction |

### 23.3 Alternatives considered

Using Canvas 2D was considered for high-volume drawing performance but deferred because SVG provides direct geometry inspection and export continuity for the first slice. A React-specific Three.js renderer was considered but direct Three.js is selected to keep the core dependency graph smaller and make WebGL lifecycle explicit. A backend-first collaboration model was rejected for v0.1 because it conflicts with the static-hosting and local-first boundaries. Existing native CAD engines and WebAssembly kernels remain an Exploratory future path rather than an implied current capability.

## 24. Open questions

| ID | Question | Why it matters | Needed evidence or decision | Owner | Blocking? | Target phase | Status |
|---|---|---|---|---|---|---|---|
| OQ-01 | Is OpenBlueprint Studio the accepted public name? | Branding and repository identity | Human naming decision and clearance search | Michael Hughes | No for candidate | P3 | Candidate |
| OQ-02 | Which units and page standards should be first-class? | Regional and trade usability | User priorities and domain review | Michael Hughes | No | P4 | Deferred |
| OQ-03 | Which schematic libraries matter most: architectural, electrical, network, plumbing, or mixed? | Controls symbol roadmap | Target-user evidence | Unknown | No | P4 | Deferred |
| OQ-04 | Is a real GitHub repository available for deployment? | Hosted proof cannot occur locally | Repository URL and explicit publish authority | Michael Hughes | Yes for P3 only | P3 | Deferred |
| OQ-05 | What browser/device support policy is desired? | Defines compatibility matrix | Human product decision plus usage evidence | Unknown | No for desktop candidate | P2/P3 | Candidate |

## 25. Decision ledger

| ID | Date/version | Decision | Status | Rationale | Alternatives considered | Evidence/source | Consequences | Revisit trigger | Authority |
|---|---|---|---|---|---|---|---|---|---|
| D-001 | 2026-08-02 / v0.1 | Establish a static, local-first browser candidate | Accepted | Directly satisfies free GitHub Pages direction without inventing a backend | Backend-first app | User instruction plus architecture synthesis | Collaboration is Deferred | Explicit backend request | Human instruction/specification |
| D-002 | 2026-08-02 / v0.1 | Use SVG for 2D and direct Three.js for derived 3D | Proposed | Smallest coherent architecture for precise 2D plus requested WebGL 2 | Canvas; wrapper-based 3D | Engineering synthesis | Performance ceiling not established | Benchmark or complexity evidence | Candidate pending human review |
| D-003 | 2026-08-02 / v0.1 | Bound the first milestone to walls, four symbols, persistence, JSON, and SVG | Accepted for implementation handoff | Produces an end-to-end usable slice without claiming full CAD parity | Broad disconnected scaffolding | Parallax Forge milestone rules | Advanced CAD remains visible but Deferred | v0.1 evidence and user priority | Human request plus governed synthesis |
| D-004 | 2026-08-02 / v0.1 | Use OpenBlueprint Studio as a replaceable candidate name | Proposed | The brief did not supply a name | Delay all work; other invented names | Assumption | Requires clearance before public release | Human naming choice | Candidate pending human review |

## 26. Reviewer-feedback disposition

Not applicable for this new baseline. No reviewer feedback was supplied. Allowed future dispositions are Adopted, Modified, Deferred, Rejected, and Clarification needed.

## 27. Version changelog

| Version | Date | Status | Summary of change | Decisions affected | Feedback addressed | Author/source |
|---|---|---|---|---|---|---|
| v0.1 | 2026-08-02 | Draft | Initial governed baseline from the user product idea | `D-001`–`D-004` | None supplied | User instruction plus labeled Parallax synthesis |

## 28. Glossary

**CAD:** Computer-aided design; in v0.1, a bounded 2D architectural drafting workflow rather than a claim of parity with professional CAD suites.  
**GitHub Pages:** Static site hosting associated with a GitHub repository.  
**React:** UI library used for the application shell and 2D interface.  
**Three.js:** Graphics library used for the live WebGL 2 preview.  
**WebGL 2:** Browser graphics API required for the 3D preview in the selected Three.js version.  
**Schema version:** Identifier that defines the accepted project JSON contract.  
**Receipt:** A reproducible record of an action, command, result, limitation, or decision.

## 29. Appendix A — Source inventory and provenance

1. Current user instruction, highest authority: “an MIT licensed, free CAD and blueprint/schematic designer app with live react, three.js, webgl2, etc.. gitpage.”
2. Existing accepted canon relevant to governance: human authority, claim discipline, “ledger above ego,” and the Parallax 3–6–9 workflow organization.
3. Official React client API documentation, reviewed 2026-08-02, supports a client-rendered React root.
4. Official Three.js WebGLRenderer documentation, reviewed 2026-08-02, states that the current renderer uses WebGL 2 and does not support WebGL 1.
5. Official Vite static-deployment documentation, reviewed 2026-08-02, describes a GitHub Actions deployment path for GitHub Pages.
6. All product name, feature-slice, interaction, schema, architecture, and validation details beyond the user's words are labeled Engineering proposal, Assumption, Candidate, or Normative within this specification; Normative status governs only this artifact.

## 30. Appendix B — Formal Forge handoff

**Controlling specification:** OBS-MPS-001, v0.1 Draft  
**Handoff status:** Authorized by the user's simultaneous invocation of Parallax Master Spec Builder, Parallax Implementation Forge, and Wayne Rider Proving Ground.  
**Forge autonomy:** Level 2 — Bounded local implementation.  
**Candidate milestone:** OBS-M1 / v0.1.0 candidate.  
**In scope:** All Normative Must requirements; Candidate Should requirements where they fit without architecture or scope deviation.  
**Out of scope:** NG-01–NG-05 and P3 publication.  
**Accepted Candidate assumptions for local implementation:** product name OpenBlueprint Studio; default imperial feet; SVG 2D editor; direct Three.js lifecycle; relative static asset base.  
**Blocking decisions:** None for the local candidate. OQ-04 blocks only a live GitHub Pages deployment.  
**Release authority:** Michael Hughes retains final publication and release authority. The Forge must preserve this specification unchanged and prepare a separate candidate and Wayne handoff.

## 31. Final Quality-Gate Record

| Gate | Verification method | Result | Evidence or boundary |
|---|---|---|---|
| Claim discipline | Manual content review | PASS | Facts, Assumptions, Hypotheses, Engineering proposals, and Symbolic interpretations are separated; product benefit remains unvalidated |
| Canon preservation | Manual content review | PASS | User licensing, product category, technology, and static-host direction are preserved |
| Terminology consistency | Manual content review | PASS | OpenBlueprint Studio, Project, Wall, Symbol, and live 3D preview have stable meanings |
| Completeness | Automated checker + manual content review | PASS | Required schema areas are present; final automated result is retained in the detached log |
| Internal consistency | Manual content review | PASS | Goals, requirements, components, interfaces, failures, validation, phases, and handoff cross-reference consistently |
| Unsupported certainty | Automated checker + manual content review | PASS | No implementation, deployment, certification, usability, or market conclusion is asserted by the specification |
| Revision integrity | Not applicable | Not applicable | New baseline; no prior version or reviewer feedback exists |
| Version and artifact identity | Automated checker + manual content review | PASS | Document ID and v0.1 identity agree across control, changelog, receipt, and detached log |
| Rendered document quality | Rendered visual review — Not applicable | Not applicable | Markdown is the controlling artifact; no paginated DOCX/PDF was requested |
| Engineering correctness and technical feasibility | Not applicable unless independently validated | Not established | Proposed for Forge and Wayne evidence; framework documentation alone is insufficient |
| Security, safety, privacy, and legal compliance | Not applicable unless independently assessed | Not established | Requirements and risks are defined; no certification or legal opinion is claimed |
| Usability and product-market fit | Not applicable unless supported by evidence | Not established | Requires target-user observation and market evidence |

## 32. Quality-Gate Execution Receipt

| Field | Observed value |
|---|---|
| Receipt status | PASS |
| Checker script | `check_master_spec.py` |
| Checker path | `/root/.codex/skills/remote-skills/skill-6a6e73f729dc8191992a8f9b3d4bb8cb/scripts/check_master_spec.py` |
| Checker SHA-256 | `08ea30d8e55aeebb8f86007b1578f1f6606d474730bfbe6eccf4f4c2c0e458a8` |
| Expected specification version | `v0.1` |
| Exact command | Recorded verbatim in the detached execution log after final sealing |
| Input filename | `OpenBlueprint_Studio_Master_Specification_v0.1_Draft.md` |
| Input SHA-256 | Preflight and final input hashes are recorded in the detached execution log to avoid self-reference |
| Execution timestamp/timezone | Recorded in the detached execution log as UTC |
| Runtime | Linux x86_64; local Codex workspace |
| Python version | Python 3.12.13 |
| Exit code | `0` for the final strict run |
| Error count | `0` for the final strict run |
| Warning count | `0` for the final strict run |
| Warning disposition | All preflight warnings were corrected or explicitly bounded before final sealing; details are in the detached log |
| Corrections after first run | Recorded in the detached log |
| Final rerun result | PASS — exact final artifact checked in strict final mode |
| Detached log | `OpenBlueprint_Studio_Master_Specification_v0.1_Draft_Checker_Execution_Log.md` |
| Final artifact hash handling | The final whole-file SHA-256 is recorded in the detached log to avoid self-reference |
| Checker establishes | The implemented static checks found required structure, version, classification, receipt fields, and no remaining checker warnings in the identified artifact |
| Checker does not establish | Engineering correctness, scientific truth, safety, security, privacy, legal compliance, accessibility, usability, deployment readiness, or product-market fit |
