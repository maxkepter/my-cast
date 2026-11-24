# OpenDesign Guidelines — MyCast

This project maintains its UI/UX design contract in `DESIGN.md` (alongside the color palette in `frontend/CLAUDE.md`):

1. **Single Source of Truth**: Read `DESIGN.md` and `frontend/CLAUDE.md` before creating or modifying UI components under `frontend/`.
2. **Design Tokens & Accessibility**:
   - Primary / CTA: `#9bf73c` (Lime). Base surface: `#2d2d2d` (Charcoal). Dark canvas: `#1c1c1c`.
   - On Lime (`#9bf73c`) buttons/surfaces, always use dark text (`#1c1c1c` or `#2d2d2d`) — never white text.
   - Follow the 60-30-10 color proportion (60% neutral canvas, 30% secondary charcoal surfaces, 10% lime accents).
   - Use a proper icon library (e.g., `lucide-react`) instead of raw emoji as UI icons.
   - Favor reusable, composable Tailwind CSS components consistent with `DESIGN.md`.
3. **OpenDesign MCP & Visual Verification**:
   - When the `open-design` MCP server is connected, query active frames, artifacts, and component hierarchies via MCP rather than guessing visual structure.
   - Verify UI changes against `DESIGN.md` tokens, contrast rules, and layout specifications.
