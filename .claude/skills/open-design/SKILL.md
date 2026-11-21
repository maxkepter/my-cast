---
name: open-design
description: >-
  Integrate OpenDesign (open-design.ai) with coding agents in MyCast to sync design tokens, read DESIGN.md contracts, query frames/artifacts via the OpenDesign MCP server, implement frontend UI components, and verify visual output.
---

# OpenDesign Integration Skill — MyCast

Use this skill to read OpenDesign specs (`DESIGN.md` and OpenDesign workspace artifacts), query frames over MCP, implement UI components in `frontend/src/components/` faithfully, and run visual verification.

## 1. Prerequisites & MCP Setup (Optional)

Configure the `open-design` MCP server in your harness configuration:

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

If OpenDesign MCP is not running, fall back to reading `DESIGN.md` directly from the repository root.

## 2. Available MCP Tools

When the `open-design` MCP server is connected:
- `list_projects`: List available OpenDesign projects.
- `get_active_context`: Retrieve the currently active project/file in OpenDesign.
- `get_artifact`: Extract an artifact along with its related components/files.
- `get_file`: Read a specific design file in a project.
- `create_artifact`: Create a new design artifact in OpenDesign.
- `search_files`: Search design files across the workspace.

## 3. UI Design-to-Code Workflow (MyCast)

1. **Read `DESIGN.md`**: Inspect MyCast's color tokens (`#9bf73c` Lime CTA, `#2d2d2d` Base Charcoal, `#1c1c1c` Dark Canvas, dark text `#1c1c1c`/`#2d2d2d` on Lime buttons, 60/30/10 ratio), typography scale, spacing, radii, elevation, and component guidelines.
2. **Query OpenDesign via MCP (when running)**: Call `get_active_context` or `get_artifact` to inspect the exact frame structure, layout hierarchy, and component specs.
3. **Implement Frontend Components**: Build or update React/Next.js + Tailwind CSS components in `frontend/src/components/` using `lucide-react` icons (no emoji icons), mapping strictly to the documented tokens.
4. **Verify Visually**: Preview the rendered UI in a browser against the dev server (`http://localhost:3000`) and verify layout, responsive behavior, contrast, and token adherence against `DESIGN.md`.
