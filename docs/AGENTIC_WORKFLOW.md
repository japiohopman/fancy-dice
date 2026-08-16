# FANCY DICE — AGENTIC WORKFLOW ARCHITECTURE & PROTOCOL

This document defines the multi-agent development architecture, agent roles, subsystem-based operational scopes, controlled scope expansion protocols, and human approval gates for **Fancy Dice**.

---

## 1. PRINCIPLES & GOALS

1. **Human Oversight First**: AI agents execute engineering tasks; human engineers make strategic decisions, review PRs, and perform acceptance testing.
2. **Measurement-Driven Development**: Every optimization must follow a **Measure → Change → Measure Again** workflow.
3. **Controlled Autonomy**: Agents are defined by subsystem responsibilities rather than rigid file paths. If solving a problem requires modifying files outside an agent's primary subsystem, the agent must document the reason, outline the expanded scope, and request approval if significant.
4. **Safe Failure Recovery**: Autonomous agents must NEVER use destructive commands like `git reset --hard` to discard work. Failed attempts must be preserved, documented, and escalated to human review.

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

---

## 3. AGENT ROLES & SUBSYSTEM SCOPES

### A. Lead Orchestrator Agent
- **Responsibility**: Oversees task distribution, monitors agent operations, enforces workflow rules, and prepares PR summaries for human review.
- **Allowed Scope**: Repository-wide inspection; plan orchestration; pull request descriptions.
- **Forbidden Scope**: Direct unreviewed code commits.
- **Inputs**: Roadmap tasks, human review comments, agent verification logs.
- **Outputs**: Agent assignment specifications, pull request descriptions, gate transition requests.

### B. Baseline & Performance Agent
- **Responsibility**: Performance profiling, bundle size optimization, WebGL rendering efficiency, audio node lifecycle management, and build configuration.
- **Allowed Scope**: Files and configurations directly related to WebGL rendering, 3D canvas lifecycle, audio synthesis, and Vite/Rollup build chunking.
- **Forbidden Scope**: UI layout redesigns or Android native manifest configuration changes.
- **Inputs**: Chrome DevTools performance traces, `npm run build` bundle outputs.
- **Outputs**: Measured FPS reports, code-splitting PRs, node pooling optimizations.

### C. Android QA & Capacitor Agent
- **Responsibility**: Native Android project setup, Capacitor bridge configuration, native hardware plugin integration (`@capacitor/motion`, `@capacitor/haptics`), and Android Studio build validation.
- **Allowed Scope**: Files and configurations directly related to Capacitor, Android native wrapper, device sensors, and native haptics.
- **Forbidden Scope**: Desktop UI layout changes, TRPG notation parser math.
- **Inputs**: Android SDK build logs, Capacitor plugin specifications, hardware test feedback.
- **Outputs**: Native Android project syncs, Capacitor plugin integrations, APK build configurations.

### D. UX/UI Polish Agent
- **Responsibility**: Mobile landscape responsiveness, touch target optimization, visual hierarchy, layout collision prevention, text overflow handling, and legacy component cleanup.
- **Allowed Scope**: UI components, CSS/Tailwind styling, layout responsiveness handlers, and unimported legacy component cleanup.
- **Forbidden Scope**: 3D physics collision logic, notation parser math algorithms.
- **Inputs**: Screen resolution matrices, mobile touch guidelines, UX audit findings.
- **Outputs**: Responsive UI diffs, dead code removal PRs, CSS/Tailwind refinements.

### E. Code Quality & Refactoring Agent
- **Responsibility**: TypeScript type strictness, interface standardization, elimination of magic numbers, event listener lifecycle cleanup, and state sync refactoring.
- **Allowed Scope**: TypeScript type definitions, notation parser functions, custom hooks, and shared utilities.
- **Forbidden Scope**: Adding new product features or altering core calculation algorithms without test coverage.
- **Inputs**: `npm run lint` (`tsc --noEmit`) outputs, code audit findings.
- **Outputs**: Strongly-typed interface definitions, refactored clean code PRs.

---

## 4. CONTROLLED SCOPE EXPANSION PROTOCOL

If an agent discovers that solving an assigned roadmap item requires modifying code outside its primary subsystem:

1. **Document Reason**: Explain why the cross-subsystem change is technically necessary.
2. **Identify Expanded Scope**: Explicitly list the additional files or functions required.
3. **Evaluate Impact**: If the expansion is minor (e.g., adding a typed property to `types.ts`), proceed and note it in the PR description. If the expansion is significant (e.g., altering React root state in `App.tsx`), halt and request human approval before proceeding.

---

## 5. SAFE FAILURE & RECOVERY PROTOCOL

In the event of an unexpected build error, test failure, or low confidence (<80%), agents must **NEVER** casually discard work using `git reset --hard` or destructive commands.

### Required Recovery Steps:
1. **Stop Implementation**: Immediately halt further modifications.
2. **Preserve Working State**: Keep the current working tree state intact on the feature branch.
3. **Record Blocker**: Document the exact error log, failure mode, and diagnostic steps taken.
4. **Explain Attempted Solution**: Outline what was modified and why it failed.
5. **Escalate to Human Review**: Request human guidance or code review intervention.
