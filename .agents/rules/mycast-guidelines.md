---
trigger: always_on
description: Core MyCast monorepo guidelines covering NestJS DDD/Clean Architecture, module boundaries, interface naming, Next.js design contract, and SystemOne usage.
---

# Project Guidelines — MyCast

## Project Context
- **Project Name**: MyCast
- **Goal**: Multimedia video streaming, podcast sharing, casting, and audio/video transcoding & delivery platform.
- **Monorepo Structure**:
  - `backend/`: NestJS 11 following Clean Architecture & Domain-Driven Design (DDD).
    - Clear layering: `domain` (entities, value objects, domain events), `application` (use cases, services, handlers, interfaces), `infra/infrastructure` (controllers, guards, strategies, listeners, adapters), `dtos`.
    - **Mandatory 6-Step Design & Implementation Sequence**:
      1. **Business Boundaries & Modules**: Define bounded contexts and independent modules.
      2. **Business Rules**: Define enums (`domain/enums/`) and domain events (`domain/events/`).
      3. **API & Schema**: Define use-case interfaces and request/response DTOs (`dtos/`).
      4. **Domain Components**: Design Entities (`domain/entities/`), Value Objects, Domain Services, and Repository interfaces.
      5. **Use-Case Implementation**: Implement Service classes (`application/services/`) — prefer grouping multiple interfaces sharing dependencies and business context into a single cohesive service class — and Event Handlers (`application/handlers/`).
      6. **Infrastructure Implementation**: Controllers, Guards, Middlewares, Listeners, and Adapters (`infra/`).
    - **Module Boundary & Dependency Rules**:
      - **Cross-Module Communication**: Modules know and depend on each other strictly through **public APIs and schemas** (exported Service contracts, DTOs, Event schemas).
      - **Modules May ONLY Import Modules**: In NestJS modules, `imports` may only import other modules (`imports: [OtherModule]`). Directly importing entities, internal services, or private files from another module is strictly forbidden.
      - **Dependency Matrix & Contracts**: Planner must define upstream/downstream dependencies and complete contracts (API, DTO, Event, Mock spec) so modules can be developed and tested independently.
      - **Complete `@Module` Configuration Required**: Planner must explicitly list every element in `imports`, `controllers`, `providers`, and `exports`.
    - **Interface Naming Convention**:
      - **Never use the `I` prefix on interface names** anywhere in the repository.
    - **Parallel Orchestration & Two-Phase Auditing**:
      - **Runner**: Dispatches N modules to N parallel `executor` subagents working independently against contracts.
      - **Auditor Phase 1 (Module Isolation)**: Tests each module in isolation with upstream mocks per contract spec.
      - **Auditor Phase 2 (Full Integration)**: Once 100% of modules pass Phase 1, verifies real system-wide integration.
      - **Runner Boundary**: Runner is **coordinator-only**. Never perform Planner, Executor, or Auditor work.
  - `video-transcoder/`: Standalone NestJS 11 video transcoding microservice.
  - `frontend/`: Next.js (App Router), React, TypeScript, Tailwind CSS. Follow `frontend/AGENTS.md` and the OpenDesign contract in `DESIGN.md` (Primary Lime `#9bf73c`, Base Charcoal `#2d2d2d`).
  - `.agents/skills/open-design`: OpenDesign (`open-design.ai`) integration with Antigravity.
  - `.agents/skills/systemone`: Semantic evaluation and AI routing module (JEV SystemOne).

## Agent Requirement: Active Use of SystemOne Skill
All agents (`planner`, `executor`, `auditor`, `runner`) proactively use `systemone` across analysis, implementation, and verification tasks:
- **Planner**: Evaluate `complexity`, `risk_level`, `modules`, `strategy`.
- **Executor**: Triage semantic data, routing logic, and edge cases.
- **Auditor**: Score `quality_score`, `compliance`, `severity`, `is_pass`.
- **Runner**: Assess `convergence` and `can_auto_resolve`.
