# Project Guidelines

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
      5. **Use-Case Implementation**: Implement Service classes (`application/services/`) — **prefer grouping multiple interfaces sharing dependencies and business context into a single cohesive service class** (avoid fragmenting into trivial one-class-per-interface files) — and Event Handlers (`application/handlers/`).
      6. **Infrastructure Implementation**: Controllers, Guards, Middlewares, Listeners, and Adapters (`infra/`).
    - **Module Boundary & Dependency Rules**:
      - **Cross-Module Communication**: Modules know and depend on each other strictly through **public APIs and schemas** (exported Service contracts, DTOs, Event schemas).
      - **Modules May ONLY Import Modules**: In NestJS modules, `imports` may only import other modules (`imports: [OtherModule]`). Directly importing entities, internal services, or private files from another module is strictly forbidden.
      - **Dependency Matrix & Contracts**: Planner must explicitly define upstream dependencies and downstream dependents, complete with contracts (API signatures, DTOs, Events, Mock specs) so modules can be developed and tested independently.
      - **Complete `@Module` Configuration Required**: When Planner designs each module (even at the Domain stage), it **must specify the complete `@Module` definition** (no empty placeholders):
        ```typescript
        @Module({
          imports: [TypeOrmModule.forFeature([...]), OtherModule],
          controllers: [...],
          providers: [...],
          exports: [...],
        })
        ```
        List every item in `imports` (TypeORM entities, upstream modules), `controllers`, `providers` (domain services, use-case services, handlers), and `exports` (public contracts and services).
    - **Interface Naming Convention**:
      - **Never use the `I` prefix on interface names** anywhere in the repository (e.g., use `UserService`, `UploadVideoUseCase`, `VideoQueryContract` instead of `IUserService`, `IUploadVideoUseCase`, `IVideoQueryContract`). Applies to both backend and frontend.
    - **Parallel Orchestration & Two-Phase Auditing**:
      - **Runner**: Dispatches N modules to N parallel `executor` subagents working independently against contracts.
      - **Auditor Phase 1 (Module Isolation)**: Tests each module in isolation, mocking upstream module APIs and data strictly per the contract mock spec.
      - **Auditor Phase 2 (Full Integration)**: Once 100% of modules pass Phase 1, verifies real system-wide integration (real NestJS DI, event routing, full build/lint/test).
      - **Runner Boundary & Violation Protocol**: Runner is **coordinator-only**. It must never perform Planner work (creating/editing plans), Executor work (writing/editing code), or Auditor work (running tests/audits). **On any violation: immediately stop all agents, restart the pipeline from scratch, and issue a warning for the next run.**
    - Integrated Infrastructure: PostgreSQL (TypeORM), Redis (Cache), BullMQ (Queues & background jobs), AWS S3/MinIO (Object storage & presigned URLs), Mailer, Event Emitter / RabbitMQ.
  - `video-transcoder/`: Standalone NestJS 11 video transcoding microservice (FFmpeg/FFprobe, RabbitMQ, Vitest).
  - `frontend/`: Next.js (App Router), React, TypeScript, Tailwind CSS. Follow the color palette in `frontend/CLAUDE.md` and the OpenDesign contract in `DESIGN.md` (Primary Lime `#9bf73c`, Base Charcoal `#2d2d2d`).
  - `.claude/skills/open-design`: OpenDesign (`open-design.ai`) integration with Claude Code.
  - `.claude/skills/systemone`: Semantic evaluation and AI routing module (JEV SystemOne).

---

## Agent Requirement: Active Use of SystemOne Skill

All agents (`planner`, `executor`, `auditor`, `runner`, `claude`) **must proactively use the `systemone` skill** across analysis, implementation, and verification tasks:

### 1. SystemOne Role Allocation
- **Planner**:
  - Evaluate technical complexity (`number:complexity:1,10`), architectural risk (`noun:risk_level:low,medium,high,critical`), affected modules (`list:modules:auth,user,video,storage,queue,cache,frontend`), and design strategy (`noun:strategy`).
- **Executor**:
  - Triage semantic inputs, routing logic, latent edge cases, and AI-powered primitives in source code.
- **Auditor**:
  - Act as an independent quantitative referee: score code quality (`number:quality_score:1,10`), architecture compliance (`number:compliance:1,10`), defect severity (`noun:severity:blocker,major,minor,trivial`), and PASS/FAIL gating (`noul:is_pass`).
- **Runner**:
  - Assess convergence across iterations (`number:convergence:1,5`) and whether remaining errors can be auto-resolved (`noul:can_auto_resolve`) to decide between retrying or escalating to the user.

### 2. Mandatory Reporting Standard
Whenever an agent runs `systemone`, it **MUST** include both sections in its output:

1. **Evaluation Process**:
   - **Input State**: Concise summary of the context passed to `-s`.
   - **Questions / Primitives**: List of configured primitives (`noul`, `noun`, `number`, `list`, `string`) and each question's purpose.
   - **Executed Command / Code**: Exact CLI command `node .claude/skills/systemone/script/systemone-eval.js ...` or Node.js snippet executed.

2. **Evaluation Results & Decisions**:
   - **Results Table**: Returned values, scores, probabilities, and classification labels from SystemOne.
   - **Action Decision**: Clear rationale explaining the next branch or action chosen from the quantitative results.

---

## SystemOne Evaluation Technical Reference
Used for semantic classification, routing, and typed quantitative evaluation.

- **Skill**: `systemone` (details: [.claude/skills/systemone/SKILL.md](.claude/skills/systemone/SKILL.md)).
- **Script**: `.claude/skills/systemone/script/systemone-eval.js`
- **Environment Variables**: Configured in local `.env` or shell environment (never commit `.env` to git):
  - `JEV_API_KEY`: Authentication API key (required; `TYPESAFE_API_KEY` also supported).
  - `JEV_ENDPOINT_URL`: Custom endpoint URL (optional).
  - `JEV_MODEL`: Target model identifier (optional).
- **Primitives**:
  - `noul`: Boolean / probability `[0..1]`.
  - `noun` / `choice`: Single option selection with probability distribution.
  - `string`: String / identifier extraction.
  - `number` / `score`: Quantitative scale (`min, max` or ordered levels).
  - `list`: Multi-label selection.

### Usage

#### 1. Environment Setup
Configure in a local `.env` file (auto-loaded, gitignored):
```env
JEV_API_KEY=<your-api-key>
# JEV_ENDPOINT_URL=<endpoint-url>
# JEV_MODEL=<model-name>
```

#### 2. Run Directly via CLI Flags

**Full Flag Syntax:**
```bash
node .claude/skills/systemone/script/systemone-eval.js \
  -s "Video streaming API timed out while uploading a 2GB video" \
  --noul is_urgent "Is this urgent?" \
  --noun category "Classify issue type" "bug,performance,billing" \
  --number priority "Priority level" "1,5" \
  --list tags "Affected areas" "backend,frontend,storage,devops" \
  --string target "Affected module" "video_upload,user_profile,auth"
```

**Compact `-q` Syntax:**
```bash
node .claude/skills/systemone/script/systemone-eval.js \
  -s "NestJS video streaming module upload presigned URL latency spike" \
  -q "urgent:noul:Is this urgent?" \
  -q "layer:noun:Architectural layer:domain,application,infrastructure" \
  -q "risk:number:Risk level:1,5" \
  -q "modules:list:Related modules:video,storage,queue,auth"
```

#### 3. Node.js Module Usage
```javascript
const { evaluate } = require("./.claude/skills/systemone/script/systemone-eval");
const res = await evaluate({ state, questions });
```
