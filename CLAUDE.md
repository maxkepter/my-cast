# Project Guidelines

## Tổng quan dự án (Project Context)
- **Tên dự án**: MyCast
- **Mục tiêu**: Nền tảng phát trực tuyến, chia sẻ video và podcast đa phương tiện (Video streaming, casting, audio/video transcoding & delivery).
- **Cấu trúc Monorepo**:
  - `backend/`: NestJS 11 theo mô hình Clean Architecture & Domain-Driven Design (DDD).
    - Phân lớp rõ ràng: `domain` (entities, value objects, domain events), `application` (usecases, services, handlers, interfaces), `infra/infrastructure` (controllers, guards, strategies, listeners, adapters), `dtos`.
    - Hạ tầng tích hợp: PostgreSQL (TypeORM), Redis (Cache), BullMQ (Queue & background job processing), AWS S3/MinIO (Object storage, presigned URLs), Mailer, Event Emitter / RabbitMQ.
  - `frontend/`: Next.js (App Router), React, TypeScript, Tailwind CSS. Tuân thủ bảng màu chuẩn tại `frontend/CLAUDE.md` (chủ đạo Lime `#9bf73c` và Base Charcoal `#2d2d2d`).
  - `.claude/skills/systemone`: Module đánh giá ngữ nghĩa và định tuyến AI (JEV SystemOne).

---

## Yêu cầu đối với các Agent: Tăng cường vận dụng Skill SystemOne

Tất cả các agent (`planner`, `executor`, `auditor`, `runner`, `claude`) **bắt buộc chủ động khai thác skill `systemone`** trong mọi tác vụ phân tích, triển khai và kiểm thử:

### 1. Phân bổ vai trò ứng dụng SystemOne
- **Planner**:
  - Dùng SystemOne để đánh giá độ phức tạp (`number:complexity:1,10`), rủi ro kiến trúc (`noun:risk_level:low,medium,high,critical`), phân loại module bị ảnh hưởng (`list:modules:auth,user,video,storage,queue,cache,frontend`) và định tuyến phương án thiết kế (`noun:strategy`).
- **Executor**:
  - Dùng SystemOne cho các bài toán phân loại ngữ nghĩa dữ liệu đầu vào, routing logic, phát hiện edge-cases tiềm ẩn, và hỗ trợ xây dựng tính năng AI-powered primitives trong mã nguồn.
- **Auditor**:
  - Dùng SystemOne làm trọng tài đánh giá độc lập: chấm điểm code quality (`number:quality_score:1,10`), đo độ tuân thủ kiến trúc (`number:compliance:1,10`), phân loại mức độ nghiêm trọng của lỗi (`noun:severity:blocker,major,minor,trivial`), và quyết định PASS/FAIL gating (`noul:is_pass`).
- **Runner**:
  - Dùng SystemOne phân tích mức độ hội tụ qua các iteration (`number:convergence:1,5`), đánh giá xem lỗi còn lại có khả năng tự giải quyết không (`noul:can_auto_resolve`) để quyết định lặp tiếp hay escalate cho người dùng.

### 2. Quy chuẩn phản hồi bắt buộc (Reporting Standard)
Mỗi khi agent kích hoạt và sử dụng `systemone`, **PHẢI** xuất trình đầy đủ 2 phần trong phản hồi:

1. **Quá trình sử dụng (Evaluation Process)**:
   - **Input State**: Tóm tắt ngắn gọn chuỗi ngữ cảnh/dữ liệu truyền vào `-s`.
   - **Thiết kế Questions/Primitives**: Liệt kê các primitives được cấu hình (`noul`, `noun`, `number`, `list`, `string`) và mục đích của từng câu hỏi.
   - **Lệnh / Code thực thi**: Lệnh CLI `node .claude/skills/systemone/script/systemone-eval.js ...` hoặc đoạn code Node.js đã chạy.

2. **Kết quả và Quyết định (Evaluation Results & Decisions)**:
   - **Bảng kết quả**: Giá trị output, điểm số, xác suất và nhãn phân loại từ SystemOne.
   - **Quyết định hành động**: Lý giải rõ ràng nhánh logic hoặc hành động tiếp theo được chọn căn cứ vào kết quả định lượng trên.

---

## Hướng dẫn kỹ thuật SystemOne Evaluation
Dùng cho phân loại ngữ nghĩa, định tuyến (router) và đánh giá có định kiểu.

- **Skill**: `systemone` (chi tiết: [.claude/skills/systemone/SKILL.md](.claude/skills/systemone/SKILL.md)).
- **Script**: `.claude/skills/systemone/script/systemone-eval.js`
- **Biến môi trường**: Cấu hình trong file `.env` cục bộ hoặc export từ shell (tuyệt đối không commit `.env` vào git):
  - `JEV_API_KEY`: API key xác thực (bắt buộc).
  - `JEV_ENDPOINT_URL`: Endpoint tùy biến (tùy chọn).
  - `JEV_MODEL`: Model chỉ định (tùy chọn).
- **Primitives**:
  - `noul`: Boolean / xác suất [0..1].
  - `noun` / `choice`: Chọn 1 option kèm phân phối xác suất.
  - `string`: Trích xuất chuỗi / định danh.
  - `number` / `score`: Đo lường thang điểm (`min, max` hoặc ordered levels).
  - `list`: Chọn nhiều nhãn phù hợp (multi-label).

### Hướng dẫn sử dụng

#### 1. Thiết lập biến môi trường
Cấu hình trong file `.env` cục bộ (tự động load, file `.env` đã được gitignore):
```env
JEV_API_KEY=<your-api-key>
# JEV_ENDPOINT_URL=<endpoint-url>
# JEV_MODEL=<model-name>
```

#### 2. Chạy trực tiếp qua CLI Flags

**Cú pháp đầy đủ:**
```bash
node .claude/skills/systemone/script/systemone-eval.js \
  -s "Video streaming API gặp lỗi timeout khi upload video 2GB" \
  --noul is_urgent "Có khẩn cấp không?" \
  --noun category "Phân loại lỗi" "bug,performance,billing" \
  --number priority "Mức độ ưu tiên" "1,5" \
  --list tags "Các bộ phận liên quan" "backend,frontend,storage,devops" \
  --string target "Module bị ảnh hưởng" "video_upload,user_profile,auth"
```

**Cú pháp gọn `-q`:**
```bash
node .claude/skills/systemone/script/systemone-eval.js \
  -s "NestJS video streaming module upload presigned URL latency spike" \
  -q "urgent:noul:Có khẩn cấp không?" \
  -q "layer:noun:Phân lớp kiến trúc:domain,application,infrastructure" \
  -q "risk:number:Mức độ rủi ro:1,5" \
  -q "modules:list:Module liên quan:video,storage,queue,auth"
```

#### 3. Sử dụng dạng Node.js Module
```javascript
const { evaluate } = require('./.claude/skills/systemone/script/systemone-eval');
const res = await evaluate({ state, questions });
```

Payload mẫu: [.claude/skills/systemone/examples/all-types-payload.json](.claude/skills/systemone/examples/all-types-payload.json)
