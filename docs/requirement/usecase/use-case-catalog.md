# Danh mục Use Case Hệ thống MyCast (Use Case Catalog)

## 1. Phân cấp Actors (Actor Hierarchy)
- **Guest (`ACT-GUEST`)**: Khách vãng lai, truy cập nội dung công khai (xem video, xem kênh, xem bình luận).
- **User / Viewer (`ACT-USER`)**: Kế thừa `Guest`; người dùng đã đăng nhập, tương tác nội dung, chặn/bỏ chặn người dùng.
- **Creator (`ACT-CREATOR`)**: Kế thừa `User`; sở hữu kênh, xuất bản/chỉnh sửa/xóa video, quản lý bình luận trên kênh.
- **Staff (`ACT-STAFF`)**: Kế thừa `User`; kiểm duyệt nội dung, xử lý kháng cáo, xóa bình luận vi phạm toàn hệ thống.
- **Admin (`ACT-ADMIN`)**: Kế thừa `Staff`; toàn quyền hệ thống, quản trị hạ tầng Storage Nodes.
- **Transcoder Worker (`ACT-SYS-TRANSCODER`)**: Hệ thống xử lý nền chuyển mã video thích ứng HLS.
- **Storage Cluster (`ACT-EXT-STORAGE`)**: Cụm lưu trữ tệp tin phân tán S3/MinIO.
- **Email Service (`ACT-EXT-MAIL`)**: Dịch vụ thông báo và gửi thư hệ thống.

---

## 2. Bảng Danh mục Use Case Chi tiết

### Module 1: Authentication & User Management (`AUTH` & `USER`)

| Use Case ID | Tên Use Case | Actor chính | Mục tiêu (Goal) | Interface Code ánh xạ |
| :--- | :--- | :--- | :--- | :--- |
| `UC-AUTH-01` | Đăng ký tài khoản | Guest | Tạo tài khoản người dùng mới (hệ thống tự động kích hoạt khởi tạo hồ sơ người dùng ban đầu) | `RegisterUseCase` |
| `UC-AUTH-02` | Đăng nhập hệ thống | Guest | Xác thực danh tính và nhận cặp token truy cập (Access/Refresh Token) | `LoginUseCase` |
| `UC-AUTH-03` | Quên mật khẩu | Guest | Yêu cầu gửi đường dẫn thiết lập lại mật khẩu qua email | `ForgotPasswordUseCase` |
| `UC-AUTH-04` | Đổi mật khẩu | User | Thay đổi mật khẩu tài khoản đang sử dụng hoặc thiết lập mới qua token | `UpdatePasswordUseCase` |
| `UC-USER-01` | Cập nhật thông tin cá nhân | User | Cập nhật tên hiển thị, ảnh đại diện, tiểu sử | `UpdateUserUseCase` |
| `UC-USER-02` | Xem hồ sơ người dùng | User | Truy vấn thông tin tài khoản người dùng theo định danh | `GetUserUseCase` |

*Ghi chú kỹ thuật: Cơ chế làm mới token (`RefreshTokenUseCase`) là cơ chế bảo mật tầng hạ tầng/middleware (NFR-SEC), không cấu thành Use Case nghiệp vụ độc lập do người dùng tương tác.*

---

### Module 2: Channel Management (`CHAN`)

| Use Case ID | Tên Use Case | Actor chính | Mục tiêu (Goal) | Interface Code ánh xạ |
| :--- | :--- | :--- | :--- | :--- |
| `UC-CHAN-01` | Quản lý thông tin kênh | Creator | Khởi tạo, tùy biến tên kênh, ảnh bìa, avatar, thông tin giới thiệu kênh | `ManageChannelUseCase` |
| `UC-CHAN-02` | Xem trang kênh | Guest, User | Truy cập trang chủ của kênh, xem danh sách video công khai và thống kê | `ViewChannelUseCase` |
| `UC-CHAN-03` | Theo dõi kênh sáng tạo | User | Đăng ký theo dõi kênh để nhận thông báo và cập nhật video mới | `FollowCreatorUseCase` |
| `UC-CHAN-04` | Hủy theo dõi kênh | User | Hủy trạng thái đăng ký theo dõi kênh | `UnfollowCreatorUseCase` |

---

### Module 3: Video Management & Playback (`VID`)

| Use Case ID | Tên Use Case | Actor chính | Mục tiêu (Goal) | Interface Code ánh xạ |
| :--- | :--- | :--- | :--- | :--- |
| `UC-VID-01` | Tải lên video mới | Creator | Tải tệp video (<100MB) lên hệ thống, thiết lập metadata và kích hoạt quy trình transcode | `UploadVideoUseCase` |
| `UC-VID-02` | Xem video (Playback) | Guest, User | Kiểm tra quyền truy cập, phát luồng HLS đa phân giải, ghi nhận lượt xem | `WatchVideoUseCase` |
| `UC-VID-03` | Cập nhật thông tin video | Creator | Sửa tiêu đề, mô tả, tags, thumbnail, chế độ riêng tư (Public/Private/Unlisted/Scheduled), bật/tắt bình luận | `UpdateVideoUseCase` |
| `UC-VID-04` | Xóa video | Creator | Xóa video khỏi hệ thống và giải phóng tài nguyên liên quan | `DeleteVideoUseCase` |
| `UC-VID-05` | Chia sẻ video | Guest, User | Tạo liên kết chia sẻ video công khai | `ShareVideoUseCase` |
| `UC-VID-06` | Thích / Bỏ thích video | User | Ghi nhận phản ứng Like hoặc Dislike của người xem với video | `ToggleVideoLikeUseCase` |
| `UC-VID-07` | Lấy trạng thái tương tác | User | Truy vấn trạng thái phản ứng hiện tại của người xem với video | `GetVideoReactionStatusUseCase` |
| `UC-VID-08` | Tạo danh sách phát | User | Tạo playlist mới để phân loại và gom nhóm video | `CreatePlaylistUseCase` |
| `UC-VID-09` | Quản lý video trong playlist | User | Thêm hoặc xóa video khỏi danh sách phát | `AddVideoToPlaylistUseCase` |
| `UC-VID-10` | Xem danh sách phát | Guest, User | Phát liên tục các video nằm trong playlist theo thứ tự | `WatchPlaylistUseCase` |
| `UC-VID-11` | Xem lịch sử xem video | User | Truy vấn danh sách các video đã xem theo mốc thời gian | `ViewWatchHistoryUseCase` |

---

### Module 4: Interaction & Community (`INT`)

| Use Case ID | Tên Use Case | Actor chính | Mục tiêu (Goal) | Interface Code ánh xạ |
| :--- | :--- | :--- | :--- | :--- |
| `UC-INT-01` | Xem danh sách bình luận | Guest, User | Xem danh sách các bình luận dưới video theo phân trang và phân cấp | `ViewCommentsUseCase` |
| `UC-INT-02` | Tạo bình luận | User | Đăng bình luận mới hoặc phản hồi bình luận của người xem khác | `CreateCommentUseCase` |
| `UC-INT-03` | Chỉnh sửa bình luận | User | Cập nhật nội dung bình luận do chính mình đăng tải | `UpdateCommentUseCase` |
| `UC-INT-04` | Xóa bình luận | User, Creator, Staff, Admin | - User: Xóa bình luận do chính mình viết.<br>- Creator: Xóa bất kỳ bình luận nào dưới video thuộc kênh của mình.<br>- Staff / Admin: Xóa bất kỳ bình luận vi phạm nào trên toàn hệ thống. | `DeleteCommentUseCase` |
| `UC-INT-05` | Báo cáo nội dung vi phạm | User, Guest | Gửi báo cáo vi phạm tiêu chuẩn cộng đồng đối với video hoặc bình luận | `CreateReportUseCase` |
| `UC-INT-06` | Chặn người dùng | User | Chặn người dùng khác tương tác và bình luận trên nội dung của mình | `BlockUserUseCase` |
| `UC-INT-07` | Bỏ chặn người dùng | User | Hủy trạng thái chặn, cho phép người dùng tương tác trở lại | `BlockUserUseCase` |

---

### Module 5: Content Moderation (`MOD`)

| Use Case ID | Tên Use Case | Actor chính | Mục tiêu (Goal) | Interface Code / Cơ chế |
| :--- | :--- | :--- | :--- | :--- |
| `UC-MOD-01` | Quét nội dung tự động | System | Tự động phát hiện và gắn cờ video chứa vi phạm từ khóa hoặc số lượt report cao | Automated Moderation Service |
| `UC-MOD-02` | Xử lý báo cáo & kháng cáo | Staff | Tiếp nhận, đánh giá chứng cứ báo cáo hoặc đơn kháng cáo từ Creator | Moderation Admin Service |
| `UC-MOD-03` | Khóa / Mở khóa nội dung | Staff | Cưỡng chế chuyển trạng thái video sang Banned hoặc mở lại sau kháng cáo | Moderation Admin Service |

---

### Module 6: Storage Node Administration & Transcoder (`ADM` & `TRC`)

| Use Case ID | Tên Use Case | Actor chính | Mục tiêu (Goal) | Interface Code ánh xạ |
| :--- | :--- | :--- | :--- | :--- |
| `UC-ADM-01` | Quản trị Storage Nodes | Admin | Thêm mới node lưu trữ, chỉnh sửa thông số kết nối và dung lượng tối đa | `StorageNodeAdminPort` |
| `UC-ADM-02` | Cập nhật trạng thái Node | Admin | Bật/tắt trạng thái hoạt động của Storage Node (Active, Inactive, Draining) | `StorageNodeAdminPort` |
| `UC-ADM-03` | Giám sát dung lượng & tải | Admin | Theo dõi trực quan tỷ lệ đầy, tải đọc/ghi và số lượng file trên từng node | `StorageNodeAdminPort` |
| `UC-TRC-01` | Nhận job & phân tích media | Transcoder Worker | Tiếp nhận sự kiện video upload từ Message Queue và phân tích tệp nguồn | `VideoTranscodeContract` |
| `UC-TRC-02` | Chuyển mã HLS đa biến thể | Transcoder Worker | Dùng FFmpeg băm luồng đa độ phân giải (144p - 2K 60fps), sinh playlist HLS | `VideoTranscodeContract` / FFmpeg |
| `UC-TRC-03` | Cập nhật trạng thái & lưu trữ | Transcoder Worker | Đẩy file HLS lên Storage Node và phát sự kiện hoàn tất (READY / FAILED) | Storage Client / Event Bus |

---

## 3. Danh mục Files PlantUML Cập nhật
1. `docs/requirement/use-case.puml`: Tổng hợp toàn bộ hệ thống MyCast.
2. `docs/requirement/use-case-auth-user.puml`: Phân hệ Xác thực & Quản lý Người dùng.
3. `docs/requirement/use-case-video-channel.puml`: Phân hệ Video & Kênh Sáng tạo.
4. `docs/requirement/use-case-interaction.puml`: Phân hệ Tương tác Cộng đồng & Kiểm duyệt.
5. `docs/requirement/use-case-transcoder-storage.puml`: Phân hệ Chuyển mã Video & Hạ tầng Lưu trữ.
