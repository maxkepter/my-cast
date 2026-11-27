---
trigger: always_on
description: Follow DESIGN.md and OpenDesign contracts as the single source of truth for MyCast frontend UI implementation and review.
---

# OpenDesign Integration Guidelines — MyCast

Guidelines for following the **OpenDesign** (`open-design.ai` / `DESIGN.md`) design system in MyCast.

## 1. Single Source of Truth
- All UI/UX specifications, component styling, layouts, and color tokens are governed by `DESIGN.md` (alongside `frontend/AGENTS.md`).
- Before creating or modifying any component under `frontend/`, agents (`planner`, `executor`, `auditor`) **MUST** read and follow the tokens defined in `DESIGN.md`.

## 2. UI Implementation Rules from OpenDesign Specs
- **Colors & Tokens**:
  - Primary / CTA: `#9bf73c` (Lime).
  - Base surface: `#2d2d2d` (Charcoal).
  - Page canvas: `#1c1c1c` (Dark mode).
  - Lime buttons: always use dark text (`#1c1c1c` or `#2d2d2d`); **never use white text**.
  - Color balance: 60% neutral canvas (`#1c1c1c`, `#141414`), 30% secondary charcoal surfaces (`#2d2d2d`), 10% lime accents (`#9bf73c`).
- **Iconography**: Use a standard icon library (such as `lucide-react`); never use raw emoji as UI icons.
- **Components**: Favor reusable, composable Tailwind CSS components aligned with OpenDesign tokens.

## 3. OpenDesign Workspace & MCP Verification
- When the local OpenDesign desktop app or daemon is running:
  - Query frames, component hierarchies, and design specs via the `open-design` MCP server.
  - Use the `browser` subagent to visually verify the live app on the local dev server (`localhost:3000`) when reviewing UI work.
  - `auditor` must verify implemented frontend code directly against `DESIGN.md`.
