---
name: open-design
description: Tích hợp OpenDesign (open-design.ai / nexu-io/open-design) với Antigravity để đồng bộ design tokens, sinh component UI chuẩn DESIGN.md, kết nối MCP server và kiểm thử giao diện trực quan.
---

# OpenDesign Integration Skill for Antigravity

Skill này hướng dẫn và điều phối việc sử dụng **OpenDesign** (`open-design.ai` / `nexu-io/open-design`) trong Antigravity để thiết kế, đồng bộ tokens và triển khai giao diện frontend.

---

## 1. Tổng quan & Vai trò
- **OpenDesign**: Môi trường làm việc thiết kế AI mã nguồn mở, cục bộ (local-first), giao tiếp qua `DESIGN.md` và giao thức MCP.
- **Antigravity**: Coding Agent điều hướng, đọc hiểu design contract và sinh mã React/Next.js/Tailwind CSS chuẩn xác mà không bị lệch phong cách thiết kế.

---

## 2. Trạng thái kết nối MCP (Đã kích hoạt)

### A. Cấu hình MCP Server
Đã được đăng ký trong cấu hình Antigravity (`~/.gemini/antigravity/mcp_config.json` & `~/.gemini/config/mcp_config.json`):
```json
{
  "mcpServers": {
    "open-design": {
      "command": "od",
      "args": [
        "mcp",
        "--daemon-url",
        "http://127.0.0.1:7456"
      ]
    }
  }
}
```

### B. CLI Shim
Lệnh `od` đã được liên kết trực tiếp vào PATH:
- Vị trí: `C:\Users\kepter\.gemini\antigravity\bin\od.cmd`
- Thực thi: `D:\design\open-design\apps\daemon\bin\od.mjs`

### C. Khởi chạy OpenDesign Daemon
Để MCP server của OpenDesign xử lý các request từ Antigravity, OpenDesign daemon cần chạy ở cổng `7456`:
```bash
# Khởi động daemon (không mở trình duyệt):
od --no-open

# Hoặc mở giao diện web/desktop của OpenDesign:
od
```

### D. Các MCP Tools được cung cấp
Khi daemon hoạt động, OpenDesign MCP cung cấp các công cụ cho Antigravity:
- `list_projects`: Liệt kê các dự án OpenDesign hiện có trên máy.
- `get_active_context`: Lấy dự án/file hiện đang được mở và tương tác trong OpenDesign.
- `get_artifact`: Trích xuất artifact kèm các component/tệp liên quan.
- `get_file`: Đọc nội dung file thiết kế trong project.
- `create_artifact`: Tạo mới artifact trong OpenDesign.
- `search_files`: Tìm kiếm file thiết kế trong workspace.

---

## 3. Quy trình thiết kế & sinh mã UI chuẩn

1. **Đọc hiểu `DESIGN.md`**: Kiểm tra tokens màu sắc (`#9bf73c`, `#2d2d2d`, `#1c1c1c`...), typography, spacing.
2. **Truy vấn OpenDesign qua MCP**: Gọi `get_active_context` hoặc `get_artifact` để lấy cấu trúc frame/layout từ OpenDesign workspace.
3. **Triển khai Frontend**: Viết component React/Next.js trong `frontend/src/components/`.
4. **Kiểm thử trực quan**: Dùng subagent `browser` mở dev preview trên localhost để chụp màn hình và nghiệm thu giao diện.
