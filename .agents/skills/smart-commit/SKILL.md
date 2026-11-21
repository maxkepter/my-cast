---
name: smart-commit
description: Phân tích git diff và untracked files, nhóm thay đổi theo module/tính năng độc lập, kiểm tra build/test, tạo các atomic commit theo chuẩn Conventional Commits khi được yêu cầu tường minh.
disable-model-invocation: true
---

# Smart Commit Skill

Skill tự động hóa quy trình rà soát, nhóm thay đổi nguyên tử (atomic commits), kiểm tra chất lượng trước khi commit và push an toàn lên Git remote.

## 1. Mục tiêu và Nguyên tắc
- **Atomic Commits**: Mỗi commit đại diện cho một thay đổi logic duy nhất (single responsibility).
- **Conventional Commits**: Định dạng commit message chuẩn `type(scope): description` ở thể mệnh lệnh (imperative mood):
  - `feat`: Tính năng mới.
  - `fix`: Sửa lỗi.
  - `refactor`: Tái cấu trúc code (không đổi hành vi).
  - `style`: Định dạng code, tokens, CSS/styling.
  - `docs`: Tài liệu, guidelines, skill definitions.
  - `ci`: Cấu hình GitHub Actions, Docker, deployment pipeline.
  - `test`: Thêm hoặc sửa test cases.
  - `chore`: Cấu hình dependencies, build tool.
- **Verification First**: Kiểm tra build, lint và test của module bị ảnh hưởng trước khi tạo commit; báo cáo trung thực các bước pass/fail/skipped và không bypass git hooks.
- **Safety & Attribution**:
  - Cấm dùng `git add .` bừa bãi; chỉ stage tường minh từng đường dẫn hoặc hunk sau khi kiểm tra diff. Bảo toàn các thay đổi không liên quan và tuyệt đối không stage secrets hay file `.env`.
  - **Không bao giờ** thêm dòng `Co-authored-by:` hoặc ghi công AI/agent trong commit message trừ khi người dùng yêu cầu rõ ràng.
  - Chỉ thực hiện `git commit` khi người dùng yêu cầu tường minh, và chỉ `git push` khi người dùng yêu cầu riêng biệt.

---

## 2. Quy trình 5 bước thực hiện

### Bước 1: Rà soát Working Tree
Lấy toàn bộ trạng thái thay đổi:
```bash
git status -s
git diff --stat
git ls-files --others --exclude-standard
```

### Bước 2: Phân loại và lập nhóm Commit (Grouping)
Nhóm các file thay đổi theo thứ tự phụ thuộc tự nhiên trong monorepo MyCast:
1. **CI / Config / Build tools**: `.github/`, root config, toolings.
2. **Docs / Guidelines**: `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, tài liệu dự án, agent prompts.
3. **Core / Shared / Common**: `common/`, utility, domain primitives, types dùng chung.
4. **Infrastructure / Database**: TypeORM modules, migrations, adapters, configs kết nối.
5. **Feature Modules (Backend)**: Domain entities -> DTOs -> UseCases -> Services -> Controllers -> Module.
6. **Frontend Core / Design Tokens**: `globals.css`, color palette, Tailwind theme.
7. **Frontend State / Clients**: API client, auth context, hooks, shared types.
8. **Frontend Components / UI**: Layouts, components, pages.

### Bước 3: Verification (Build, Lint & Test)
Kiểm tra module tương ứng không bị gãy trước khi commit:
- Backend:
  ```bash
  npm --prefix backend run lint
  npm --prefix backend run build
  npm --prefix backend run test
  ```
- Frontend:
  ```bash
  npm --prefix frontend run lint
  npm --prefix frontend run build
  ```

### Bước 4: Tạo Atomic Commits
Chạy `git add` tường minh theo từng nhóm, kiểm tra `git diff --staged`, và commit:
```bash
# Ví dụ nhóm 1: CI
git add .github/workflows/backend.yml .github/workflows/frontend.yml
git commit -m "ci: prune docker images after deployment"

# Ví dụ nhóm 2: Module User
git add backend/src/modules/user/ backend/src/app.module.ts
git commit -m "feat(backend): add user module and wire application modules"
```

### Bước 5: Push lên Remote (Chỉ khi được yêu cầu)
Xác minh nhánh, remote, trạng thái working tree và đẩy branch lên origin khi người dùng yêu cầu push:
```bash
git status
git push origin <current-branch>
```

---

## 3. Checklist trước khi Commit / Push
- [ ] Không có file rác, file `.env` chứa credential thực tế bị add nhầm.
- [ ] Tên commit viết ở thể mệnh lệnh (imperative mood), viết thường, không chấm câu cuối, không chứa `Co-authored-by:`.
- [ ] Các module bị ảnh hưởng đã pass build/lint/test.
- [ ] Báo cáo danh sách commit IDs và các thay đổi còn lại (nếu có).
