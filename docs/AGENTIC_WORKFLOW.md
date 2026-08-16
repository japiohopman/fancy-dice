# FANCY DICE — AGENTIC WORKFLOW ARCHITECTURE & PROTOCOL

This document defines the multi-agent development architecture, agent roles, operational rules, and human approval gates for the polish and release phase of **Fancy Dice**.

---

## 1. PRINCIPLES & GOALS

1. **Human Oversight First**: AI agents execute engineering tasks; human engineers make strategic decisions, review PRs, and perform acceptance testing.
2. **Measurement-Driven Development**: Every optimization must follow a **Measure → Change → Measure Again** workflow.
3. **Product Integrity**: Existing features are frozen. Changes are strictly limited to performance, reliability, usability, Android readiness, code quality, and documentation.

---

## 2. HUMAN APPROVAL GATES

No agent may cross a human approval gate without explicit human sign-off.

```
[Gate 1: Audit Approval]
       │
       ▼
[Gate 2: Roadmap Approval]
       │
       ▼
[Gate 3: Implementation Authorization]
       │
       ▼
[Gate 4: Pull Request Code Review]
       │
       ▼
[Gate 5: Android Hardware Acceptance]
       │
       ▼
[Gate 6: Production Release Approval]
```

### Gate Definitions:
- **Gate 1 — Audit Approval**: Human approves the technical audit findings in `docs/MASTER_AUDIT.md`.
- **Gate 2 — Roadmap Approval**: Human approves prioritized P0–P3 tasks in `docs/ROADMAP.md`.
- **Gate 3 — Implementation Authorization**: Human authorizes AI agents to begin modifying application code for a specific roadmap item.
- **Gate 4 — PR Code Review**: Human reviews code diffs, automated lint/build passes, and test results before merging PRs.
- **Gate 5 — Android Hardware Acceptance**: Human tests generated APKs on physical Android devices to confirm performance, sensor gestures, audio, and UI responsiveness.
- **Gate 6 — Release Approval**: Human explicitly approves production app store build submission.

---

## 3. AGENT ROLES & SPECIFICATIONS

### A. Lead Orchestrator Agent
- **Purpose**: Oversees task distribution, monitors agent operations, enforces workflow rules, and prepares PR summaries for human review.
- **Scope**: Repository-wide inspection; plan orchestration; PR drafting.
- **Forbidden Scope**: Direct unreviewed code commits.
- **Inputs**: Roadmap tasks, human review comments, agent test reports.
- **Outputs**: Agent assignment specifications, pull request descriptions, gate transition requests.

### B. Baseline & Performance Agent
- **Purpose**: Establishes performance baselines, profiles bundle sizes, diagnoses WebGL/CPU bottlenecks, and optimizes rendering/audio pipelines.
- **Scope**: `src/lib/audioManager.ts`, `src/components/ThreeDiceCanvas.tsx`, `vite.config.ts`, `package.json`.
- **Forbidden Scope**: UI layout redesigns or Android native configuration changes.
- **Inputs**: Chrome DevTools performance traces, `npm run build` bundle outputs.
- **Outputs**: Measured FPS reports, code-splitting PRs, node pooling optimizations.

### C. Android QA & Capacitor Agent
- **Purpose**: Manages Capacitor configuration, native Android platform synchronization, plugin integration (`@capacitor/motion`, `@capacitor/haptics`), and Android Studio build verification.
- **Scope**: `capacitor.config.ts`, `android/`, `src/lib/shakeDetector.ts`.
- **Forbidden Scope**: Desktop UI layout changes, TRPG notation parser modification.
- **Inputs**: Android SDK build logs, Capacitor plugin specifications, hardware test feedback.
- **Outputs**: Native Android project syncs, Capacitor plugin integrations, APK build configurations.

### D. UX/UI Polish Agent
- **Purpose**: Eliminates visual glitches, refines mobile landscape responsiveness, optimizes touch target sizes, prevents overlay text overflow, and cleans up dead UI code.
- **Scope**: `src/components/`, `src/index.css`.
- **Forbidden Scope**: 3D physics collision logic, notation parser math.
- **Inputs**: Screen resolution matrices, mobile touch guidelines, UX audit findings.
- **Outputs**: Responsive UI diffs, dead code removal PRs, CSS/Tailwind refinements.

### E. Code Quality & Refactoring Agent
- **Purpose**: Resolves TypeScript technical debt, removes magic numbers, fixes implicit `any` types, and standardizes component interfaces.
- **Scope**: `src/types.ts`, `src/lib/diceParser.ts`, `src/App.tsx`.
- **Forbidden Scope**: Adding new product features or altering core calculation algorithms without test coverage.
- **Inputs**: `npm run lint` (`tsc --noEmit`) outputs, audit findings.
- **Outputs**: Strongly-typed interface definitions, refactored clean code PRs.

### F. Documentation Agent
- **Purpose**: Keeps documentation (`README.md`, `docs/`) perfectly synchronized with codebase state.
- **Scope**: `README.md`, `docs/*.md`.
- **Forbidden Scope**: Modifying application executable code.
- **Inputs**: Code diffs, architecture updates, build procedures.
- **Outputs**: Up-to-date documentation PRs.

---

## 4. AGENT OPERATIONAL RULES

1. **Autonomous Fail-Safe**: If an agent encounters a build/type error or low confidence (<80%), it must halt, revert changes to a known clean state (`git reset --hard`), and report the blocker to the Lead Orchestrator.
2. **Branching Strategy**: Every task must be executed on a dedicated feature branch named `fix/<task-id>` or `perf/<task-id>`.
3. **Verification Obligation**: Every modification must be validated with `npm run lint` and `npm run build` prior to PR creation.
