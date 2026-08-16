# FANCY DICE — CODE REVIEW & APPROVAL PROTOCOL

This protocol governs code reviews, pull requests, testing requirements, and human sign-off procedures for the **Fancy Dice** project.

---

## 1. PULL REQUEST (PR) STANDARDS

Every pull request submitted by an AI agent or contributor must strictly adhere to the following standards:

### Requirements:
1. **Scope Limit**: A PR must address **exactly one** roadmap item from `docs/ROADMAP.md` (e.g., `P0-1` or `P1-1`). Multi-task PRs are prohibited.
2. **Zero Unrelated Changes**: Formatting-only changes, dependency updates, or opportunistic refactoring outside the task scope are forbidden.
3. **Automated Verification**: The PR description must include terminal execution logs showing successful passes for `npm run lint` and `npm run build`.
4. **No Code Without Tests / Verification**: Any change to physics mapping, sensor logic, or state management must include unit test or build verification proof.

---

## 2. CODE REVIEW CHECKLIST FOR HUMAN REVIEWERS

When reviewing a PR at **Gate 4**, the human reviewer will evaluate:

- [ ] **Task Alignment**: Does the PR directly solve the stated roadmap objective without feature creep?
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
   - If changes are requested, the agent reverts or updates the branch according to reviewer comments.
