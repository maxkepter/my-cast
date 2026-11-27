---
name: development
description: Plan, implement in parallel where safe via Task Matrix, and independently review nontrivial MyCast changes in two phases.
---

# Development Workflow (MyCast)

1. **Pre-Flight & Planning**: Start via `runner`, which checks `docs/workflow/active/YYYY-MM-DD-<slug>/`. When requirements are unclear or complex, run `business-analyst` (SRS in `docs/srs/`) or consult `architect` (read-only) first. If no approved `plan.md` exists, `runner` delegates to `planner` to create `docs/workflow/active/YYYY-MM-DD-<slug>/plan.md` (with MyCast's 6-step NestJS DDD sequence, complete `@Module` wiring, dependency matrix, public contracts with no `I` prefix, mock specs, `DESIGN.md` alignment, and non-overlapping `Scope (Files)`) and stops for user approval.
2. **Task Matrix & Parallel Execution**: Once `plan.md` is approved, `runner` creates `task-matrix.md` (single writer) and dispatches `executor` subagents only for `todo` tasks with satisfied `Deps` and non-overlapping `Scope (Files)`.
3. **Two-Phase Audit & Cross-Check**: Each task transitions `todo -> doing -> verifying` (`auditor` Phase 1 isolation with Vitest contract mocks + scope-lock check) `-> reviewing` (`runner` cross-checks `git diff --stat` and evidence) `-> done`. Any task exceeding 2 retries (`Retries > 2`) or hitting `VERDICT: BLOCKED` transitions to `blocked` and stops for user intervention.
4. **Full Integration & Archive**: Once 100% of tasks are `done`, `runner` invokes `auditor` in Phase 2 (full integration across `backend/`, `video-transcoder/`, `frontend/` without internal mocks). On `VERDICT: PASS`, `runner` moves the folder from `docs/workflow/active/` to `docs/workflow/archive/`.

Use the roles in `.claude/agents/` if supported; otherwise apply the same role boundaries in the current session. Use `systemone` for quantitative evaluation per `CLAUDE.md` when configured (`JEV_API_KEY` or `TYPESAFE_API_KEY`). This workflow never authorizes commits, pushes, or destructive actions without explicit user approval.
