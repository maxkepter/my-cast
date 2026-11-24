# Token Optimization & Context Window Management

## Model Tiering Strategy

1. **Fast / Cost-Effective Tier (e.g., Haiku / Flash)**:
   - Routine file searches and path discovery.
   - Independent single-file utility generation.
   - Documentation updates and formatting tasks.
2. **Implementation Tier (e.g., Sonnet)**:
   - Feature development and multi-file code modifications.
   - TDD workflows and unit test generation.
   - Code reviews and standard linting audits.
3. **Deep Reasoning Tier (e.g., Opus / Pro)**:
   - Complex architectural design and system decomposition.
   - Difficult multi-layer bug diagnosis and root-cause analysis.
   - Rigorous security reviews and threat modeling.

## Context Window Preservation

- **Avoid Late Context Saturation**: Avoid launching large refactoring passes or broad multi-module feature work when the conversational context exceeds 75% capacity.
- **Strategic Compaction**: Trigger manual compaction or start a fresh session at logical task boundaries (e.g., when a plan is finalized, or after an implementation task is verified green).
- **Prefer Focused Tools**: Query `graphify-out/` (`graphify query` / MCP `query_graph`) or use scoped `Grep`/`Glob` searches rather than wide recursive file dumps that flood the context with irrelevant lines.
- **De-clutter Tool Payloads**: Keep active tools and subagent scopes focused on the task domain.
