---
name: open-design
description: >-
  Integrate OpenDesign (open-design.ai) with Antigravity to sync MyCast design tokens, read DESIGN.md and frontend/AGENTS.md contracts, query frames/artifacts via the OpenDesign MCP server, implement Next.js/Tailwind UI components, and visually verify output.
---

# OpenDesign Integration Skill (MyCast)

Use this skill to read MyCast's OpenDesign specs (`DESIGN.md` and OpenDesign workspace artifacts), query frames over MCP, implement Next.js / Tailwind CSS components faithfully under `frontend/`, and run visual verification.

## Prerequisites & MCP Setup (Optional)

If you use the local-first OpenDesign daemon (`od`), configure the `open-design` MCP server in Antigravity (`~/.gemini/antigravity/mcp_config.json` or `~/.gemini/config/mcp_config.json`):

```json
{
  "mcpServers": {
    "open-design": {
      "command": "od",
      "args": ["mcp", "--daemon-url", "http://127.0.0.1:7456"]
    }
  }
}
```

Start the local daemon when querying workspace artifacts:

```bash
# Headless daemon:
od --no-open

# Or open the OpenDesign UI:
od
```

If OpenDesign MCP is not running, fall back to reading `DESIGN.md` and `frontend/AGENTS.md` directly from the repository.

## Available MCP Tools

When the `open-design` MCP server is connected:
- `list_projects`: List available OpenDesign projects.
- `get_active_context`: Retrieve the currently active project/file in OpenDesign.
- `get_artifact`: Extract an artifact along with its related components/files.
- `get_file`: Read a specific design file in a project.
- `create_artifact`: Create a new design artifact in OpenDesign.
- `search_files`: Search design files across the workspace.

## UI Design-to-Code Workflow

1. **Read Design Contracts**: Inspect `DESIGN.md` and `frontend/AGENTS.md` (`#1c1c1c` dark canvas, `#2d2d2d` charcoal base, `#9bf73c` lime accent, dark text `#1c1c1c`/`#2d2d2d` on lime buttons — never white text).
2. **Query OpenDesign via MCP (when running)**: Call `get_active_context` or `get_artifact` to inspect frame layout and component hierarchy.
3. **Implement Frontend Components**: Build reusable Next.js App Router + Tailwind CSS components under `frontend/src/components/` using standard icons (e.g., `lucide-react`) instead of raw emoji, and respecting MyCast's no-`I`-prefix interface rule.
4. **Visual Verification**: Use the `browser` subagent to open the local dev server preview (`localhost:3000`), inspect screenshots against `DESIGN.md`, and run `cd frontend && npm run lint && npm run build`.
