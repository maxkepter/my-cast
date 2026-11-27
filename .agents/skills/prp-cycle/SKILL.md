---
name: prp-cycle
description: Complete Product Requirements to Plan to Test-Driven Development cycle with dual-review convergence for MyCast.
---

# PRP Cycle Workflow

1. **Problem Definition & Inception (PRD / SRS)**: Invoke `business-analyst` (for full ISO/IEEE SRS in `docs/srs/`) or run the `prp-workflow` skill to formulate `docs/prd/<feature>.md`. Define measurable success metrics and explicit out-of-scope boundaries.
2. **Architecture & Decomposition**: Consult `architect` (read-only) to establish bounded contexts, module responsibilities, integration patterns, and Architectural Decision Records (ADRs).
3. **Implementation Planning**: Delegate to `planner` to produce `docs/workflow/active/YYYY-MM-DD-<slug>/plan.md` with complete `@Module` wiring, cross-module contracts, non-overlapping `Scope (Files)`, and mock specifications. Wait for human approval before `runner` generates `task-matrix.md`.
4. **Test-Driven Implementation (TDD)**: Dispatch `executor` (or parallel `executor`s via `runner`) guided by `tdd-guide` using Vitest in `backend/` and `video-transcoder/`. Consult stack checklists under `.agents/checklists/` (`typescript.md`, `react.md`).
5. **Build & Error Recovery**: If compilation, lint, or type errors arise, invoke `build-error-resolver` for surgical, non-architectural fixes.
6. **Adversarial Dual-Review (Santa Loop)**: Run `santa-loop` dispatching `auditor` and `security-reviewer` independently over the diff. Both must issue a `PASS` verdict (max 3 fix iterations before human escalation).
7. **Clean-up & Authorized Commit**: Invoke `refactor-cleaner` to prune dead code and unused imports. Run `smart-commit` only when explicitly authorized by the user to create atomic Conventional Commits.
