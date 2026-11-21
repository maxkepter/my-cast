---
trigger: always_on
description: Follow DESIGN.md and OpenDesign contracts as the single source of truth for UI implementation and review in MyCast.
---

# OpenDesign Integration Guidelines — MyCast

Quy tắc tích hợp và tuân thủ hệ thống thiết kế **OpenDesign** (`open-design.ai` / `DESIGN.md`) trong dự án MyCast.

## 1. Nguồn chân lý thiết kế (Single Source of Truth)
- Toàn bộ thiết kế giao diện (UI/UX), styling component, layout, và tokens màu sắc được quản lý tại tệp [DESIGN.md](DESIGN.md) ở thư mục gốc theo chuẩn **OpenDesign**.
- Khi sinh mới hoặc tinh chỉnh bất kỳ component nào trong thư mục `frontend/`, các agent (`planner`, `executor`, `auditor`) **BẮT BUỘC** đọc và tuân thủ các tokens định nghĩa trong [DESIGN.md](DESIGN.md).

## 2. Quy tắc sinh mã UI & Accessibility từ OpenDesign Specs
- **Màu sắc & Tokens**:
  - Primary / CTA: `#9bf73c` (Lime).
  - Base surface: `#2d2d2d`.
  - Nền trang (Canvas): `#1c1c1c` (Dark mode).
  - Nút bấm Lime: Bắt buộc dùng text tối màu (`#1c1c1c` hoặc `#2d2d2d`), **tuyệt đối không dùng chữ trắng**.
  - Tỷ lệ màu: 60% trung tính (`#1c1c1c`, `#141414`), 30% bề mặt phụ (`#2d2d2d`), 10% điểm nhấn (`#9bf73c`).
- **Iconography**: Sử dụng thư viện icon chính thống (như `lucide-react`), không dùng emoji thay thế icon.
- **Components**: Ưu tiên xây dựng component tái sử dụng, tương thích Tailwind CSS và đồng nhất với token của OpenDesign.

## 3. Tương tác với OpenDesign Workspace & MCP
- Khi ứng dụng OpenDesign desktop hoặc daemon (`od --no-open`) chạy cục bộ qua MCP server `open-design`:
  - Truy vấn cấu trúc frame, artifact, và component hierarchy qua MCP thay vì đoán cấu trúc giao diện.
  - Khi kiểm thử trực quan giao diện trên dev server (`localhost:3000`), đối chiếu trực tiếp giữa giao diện render thực tế và đặc tả trong `DESIGN.md`.
