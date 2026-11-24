---
name: test-coverage
description: Analyze MyCast Vitest test coverage, identify untested branches and edge cases, and generate missing tests to reach >= 80% coverage.
---

# Test Coverage Analysis & Remediation (MyCast)

Analyze automated test coverage across unit, contract, and e2e tests, locate untested branches and execution paths, and generate targeted tests to achieve an 80%+ coverage threshold.

## Workflow

### Step 1: Verified MyCast Test & Coverage Commands
- **`backend/` (NestJS + Vitest)**:
  - Coverage report: `cd backend && npm run test:cov` (`vitest run --coverage`, `@vitest/coverage-v8`)
  - Targeted unit tests: `cd backend && npx vitest run src/modules/<module_name>`
  - E2E tests: `cd backend && npm run test:e2e` (`vitest run --config ./vitest.config.e2e.ts`)
- **`video-transcoder/` (NestJS + Vitest)**:
  - Unit tests: `cd video-transcoder && npm test` (`vitest run`)
- **`frontend/` (Next.js)**:
  - No automated unit-test script is currently configured in `frontend/package.json`. Report frontend test coverage as N/A (run `cd frontend && npm run lint && npm run build`) unless the user explicitly asks to add a test runner.

### Step 2: Run & Parse Coverage
1. Execute `npm run test:cov` in the target package (`backend/`).
2. Identify source files falling below the **80% threshold** (lines, branches, functions).
3. For each under-covered file, extract:
   - Untested service/domain methods.
   - Unreached conditional branches (`if/else`, `switch`, ternary, nullish coalescing).
   - Unhandled error recovery paths (`catch` blocks, S3/Redis/DB/queue failure branches, guard rejections).

### Step 3: Targeted Test Generation
Generate Vitest `*.spec.ts` tests following this priority:
1. **Happy Path**: Core domain and use-case behavior with valid inputs.
2. **Error & Failure Modes**: Invalid DTOs, unauthorized/forbidden callers, downstream storage/queue/DB timeouts.
3. **Boundary Values**: Empty collections, zero/negative values, max upload sizes, missing optional fields.
4. **Branch Completion**: Explicit scenarios covering every conditional branch.

## Test Implementation Invariants

- Place unit tests adjacent to source files (`*.spec.ts`) and e2e tests under `test/*.e2e-spec.ts`.
- Respect MyCast module boundaries: mock upstream module dependencies via exported contracts/mock specs, never deep-importing internals of other modules.
- Never weaken existing assertions or delete existing test cases to artificially raise coverage.
- Keep unit tests fast and hermetic: mock PostgreSQL/TypeORM repositories, Redis, BullMQ, RabbitMQ, and S3/MinIO clients.
- Confirm 100% of tests pass (`npm test` / `npm run test:cov`) and lint passes (`npm run lint` in `backend/`).

## Deliverable Format

```markdown
# [Test Coverage Report]

## Summary
- Target Package: `backend/` | `video-transcoder/`
- Target Threshold: >= 80%
- Initial Coverage: XX%
- Final Coverage: YY% (PASS | NEEDS FOLLOW-UP)

## Under-Covered Modules Remediated
- `backend/src/modules/<mod>/application/services/<svc>.ts`: Raised from 62% to 88% (+4 unit tests covering error branches).
```
