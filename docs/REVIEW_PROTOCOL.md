# FANCY DICE — CODE REVIEW & APPROVAL PROTOCOL

This protocol governs code reviews, pull requests, testing requirements, subsystem scope reviews, and human sign-off procedures for **Fancy Dice**.

---

## 1. PULL REQUEST (PR) STANDARDS

Every pull request submitted by an AI agent or contributor must strictly adhere to the following standards:

### Requirements:
1. **Scope Alignment**: A PR must address **exactly one** roadmap item from `docs/ROADMAP.md` (e.g., `P0-1` or `P1-1`).
2. **Subsystem Justification**: If files outside the agent's primary subsystem were modified, the PR description must explicitly justify the scope expansion according to the Controlled Scope Expansion Protocol.
3. **Automated Verification**: The PR description must include terminal execution logs showing successful passes for `npm run lint` (`tsc --noEmit`) and `npm run build`.
4. **Safe Failure Protocol Compliance**: Discarding work via `git reset --hard` is strictly forbidden. Any failed approach must be recorded in blocker logs.

---

## 2. CODE REVIEW CHECKLIST FOR HUMAN REVIEWERS

When reviewing a PR at **Gate 4**, the human reviewer will evaluate:

- [ ] **Task Alignment**: Does the PR directly solve the stated roadmap objective without feature creep?
- [ ] **Scope Integrity**: Are modifications confined to allowed subsystem responsibilities or justified via scope expansion rules?
- [ ] **Type Safety**: Are TypeScript interfaces strict with zero implicit `any` additions?
- [ ] **Performance**: Does the change avoid unnecessary React re-renders, unthrottled event listeners, or memory leaks?
- [ ] **Android Compatibility**: If touch/sensor APIs are modified, do they work in both browser and Capacitor WebView?
- [ ] **Build Integrity**: Does `npm run build` execute without warnings or errors?

---

## 3. SIGN-OFF PROCEDURES

1. **Agent Submission**: Upon completing code modifications and passing local verification, the agent creates a PR branch and submits a detailed PR description.
2. **Human Inspection**: The human reviewer inspects the git diff on GitHub.
3. **Approval or Changes Requested**:
   - If approved, the human merges the PR to `main`.
   - If changes are requested, the agent addresses comments while preserving state.
