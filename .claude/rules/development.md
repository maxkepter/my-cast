# Development Rules

- Inspect relevant instructions (`CLAUDE.md`, `frontend/CLAUDE.md`, `DESIGN.md`), code, existing tests, and working-tree changes before editing. Preserve unrelated changes.
- Implement the smallest complete change that satisfies the request; follow existing MyCast conventions (DDD/Clean Architecture, no `I` prefix on interfaces, module-only NestJS imports) and avoid speculative abstractions.
- Validate external inputs, handle failures without losing data, and protect secrets. Follow `DESIGN.md` accessibility and design token requirements for `frontend/` changes.
- For nontrivial changes, identify affected module boundaries, contracts, dependencies, and verification before implementation. Ask about consequential ambiguity rather than inventing requirements.
- Run relevant tests, lint, or build checks available in the affected package (`backend/`, `frontend/`, `video-transcoder/`). Report failures, skipped checks, and reasons accurately.
- Never commit, push, publish, or perform destructive operations without user authorization. Do not bypass checks or hooks.
