---
name: mycast-design-system
version: 1.0.0
tokens:
  colors:
    primary: "#9bf73c"
    primary_hover: "#7ad81f"
    primary_active: "#5aa616"
    primary_surface: "#f3ffe0"
    base_dark: "#2d2d2d"
    canvas_dark: "#1c1c1c"
    canvas_deep: "#141414"
    canvas_light: "#f7f7f5"
    surface_light: "#ececec"
    text_primary_dark: "#ececec"
    text_secondary_dark: "#8a8a8a"
    text_on_primary: "#1c1c1c"
    border_dark: "#525252"
    border_subtle: "#3d3d3d"
    semantic:
      success: "#9bf73c"
      warning: "#f7c93c"
      error: "#ff5c5c"
      info: "#3cc8f7"
      accent_sub: "#b48cff"
  typography:
    font_sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    font_mono: "JetBrains Mono, monospace"
  spacing:
    unit: "4px"
    scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64]
  radius:
    sm: "4px"
    md: "8px"
    lg: "12px"
    pill: "9999px"
---

# MyCast Design System & Visual Specification

Design contract tuân thủ chuẩn **OpenDesign** (`open-design.ai` / `DESIGN.md`) cho toàn bộ giao diện MyCast (Web, Mobile, Desktop).

---

## 1. Bản sắc thị giác & Triết lý thiết kế (Atmosphere & Vibe)
- **Phong cách chủ đạo**: Modern Dark Media Streaming (tối giản, tương phản cao, tập trung vào nội dung media, video và podcast).
- **Tỷ lệ thị giác chuẩn (60-30-10)**:
  - **60% Trung tính**: Nền `#1c1c1c` (Canvas) và `#141414` (Deep Canvas cho sidebar/player).
  - **30% Phụ & Bề mặt**: Card, modal, panel `#2d2d2d` (Neutral 800) với border `#525252`.
  - **10% Điểm nhấn (Accent)**: Lime `#9bf73c` (CTA, playing state, scrubber, badges).

---

## 2. Hệ màu chuẩn (Color Tokens & Roles)

### Màu gốc & Điểm nhấn
- **Primary / Accent (`#9bf73c`)**: Nút CTA chính, tiến trình audio/video, trạng thái active, toggle checked.
- **Base Charcoal (`#2d2d2d`)**: Card, surface container, popover.

### Thang trung tính (dẫn xuất từ `#2d2d2d`)
- `Neutral 950` (`#141414`): Nền sidebar, floating player bar.
- `Neutral 900` (`#1c1c1c`): Nền trang dark mode chính.
- `Neutral 800` (`#2d2d2d`): Card, list item, modal body.
- `Neutral 700` (`#3d3d3d`): Hover state trên card, input background.
- `Neutral 600` (`#525252`): Viền hairline (borders), dividers.
- `Neutral 400` (`#8a8a8a`): Phụ đề, metadata, timestamp, placeholder text.
- `Neutral 200` (`#d4d4d4`): Text tiêu đề phụ, icon thường.
- `Neutral 100` (`#ececec`): Text chính trên nền tối (Title, headings).

### Thang Lime (dẫn xuất từ `#9bf73c`)
- `Lime 50` (`#f3ffe0`): Tint nền nhẹ khi highlight.
- `Lime 200` (`#d2fda0`): Glow, subtle hover badge.
- `Lime 400` (`#b6fa6b`): Hover state sáng cho nút.
- `Lime 500` (`#9bf73c`): Màu chuẩn thương hiệu.
- `Lime 600` (`#7ad81f`): Button hover/press.
- `Lime 700` (`#5aa616`): Active state viền/nhãn.
- `Lime 900` (`#2e5410`): Nền tối của badge có chữ lime.

---

## 3. Typography & Text Hierarchy
- **Font Sans**: Inter hoặc system-ui fallback.
- **Tiêu đề Video / Podcast**: Font weight 600–700, màu `#ececec`, tracking `-0.01em`.
- **Nội dung / Mô tả**: Font weight 400, màu `#d4d4d4`, line-height 1.6.
- **Metadata (lượt xem, thời lượng)**: Font weight 500, size `12px-14px`, màu `#8a8a8a`.
- **Text trên nút Lime**: BẮT BUỘC dùng màu tối `#1c1c1c` hoặc `#2d2d2d`, TUYỆT ĐỐI KHÔNG dùng chữ trắng.

---

## 4. Hình khối & Bo góc (Geometry & Radii)
- **Nút CTA, Tags, Chips**: Bo góc dạng Pill (`rounded-full` / `9999px`) hoặc `rounded-lg` (8px-12px).
- **Card Video Thumbnail**: `rounded-xl` (12px), overflow hidden.
- **Player & Modals**: `rounded-2xl` (16px), viền hairline `#525252` (1px solid), không lạm dụng box-shadow dày.

---

## 5. Nguyên tắc nghiêm cấm (Anti-Patterns / Don'ts)
- ❌ **Không dùng chữ trắng trên nền Lime `#9bf73c`**: Gây mất độ tương phản chuẩn WCAG. Luôn dùng `#1c1c1c`.
- ❌ **Không dùng gradient tím/xanh ngẫu nhiên**: Chỉ sử dụng bảng màu thương hiệu MyCast đã định nghĩa.
- ❌ **Không dùng emoji thay cho icon**: Luôn dùng Lucide Icons hoặc icon SVG chuyên dụng.
- ❌ **Không tự ý sinh mã hex tùy ý ngoài bảng màu token**.
