---
name: smart-commit
description: Analyze git diff and untracked files, group changes into independent atomic Conventional Commits, verify build/test checks, and push safely when explicitly authorized.
disable-model-invocation: true
---

# Smart Commit Skill (MyCast)

Automate reviewing working-tree changes, grouping them into logical atomic commits, running verification checks, and creating Conventional Commits when explicitly requested by the user.

## 1. Goals & Principles
- **Atomic Commits**: Each commit represents one coherent logical change (single responsibility).
- **Conventional Commits**: Use `type(scope): description` in imperative mood, lowercase, no trailing period:
  - `feat`: New feature.
  - `fix`: Bug fix.
  - `refactor`: Code restructuring without behavior change.
  - `style`: Formatting, tokens, CSS/styling.
  - `docs`: Documentation, guidelines, agent/skill configs.
  - `ci`: GitHub Actions, Docker, deployment pipelines.
  - `test`: Adding or updating tests.
  - `chore`: Dependencies, build tooling, repository maintenance.
- **Verification First**: Run build/lint/test checks for affected packages before committing; never bypass hooks.
- **Safety**: Never run blind `git add .`; stage explicit paths/hunks only, never stage `.env` or secrets, and never add `Co-authored-by:` trailers unless explicitly requested. Commit and push ONLY when explicitly authorized by the user.

---

## 2. 5-Step Workflow

### Step 1: Inspect Working Tree
```bash
git status -s
git diff --stat
git ls-files --others --exclude-standard
```

### Step 2: Group Changes by Natural Dependency Order
1. **CI / Config / Build Tools**: `.github/`, root configs, tooling.
2. **Docs / Guidelines**: `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, project docs, agent configs.
3. **Core / Shared / Common**: `common/`, utilities, domain primitives, shared types.
4. **Infrastructure / Database**: TypeORM modules, migrations, adapters, storage/queue/cache configs.
5. **Feature Modules (Backend / Video Transcoder)**: Domain entities -> DTOs -> Use-case interfaces -> Services -> Controllers -> `@Module`.
6. **Frontend Core / Design Tokens**: `globals.css`, color palette, Tailwind theme.
7. **Frontend State / Clients**: API clients, auth context, hooks, shared types.
8. **Frontend Components / UI**: Layouts, components, pages.

### Step 3: Verify Affected Packages
- Backend:
  ```bash
  npm --prefix backend run lint
  npm --prefix backend run build
  npm --prefix backend run test
  ```
- Video Transcoder:
  ```bash
  npm --prefix video-transcoder run build
  npm --prefix video-transcoder run test
  ```
- Frontend:
  ```bash
  npm --prefix frontend run lint
  npm --prefix frontend run build
  ```

### Step 4: Create Atomic Commits (Only When Explicitly Requested)
Stage explicit paths per group, inspect `git diff --cached`, and commit:
```bash
# Example group 1: CI
git add .github/workflows/backend.yml .github/workflows/frontend.yml
git commit -m "ci: prune docker images after deployment"

# Example group 2: Backend module
git add backend/src/modules/user/ backend/src/app.module.ts
git commit -m "feat(backend): add user module and wire application modules"
```

### Step 5: Push to Remote (Only When Separately Requested)
Verify branch, remote, and clean working tree before pushing:
```bash
git status
git push origin <current-branch>
```

---

## 3. Pre-Push Checklist
- [ ] Zero junk files or real `.env` credentials staged.
- [ ] Commit messages follow Conventional Commits (imperative mood, lowercase, no trailing period).
- [ ] Affected packages build and pass verification checks cleanly.
- [ ] Working tree state and commit IDs reported accurately.
