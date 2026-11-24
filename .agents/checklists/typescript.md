# TypeScript & NestJS Engineering Checklist (MyCast)

## Type Safety & Schema Invariants
- [ ] **Strict Typing**: Respect each package's `tsconfig.json` (`backend/`, `frontend/`, `video-transcoder/`) and keep nullability explicit.
- [ ] **Zero `any` Policy**: Avoid `any` in production code; use `unknown` with runtime type narrowing or generic constraints.
- [ ] **No `I` Prefix on Interfaces**: Never prefix interface names with `I` across backend or frontend (e.g., use `UserService`, `UploadVideoUseCase`, `VideoQueryContract`).
- [ ] **Explicit Return Types**: Include explicit return type annotations on exported functions, service methods, and public module contracts.
- [ ] **Immutability**: Prefer `readonly` arrays (`ReadonlyArray<T>` or `readonly T[]`) and `as const` assertions for fixed lookup maps.
- [ ] **Boundary Validation**: Validate external NestJS DTO inputs with `class-validator` / `class-transformer` decorators.

## Module Boundaries & Imports (NestJS Clean Architecture / DDD)
- [ ] **Module-Only Imports**: NestJS modules may only import other modules (`imports: [OtherModule]`). Never import another module's internal entities, repositories, or private services directly.
- [ ] **Explicit Public Contracts**: Expose cross-module APIs strictly via exported service contracts, DTOs, and event schemas.
- [ ] **Cohesive Services**: Group related use-case interfaces sharing dependencies/business context into cohesive services under `application/services/`.
- [ ] **Type-Only Imports**: Use `import type { ... }` for type-only references where appropriate.

## Verification (Verified MyCast Commands)
- [ ] **Backend**: `cd backend && npm run lint && npm run build && npm test` (`oxlint --type-aware`, `nest build`, `vitest run`)
- [ ] **Video Transcoder**: `cd video-transcoder && npm run build && npm test` (`nest build`, `vitest run`)
- [ ] **Frontend**: `cd frontend && npm run lint && npm run build` (`eslint`, `next build`)
