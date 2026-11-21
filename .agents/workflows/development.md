---
name: development
description: Plan, implement in parallel where safe, and independently review nontrivial changes in two phases.
---

# Development workflow

1. **Pre-Flight & Planning**: Start via `runner`, which checks `docs/workflow/active/YYYY-MM-DD-<slug>/`. When requirements are unclear or complex, run `business-analyst` first. If no approved `plan.md` exists, `runner` delegates to `planner` to create `docs/workflow/active/YYYY-MM-DD-<slug>/plan.md` (with module dependency matrix, public contracts, mock specs, and non-overlapping file scopes) and stops for user approval.
2. **Task Matrix & Parallel Execution**: Once `plan.md` is approved, `runner` creates `task-matrix.md` (single writer) and dispatches `executor` subagents only for `todo` tasks with satisfied `Deps` and non-overlapping `Scope (Files)`.
3. **Two-Phase Audit & Cross-Check**: Each task transitions `todo -> doing -> verifying` (`auditor` Phase 1 isolation + scope-lock check) `-> reviewing` (`runner` cross-checks `git diff` and evidence) `-> done`. Any task exceeding 2 retries or hitting a blocker transitions to `blocked` and stops for user intervention.
4. **Full Integration & Archive**: Once 100% of tasks are `done`, `runner` invokes `auditor` in Phase 2 (full integration without internal mocks). On `PASS`, `runner` moves the folder from `docs/workflow/active/` to `docs/workflow/archive/`.

Use the roles in `.agents/agents/` if supported; otherwise apply the same responsibilities in the current session. The `systemone` skill may be used for quantitative evaluation when configured (`JEV_API_KEY` or `TYPESAFE_API_KEY`). This workflow does not authorize commits, pushes or destructive actions.
