# Development rules

- Inspect relevant instructions, code, existing tests and working-tree changes before editing. Preserve unrelated changes.
- Implement the smallest change that satisfies the request; follow existing conventions and avoid speculative abstractions.
- Validate external inputs, handle failures without losing data, and protect secrets. Follow the project's accessibility and design requirements where applicable.
- For nontrivial changes, identify affected boundaries, contracts, dependencies and verification before implementation. Ask about consequential ambiguity rather than inventing requirements.
- Run relevant tests, lint or build checks available in the project. Report failures, skipped checks and reasons accurately.
- Never commit, push, publish or perform destructive operations without user authorization. Do not bypass checks or hooks.
