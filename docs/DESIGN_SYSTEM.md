# MyCast Design System & UI Specification

Tài liệu đặc tả toàn diện về ngôn ngữ thiết kế, kiến trúc giao diện, quy chuẩn token, luồng trải nghiệm người dùng (UX) và các màn hình cốt lõi của nền tảng **MyCast**.

---

## 1. Định Vị & Triết Lý Thiết Kế (Design Philosophy)

- **Mục tiêu**: Nền tảng chia sẻ video phổ thông chuẩn phong cách YouTube nhưng **đặt văn hóa thảo luận, trao đổi sâu sắc làm trọng tâm** (Discussion-First Video Platform).
- **Nguyên tắc cốt lõi**:
  1. **Zero-Emoji Policy (Tuyệt đối không dùng emoji)**: 100% biểu tượng thị giác trên toàn bộ giao diện phải sử dụng các vector SVG tinh xảo, đồng bộ, nhất quán với mã nguồn và thiết kế.
  2. **Tập trung vào Thảo luận đa chiều (Discussion-First)**: Không chỉ là khu vực bình luận thụ động; mỗi mốc thời gian (timestamp) đều gắn liền với các chủ đề đối thoại, phản biện kỹ thuật, hỗ trợ cơ chế bình chọn (Upvote) và phản hồi chính thức từ Chủ kênh (Creator).
  3. **Tương thích cao với YouTube Flow**: Bố cục App Shell, thanh tìm kiếm lớn ở Top Bar, Sidebar 2 chế độ (Expanded & Collapsed), thẻ Video Card tỷ lệ 16:9 với badge thời lượng và thống kê tương tác.
  4. **Google OAuth 2.0 Single Sign-On**: Xác thực người dùng tinh gọn, an toàn, không sử dụng form mật khẩu truyền thống.

---

## 2. Hệ Thống Màu Sắc & Tokens (OpenDesign Contract)

Hệ thống token tuân thủ nghiêm ngặt hợp đồng thiết kế OpenDesign tại [DESIGN.md](file:///d:/SE/project/my-cast/DESIGN.md):

| Nhóm Màu | Tên Token | Mã Hex | Ứng Dụng Trong Giao Diện |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `Lime Electric` | `#9bf73c` | Điểm nhấn thương hiệu, nút CTA chính (Đăng ký, Phát tất cả), icon active, mốc timestamp, progress bar |
| **Primary Hover** | `Lime Darker` | `#7ad81f` | Trạng thái hover của các nút hành động chính |
| **Surface Dark** | `Canvas Deep` | `#141414` | Nền canvas trang chủ, nền video player, top header |
| **Surface Card** | `Base Charcoal` | `#1c1c1c` / `#181818` | Nền các thẻ video, sidebar, modal, card danh sách phát |
| **Surface Accent** | `Elevated Gray` | `#222222` / `#262626` | Ô input tìm kiếm, pill filter chips, background thread thảo luận |
| **Hairline Border** | `Border Subdued` | `#262626` / `#2d2d2d` | Đường viền ngăn cách giữa các khối, viền card, viền sidebar |
| **Border Focus** | `Border Active` | `#3d3d3d` / `#9bf73c` | Viền focus của input, hover state của card |
| **Text Primary** | `Pure Crisp` | `#ececec` | Tiêu đề video, tên kênh, văn bản chính |
| **Text Secondary** | `Muted Slate` | `#8a8a8a` / `#aaaaaa` | Thống kê lượt xem, thời gian đăng tải, phụ đề |
| **Text Dim** | `Disabled Dark` | `#555555` / `#717171` | Placeholder, bản quyền footer |

---

## 3. Kiến Trúc App Shell & Sidebar Đa Chế Độ

Giao diện ứng dụng sử dụng cấu trúc **App Shell cố định** gồm:

### 3.1. Top Navigation Bar (Header - Cao 56px / `h-14`)
- **Trái**: 
  - Nút **Hamburger Menu** (`btn-toggle-sidebar`) để chuyển đổi trạng thái Sidebar.
  - **Logo MyCast**: Biểu tượng khối đa giác góc cạnh phối màu Lime `#9bf73c` kèm badge `Video Platform`.
- **Giữa**:
  - Thanh tìm kiếm lớn phong cách YouTube (bo tròn viền pill, nút icon kính lúp tách riêng).
- **Phải**:
  - Nút **Tạo / Upload** (`+ Tạo` video).
  - Nút **Chuông thông báo** (có chấm xanh khi có tương tác mới trong thảo luận).
  - **Avatar người dùng**: Tích hợp liên kết nhanh về trang Thư viện cá nhân (`/library`).

### 3.2. Dual-Mode Collapsible Sidebar (Sidebar 2 Chế Độ)
- **Chế độ Mở rộng (Expanded - Rộng 240px / `w-60`)**:
  - *Nhóm 1: Điều hướng chính*: Trang chủ (`/`), Khám phá, Kênh đăng ký (`/subscriptions`).
  - *Nhóm 2: Khu vực Bạn (User Area)*: Kênh của bạn (`/channel/...`), Lịch sử xem (`/history`), Danh sách phát (`/playlists`), **Thảo luận của bạn** (`/library#discussions`), Video đã thích.
  - *Nhóm 3: Kênh đã đăng ký*: Danh sách các creator đang theo dõi với avatar tròn và chấm xanh báo hoạt động mới.
  - *Nhóm 4: Cài đặt & Thông tin*: Cài đặt tài khoản, hỗ trợ, thông tin bản quyền.
- **Chế độ Thu gọn (Collapsed - Rộng 72px / `w-18`)**:
  - Thanh icon hẹp ở lề trái: Trang chủ, Đăng ký, Bạn (Thư viện), Playlist. Giúp tối đa không gian xem video và đọc thảo luận trên màn hình máy tính.

---

## 4. Đặc Tả 6 Màn Hình Trọng Tâm

### 4.1. Màn Hình 1: Trang Chủ & Đề Xuất (`/`)
- **Category Filter Chips**: Hàng thẻ lọc ngang (`Tất cả`, `Kiến trúc hệ thống`, `Lập trình Backend`, `Trí tuệ nhân tạo`, `Khoa học máy tính`, `Bảo mật & Mã hóa`, `Thảo luận sôi nổi`).
- **Video Thảo Luận Tiêu Điểm (Spotlight Banner)**: Hero card giới thiệu video có luồng bình luận phản biện chất lượng nhất trong tuần, kèm nút CTA `Xem & Thảo luận`.
- **Feed Video Đề Xuất**: Lưới video responsive (1 cột mobile, 2 cột tablet, 3-4 cột desktop) với thumbnail 16:9, thời lượng video ở góc dưới phải, tag thể loại ở góc trên trái, số lượt xem và số lượng thảo luận.

### 4.2. Màn Hình 2: Xem Video & Thảo Luận (`/watch/[id]`)
- **Cột Trái (8 cột)**:
  - **Video Player**: Trình phát video độ nét cao, thanh tiến độ hiển thị mốc thời gian thực và các điểm chấm gắn với các câu hỏi thảo luận nổi bật.
  - **Video Metadata**: Tiêu đề, thông tin kênh (Avatar, Tên chủ kênh, số người đăng ký, nút `Đăng ký` Lime `#9bf73c`).
  - **Diễn Đàn Bình Luận & Thảo Luận**:
    - Bộ lọc sắp xếp: `Bình luận hàng đầu` / `Mới nhất`.
    - Hộp tạo bình luận gắn với mốc thời gian video hiện tại.
    - Từng thread thảo luận hỗ trợ: Bộ đếm bình chọn (Upvote `▲`), mốc thời gian có thể click để tua video trực tiếp, và khung phản hồi chính thức từ **Chủ kênh / Người đăng**.
- **Cột Phải (4 cột)**:
  - **Video Tiếp Theo (Up Next / Recommended)**: Cột video đề xuất liên quan, tự động gợi ý dựa trên nội dung kỹ thuật đang xem.

### 4.3. Màn Hình 3: Danh Sách Phát (`/playlists` & `/playlists/[id]`)
- **Cột Trái**: Thẻ tổng quan danh sách phát (Ảnh bìa, số lượng video, trạng thái công khai/riêng tư, thời lượng tổng cộng, nút `Phát tất cả` và `Trộn bài`).
- **Cột Phải**: Danh sách các tập video được đánh số thứ tự từ `01`, hiển thị tiến độ học/xem với các huy hiệu rõ ràng (`ĐÃ XEM`, `ĐANG XEM`, `CHƯA XEM`).

### 4.4. Màn Hình 4: Trang Kênh Video (`/channel/[handle]`)
- **Banner Kênh**: Ảnh bìa tỷ lệ chuẩn có dải gradient mờ dần xuống thân trang.
- **Hồ Sơ Kênh**: Avatar lớn, Tên hiển thị, Handle duy nhất (`@...`), số lượng người đăng ký, số lượng video, đoạn giới thiệu tiểu sử (Bio).
- **Nút Hành Động**: Nút `Đăng ký` và nút `Cộng đồng thảo luận`.
- **Hệ Thống Tab Chuẩn YouTube**:
  - `Video`: Lưới toàn bộ video đã xuất bản của kênh.
  - `Danh sách phát`: Các bộ tuyển tập video do kênh tuyển chọn.
  - `Cộng đồng`: Bài viết dạng text, câu hỏi thăm dò ý kiến cộng đồng.
  - `Giới thiệu`: Thông tin chi tiết, ngày tham gia, liên kết mạng xã hội.

### 4.5. Màn Hình 5: Thư Viện Cá Nhân / Bạn (`/library` hoặc `/you`)
- **User Profile Header**: Thông tin tài khoản Google đã liên kết, thống kê số danh sách phát, số video đã xem và số lượng đóng góp thảo luận.
- **Lịch Sử Xem Gần Đây (Watch History)**: Hàng video xem dở với thanh progress bar màu Lime hiển thị trực quan phần trăm thời lượng đã xem (ví dụ: 75%, 50%, Đã xem xong).
- **Thảo Luận Của Bạn (My Discussions)**: Nơi lưu vết toàn bộ các bình luận phản biện mà người dùng đã gửi, số vote nhận được và thông báo khi chủ kênh phản hồi.
- **Danh Sách Phát Cá Nhân**: Quản lý các danh sách phát riêng tư và danh sách `Xem sau`.

### 4.6. Màn Hình 6: Kênh Đăng Ký (`/subscriptions`)
- **Carousel Kênh Theo Dõi**: Hàng avatar tròn của các creator để truy cập nhanh nội dung mới nhất.
- **Feed Video Mới Nhất**: Lưới video sắp xếp theo thứ tự xuất bản gần nhất từ các kênh người dùng đã đăng ký, có nhãn `MỚI` nổi bật.

---

## 5. Quy Chuẩn Kỹ Thuật Khi Triển Khai Code

1. **Framework**: Next.js 15 (App Router), React 19, TypeScript.
2. **CSS Engine**: Tailwind CSS v3/v4 sử dụng trực tiếp các class chuẩn màu `#9bf73c`, `#2d2d2d`, `#1c1c1c`, `#141414`.
3. **Quy tắc đặt tên (Interfaces)**: Cấm tuyệt đối tiền tố `I` (dùng `Video`, `Channel`, `CommentThread`, `Playlist` thay vì `IVideo`, `IChannel`).
4. **Không phụ thuộc thư viện icon bên thứ ba gây bloatware**: Toàn bộ icon được viết bằng mã SVG nội tuyến (inline SVG) tối ưu hiệu năng và load tức thì.
