# OpenDesign Integration Guidelines for Antigravity

Quy tắc tích hợp và tuân thủ hệ thống thiết kế **OpenDesign** (`open-design.ai` / `DESIGN.md`) trong dự án MyCast.

---

## 1. Nguồn chân lý thiết kế (Single Source of Truth)
- Toàn bộ thiết kế giao diện (UI/UX), styling component, layout, và tokens màu sắc được quản lý tại tệp [DESIGN.md](file:///d:/SE/project/my-cast/DESIGN.md) theo chuẩn **OpenDesign**.
- Khi sinh mới hoặc tinh chỉnh bất kỳ component nào trong thư mục `frontend/`, agent (Planner, Executor, Auditor) **BẮT BUỘC** đọc và tuân thủ các tokens định nghĩa trong [DESIGN.md](file:///d:/SE/project/my-cast/DESIGN.md).

---

## 2. Quy tắc sinh mã UI từ OpenDesign Specs
- **Màu sắc & Tokens**:
  - Primary / CTA: `#9bf73c` (Lime).
  - Base surface: `#2d2d2d`.
  - Nền trang (Canvas): `#1c1c1c` (Dark mode).
  - Nút bấm Lime: Bắt buộc dùng text tối màu (`#1c1c1c` hoặc `#2d2d2d`), **tuyệt đối không dùng chữ trắng**.
  - Tỷ lệ màu: 60% trung tính (`#1c1c1c`, `#141414`), 30% bề mặt phụ (`#2d2d2d`), 10% điểm nhấn (`#9bf73c`).
- **Iconography**: Sử dụng thư viện icon chính thống (như `lucide-react`), không dùng emoji thay thế icon.
- **Components**: Ưu tiên xây dựng component tái sử dụng, tương thích Tailwind CSS và đồng nhất với token của OpenDesign.

---

## 3. Tương tác với OpenDesign Workspace & MCP
- Khi ứng dụng OpenDesign desktop chạy cục bộ hoặc daemon chạy qua cổng MCP:
  - Antigravity kết nối qua server MCP `open-design` để truy vấn cấu trúc frame, component hierarchy, và export design specs.
  - Sử dụng subagent `browser` để kiểm tra trực quan giao diện thực tế trên dev server (localhost:3000) khi cần nghiệm thu UI.
  - Auditor khi kiểm thử UI phải đối chiếu trực tiếp giữa mã nguồn đã viết và đặc tả trong `DESIGN.md`.
