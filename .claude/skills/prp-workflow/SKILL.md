---
name: prp-workflow
description: End-to-end Product Requirements and Implementation Planning workflow. Bridges problem definition, interactive scoping, and contract-driven implementation planning for MyCast.
---

# PRP Workflow (Product Requirements & Implementation Plan)

The PRP Workflow enforces a rigorous, problem-first discipline: understand the problem deeply, extract technical constraints, define modular implementation phases, and validate contracts before writing production code.

## Core Phases

```text
[Phase 1: PRD Inception] -> [Phase 2: Technical Grounding] -> [Phase 3: Implementation Plan]
```

### Phase 1: PRD Inception (Problem-First Scoping)
- **Problem Statement**: What exact friction or limitation exists today? Who is affected?
- **Hypothesis & Expected Outcome**: What measurable outcome proves success?
- **User Scenarios**: Concrete step-by-step walkthroughs of the user journey.
- **Out of Scope (Anti-Goals)**: Explicitly list what will NOT be built in this iteration to prevent scope creep.

### Phase 2: Technical Grounding & Pattern Extraction
- **Codebase Pattern Audit**: Query `graphify-out/` (when present) and inspect existing MyCast modules (`backend/src/modules/`, `video-transcoder/src/`, `frontend/src/`), `CLAUDE.md`, and `DESIGN.md`.
- **Contract Definition**: Define public DTOs (`class-validator`), interfaces (no `I` prefix), event payloads, and TypeORM schemas required for the feature.
- **Dependency & Integration Points**: Map upstream/downstream NestJS module dependencies (`imports: [OtherModule]`), Redis/BullMQ/RabbitMQ/S3 boundaries, and frontend API integration.

### Phase 3: Detailed Implementation Plan
Produce a self-contained plan (`docs/workflow/active/YYYY-MM-DD-<slug>/plan.md` via `planner`) enabling parallel execution via `runner`'s `task-matrix.md` without guesswork:
1. **Module Breakdown**: Non-overlapping file ownership per module/package.
2. **6-Step Backend Sequence**: Boundaries/Contracts -> Enums & Events -> Usecase Interfaces & DTOs -> Entities & VOs -> Cohesive Services & Handlers -> Infra & Complete `@Module` Wiring (plus Next.js UI aligned with `DESIGN.md`).
3. **Contract & Mock Specifications**: Exact mock interfaces so Phase 1 unit tests run hermetically under Vitest.
4. **Validation Checklist**: Verified commands (`backend`: `npm run lint && npm run build && npm test`; `video-transcoder`: `npm run build && npm test`; `frontend`: `npm run lint && npm run build`).

## PRP Templates

### PRD Document Structure (`docs/prd/<feature>.md`)
```markdown
# [PRD] <Feature Name>

## 1. Problem Statement & Context
- Core Problem: ...
- Affected Users: ...
- Evidence / Data: ...

## 2. Goals & Success Metrics
- Goal: ...
- Success Metric: ...

## 3. Scope Boundaries
- In Scope: ...
- Explicitly Out of Scope: ...

## 4. Acceptance Criteria
- [ ] Criterion 1: ...
- [ ] Criterion 2: ...
```

### Implementation Plan Structure (`docs/workflow/active/YYYY-MM-DD-<slug>/plan.md`)
Follow `planner`'s full MyCast plan template (SystemOne assessment, module dependency matrix & contracts, 6-step module design with complete `@Module`, frontend `DESIGN.md` alignment, parallel assignment, and Phase 1 / Phase 2 audit criteria).
