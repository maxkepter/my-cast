# Claude Code Lifecycle Hooks (MyCast)

Event-driven hooks registered in `.claude/settings.json` and executed by the cross-platform runner `.claude/hooks/run-hook.js`.

## Active Hook Definitions

### PreToolUse
1. **Dev Server Execution Gate (`dev-server-gate`)**: On Unix/macOS/WSL, blocks foreground dev servers (`npm run dev`, `npm run start:dev`, etc.) outside `tmux` (exit code 2) unless `ECC_ALLOW_DEV_WITHOUT_TMUX=1` is set. Automatically skipped on native Windows (`win32`).
2. **Pre-Commit Quality Gate (`pre-commit-quality-gate`)**: Before `git commit`, scans newly added staged lines (`+` lines in `git diff --cached`) for leaked private keys/API keys (excluding `.env.example`) and for `console.log`/`debugger` in production `.ts`/`.tsx`/`.js`/`.jsx` files (exit code 2 on violation).
3. **Root Document Hygiene (`root-doc-hygiene`)**: Emits an advisory warning on `stderr` (exit code 0) when writing arbitrary `.md`/`.txt` files directly to the repository root instead of `docs/` (allows `README.md`, `CLAUDE.md`, `AGENTS.md`, `DESIGN.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE`).

### PostToolUse
1. **TypeScript Verification (`typescript-verification`)**: After editing `.ts`/`.tsx` files, locates the nearest package `tsconfig.json` (`backend/`, `frontend/`, or `video-transcoder/`) and runs that package's local TypeScript compiler (`tsc --noEmit --pretty`), reporting diagnostics on `stderr`.
