# Project Guidelines

## Tổng quan dự án (Project Context)
- **Tên dự án**: MyCast
- **Mục tiêu**: Nền tảng phát trực tuyến, chia sẻ video và podcast đa phương tiện (Video streaming, casting, audio/video transcoding & delivery).
- **Cấu trúc Monorepo**:
  - `backend/`: NestJS 11 theo mô hình Clean Architecture & Domain-Driven Design (DDD).
    - Phân lớp rõ ràng: `domain` (entities, value objects, domain events), `application` (usecases, services, handlers, interfaces), `infra/infrastructure` (controllers, guards, strategies, listeners, adapters), `dtos`.
    - **Trình tự thiết kế & triển khai chuẩn (6 bước bắt buộc)**:
      1. **Ranh giới nghiệp vụ & Module**: Phân định ranh giới nghiệp vụ, module độc lập.
      2. **Business Rules**: Khởi tạo enums (`domain/enums/`) và domain events (`domain/events/`).
      3. **API & Schema**: Định nghĩa usecase interfaces và DTOs request/response (`dtos/`).
      4. **Domain Components**: Thiết kế Entities (`domain/entities/`), Value Objects, Domain Services, Repositories interfaces.
      5. **Usecase Implementation**: Triển khai class Services (`application/services/`) — **ưu tiên gom nhiều interface có chung phụ thuộc và nghiệp vụ vào 1 class service** (tránh phân mảnh 1 class cho 1 interface vụn vặt), và các Event Handlers (`application/handlers/`).
      6. **Triển khai Infra**: Controllers, Guards, Middlewares, Listeners, Adapters (`infra/`).
    - **Quy tắc ranh giới & phụ thuộc Module**:
      - **Giao tiếp liên module**: Các module chỉ biết nhau và phụ thuộc nhau ở các **API và schema** (exported Service contracts, DTOs, Event schemas).
      - **Module CHỈ ĐƯỢC IMPORT MODULE**: Khi triển khai NestJS module, phần `imports` chỉ được import module khác (`imports: [OtherModule]`). Tuyệt đối cấm import trực tiếp entity, internal service hay file nội bộ của module khác.
      - **Ma trận phụ thuộc & Contracts chuẩn chỉ**: Planner phải xác định rõ module phụ thuộc vào module nào (upstream) và cung cấp cho module nào (downstream), kèm contract (API, DTO, Event, Mock spec) để các module có thể phát triển và test độc lập.
      - **Bắt buộc hoàn thiện cấu hình `@Module`**: Khi Planner thiết kế kiến trúc cho từng module (kể cả ở giai đoạn Domain), **bắt buộc phải định nghĩa chi tiết cấu hình `@Module`** (không được để trống placeholder):
        ```typescript
        @Module({
          imports: [TypeOrmModule.forFeature([...]), OtherModule],
          controllers: [...],
          providers: [...],
          exports: [...],
        })
        ```
        Planner phải liệt kê rõ từng phần tử trong `imports` (TypeORM entities, upstream modules), `controllers`, `providers` (domain services, usecase services, handlers), và `exports` (contracts, services công khai).
    - **Quy ước đặt tên Interface (Interface Naming Convention)**:
      - **Tuyệt đối KHÔNG sử dụng tiền tố `I` ở đầu tên interface** trong toàn bộ dự án (ví dụ: dùng `UserService`, `UploadVideoUseCase`, `VideoQueryContract` thay vì `IUserService`, `IUploadVideoUseCase`, `IVideoQueryContract`). Quy tắc áp dụng cho cả backend và frontend.
    - **Quy trình điều phối song song & kiểm thử 2 pha**:
      - **Runner**: Phân phối N module cho N Executor chạy song song độc lập theo contract.
      - **Auditor Pha 1 (Nội bộ module)**: Kiểm thử cô lập từng module, mock dữ liệu và API từ module khác dựa theo mock spec trong contract.
      - **Auditor Pha 2 (Tích hợp toàn bộ)**: Sau khi 100% module pass Pha 1, kiểm thử tích hợp thực tế toàn bộ hệ thống (real DI, event routing, full build/test).
      - **Ranh giới Runner & Xử lý vi phạm**: Runner **chỉ điều phối**. Tuyệt đối cấm Runner làm việc của Planner (tạo/sửa plan), Executor (viết/sửa code), Auditor (chạy test/audit). **Nếu phát hiện vi phạm: lập tức ngắt toàn bộ agents, chạy lại từ đầu, phát lệnh cảnh cáo cho lần chạy kế tiếp**.
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
