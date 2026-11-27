# Danh mục Quy tắc Nghiệp vụ (Business Rules Catalog)

Hệ thống quy tắc nghiệp vụ định chuẩn của nền tảng MyCast, được định danh theo mẫu `BR-[MODULE]-[NUM]`.

---

## 1. Module Authentication & User (`AUTH` & `USER`)

| Mã BR | Tên Quy tắc | Điều kiện & Logic Nghiệp vụ | Điểm thực thi (Enforcement Point) | Mã lỗi & Thông báo |
| :--- | :--- | :--- | :--- | :--- |
| `BR-AUTH-01` | Tính duy nhất của Email | Email đăng ký tài khoản phải là duy nhất trên toàn hệ thống, không phân biệt chữ hoa/thường. | Service / Database Unique Constraint | `409 Conflict`: `"Email is already registered"` |
| `BR-AUTH-02` | Độ phức tạp Mật khẩu | Mật khẩu phải có độ dài tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt. | DTO Validation / Pipe | `400 Bad Request`: `"Password does not meet complexity requirements"` |
| `BR-AUTH-03` | Thời hạn Token phiên (NFR-SEC) | Access Token có thời hạn tối đa 15 phút. Refresh Token có thời hạn tối đa 7 ngày và bị thu hồi ngay khi đổi mật khẩu hoặc đăng xuất. | Auth Guard / JWT Service | `401 Unauthorized`: `"Token has expired"` |
| `BR-AUTH-04` | Khóa tạm thời do đăng nhập sai | Đăng nhập thất bại liên tiếp 5 lần sẽ khóa tài khoản tạm thời trong vòng 15 phút để chống Brute-force. | Auth Middleware / Redis Cache | `429 Too Many Requests`: `"Too many failed attempts. Account locked for 15 minutes"` |
| `BR-AUTH-05` | Thời hạn Token Đặt lại mật khẩu | Token trong liên kết khôi phục mật khẩu gửi qua email chỉ có hiệu lực trong vòng 60 phút và chỉ được dùng 1 lần duy nhất. | Reset Password Service | `400 Bad Request`: `"Password reset token is invalid or expired"` |

---

## 2. Module Video Management & Playback (`VID`)

| Mã BR | Tên Quy tắc | Điều kiện & Logic Nghiệp vụ | Điểm thực thi (Enforcement Point) | Mã lỗi & Thông báo |
| :--- | :--- | :--- | :--- | :--- |
| `BR-VID-01` | Giới hạn dung lượng tải lên | Dung lượng tệp video tải lên không được vượt quá 100MB (`file.size <= 104,857,600 bytes`). | Gateway / File Interceptor | `413 Payload Too Large`: `"File size exceeds maximum limit of 100MB"` |
| `BR-VID-02` | Định dạng video cho phép | Tệp tải lên phải có MIME type và Magic bytes thuộc danh sách: `video/mp4`, `video/x-matroska` (mkv), `video/quicktime` (mov), `video/x-msvideo` (avi), `video/webm`. | File Validation Filter | `400 Bad Request`: `"Unsupported video format"` |
| `BR-VID-03` | Tính toàn vẹn của Video Metadata | Tiêu đề video (`videoTitle`) bắt buộc, độ dài từ 1 đến 150 ký tự; mô tả (`videoDescription`) tối đa 5000 ký tự. | DTO Validation Pipe | `400 Bad Request`: `"Video title is required and cannot exceed 150 characters"` |
| `BR-VID-04` | Quyền sở hữu Video (Ownership) | Chỉ Creator tạo ra video mới có quyền cập nhật thông tin (`UpdateVideoUseCase`) hoặc xóa video (`DeleteVideoUseCase`). Người khác không được phép can thiệp. | Resource Ownership Guard | `403 Forbidden`: `"You do not have permission to modify this video"` |
| `BR-VID-05` | Hẹn giờ phát hành hợp lệ | Khi chế độ hiển thị là `SCHEDULED`, trường `scheduleAt` bắt buộc phải là thời gian trong tương lai (`scheduleAt > now()`). Nếu chế độ khác `SCHEDULED`, không áp dụng lịch hẹn. | DTO Validation Pipe | `400 Bad Request`: `"Scheduled time must be in the future when visibility is SCHEDULED"` |
| `BR-VID-06` | Kiểm tra tồn tại khi xem | Không cho phép truy cập phát video đối với bản ghi không tồn tại hoặc đã bị đánh dấu xóa mềm (`deletedAt IS NOT NULL`). | Service / Repository | `404 Not Found`: `"Video not found or has been deleted"` |
| `BR-VID-07` | Kiểm soát quyền truy cập Playback | - `PUBLIC` & `UNLISTED`: Mọi actor (kể cả Guest) đều có thể xem.<br>- `PRIVATE`: Chỉ tác giả (`userId === authorId`) mới được xem.<br>- `SCHEDULED`: Chỉ cho phép xem công khai khi `now() >= scheduleAt`; trước đó chỉ tác giả xem được. | Domain Policy / UseCase | `403 Forbidden`: `"This video is private or not yet available"` |
| `BR-VID-08` | Cung cấp luồng HLS hợp lệ | Chỉ cung cấp URL phát `master.m3u8` khi video có trạng thái `READY`. Nếu đang `PROCESSING`, từ chối phát luồng. | Playback Service | `409 Conflict`: `"Video is currently being processed"` |
| `BR-VID-09` | Cơ chế chống lạm phát Lượt xem | Mỗi địa chỉ IP hoặc tài khoản chỉ được tính tối đa 1 lượt xem (view count) trên cùng 1 video trong khoảng thời gian 30 giây. | Redis Rate Limiter / Stream Event | Ghi nhận nội bộ, bỏ qua tăng bộ đếm |
| `BR-VID-10` | Tự động ghi nhận Lịch sử xem | Nếu người xem có đăng nhập (`userId` khác null), tự động upsert bản ghi `WatchHistory` lưu mốc thời gian xem gần nhất. | Event Listener / Async Handler | Thành công ngầm (Silent execution) |

---

## 3. Module Video Transcoding (`TRC`)

| Mã BR | Tên Quy tắc | Điều kiện & Logic Nghiệp vụ | Điểm thực thi (Enforcement Point) | Mã lỗi & Thông báo |
| :--- | :--- | :--- | :--- | :--- |
| `BR-TRC-01` | Kiểm định tệp nguồn (Media Probe) | Worker bắt buộc chạy FFprobe trích xuất metadata và kiểm tra tính hợp lệ của audio/video streams trước khi transcode. | Transcoder Worker Probe | Đánh dấu job `FAILED`: `"Corrupted video file or invalid codecs"` |
| `BR-TRC-02` | Quy tắc không upscale độ phân giải | Worker chỉ sinh các rendition có chiều cao/chiều rộng `<= độ phân giải gốc`. (Ví dụ: Video gốc 720p thì chỉ sinh profiles 144p, 360p, 480p, 720p; không sinh 1080p hay 2K). | Rendition Generator | Tự động lọc rendition list |
| `BR-TRC-03` | Quy chuẩn đóng gói HLS | Luồng phát HLS sử dụng codec video H.264 (libx264), codec âm thanh AAC (aac), thời lượng mỗi phân đoạn (`segmentDuration`) cố định 4 đến 6 giây. | FFmpeg CLI Options | Tham số transcode cố định |
| `BR-TRC-04` | Chuyển đổi trạng thái Video | Trạng thái video chuyển dịch nghiêm ngặt: `UPLOADING -> PROCESSING -> READY` (hoặc `FAILED`). Không được bỏ qua giai đoạn `PROCESSING`. | Domain Entity State Machine | `400 Bad Request`: `"Invalid state transition"` |
| `BR-TRC-05` | Lưu trữ cấu trúc HLS hoàn chỉnh | Phải tải đầy đủ tệp `master.m3u8`, các tệp playlist biến thể và toàn bộ phân đoạn `.ts` lên Storage Node trước khi chuyển trạng thái `READY`. | Storage Client / Worker | Tự động retry upload 3 lần |
| `BR-TRC-06` | Chính sách thử lại Job thất bại | Khi quá trình chuyển mã gặp lỗi hệ thống, worker thử lại tối đa 3 lần với backoff lũy thừa (10s, 30s, 90s). Sau 3 lần thất bại, chuyển trạng thái `FAILED`. | Queue Consumer (BullMQ/RabbitMQ) | Dead Letter Queue (DLQ) |

---

## 4. Module Community & Interaction (`INT`)

| Mã BR | Tên Quy tắc | Điều kiện & Logic Nghiệp vụ | Điểm thực thi (Enforcement Point) | Mã lỗi & Thông báo |
| :--- | :--- | :--- | :--- | :--- |
| `BR-INT-01` | Giới hạn ký tự bình luận | Nội dung bình luận (`content`) không được để trống và độ dài từ 1 đến 2000 ký tự. | DTO Validation Pipe | `400 Bad Request`: `"content must be between 1 and 2000 characters"` |
| `BR-INT-02` | Trạng thái cho phép bình luận | Không cho phép tạo bình luận nếu video có cấu hình `allowComments === false`. | Comment Service | `403 Forbidden`: `"Comments are disabled for this video"` |
| `BR-INT-03` | Ràng buộc Chặn người dùng | Người dùng bị tác giả kênh chặn (`BlockUser`) không được phép like, comment hoặc reply trên bất kỳ video nào của kênh đó. | Interaction Guard | `403 Forbidden`: `"You are blocked from interacting with this channel"` |
| `BR-INT-04` | Giới hạn độ sâu phân cấp bình luận | Hệ thống hỗ trợ tối đa 2 cấp bình luận (Top-level comment và Reply trực tiếp). Reply của một reply sẽ được quy về cấp 2 gắn với `parentId` gốc. | Domain Service | Tự động map về `rootParentId` |
| `BR-INT-05` | Phân quyền 3 cấp Xóa bình luận | Thao tác xóa bình luận được cấp phép khi thỏa mãn 1 trong 3 điều kiện:<br>1. **User (Tác giả)**: `comment.authorId === actorId`<br>2. **Creator (Chủ kênh)**: `video.authorId === actorId` (xóa bất kỳ bình luận nào dưới video kênh mình)<br>3. **Staff / Admin**: `actor.role IN ['STAFF', 'ADMIN']` (kiểm duyệt toàn hệ thống) | Comment Authorization Policy | `403 Forbidden`: `"You do not have permission to delete this comment"` |
| `BR-INT-06` | Tính toàn vẹn của mục tiêu Báo cáo | Báo cáo vi phạm chỉ được gửi cho đối tượng (`targetId`) thực sự tồn tại trong hệ thống (kiểm tra `Video` hoặc `Comment`). | Report Service | `404 Not Found`: `"Report target not found"` |
| `BR-INT-07` | Tần suất gửi Báo cáo (Rate Limit) | Một người dùng (hoặc cùng địa chỉ IP nếu là Guest) chỉ được gửi tối đa 1 báo cáo cho cùng 1 đối tượng mục tiêu trong vòng 24 giờ. | Redis Rate Limiter | `429 Too Many Requests`: `"You have already reported this content recently"` |
| `BR-INT-08` | Quy tắc Chặn & Bỏ chặn | Không cho phép người dùng tự chặn chính mình (`blockerId !== targetUserId`). Khi bỏ chặn (`isBlocked = false`), người dùng được phục hồi khả năng tương tác bình thường. | User Block Service | `400 Bad Request`: `"You cannot block yourself"` |

---

## 5. Module Content Moderation (`MOD` - Staff)

| Mã BR | Tên Quy tắc | Điều kiện & Logic Nghiệp vụ | Điểm thực thi (Enforcement Point) | Mã lỗi & Thông báo |
| :--- | :--- | :--- | :--- | :--- |
| `BR-MOD-01` | Cưỡng chế ẩn nội dung vi phạm | Video hoặc bình luận khi bị Staff chuyển sang trạng thái `BANNED` lập tức bị ẩn khỏi toàn bộ kết quả tìm kiếm, trang chủ và không thể phát. | Playback & Search Query Filters | `403 Forbidden`: `"This content has been removed for violating community guidelines"` |
| `BR-MOD-02` | Tự động gắn cờ theo ngưỡng Report | Khi một video nhận từ 10 báo cáo vi phạm hợp lệ trở lên trong ngày, hệ thống tự động đổi trạng thái sang `FLAGGED` và đưa vào danh sách ưu tiên của Staff. | Background Job / Event Handler | Tự động cập nhật trạng thái |
| `BR-MOD-03` | Quyền kháng cáo của Creator | Creator có quyền gửi 1 đơn kháng cáo duy nhất cho mỗi video bị khóa vi phạm trong vòng 14 ngày kể từ khi nhận quyết định phạt. | Appeal Service | `400 Bad Request`: `"Appeal window has expired or an appeal is already pending"` |
| `BR-MOD-04` | Quyết định cuối cùng của Staff | Quyết định xử lý kháng cáo của Staff sau khi được phê duyệt sẽ là quyết định cuối cùng, không thể gửi lại kháng cáo lần 2. | Moderation Service | `400 Bad Request`: `"Final decision has been rendered"` |

---

## 6. Module Storage Administration (`ADM` - Admin)

| Mã BR | Tên Quy tắc | Điều kiện & Logic Nghiệp vụ | Điểm thực thi (Enforcement Point) | Mã lỗi & Thông báo |
| :--- | :--- | :--- | :--- | :--- |
| `BR-ADM-01` | Tính hợp lệ cấu hình Storage Node | Endpoint URL phải hợp lệ, Bucket name tuân thủ chuẩn S3, Quota dung lượng tối đa > 0. | DTO Validation Pipe | `400 Bad Request`: `"Invalid storage node configuration"` |
| `BR-ADM-02` | Probe kiểm tra kết nối bắt buộc | Trước khi thêm mới hoặc kích hoạt Storage Node, hệ thống bắt buộc gửi probe ping đọc/ghi thử nghiệm vào bucket. Nếu thất bại, cấm lưu node vào pool. | Storage Node Admin Service | `422 Unprocessable Entity`: `"Storage node probe failed: Unable to connect to bucket"` |
| `BR-ADM-03` | Thuật toán định tuyến lưu trữ | Khi tiếp nhận upload, hệ thống tự động chọn node đang ở trạng thái `ACTIVE` có tỷ lệ dung lượng trống cao nhất hoặc theo trọng số cấu hình. | Storage Node Pool Manager | `507 Insufficient Storage`: `"No active storage node available with sufficient space"` |
| `BR-ADM-04` | Chính sách xóa Node an toàn (Deletion Policy) | Tuyệt đối cấm xóa Storage Node khi node đó vẫn còn chứa các đối tượng lưu trữ đang ở trạng thái `READY`. Node phải được chuyển sang `DRAINING` để di chuyển dữ liệu trước khi xóa. | `StorageNodeDeletionPolicy` | `409 Conflict`: `"Cannot delete storage node: Node contains active objects"` |
| `BR-ADM-05` | Cảnh báo ngưỡng đầy hạ tầng | Khi một Storage Node đạt ngưỡng dung lượng sử dụng >= 85%, hệ thống tự động phát cảnh báo WARNING; khi đạt >= 95%, tự động khóa không nhận upload mới. | Storage Health Monitor Service | Chuyển trạng thái sang `FULL` |
