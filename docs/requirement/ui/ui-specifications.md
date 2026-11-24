# Đặc tả Giao diện & Luồng Màn hình (UI Specifications & Screen Flow)

Tài liệu đặc tả giao diện chi tiết cho nền tảng chia sẻ và phát video MyCast, bao gồm sơ đồ luồng Mermaid, mô hình Wireframe ASCII, Field Catalog chuẩn hóa và bảng biến cố chuyển tiếp trạng thái (CTA Events & State Transitions).

---

## 0. Sơ đồ Luồng Màn hình Tổng thể (Screen Flow Diagram - Mermaid)

```mermaid
stateDiagram-v2
    [*] --> SCR_01_HomeFeed : Mở ứng dụng (Web)

    state "Phân vùng Người dùng (Viewer)" as ViewerZone {
        SCR_01_HomeFeed: SCR-01 Trang chủ & Khám phá
        SCR_02_WatchPage: SCR-02 Trang phát video & Tương tác
        SCR_04_ChannelPage: SCR-04 Trang chi tiết Kênh
        SCR_AUTH_Modal: Modal Đăng nhập / Đăng ký
        MODAL_Report: Modal Gửi báo cáo vi phạm
        MODAL_Share: Modal Chia sẻ liên kết
        MODAL_Playlist: Modal Thêm vào Playlist

        SCR_01_HomeFeed --> SCR_02_WatchPage : Click Video Card
        SCR_01_HomeFeed --> SCR_04_ChannelPage : Click Channel Avatar / Name
        SCR_01_HomeFeed --> SCR_AUTH_Modal : Click Đăng nhập

        SCR_02_WatchPage --> SCR_04_ChannelPage : Click Chủ kênh
        SCR_02_WatchPage --> MODAL_Report : Click Báo cáo
        SCR_02_WatchPage --> MODAL_Share : Click Chia sẻ
        SCR_02_WatchPage --> MODAL_Playlist : Click Lưu playlist
        SCR_02_WatchPage --> SCR_AUTH_Modal : Tương tác khi chưa đăng nhập

        MODAL_Report --> SCR_02_WatchPage : Đóng / Gửi report
        MODAL_Share --> SCR_02_WatchPage : Đóng / Copy link
        MODAL_Playlist --> SCR_02_WatchPage : Đóng / Lưu xong
        SCR_AUTH_Modal --> SCR_01_HomeFeed : Đăng nhập thành công
    }

    state "Phân vùng Sáng tạo (Creator Studio)" as CreatorZone {
        SCR_03_Studio: SCR-03 Quản lý nội dung kênh
        MODAL_Upload: Modal Tải lên video mới (<100MB)
        MODAL_EditVideo: Modal Chỉnh sửa video
        DRAWER_TranscodeStatus: Drawer Tiến trình chuyển mã HLS

        SCR_03_Studio --> MODAL_Upload : Click Tải lên
        SCR_03_Studio --> MODAL_EditVideo : Click Chỉnh sửa
        SCR_03_Studio --> DRAWER_TranscodeStatus : Click xem tiến trình

        MODAL_Upload --> DRAWER_TranscodeStatus : Upload <100MB xong
        DRAWER_TranscodeStatus --> SCR_03_Studio : Hoàn tất / Đóng
        MODAL_EditVideo --> SCR_03_Studio : Lưu thành công
    }

    state "Phân vùng Kiểm duyệt (Staff Dashboard)" as StaffZone {
        SCR_05_Moderation: SCR-05 Bảng điều hành kiểm duyệt
        MODAL_ActionReport: Modal Xử lý vi phạm
        MODAL_ReviewAppeal: Modal Xét duyệt kháng cáo

        SCR_05_Moderation --> MODAL_ActionReport : Chọn báo cáo
        SCR_05_Moderation --> MODAL_ReviewAppeal : Chọn đơn kháng cáo

        MODAL_ActionReport --> SCR_05_Moderation : Xử phạt / Bác bỏ
        MODAL_ReviewAppeal --> SCR_05_Moderation : Gỡ phạt / Giữ nguyên
    }

    state "Phân vùng Quản trị Lưu trữ (Admin Portal)" as AdminZone {
        SCR_06_StorageAdmin: SCR-06 Quản trị Storage Nodes
        MODAL_AddNode: Modal Thêm Storage Node mới
        MODAL_EditNode: Modal Cập nhật Node
        DIALOG_SafeDelete: Dialog Xác nhận xóa Node an toàn

        SCR_06_StorageAdmin --> MODAL_AddNode : Click Thêm Node
        SCR_06_StorageAdmin --> MODAL_EditNode : Click Cấu hình Node
        SCR_06_StorageAdmin --> DIALOG_SafeDelete : Click Xóa Node (0 active objects)

        MODAL_AddNode --> SCR_06_StorageAdmin : Probe OK & Lưu
        MODAL_EditNode --> SCR_06_StorageAdmin : Cập nhật xong
        DIALOG_SafeDelete --> SCR_06_StorageAdmin : Xóa node xong
    }

    SCR_01_HomeFeed --> SCR_03_Studio : Chuyển sang Studio
    SCR_03_Studio --> SCR_02_WatchPage : Xem trước video
    SCR_01_HomeFeed --> SCR_05_Moderation : Truy cập Kiểm duyệt
    SCR_01_HomeFeed --> SCR_06_StorageAdmin : Truy cập Storage Admin
```

*Tệp nguồn sơ đồ Mermaid độc lập: `docs/requirement/ui/screen-flow.mmd`.*

---

## 1. SCR-01: Trang chủ & Khám phá (Home Feed & Explore)

- **Mã Màn hình**: `SCR-01`
- **Tên Màn hình**: Trang chủ & Khám phá nội dung (Home Feed / Explore / Search)
- **Actor sử dụng**: Guest (`ACT-GUEST`), User / Viewer (`ACT-USER`), Creator (`ACT-CREATOR`)
- **Use Case liên quan**: `UC-VID-02`, `UC-CHAN-02`, `UC-AUTH-02`
- **Mục tiêu**: Cung cấp danh mục video công khai, thanh tìm kiếm từ khóa, bộ lọc danh mục và điểm điều hướng chính.

### Wireframe ASCII

```text
+----------------------------------------------------------------------------------------------------+
| [Logo MyCast]    [                      Ô Tìm Kiếm                     (Q) ]    [+ Upload]  [Avatar]|
+----------------------------------------------------------------------------------------------------+
| [ Tất cả ] [ Âm nhạc ] [ Trò chơi ] [ Công nghệ ] [ Tin tức ] [ Podcast ] [ Hoạt hình ]             |
+----------------------------------------------------------------------------------------------------+
|  +------------------------+  +------------------------+  +------------------------+                |
|  | [    Thumbnail 16:9   ]|  | [    Thumbnail 16:9   ]|  | [    Thumbnail 16:9   ]|                |
|  |                 [12:45]|  |                 [05:20]|  |                 [45:10]|                |
|  | (O) Tiêu đề video 1... |  | (O) Tiêu đề video 2... |  | (O) Tiêu đề video 3... |                |
|  |     Tên Kênh - 15K view|  |     Tên Kênh - 8.2K vie|  |     Tên Kênh - 120K vie|                |
|  |     2 ngày trước       |  |     1 tuần trước       |  |     3 ngày trước       |                |
|  +------------------------+  +------------------------+  +------------------------+                |
|                                                                                                    |
|  +------------------------+  +------------------------+  +------------------------+                |
|  | [    Thumbnail 16:9   ]|  | [    Thumbnail 16:9   ]|  | [    Thumbnail 16:9   ]|                |
|  |                 [08:15]|  |                 [19:04]|  |                 [03:50]|                |
|  | (O) Tiêu đề video 4... |  | (O) Tiêu đề video 5... |  | (O) Tiêu đề video 6... |                |
|  |     Tên Kênh - 500 view|  |     Tên Kênh - 42K view|  |     Tên Kênh - 1.2M vie|                |
|  |     5 giờ trước        |  |     1 tháng trước      |  |     4 ngày trước       |                |
|  +------------------------+  +------------------------+  +------------------------+                |
+----------------------------------------------------------------------------------------------------+
```

### Field Catalog

| Tên trường (Field) | Kiểu dữ liệu (Type) | Bắt buộc (Required) | Ràng buộc & Validation | Quy tắc liên quan (Target BR) |
| :--- | :--- | :---: | :--- | :--- |
| `searchKeyword` | String (Input) | Không | Tối đa 100 ký tự, tự động cắt khoảng trắng thừa. | - |
| `selectedCategory` | String (Chip/Pill) | Có | Mặc định là `"ALL"`, các giá trị thuộc danh mục hỗ trợ. | - |
| `videoCard.thumbnail`| Image URL (Display)| Có | Tỷ lệ 16:9, fallback ảnh mặc định nếu chưa transcode xong. | `BR-TRC-03` |
| `videoCard.title` | String (Display) | Có | Tối đa 150 ký tự, hiển thị 2 dòng kèm dấu ellipsis (...). | `BR-VID-03` |
| `videoCard.channel` | Object (Display) | Có | Avatar tròn (36px), Tên kênh tối đa 50 ký tự. | - |
| `videoCard.views` | Number (Display) | Có | Định dạng số rút gọn (ví dụ: 1.2K, 50K, 1.5M). | `BR-VID-09` |
| `videoCard.duration`| Time String (Badge)| Có | Định dạng `MM:SS` hoặc `HH:MM:SS`. | `BR-TRC-01` |

### Bảng biến cố CTA & Chuyển tiếp Trạng thái (CTA Events)

| Biến cố / Tương tác (CTA Event) | Hành động kích hoạt (Trigger) | Điều kiện kiểm tra (Condition) | Trạng thái chuyển tiếp / API gọi |
| :--- | :--- | :--- | :--- |
| `CLICK_VIDEO_CARD` | Bấm vào Card video | Video ở trạng thái `READY` | Điều hướng sang `SCR-02: Video Watch Page` (`/watch?v={videoId}`) |
| `SUBMIT_SEARCH` | Nhấn Enter trên ô tìm kiếm | `searchKeyword.trim().length > 0` | Gọi API tìm kiếm, lọc danh sách video hiển thị |
| `SELECT_CATEGORY` | Bấm chọn Category Chip | Category khác trạng thái hiện tại | Lọc video theo danh mục đã chọn |
| `CLICK_UPLOAD` | Bấm nút "+ Upload" | Người dùng đã đăng nhập (Creator) | Mở Modal tải lên trên `SCR-03: Creator Studio` |
| `CLICK_AVATAR` | Bấm biểu tượng Avatar | Đã đăng nhập / Chưa đăng nhập | Mở Menu cá nhân / Điều hướng `SCR-AUTH-01` |

---

## 2. SCR-02: Trang Xem Video (Video Watch Page)

- **Mã Màn hình**: `SCR-02`
- **Tên Màn hình**: Trang phát video & tương tác (Video Watch Page)
- **Actor sử dụng**: Guest (`ACT-GUEST`), User / Viewer (`ACT-USER`), Creator (`ACT-CREATOR`), Staff (`ACT-STAFF`)
- **Use Case liên quan**: `UC-VID-02`, `UC-VID-05`, `UC-VID-06`, `UC-VID-07`, `UC-INT-01`, `UC-INT-02`, `UC-INT-03`, `UC-INT-04`, `UC-INT-05`
- **Mục tiêu**: Trình phát video HLS đa độ phân giải (144p - 2K 60fps), thông tin kênh, thanh phản ứng (Like/Share/Report) và khung bình luận phân cấp 2 tầng.

### Wireframe ASCII

```text
+------------------------------------------------------------------------------------+-----------------------+
|  [                     TRÌNH PHÁT VIDEO HLS (16:9)                                ]| [DANH SÁCH GỢI Ý]     |
|  [ Play/Pause | Volume | 04:12 / 18:30 | HD Quality: [1080p60 v] | Fullscreen     ]| +-------------------+ |
|                                                                                    | | [Thumb] Video kế 1| |
|  Tiêu đề Video: Hướng dẫn Clean Architecture & DDD trong NestJS                    | | Tên Kênh - 10K view| |
|                                                                                    | +-------------------+ |
|  (O) Tech Channel          [ Đã đăng ký v ]     [ Like 1.2K | Dislike ] [ Chia sẻ ]| | [Thumb] Video kế 2| |
|      150K người theo dõi                         [ Lưu Playlist ] [ Báo cáo ( ! ) ]| | Tên Kênh - 55K view| |
|  --------------------------------------------------------------------------------- | +-------------------+ |
|  [Hộp Mô Tả] 125,400 lượt xem - 2 ngày trước                                       | | [Thumb] Video kế 3| |
|  Chi tiết về cách phân lớp Domain, Application, Infrastructure... [Xem thêm]       | | Tên Kênh - 3.1K vie| |
|  --------------------------------------------------------------------------------- | +-------------------+ |
|  BÌNH LUẬN (42)                                                                    |                       |
|  [Avatar] [ Viết bình luận công khai...                                          ] |                       |
|           [ Hủy ]  [ Bình luận (Gửi) ]                                            |                       |
|                                                                                    |                       |
|  (O) User A - 1 ngày trước                                                         |                       |
|      Video giải thích rất trực quan! Cảm ơn tác giả.                               |                       |
|      [Thích] [Phản hồi] [ ... (Xóa nếu là chủ comment / chủ video / Staff) ]       |                       |
|                                                                                    |                       |
|      L-- (O) Tech Channel (Tác giả) - 18 giờ trước                                 |                       |
|              Cảm ơn bạn đã ủng hộ kênh!                                            |                       |
|              [Thích] [Phản hồi] [ ... ]                                            |                       |
+------------------------------------------------------------------------------------+-----------------------+
```

### Field Catalog

| Tên trường (Field) | Kiểu dữ liệu (Type) | Bắt buộc (Required) | Ràng buộc & Validation | Quy tắc liên quan (Target BR) |
| :--- | :--- | :---: | :--- | :--- |
| `hlsPlayer.streamUrl` | URL String (HLS) | Có | Master playlist `.m3u8` cấp bởi Storage Node khi video `READY`. | `BR-VID-08`, `BR-TRC-03` |
| `hlsPlayer.quality` | Enum Select | Có | Danh sách renditions: `Auto`, `144p`, `360p`, `480p`, `720p`, `1080p`, `2K@60`. | `BR-TRC-02` |
| `video.viewsCount` | Number (Display) | Có | Bộ đếm lượt xem hợp lệ (chống spam 1 view/30s). | `BR-VID-09` |
| `video.likeStatus` | Boolean / Toggle | Không | Trạng thái like của người dùng đăng nhập (`ToggleVideoLikeUseCase`). | `UC-VID-06` |
| `comment.input` | Text Area (Input) | Có | Độ dài từ 1 đến 2000 ký tự, không được chỉ chứa khoảng trắng. | `BR-INT-01`, `BR-INT-02` |
| `comment.parentId` | UUID (Hidden) | Không | Trỏ tới ID bình luận cấp 1 nếu đang reply; tối đa 2 cấp phân tầng. | `BR-INT-04` |
| `report.reason` | Enum Select (Modal) | Có | Thuộc enum `ReportReason`: `SPAM`, `VIOLENCE`, `COPYRIGHT`, `HARASSMENT`... | `BR-INT-06` |
| `report.description` | Text Area (Modal) | Không | Tối đa 1000 ký tự ghi chú làm rõ hành vi vi phạm. | `BR-INT-06` |

### Bảng biến cố CTA & Chuyển tiếp Trạng thái (CTA Events)

| Biến cố / Tương tác (CTA Event) | Hành động kích hoạt (Trigger) | Điều kiện kiểm tra (Condition) | Trạng thái chuyển tiếp / API gọi |
| :--- | :--- | :--- | :--- |
| `LOAD_WATCH_PAGE` | Mở trang `/watch?v={id}` | Video `READY`, thỏa mãn quyền visibility | Gọi API `GET /videos/{id}/watch` (`WatchVideoUseCase`), khởi tạo HLS player |
| `TOGGLE_LIKE` | Bấm nút "Like" | Đã đăng nhập (`ACT-USER`) | Gọi API `POST /videos/{id}/like` (`ToggleVideoLikeUseCase`) |
| `SUBMIT_COMMENT` | Bấm nút "Bình luận (Gửi)" | Đã đăng nhập, `allowComments === true`, độ dài 1-2000 | Gọi API `POST /comments` (`CreateCommentUseCase`), prepend bình luận mới vào danh sách |
| `DELETE_COMMENT` | Bấm "Xóa" trên menu bình luận | Thỏa mãn 1 trong 3 cấp quyền xóa (User tác giả, Chủ kênh, Staff/Admin) | Gọi API `DELETE /comments/{id}` (`DeleteCommentUseCase`, `BR-INT-05`) |
| `CLICK_SUBSCRIBE` | Bấm "Theo dõi / Đăng ký" | Đã đăng nhập, không tự follow kênh chính mình | Gọi API `POST /channels/{id}/follow` (`FollowCreatorUseCase`) |
| `OPEN_REPORT_MODAL` | Bấm biểu tượng "Báo cáo" | Mọi Actor | Mở modal báo cáo vi phạm (`UC-INT-05`) |
| `SUBMIT_REPORT` | Bấm "Gửi báo cáo" trong Modal | Chưa báo cáo đối tượng này trong 24h | Gọi API `POST /reports` (`CreateReportUseCase`), đóng modal hiển thị thông báo thành công |

---

## 3. SCR-03: Creator Studio - Quản lý & Tải lên Video

- **Mã Màn hình**: `SCR-03`
- **Tên Màn hình**: Bảng điều khiển Studio Sáng tạo (Creator Studio - Upload & Video Management)
- **Actor sử dụng**: Creator (`ACT-CREATOR`)
- **Use Case liên quan**: `UC-VID-01`, `UC-VID-03`, `UC-VID-04`, `UC-CHAN-01`
- **Mục tiêu**: Quản lý danh sách video đã tải lên, theo dõi trạng thái chuyển mã, chỉnh sửa metadata, thiết lập quyền riêng tư và tải lên video mới (<100MB).

### Wireframe ASCII

```text
+----------------------------------------------------------------------------------------------------+
| [Logo Studio]    Kênh của tôi: Tech Channel                                  [ + Tải video lên ]   |
+----------------------------------------------------------------------------------------------------+
| [ Nội dung kênh ] [ Danh sách phát ] [ Số liệu phân tích ] [ Tùy chỉnh kênh ]                      |
+----------------------------------------------------------------------------------------------------+
| Danh sách Video (Tổng số: 18)                                      [ Tìm kiếm video... (Q) ]       |
+----------------------------------------------------------------------------------------------------+
| [ ] Video                     | Chế độ hiển thị | Ngày tải lên | Số lượt xem | Bình luận | Thao tác|
|----------------------------------------------------------------------------------------------------|
| [ ] [Thumb] Clean Arch NestJS | (•) Công khai   | 24/10/2026   | 125,400     | 42        | [E] [X] |
| [ ] [Thumb] Microservices Bull| (•) Đã lên lịch | 28/10 09:00  | 0           | 0         | [E] [X] |
| [ ] [Thumb] Intro Video 2K    | (•) Đang xử lý..| 25/10/2026   | 0           | 0         | [ ] [X] |
| [ ] [Thumb] Private Draft     | (•) Riêng tư    | 20/10/2026   | 12          | 1         | [E] [X] |
+----------------------------------------------------------------------------------------------------+
|  MODAL TẢI LÊN VIDEO MỚI (UPLOAD MODAL < 100MB):                                                   |
|  +-----------------------------------------------------------------------------------------------+ |
|  | Kéo và thả tệp video vào đây (Hỗ trợ MP4, MKV, MOV, WEBM. Dung lượng tối đa: 100MB)          | |
|  | [ Chọn tệp từ máy tính ]                                                                      | |
|  |                                                                                               | |
|  | Tiêu đề video (*):     [ Hướng dẫn triển khai DDD trong NestJS                     ]          | |
|  | Mô tả video:           [ Phân tích chi tiết ranh giới domain, entity, usecases...  ]          | |
|  | Chế độ hiển thị (*):   ( ) Công khai   ( ) Không công khai   ( ) Riêng tư   (•) Lên lịch      | |
|  | Ngày giờ phát hành:    [ 28/10/2026 09:00 AM ] (Bắt buộc nếu chọn Lên lịch)                    | |
|  | Cài đặt bình luận:     [X] Cho phép người xem bình luận dưới video này                         | |
|  | Ảnh thu nhỏ (Thumbnail): [ Tải ảnh lên (Khuyên dùng 1280x720) ]                                | |
|  |                                                                                               | |
|  | [ Hủy bỏ ]                                                    [ Lưu thay đổi / Xuất bản ]     | |
|  +-----------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
```

### Field Catalog

| Tên trường (Field) | Kiểu dữ liệu (Type) | Bắt buộc (Required) | Ràng buộc & Validation | Quy tắc liên quan (Target BR) |
| :--- | :--- | :---: | :--- | :--- |
| `upload.videoFile` | Binary / File | Có | Dung lượng `<= 100MB` (104,857,600 bytes), định dạng MIME: MP4, MKV, MOV, AVI, WEBM. | `BR-VID-01`, `BR-VID-02` |
| `upload.videoTitle` | Text Input | Có | Chiều dài từ 1 đến 150 ký tự, không được rỗng. | `BR-VID-03` |
| `upload.videoDescription`| Text Area | Không | Chiều dài tối đa 5000 ký tự. | `BR-VID-03` |
| `upload.visibility` | Radio Group | Có | 1 trong 4 giá trị: `PUBLIC`, `UNLISTED`, `PRIVATE`, `SCHEDULED`. | `BR-VID-07` |
| `upload.scheduleAt` | DateTime Picker | Điều kiện | Bắt buộc khi `visibility === SCHEDULED`. Thời gian phải lớn hơn thời điểm hiện tại (`> now()`). | `BR-VID-05` |
| `upload.allowComments`| Toggle Switch | Có | Boolean (true: cho phép bình luận, false: khóa bình luận). Mặc định `true`. | `BR-INT-02` |
| `upload.thumbnail` | Image File | Không | Tệp ảnh PNG/JPG, dung lượng < 5MB, tỷ lệ khuyến nghị 16:9. | `BR-TRC-03` |

### Bảng biến cố CTA & Chuyển tiếp Trạng thái (CTA Events)

| Biến cố / Tương tác (CTA Event) | Hành động kích hoạt (Trigger) | Điều kiện kiểm tra (Condition) | Trạng thái chuyển tiếp / API gọi |
| :--- | :--- | :--- | :--- |
| `OPEN_UPLOAD_MODAL` | Bấm "+ Tải video lên" | Creator đã đăng nhập | Hiển thị Modal Upload trên màn hình |
| `DROP_FILE_CHECK` | Kéo thả tệp vào dropzone | File dung lượng > 100MB | Báo lỗi ngay tại giao diện (`BR-VID-01`), không cho submit |
| `SUBMIT_UPLOAD` | Bấm "Lưu thay đổi / Xuất bản" | Thỏa mãn toàn bộ Field Catalog validation | Gọi API `POST /videos/upload` (`UploadVideoUseCase`), đóng modal, hiện tiến trình `PROCESSING` |
| `CLICK_EDIT_VIDEO` | Bấm biểu tượng cây bút [E] | Creator sở hữu video | Mở Modal Cập nhật thông tin video (`UC-VID-03`, `UpdateVideoUseCase`) |
| `SUBMIT_UPDATE_VIDEO`| Bấm "Lưu thay đổi" (Update) | Ít nhất 1 trường thay đổi (`@AtLeastNonEmpty(1)`) | Gọi API `PUT /videos/{id}` (`UpdateVideoUseCase`), cập nhật bảng hiển thị |
| `DELETE_VIDEO` | Bấm biểu tượng thùng rác [X] | Creator xác nhận hộp thoại cảnh báo | Gọi API `DELETE /videos/{id}` (`DeleteVideoUseCase`), loại bỏ dòng khỏi bảng |

---

## 4. SCR-04: Trang Chi tiết Kênh (Channel Page)

- **Mã Màn hình**: `SCR-04`
- **Tên Màn hình**: Trang chủ Kênh sáng tạo (Channel Public Page)
- **Actor sử dụng**: Guest (`ACT-GUEST`), User / Viewer (`ACT-USER`), Creator chủ kênh (`ACT-CREATOR`)
- **Use Case liên quan**: `UC-CHAN-01`, `UC-CHAN-02`, `UC-CHAN-03`, `UC-CHAN-04`, `UC-VID-02`
- **Mục tiêu**: Trưng bày danh tính kênh (Banner, Avatar, Tên, Tiểu sử), danh sách video đã xuất bản, tab Playlist và thao tác Đăng ký / Hủy đăng ký theo dõi.

### Wireframe ASCII

```text
+----------------------------------------------------------------------------------------------------+
| [============================= ẢNH BÌA KÊNH (BANNER 16:9 / 2048x1152) ============================]|
+----------------------------------------------------------------------------------------------------+
|  (   AVATAR   )   Tech Channel   [@techchannel]   [ ĐÃ ĐĂNG KÝ (150K) v ]  hoặc  [ Tùy chỉnh kênh ]|
|  (   KÊNH     )   18 video - 1.2M lượt xem toàn kênh                                               |
|                   Kênh chia sẻ kiến thức lập trình backend, microservices, cloud native...         |
+----------------------------------------------------------------------------------------------------+
|  [ TRANG CHỦ ]    [ VIDEO (18) ]    [ DANH SÁCH PHÁT (4) ]    [ GIỚI THIỆU ]                       |
+----------------------------------------------------------------------------------------------------+
|  Mới nhất v                                                                                        |
|  +------------------------+  +------------------------+  +------------------------+                |
|  | [    Thumbnail 16:9   ]|  | [    Thumbnail 16:9   ]|  | [    Thumbnail 16:9   ]|                |
|  |                 [12:45]|  |                 [05:20]|  |                 [45:10]|                |
|  | Clean Arch NestJS      |  | Microservices BullMQ   |  | Video Transcoder 2K    |                |
|  | 125K view - 2 ngày trc |  | 8.2K view - 1 tuần trc |  | 42K view - 3 tuần trc  |                |
|  +------------------------+  +------------------------+  +------------------------+                |
+----------------------------------------------------------------------------------------------------+
```

### Field Catalog

| Tên trường (Field) | Kiểu dữ liệu (Type) | Bắt buộc (Required) | Ràng buộc & Validation | Quy tắc liên quan (Target BR) |
| :--- | :--- | :---: | :--- | :--- |
| `channel.bannerUrl` | Image URL | Không | Hiển thị ảnh bìa kênh (fallback màu nền mặc định nếu trống). | `UC-CHAN-01` |
| `channel.avatarUrl` | Image URL | Có | Ảnh đại diện tròn, tỷ lệ 1:1. | `UC-CHAN-01` |
| `channel.name` | String (Display) | Có | Độ dài từ 3 đến 50 ký tự. | `UC-CHAN-01` |
| `channel.handle` | String (Display) | Có | Định danh `@handle` duy nhất, bắt đầu bằng ký tự `@`. | - |
| `channel.subscribers`| Number (Display) | Có | Tổng số người theo dõi kênh. | - |
| `channel.activeTab` | Tab Select | Có | 1 trong các tab: `HOME`, `VIDEOS`, `PLAYLISTS`, `ABOUT`. | `UC-CHAN-02` |

### Bảng biến cố CTA & Chuyển tiếp Trạng thái (CTA Events)

| Biến cố / Tương tác (CTA Event) | Hành động kích hoạt (Trigger) | Điều kiện kiểm tra (Condition) | Trạng thái chuyển tiếp / API gọi |
| :--- | :--- | :--- | :--- |
| `LOAD_CHANNEL_PAGE` | Truy cập `/channel/{id}` hoặc `/@handle` | Kênh tồn tại | Gọi API `GET /channels/{id}` (`ViewChannelUseCase`) |
| `TOGGLE_FOLLOW` | Bấm nút "Đăng ký" / "Hủy đăng ký" | Đã đăng nhập, không phải chủ kênh | Gọi API `POST /channels/{id}/follow` hoặc `unfollow` (`UC-CHAN-03/04`) |
| `CUSTOMIZE_CHANNEL` | Bấm "Tùy chỉnh kênh" | Là chủ sở hữu kênh (`userId === channel.ownerId`) | Điều hướng sang `SCR-03: Creator Studio` |
| `SWITCH_TAB` | Bấm chuyển tab (Videos/Playlists) | - | Cập nhật bộ dữ liệu hiển thị theo tab tương ứng |

---

## 5. SCR-05: Cổng Kiểm duyệt Nội dung Staff (Staff Moderation Dashboard)

- **Mã Màn hình**: `SCR-05`
- **Tên Màn hình**: Cổng điều hành & kiểm duyệt nội dung (Staff Moderation Dashboard)
- **Actor sử dụng**: Staff (`ACT-STAFF`), Admin (`ACT-ADMIN`)
- **Use Case liên quan**: `UC-MOD-01`, `UC-MOD-02`, `UC-MOD-03`, `UC-INT-04`, `UC-INT-05`
- **Mục tiêu**: Xử lý hàng đợi báo cáo vi phạm cộng đồng, cưỡng chế khóa/ẩn video, xóa bình luận vi phạm và phê duyệt/bác bỏ đơn kháng cáo từ Creator.

### Wireframe ASCII

```text
+----------------------------------------------------------------------------------------------------+
| [Staff Portal]   BẢNG ĐIỀU HÀNH KIỂM DUYỆT                                      [Admin/Staff Name] |
+----------------------------------------------------------------------------------------------------+
| [Chờ duyệt: 14]       | [Gắn cờ tự động: 3]   | [Đơn kháng cáo: 5]     | [Đã xử lý hôm nay: 28]    |
+----------------------------------------------------------------------------------------------------+
| Bộ lọc: Loại mục tiêu: [ Tất cả v ]   Lý do: [ Vi phạm bản quyền v ]   Trạng thái: [ Chờ duyệt v ] |
+----------------------------------------------------------------------------------------------------+
| HÀNG ĐỢI BÁO CÁO VI PHẠM (REPORT QUEUE):                                                           |
|----------------------------------------------------------------------------------------------------|
| Mã Báo cáo | Đối tượng | Tiêu đề / Xem trước        | Lý do vi phạm | Người báo cáo | Thao tác     |
|------------|-----------|----------------------------|---------------|---------------|--------------|
| #REP-1024  | VIDEO     | "Hacking full tool 2026"   | PHẦN MỀM ĐỘC  | user_91 (3 lượ| [XỬ LÝ NGAY] |
| #REP-1025  | COMMENT   | "Mua tài khoản giá rẻ tại..| SPAM / LỪA ĐẢO| user_14 (1 lượ| [XỬ LÝ NGAY] |
| #REP-1026  | VIDEO     | "Nhạc remix lậu không xin..| BẢN QUYỀN     | music_corp (5)| [XỬ LÝ NGAY] |
+----------------------------------------------------------------------------------------------------+
|  MODAL XỬ LÝ VI PHẠM / XEM XÉT BÁO CÁO:                                                            |
|  +-----------------------------------------------------------------------------------------------+ |
|  | Đối tượng: VIDEO - "Hacking full tool 2026" (ID: 88bf-12a4...)                                | |
|  | Tác giả: HackerChannel (ID: usr_001) - Số gậy cảnh cáo hiện tại: 1/3                          | |
|  | Lý do báo cáo: PHẦN MỀM ĐỘC HẠI HOẶC NGUY HIỂM                                                | |
|  | Mô tả từ người báo cáo: "Video chia sẻ link tải chứa trojan đánh cắp cookie"                  | |
|  |                                                                                               | |
|  | QUYẾT ĐỊNH CỦA KIỂM DUYỆT VIÊN:                                                               | |
|  | ( ) BÁC BỎ BÁO CÁO (Nội dung hợp lệ, đóng báo cáo)                                            | |
|  | (•) KHÓA VIDEO & CẢNH CÁO (Chuyển trạng thái sang BANNED, ẩn khỏi hệ thống)                   | |
|  | Ghi chú giải trình kiểm duyệt (*): [ Video vi phạm chính sách an toàn số khoản 4...         ] | |
|  |                                                                                               | |
|  | [ Hủy bỏ ]                                                    [ Xác nhận quyết định ]         | |
|  +-----------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
```

### Field Catalog

| Tên trường (Field) | Kiểu dữ liệu (Type) | Bắt buộc (Required) | Ràng buộc & Validation | Quy tắc liên quan (Target BR) |
| :--- | :--- | :---: | :--- | :--- |
| `filter.targetType` | Enum Select | Không | `ALL`, `VIDEO`, `COMMENT`. | `BR-INT-06` |
| `filter.status` | Enum Select | Không | `PENDING`, `RESOLVED`, `DISMISSED`. | - |
| `decision.action` | Radio Choice (Modal)| Có | `DISMISS` (Bác bỏ), `BAN_VIDEO` (Khóa video), `DELETE_COMMENT` (Xóa comment), `WARN_USER`. | `BR-MOD-01`, `BR-INT-05` |
| `decision.reason` | Text Area (Modal) | Có | Bắt buộc khi ra lệnh phạt, độ dài tối thiểu 10 ký tự, tối đa 500 ký tự. | `BR-MOD-04` |
| `appeal.verdict` | Radio Choice (Modal)| Có | `APPROVE_APPEAL` (Mở khóa lại), `REJECT_APPEAL` (Giữ nguyên lệnh phạt). | `BR-MOD-03`, `BR-MOD-04` |

### Bảng biến cố CTA & Chuyển tiếp Trạng thái (CTA Events)

| Biến cố / Tương tác (CTA Event) | Hành động kích hoạt (Trigger) | Điều kiện kiểm tra (Condition) | Trạng thái chuyển tiếp / API gọi |
| :--- | :--- | :--- | :--- |
| `OPEN_RESOLVE_MODAL` | Bấm "XỬ LÝ NGAY" trên hàng đợi | Vai trò Staff / Admin | Hiển thị chi tiết vi phạm và Modal ra quyết định |
| `CONFIRM_DECISION_BAN` | Bấm "Xác nhận quyết định" (Ban) | `decision.reason.trim().length >= 10` | Gọi API `POST /moderation/videos/{id}/ban` (`BR-MOD-01`), cập nhật trạng thái `BANNED`, đóng modal |
| `CONFIRM_DISMISS` | Bấm "Xác nhận quyết định" (Bác bỏ) | - | Gọi API `POST /moderation/reports/{id}/dismiss`, đóng báo cáo |
| `RESOLVE_APPEAL` | Phê duyệt/Bác bỏ đơn kháng cáo | Đơn kháng cáo đang ở trạng thái `PENDING` | Gọi API `POST /moderation/appeals/{id}/resolve` (`BR-MOD-04`), quyết định có hiệu lực tối hậu |

---

## 6. SCR-06: Cổng Quản trị Node Lưu trữ Admin (Storage Nodes Management)

- **Mã Màn hình**: `SCR-06`
- **Tên Màn hình**: Cổng quản trị cụm node lưu trữ (Storage Nodes Management Portal)
- **Actor sử dụng**: Admin (`ACT-ADMIN`)
- **Use Case liên quan**: `UC-ADM-01`, `UC-ADM-02`, `UC-ADM-03`
- **Interface Code liên quan**: `StorageNodeAdminService` (`list`, `create`, `update`, `remove`, `healthCheck`)
- **Mục tiêu**: Quản trị hạ tầng phân tán S3/MinIO, kiểm tra kết nối (Probe), theo dõi quota dung lượng, định cấu hình trạng thái hoạt động và thực thi chính sách xóa an toàn (Deletion Policy).

### Wireframe ASCII

```text
+----------------------------------------------------------------------------------------------------+
| [Admin Portal]   HẠ TẦNG LƯU TRỮ (STORAGE NODES MANAGEMENT)               [ Admin Profile / Logout]|
+----------------------------------------------------------------------------------------------------+
| [Tổng số Node: 4]     | [Node Hoạt động: 3]   | [Dung lượng đã dùng: 642 GB] | [Khả dụng: 1.35 TB] |
+----------------------------------------------------------------------------------------------------+
| Chế độ: [ HYBRID (DB + ENV) ]    Trạng thái: [ Tất cả v ]          [ + Thêm Node Lưu Trữ Mới ]     |
+----------------------------------------------------------------------------------------------------+
| DANH SÁCH STORAGE NODES:                                                                           |
|----------------------------------------------------------------------------------------------------|
| Tên Node    | Endpoint URL        | Bucket       | Dung lượng (Dùng/Tối đa) | Trạng thái | Thao tác|
|-------------|---------------------|--------------|--------------------------|------------|---------|
| storage-hn-1| minio.hn.mycast.vn  | mycast-prod  | [======    ] 62% (620GB) | [ACTIVE]   | [P][E][X|
| storage-sg-1| s3.ap-southeast-1...| mycast-backup| [=         ] 12% (120GB) | [ACTIVE]   | [P][E][X|
| storage-node| minio-dev.local:9000| mycast-dev   | [          ] 0%  (0GB)   | [INACTIVE] | [P][E][X|
+----------------------------------------------------------------------------------------------------+
|  MODAL THÊM NODE LƯU TRỮ MỚI (CREATE STORAGE NODE):                                                |
|  +-----------------------------------------------------------------------------------------------+ |
|  | Tên Node (*):          [ storage-cloud-node-03                                     ]          | |
|  | Endpoint URL (*):      [ https://s3.ap-southeast-1.amazonaws.com                  ]          | |
|  | Tên Bucket (*):        [ mycast-media-renditions                                   ]          | |
|  | Khu vực (Region):      [ ap-southeast-1                                            ]          | |
|  | Access Key (*):        [ AKIAIOSFODNN7EXAMPLE                                      ]          | |
|  | Secret Key (*):        [ ****************************************                  ]          | |
|  | Hạn mức Dung lượng (*):[ 1000 ] GB                                                        | |
|  | Trạng thái kích hoạt:  [X] Kích hoạt ngay vào Pool (ACTIVE)                                   | |
|  |                                                                                               | |
|  | [ Kiểm tra kết nối (Probe Test) ]  -> Kết quả: [ (v) Probe Passed: Bucket Write/Read OK ]     | |
|  |                                                                                               | |
|  | [ Hủy bỏ ]                                                    [ Xác nhận Lưu Node ]           | |
|  +-----------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
```

### Field Catalog

| Tên trường (Field) | Kiểu dữ liệu (Type) | Bắt buộc (Required) | Ràng buộc & Validation | Quy tắc liên quan (Target BR) |
| :--- | :--- | :---: | :--- | :--- |
| `node.name` | Text Input | Có | Độ dài từ 3 đến 50 ký tự, định dạng slug không dấu (`[a-z0-9-]`). | `BR-ADM-01` |
| `node.endpoint` | URL Input | Có | URL hợp lệ có giao thức `http://` hoặc `https://`. | `BR-ADM-01` |
| `node.bucket` | Text Input | Có | Tuân thủ quy chuẩn đặt tên bucket S3 (3-63 ký tự, chữ thường, số, dấu gạch nối). | `BR-ADM-01` |
| `node.region` | Text Input | Không | Tùy chọn (ví dụ: `us-east-1`, `ap-southeast-1`). | - |
| `node.accessKey` | Password Input | Có | Không được để trống. | `BR-ADM-01` |
| `node.secretKey` | Password Input | Có | Không được để trống. | `BR-ADM-01` |
| `node.maxQuotaBytes` | Number Input (GB) | Có | Giá trị số nguyên dương > 0 (quy đổi ra bytes khi gửi API). | `BR-ADM-01` |
| `node.status` | Enum Select / Toggle| Có | `ACTIVE`, `INACTIVE`, `DRAINING`. | `BR-ADM-02` |

### Bảng biến cố CTA & Chuyển tiếp Trạng thái (CTA Events)

| Biến cố / Tương tác (CTA Event) | Hành động kích hoạt (Trigger) | Điều kiện kiểm tra (Condition) | Trạng thái chuyển tiếp / API gọi |
| :--- | :--- | :--- | :--- |
| `LOAD_STORAGE_ADMIN` | Truy cập `/admin/storage-nodes` | Quyền Quản trị viên (`Role = ADMIN`) | Gọi API `GET /admin/storage-nodes` (`StorageNodeAdminService.list`), render dashboard |
| `OPEN_CREATE_NODE_MODAL`| Bấm "+ Thêm Node Lưu Trữ"| Admin | Mở Modal tạo node |
| `TRIGGER_PROBE_TEST` | Bấm "Kiểm tra kết nối" | Các trường kết nối đã điền đầy đủ | Gọi API Probe đọc/ghi bucket thử nghiệm (`BR-ADM-02`), hiển thị kết quả PASS/FAIL |
| `SUBMIT_CREATE_NODE` | Bấm "Xác nhận Lưu Node" | Probe thành công và form hợp lệ | Gọi API `POST /admin/storage-nodes` (`StorageNodeAdminService.create`), thêm vào pool |
| `TRIGGER_HEALTH_CHECK` | Bấm biểu tượng [P] trên bảng | - | Gọi API `POST /admin/storage-nodes/{id}/health-check`, cập nhật Drawer trạng thái |
| `CLICK_DELETE_NODE` | Bấm biểu tượng [X] trên bảng | - | Mở Dialog cảnh báo xóa |
| `CONFIRM_DELETE_NODE` | Bấm "Xác nhận Xóa" trong Dialog | Kiểm tra `activeObjectsCount === 0` (Tuân thủ `storage-node-deletion.policy`) | Gọi API `DELETE /admin/storage-nodes/{id}` (`StorageNodeAdminService.remove`, `BR-ADM-04`). Nếu còn dữ liệu, báo lỗi `409 Conflict` |
