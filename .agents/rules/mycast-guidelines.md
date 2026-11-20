---
trigger: always_on
---

# Project Guidelines — MyCast

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
      5. **Usecase Implementation**: Triển khai class Services (`application/services/`) — ưu tiên gom nhiều interface có chung phụ thuộc và nghiệp vụ vào 1 class service, và các Event Handlers (`application/handlers/`).
      6. **Triển khai Infra**: Controllers, Guards, Middlewares, Listeners, Adapters (`infra/`).
    - **Quy tắc ranh giới & phụ thuộc Module**:
      - **Giao tiếp liên module**: Các module chỉ biết nhau và phụ thuộc nhau ở các **API và schema** (exported Service contracts, DTOs, Event schemas).
      - **Module CHỈ ĐƯỢC IMPORT MODULE**: Khi triển khai NestJS module, phần `imports` chỉ được import module khác (`imports: [OtherModule]`). Tuyệt đối cấm import trực tiếp entity, internal service hay file nội bộ của module khác.
      - **Ma trận phụ thuộc & Contracts chuẩn chỉ**: Planner phải xác định rõ module phụ thuộc vào module nào (upstream) và cung cấp cho module nào (downstream), kèm contract (API, DTO, Event, Mock spec) để các module có thể phát triển và test độc lập.
      - **Bắt buộc hoàn thiện cấu hình `@Module`**: Planner phải định nghĩa rõ từng phần tử trong `imports`, `controllers`, `providers`, `exports`.
    - **Quy ước đặt tên Interface**:
      - **Tuyệt đối KHÔNG sử dụng tiền tố `I` ở đầu tên interface** trong toàn bộ dự án.
    - **Quy trình điều phối song song & kiểm thử 2 pha**:
      - **Runner**: Phân phối N module cho N Executor chạy song song độc lập theo contract.
      - **Auditor Pha 1 (Nội bộ module)**: Kiểm thử cô lập từng module, mock dữ liệu và API từ module khác dựa theo mock spec trong contract.
      - **Auditor Pha 2 (Tích hợp toàn bộ)**: Sau khi 100% module pass Pha 1, kiểm thử tích hợp thực tế toàn bộ hệ thống.
      - **Ranh giới Runner & Xử lý vi phạm**: Runner **chỉ điều phối**. Tuyệt đối cấm Runner làm việc của Planner, Executor, Auditor.
  - `frontend/`: Next.js (App Router), React, TypeScript, Tailwind CSS. Tuân thủ bảng màu chuẩn tại `frontend/AGENTS.md` và hợp đồng thiết kế OpenDesign tại `DESIGN.md` (chủ đạo Lime `#9bf73c` và Base Charcoal `#2d2d2d`).
  - `.agents/skills/open-design`: Tích hợp OpenDesign (open-design.ai) với Antigravity.
  - `.agents/skills/systemone`: Module đánh giá ngữ nghĩa và định tuyến AI (JEV SystemOne).

## Yêu cầu đối với các Agent: Tăng cường vận dụng Skill SystemOne
Tất cả các agent (`planner`, `executor`, `auditor`, `runner`) chủ động khai thác skill `systemone` trong mọi tác vụ phân tích, triển khai và kiểm thử.
- Planner: Đánh giá complexity, risk_level, modules, strategy.
- Executor: Triage semantic data, routing logic, edge-cases.
- Auditor: Chấm điểm quality_score, compliance, severity, is_pass.
- Runner: Đánh giá convergence, can_auto_resolve.
