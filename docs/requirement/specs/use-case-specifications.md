# Đặc tả Chi tiết Use Case (Use Case Specifications)

Tài liệu đặc tả chi tiết các Use Case trọng yếu của hệ thống MyCast, tuân thủ 100% các interface và DTOs hiện hữu trong mã nguồn backend (`RegisterUseCase`, `UploadVideoUseCase`, `WatchVideoUseCase`, `UpdateVideoUseCase`, `VideoTranscodeContract`, `CreateCommentUseCase`, `DeleteCommentUseCase`, `CreateReportUseCase`, `BlockUserUseCase`, `StorageNodeAdminPort`).

---

## 1. UC-AUTH-01: Đăng ký tài khoản (Register User)

- **Mã Use Case**: `UC-AUTH-01`
- **Tên Use Case**: Đăng ký tài khoản người dùng
- **Actor chính**: Guest (`ACT-GUEST`)
- **Actor phụ**: Email Service (`ACT-EXT-MAIL`)
- **Mã Interface Code**: `RegisterUseCase` (`execute(req: RegisterReq): Promise<AuthRes>`)
- **Điều kiện tiên quyết (Pre-conditions)**: Người dùng chưa đăng nhập.
- **Điều kiện sau thành công (Post-conditions)**:
  1. Bản ghi tài khoản (`Account`) được tạo và mã hóa mật khẩu an toàn (`BR-AUTH-02`).
  2. Hệ thống tự động khởi tạo hồ sơ người dùng ban đầu (`UserProfile` với tên mặc định, avatar placeholder).
  3. Trả về token xác thực và thông tin định danh người dùng.
- **Kích hoạt (Trigger)**: Guest điền biểu mẫu đăng ký và bấm "Đăng ký".

### Luồng sự kiện chính (Main Flow)

| Bước | Hành động của Actor (Actor Action) | Phản hồi của Hệ thống (System Response) |
| :---: | :--- | :--- |
| 1 | Guest nhập email, mật khẩu, xác nhận mật khẩu và tên hiển thị ban đầu. | Hệ thống tiếp nhận dữ liệu đăng ký. |
| 2 | - | Hệ thống kiểm tra tính hợp lệ của email và độ phức tạp mật khẩu (`BR-AUTH-02`). |
| 3 | - | Hệ thống kiểm tra tính duy nhất của email trong cơ sở dữ liệu (`BR-AUTH-01`). |
| 4 | - | Hệ thống mã hóa mật khẩu bằng thuật toán băm an toàn (Bcrypt/Argon2). |
| 5 | - | Hệ thống lưu tài khoản mới vào cơ sở dữ liệu. |
| 6 | - | **Hành vi hệ thống tự động**: Hệ thống kích hoạt ngầm quy trình tạo hồ sơ người dùng (`UserProfile`) liên kết với tài khoản vừa tạo. |
| 7 | - | Hệ thống sinh cặp JWT (Access Token 15m / Refresh Token 7d) và trả về thông tin đăng nhập thành công (`BR-AUTH-03`). |

### Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)

- **3a. Email đã tồn tại trong hệ thống**:
  - 3a1. Hệ thống phát hiện email trùng lặp.
  - 3a2. Trả về mã lỗi HTTP 409 Conflict: `"Email is already registered"` (`BR-AUTH-01`).
- **2a. Mật khẩu không thỏa mãn độ phức tạp**:
  - 2a1. Trả về mã lỗi HTTP 400 Bad Request: `"Password does not meet complexity requirements"` (`BR-AUTH-02`).

---

## 2. UC-VID-01: Tải lên video mới (Upload Video)

- **Mã Use Case**: `UC-VID-01`
- **Tên Use Case**: Tải lên video mới
- **Actor chính**: Creator (`ACT-CREATOR`)
- **Actor phụ**: Transcoder Worker (`ACT-SYS-TRANSCODER`), Storage Cluster (`ACT-EXT-STORAGE`)
- **Mã Interface Code**: `UploadVideoUseCase` (`execute(authorId: string, req: UploadVideoReq): Promise<VideoRes>`)
- **Điều kiện tiên quyết (Pre-conditions)**:
  1. Người dùng đã đăng nhập hệ thống với tài khoản hợp lệ (có `authorId`).
  2. Người dùng đã khởi tạo kênh cá nhân (Channel).
  3. Có ít nhất một Storage Node đang ở trạng thái `ACTIVE` và dung lượng khả dụng > 100MB.
- **Điều kiện sau thành công (Post-conditions)**:
  1. Bản ghi video được tạo trong cơ sở dữ liệu với trạng thái khởi tạo `UPLOADING`/`PROCESSING`.
  2. Tệp video gốc được lưu trữ an toàn trên Storage Node được định tuyến.
  3. Sự kiện `VideoUploadedEvent` được gửi vào message queue kích hoạt worker chuyển mã.
  4. Trả về đối tượng `VideoRes` cho Creator.
- **Kích hoạt (Trigger)**: Creator chọn tải lên tệp video từ giao diện Web Studio.

### Luồng sự kiện chính (Main Flow)

| Bước | Hành động của Actor (Actor Action) | Phản hồi của Hệ thống (System Response) |
| :---: | :--- | :--- |
| 1 | Creator chọn tệp video từ máy tính (dung lượng < 100MB) và nhập metadata (`videoTitle`, `videoDescription`, `thumbnail`, cấu hình `videoConfig` gồm `visibility`, `allowComments`, `scheduleAt`). | Hệ thống tiếp nhận luồng tải tệp, kiểm tra sơ bộ định dạng MIME và dung lượng (`BR-VID-01`, `BR-VID-02`). |
| 2 | Creator bấm "Xuất bản" (Publish) hoặc "Lưu nháp". | Hệ thống kiểm tra tính hợp lệ của DTO `UploadVideoReq` qua validation pipe (`BR-VID-03`). |
| 3 | - | Hệ thống định tuyến và ghi tệp video vào Storage Node khả dụng được lựa chọn từ pool (`BR-ADM-03`). |
| 4 | - | Hệ thống khởi tạo entity `Video` với trạng thái ban đầu, liên kết với `authorId` và lưu vào Database (`BR-VID-04`). |
| 5 | - | Hệ thống phát sinh sự kiện `VideoUploadedEvent` gửi tới Message Queue (BullMQ/RabbitMQ/Redis Stream) kèm `videoId` và đường dẫn file nguồn. |
| 6 | - | Hệ thống phản hồi mã HTTP 201 Created cùng dữ liệu `VideoRes` bao gồm `videoId`, `title`, `views = 0`, `config`. |

### Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)

- **1a. Tệp video vượt quá dung lượng cho phép (> 100MB)**:
  - 1a1. Hệ thống ngắt luồng tải lên tại tầng gateway/interceptor.
  - 1a2. Trả về mã lỗi HTTP 413 Payload Too Large: `"File size exceeds maximum limit of 100MB"` (`BR-VID-01`).
- **1b. Định dạng tệp không được hỗ trợ**:
  - 1b1. Kiểm tra magic bytes phát hiện định dạng ngoài danh mục MP4, MKV, MOV, AVI, WEBM.
  - 1b2. Trả về mã lỗi HTTP 400 Bad Request: `"Unsupported video format"` (`BR-VID-02`).
- **3a. Toàn bộ Storage Nodes bị đầy hoặc không khả dụng**:
  - 3a1. Không có node `ACTIVE` nào đủ dung lượng trống.
  - 3a2. Trả về mã lỗi HTTP 507 Insufficient Storage: `"No available storage node to accept upload"` (`BR-ADM-03`).
- **4a. Chế độ hiển thị SCHEDULED nhưng thời gian hẹn giờ trong quá khứ**:
  - 4a1. Phát hiện `visibility === SCHEDULED` và `scheduleAt <= now()`.
  - 4a2. Trả về mã lỗi HTTP 400 Bad Request: `"Scheduled time must be in the future"` (`BR-VID-05`).

---

## 3. UC-VID-02: Xem video (HLS Playback)

- **Mã Use Case**: `UC-VID-02`
- **Tên Use Case**: Xem video (HLS Playback)
- **Actor chính**: Guest (`ACT-GUEST`), User / Viewer (`ACT-USER`)
- **Actor phụ**: Storage Cluster (`ACT-EXT-STORAGE`)
- **Mã Interface Code**: `WatchVideoUseCase` (`execute(videoId: string, userId?: string | null): Promise<WatchVideoRes>`)
- **Điều kiện tiên quyết (Pre-conditions)**: Video tồn tại trong hệ thống và đã chuyển mã hoàn tất (`READY`).
- **Điều kiện sau thành công (Post-conditions)**:
  1. Trả về `WatchVideoRes` chứa metadata, URL luồng phát HLS (master `.m3u8`).
  2. Ghi nhận lượt xem hợp lệ (chống spam view count `BR-VID-09`).
  3. Nếu người xem đã đăng nhập (`userId` tồn tại), tự động ghi nhận lịch sử xem video (Watch History `BR-VID-10`).
- **Kích hoạt (Trigger)**: Người dùng truy cập đường dẫn xem video (`/watch?v={videoId}`).

### Luồng sự kiện chính (Main Flow)

| Bước | Hành động của Actor (Actor Action) | Phản hồi của Hệ thống (System Response) |
| :---: | :--- | :--- |
| 1 | Người dùng truy cập trang phát video với tham số `videoId`. | Hệ thống trích xuất `videoId` và thông tin nhận diện người dùng (`userId` nếu có token xác thực). |
| 2 | - | Hệ thống truy vấn thông tin video từ Database hoặc Cache (`BR-VID-06`). |
| 3 | - | Hệ thống kiểm tra quyền truy cập của người xem dựa trên chế độ riêng tư của video (`BR-VID-07`). |
| 4 | - | Hệ thống lấy URL luồng phát HLS tương ứng từ Storage Node đang lưu trữ (`BR-VID-08`). |
| 5 | - | Hệ thống tăng lượt xem của video (tăng trực tiếp hoặc qua message queue) (`BR-VID-09`). |
| 6 | - | Nếu `userId` khác rỗng, hệ thống lưu bản ghi lịch sử xem vào cơ sở dữ liệu (`BR-VID-10`). |
| 7 | - | Trả về đối tượng `WatchVideoRes` gồm `videoId`, `title`, `description`, `thumbnail`, `videoFile` (URL m3u8), `views`, `likesCount`, `sharesCount`. |

### Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)

- **2a. Không tìm thấy video (`videoId` không tồn tại hoặc đã bị xóa mềm)**:
  - 2a1. Trả về mã lỗi HTTP 404 Not Found: `"Video not found or has been deleted"` (`BR-VID-06`).
- **3a. Video ở chế độ PRIVATE và người xem không phải tác giả**:
  - 3a1. Phát hiện `video.visibility === PRIVATE` và `userId !== video.authorId`.
  - 3a2. Trả về mã lỗi HTTP 403 Forbidden: `"This video is private"` (`BR-VID-07`).
- **3b. Video ở chế độ SCHEDULED và chưa đến giờ phát hành**:
  - 3b1. Phát hiện `video.visibility === SCHEDULED` và `now() < video.scheduleAt` và `userId !== video.authorId`.
  - 3b2. Trả về mã lỗi HTTP 403 Forbidden: `"This video has not been published yet"` (`BR-VID-07`).
- **3c. Video đang bị Staff khóa do vi phạm (Status = BANNED)**:
  - 3c1. Phát hiện trạng thái video là `BANNED`.
  - 3c2. Trả về mã lỗi HTTP 403 Forbidden: `"This video has been taken down due to policy violation"` (`BR-MOD-01`).
- **4a. Video chưa hoàn thành chuyển mã (Status = PROCESSING)**:
  - 4a1. Trả về mã lỗi HTTP 409 Conflict: `"Video is currently being processed"` (`BR-TRC-04`).

---

## 4. UC-VID-03: Cập nhật thông tin video (Update Video Metadata & Settings)

- **Mã Use Case**: `UC-VID-03`
- **Tên Use Case**: Cập nhật thông tin video
- **Actor chính**: Creator (`ACT-CREATOR`)
- **Mã Interface Code**: `UpdateVideoUseCase` (`execute(authorId: string, videoId: string, req: UpdateVideoReq): Promise<VideoRes>`)
- **Điều kiện tiên quyết (Pre-conditions)**:
  1. Creator đã đăng nhập và là chủ sở hữu hợp pháp của video (`video.authorId === authorId`).
  2. Video tồn tại và chưa bị xóa vĩnh viễn.
- **Điều kiện sau thành công (Post-conditions)**:
  1. Các trường thông tin (tiêu đề, mô tả, thumbnail, visibility, allowComments, scheduleAt) được cập nhật vào cơ sở dữ liệu.
  2. Cache liên quan tới video được làm mới (invalidation).
  3. Trả về đối tượng `VideoRes` với thông tin cập nhật mới nhất.
- **Kích hoạt (Trigger)**: Creator chỉnh sửa video trong Creator Studio và bấm "Lưu thay đổi".

### Luồng sự kiện chính (Main Flow)

| Bước | Hành động của Actor (Actor Action) | Phản hồi của Hệ thống (System Response) |
| :---: | :--- | :--- |
| 1 | Creator truy cập trang chỉnh sửa video, nhập các trường cần cập nhật: `title`, `description`, `thumbnail`, `visibility` (PUBLIC, PRIVATE, UNLISTED, SCHEDULED), `allowComments` (true/false), `scheduleAt` (nếu có). | Hệ thống tiếp nhận yêu cầu cập nhật kèm `videoId` và DTO `UpdateVideoReq`. |
| 2 | - | Hệ thống kiểm tra quy tắc ít nhất một trường dữ liệu được cung cấp (`@AtLeastNonEmpty(1)`). |
| 3 | - | Hệ thống truy vấn bản ghi video theo `videoId`. Nếu không tìm thấy, báo lỗi (`BR-VID-06`). |
| 4 | - | Hệ thống kiểm tra quyền sở hữu (Ownership Guard): xác minh `authorId` của người gọi phải trùng khớp với `video.authorId` (`BR-VID-04`). |
| 5 | - | Hệ thống kiểm tra tính hợp lệ logic của chế độ hiển thị: nếu `visibility === SCHEDULED`, trường `scheduleAt` bắt buộc phải có và phải nằm trong tương lai; nếu `visibility !== SCHEDULED` mà có `scheduleAt` thì loại bỏ hoặc báo lỗi (`BR-VID-05`). |
| 6 | - | Hệ thống lưu các thay đổi vào cơ sở dữ liệu, cập nhật mốc thời gian `updatedAt`. |
| 7 | - | Trả về mã HTTP 200 OK cùng dữ liệu `VideoRes` đã cập nhật. |

### Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)

- **2a. Không có trường dữ liệu nào được cung cấp để cập nhật**:
  - 2a1. Trả về mã lỗi HTTP 400 Bad Request: `"At least one field must be provided for update"`.
- **3a. Video không tồn tại trong hệ thống**:
  - 3a1. Trả về mã lỗi HTTP 404 Not Found: `"Video not found"`.
- **4a. Người dùng không phải là chủ sở hữu video**:
  - 4a1. Phát hiện `video.authorId !== authorId`.
  - 4a2. Trả về mã lỗi HTTP 403 Forbidden: `"You do not have permission to modify this video"` (`BR-VID-04`).
- **5a. Cấu hình SCHEDULED nhưng thiếu hoặc sai ngày hẹn giờ**:
  - 5a1. Trả về mã lỗi HTTP 400 Bad Request: `"Scheduled time is required and must be in the future when visibility is SCHEDULED"` (`BR-VID-05`).

---

## 5. UC-TRC-01 & UC-TRC-02: Quy trình Chuyển mã Video (Transcoding Pipeline)

- **Mã Use Case**: `UC-TRC-01` (Nhận Job & Phân tích) & `UC-TRC-02` (Chuyển mã HLS đa biến thể)
- **Tên Use Case**: Quy trình Chuyển mã Video Thích ứng Đa biến thể
- **Actor chính**: Transcoder Worker (`ACT-SYS-TRANSCODER`)
- **Actor phụ**: Storage Cluster (`ACT-EXT-STORAGE`)
- **Mã Interface Code**: `VideoTranscodeContract` (`probe`, `validate`, `generateThumbnail`, `generateStoryboard`, `transcodeHls`, `compress`)
- **Điều kiện tiên quyết (Pre-conditions)**:
  1. Nhận được sự kiện `VideoUploadedEvent` từ Message Queue.
  2. Tệp video nguồn đã được tải về phân vùng xử lý tạm thời của worker.
- **Điều kiện sau thành công (Post-conditions)**:
  1. Tạo thành công thumbnail mặc định và storyboard preview (WebVTT + sprites).
  2. Tạo thành công cấu trúc HLS đa phân giải gồm các profile (từ 144p tới tối đa 2K 60fps tùy theo nguồn, không upscale `BR-TRC-02`).
  3. Tệp master playlist `master.m3u8` và các thư mục phân đoạn được tải lên Storage Node.
  4. Trạng thái video được cập nhật thành `READY`.
- **Kích hoạt (Trigger)**: Worker tiêu thụ job chuyển mã từ queue.

### Luồng sự kiện chính (Main Flow)

| Bước | Hành động của Actor (Actor Action) | Phản hồi của Hệ thống (System Response) |
| :---: | :--- | :--- |
| 1 | Transcoder Worker nhận thông tin job chứa đường dẫn tệp nguồn. | Worker gọi phương thức `validate(filePath)` và `probe(filePath)` để kiểm tra tính toàn vẹn và trích xuất `VideoMetadata` (duration, width, height, fps, bitrate, codecs) (`BR-TRC-01`). |
| 2 | - | Dựa trên độ phân giải gốc của video, worker sinh danh sách các rendition phù hợp (144p, 360p, 480p, 720p, 1080p, 2K @60fps) không upscale vượt quá chất lượng gốc (`BR-TRC-02`). |
| 3 | - | Worker gọi `generateThumbnail` để trích xuất khung hình tiêu biểu làm thumbnail nếu Creator chưa cung cấp (`BR-TRC-03`). |
| 4 | - | Worker gọi `generateStoryboard` để sinh WebVTT mapping và ảnh sprite sheet phục vụ tính năng tua video xem trước trên thanh timeline. |
| 5 | - | Worker gọi `transcodeHls(inputPath, outputDir, opt)` chạy FFmpeg đóng gói video thành các phân đoạn `.ts` (segment 4s-6s) và các file playlist `.m3u8` nhánh kèm `master.m3u8` (`BR-TRC-04`). |
| 6 | - | Worker tải toàn bộ thư mục xuất bản HLS lên Storage Node được chỉ định thông qua Storage Client (`BR-TRC-05`). |
| 7 | - | Worker phát sự kiện `VideoTranscodeCompletedEvent` để Backend API cập nhật trạng thái video sang `READY` và gửi thông báo cho Creator. |

### Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)

- **1a. Tệp video bị hỏng (corrupted) hoặc FFmpeg không đọc được**:
  - 1a1. Worker đánh dấu job thất bại, chuyển trạng thái video sang `FAILED` kèm lý do lỗi (`BR-TRC-01`).
- **5a. Tiến trình FFmpeg transcode bị lỗi giữa chừng**:
  - 5a1. Nếu `retryCount < 3`, đẩy lại job vào hàng đợi với exponential backoff (`BR-TRC-06`).
  - 5a2. Nếu `retryCount >= 3`, chuyển trạng thái video sang `FAILED`, đưa vào Dead Letter Queue (DLQ).
- **6a. Tải tệp phân đoạn lên Storage Node thất bại**:
  - 6a1. Worker thử ghi lại vào node dự phòng trong pool lưu trữ.

---

## 6. UC-INT-02: Tạo bình luận mới (Create Comment)

- **Mã Use Case**: `UC-INT-02`
- **Tên Use Case**: Tạo bình luận mới
- **Actor chính**: User / Viewer (`ACT-USER`)
- **Mã Interface Code**: `CreateCommentUseCase` (`execute(userId: string, dto: CreateCommentReqDto): Promise<CommentResDto>`)
- **Điều kiện tiên quyết (Pre-conditions)**:
  1. Người dùng đã đăng nhập hệ thống (`userId` hợp lệ).
  2. Video tồn tại và đang ở trạng thái cho phép bình luận (`allowComments === true`).
  3. Người dùng không bị tác giả video hoặc hệ thống đưa vào danh sách chặn (Block).
- **Điều kiện sau thành công (Post-conditions)**:
  1. Bản ghi bình luận mới được lưu vào cơ sở dữ liệu.
  2. Số lượng bình luận của video được cập nhật (+1).
  3. Trả về thông tin chi tiết bình luận cho người dùng.
- **Kích hoạt (Trigger)**: Người dùng nhập nội dung và bấm gửi bình luận.

### Luồng sự kiện chính (Main Flow)

| Bước | Hành động của Actor (Actor Action) | Phản hồi của Hệ thống (System Response) |
| :---: | :--- | :--- |
| 1 | Người dùng nhập nội dung bình luận (tối đa 2000 ký tự) dưới video hoặc dưới một bình luận cha (`parentId`). | Hệ thống nhận yêu cầu chứa `videoId`, `content`, `parentId` (tùy chọn) trong DTO `CreateCommentReqDto`. |
| 2 | - | Hệ thống kiểm tra tính hợp lệ của dữ liệu đầu vào: độ dài ký tự từ 1 đến 2000 (`BR-INT-01`). |
| 3 | - | Hệ thống kiểm tra trạng thái video: video tồn tại và cấu hình `allowComments === true` (`BR-INT-02`). |
| 4 | - | Hệ thống kiểm tra quan hệ chặn: người dùng không bị chủ kênh chặn tương tác (`BR-INT-03`). |
| 5 | - | Nếu có `parentId`, hệ thống kiểm tra bình luận cha phải tồn tại trên cùng video và không vượt quá 2 cấp độ sâu (`BR-INT-04`). |
| 6 | - | Hệ thống lưu bình luận vào cơ sở dữ liệu, tăng bộ đếm bình luận của video. |
| 7 | - | Trả về mã HTTP 201 Created cùng dữ liệu `CommentResDto`. |

### Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)

- **2a. Nội dung bình luận trống hoặc vượt quá 2000 ký tự**:
  - 2a1. Trả về mã lỗi HTTP 400 Bad Request: `"content must be between 1 and 2000 characters"` (`BR-INT-01`).
- **3a. Video đã bị tắt tính năng bình luận (`allowComments === false`)**:
  - 3a1. Trả về mã lỗi HTTP 403 Forbidden: `"Comments are disabled for this video"` (`BR-INT-02`).
- **4a. Người dùng bị tác giả video chặn tương tác**:
  - 4a1. Trả về mã lỗi HTTP 403 Forbidden: `"You are blocked from commenting by the video author"` (`BR-INT-03`).
- **5a. Bình luận cha không tồn tại hoặc bị xóa**:
  - 5a1. Trả về mã lỗi HTTP 404 Not Found: `"Parent comment not found"` (`BR-INT-04`).

---

## 7. UC-INT-04: Xóa bình luận (Delete Comment - Phân quyền 3 cấp)

- **Mã Use Case**: `UC-INT-04`
- **Tên Use Case**: Xóa bình luận
- **Actor chính**: User / Viewer (`ACT-USER`), Creator (`ACT-CREATOR`), Staff (`ACT-STAFF`), Admin (`ACT-ADMIN`)
- **Mã Interface Code**: `DeleteCommentUseCase` (`execute(actorId: string, role: Role, dto: DeleteCommentReqDto): Promise<void>`)
- **Điều kiện tiên quyết (Pre-conditions)**: Người dùng đã đăng nhập và bình luận cần xóa đang tồn tại.
- **Điều kiện sau thành công (Post-conditions)**:
  1. Bình luận được đánh dấu xóa mềm (`isDeleted = true` hoặc cập nhật trạng thái `DELETED`).
  2. Toàn bộ câu trả lời con (nếu có) bị ẩn hoặc gắn cờ theo logic phân cấp.
  3. Bộ đếm bình luận của video được cập nhật (-1).
- **Kích hoạt (Trigger)**: Actor chọn thao tác "Xóa bình luận" từ menu tùy chọn.

### Ma trận Phân quyền Xóa Bình luận (3-Tier RBAC & Ownership)

| Nhóm Actor | Thẩm quyền Xóa | Điều kiện Ràng buộc |
| :--- | :--- | :--- |
| **User (Tác giả)** | Chỉ được xóa bình luận do chính mình viết | `comment.authorId === actorId` |
| **Creator (Chủ kênh)** | Được xóa BẤT KỲ bình luận nào xuất hiện dưới video thuộc kênh mình quản lý | `video.authorId === actorId` |
| **Staff / Admin** | Được xóa BẤT KỲ bình luận nào trên toàn hệ thống (kiểm duyệt vi phạm) | `actor.role IN ['STAFF', 'ADMIN']` |

### Luồng sự kiện chính (Main Flow)

| Bước | Hành động của Actor (Actor Action) | Phản hồi của Hệ thống (System Response) |
| :---: | :--- | :--- |
| 1 | Actor bấm "Xóa bình luận" trên giao diện. | Hệ thống tiếp nhận `commentId` trong DTO `DeleteCommentReqDto`. |
| 2 | - | Hệ thống truy vấn bản ghi bình luận và video chứa bình luận đó (`BR-INT-05`). |
| 3 | - | **Kiểm tra phân quyền 3 cấp**: <br>1. Nếu `actor.role IN ['STAFF', 'ADMIN']` -> Cho phép xóa.<br>2. Nếu `video.authorId === actorId` (Creator của video) -> Cho phép xóa.<br>3. Nếu `comment.authorId === actorId` (Chính tác giả bình luận) -> Cho phép xóa.<br>4. Nếu không thỏa mãn bất kỳ điều kiện nào -> Từ chối (`BR-INT-05`). |
| 4 | - | Hệ thống thực hiện xóa mềm bình luận, cập nhật `deletedAt = now()`. |
| 5 | - | Hệ thống cập nhật giảm bộ đếm bình luận của video. |
| 6 | - | Trả về mã HTTP 204 No Content. |

### Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)

- **2a. Bình luận không tồn tại hoặc đã bị xóa trước đó**:
  - 2a1. Trả về mã lỗi HTTP 404 Not Found: `"Comment not found"`.
- **3a. Không đủ thẩm quyền xóa bình luận**:
  - 3a1. Actor không phải người viết, không phải chủ kênh video và không có vai trò Staff/Admin.
  - 3a2. Trả về mã lỗi HTTP 403 Forbidden: `"You do not have permission to delete this comment"` (`BR-INT-05`).

---

## 8. UC-INT-06 & UC-INT-07: Chặn & Bỏ chặn người dùng (Block / Unblock User)

- **Mã Use Case**: `UC-INT-06` (Chặn người dùng) & `UC-INT-07` (Bỏ chặn người dùng)
- **Tên Use Case**: Quản lý chặn và bỏ chặn tương tác người dùng
- **Actor chính**: User / Viewer (`ACT-USER`), Creator (`ACT-CREATOR`)
- **Mã Interface Code**: `BlockUserUseCase` (`execute(blockerId: string, dto: BlockUserReqDto): Promise<BlockStatusResDto>`)
- **Điều kiện tiên quyết (Pre-conditions)**: Người dùng đã đăng nhập hệ thống (`blockerId` hợp lệ).
- **Điều kiện sau thành công (Post-conditions)**:
  1. Trạng thái chặn giữa `blockerId` và `targetUserId` được lưu trữ hoặc đảo trạng thái (upsert/toggle).
  2. Người bị chặn mất toàn bộ quyền bình luận, phản hồi trên nội dung của người chặn (`BR-INT-03`).
  3. Trả về `BlockStatusResDto` chứa trạng thái `isBlocked` (true nếu chặn, false nếu bỏ chặn).
- **Kích hoạt (Trigger)**: Người dùng chọn "Chặn người dùng" hoặc "Bỏ chặn" trên trang cá nhân hoặc menu tương tác.

### Luồng sự kiện chính (Main Flow)

| Bước | Hành động của Actor (Actor Action) | Phản hồi của Hệ thống (System Response) |
| :---: | :--- | :--- |
| 1 | Actor bấm "Chặn" hoặc "Bỏ chặn" tài khoản mục tiêu (`targetUserId`). | Hệ thống tiếp nhận DTO `BlockUserReqDto` chứa `targetUserId`. |
| 2 | - | Hệ thống kiểm tra: Actor không được tự chặn chính mình (`blockerId !== targetUserId`). |
| 3 | - | Hệ thống kiểm tra tài khoản mục tiêu `targetUserId` phải tồn tại trong cơ sở dữ liệu. |
| 4 | - | Hệ thống truy vấn trạng thái chặn hiện tại: <br>- Nếu thực hiện UC-INT-06 (Chặn): Tạo bản ghi quan hệ chặn (`isBlocked = true`).<br>- Nếu thực hiện UC-INT-07 (Bỏ chặn): Xóa bản ghi quan hệ chặn hoặc cập nhật `isBlocked = false`. |
| 5 | - | Trả về mã HTTP 200 OK cùng dữ liệu `BlockStatusResDto` (`blockerId`, `blockedId`, `isBlocked`). |

### Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)

- **2a. Tự chặn chính mình (`blockerId === targetUserId`)**:
  - 2a1. Trả về mã lỗi HTTP 400 Bad Request: `"You cannot block yourself"`.
- **3a. Người dùng mục tiêu không tồn tại**:
  - 3a1. Trả về mã lỗi HTTP 404 Not Found: `"User not found"`.

---

## 9. UC-INT-05: Báo cáo vi phạm nội dung (Create Report)

- **Mã Use Case**: `UC-INT-05`
- **Tên Use Case**: Báo cáo vi phạm nội dung
- **Actor chính**: User / Viewer (`ACT-USER`), Guest (`ACT-GUEST`)
- **Mã Interface Code**: `CreateReportUseCase` (`execute(reporterId: string | null, dto: CreateReportReqDto): Promise<ReportSubmissionResDto>`)
- **Điều kiện tiên quyết (Pre-conditions)**: Đối tượng bị báo cáo (Video hoặc Comment) phải đang tồn tại trên hệ thống.
- **Điều kiện sau thành công (Post-conditions)**:
  1. Bản ghi báo cáo được tạo trong hàng đợi kiểm duyệt với trạng thái `PENDING`.
  2. Nếu đối tượng tích lũy đủ ngưỡng báo cáo vi phạm, tự động gắn cờ cảnh báo (`FLAGGED`) hoặc tạm ẩn nội dung (`BR-MOD-02`).
  3. Trả về mã xác nhận tiếp nhận báo cáo cho người gửi.
- **Kích hoạt (Trigger)**: Người dùng chọn chức năng "Báo cáo vi phạm" trên menu ngữ cảnh của video hoặc bình luận.

### Luồng sự kiện chính (Main Flow)

| Bước | Hành động của Actor (Actor Action) | Phản hồi của Hệ thống (System Response) |
| :---: | :--- | :--- |
| 1 | Người dùng chọn lý do vi phạm (`reason` thuộc enum `ReportReason`: Spam, Bạo lực, Khiêu dâm, Bản quyền...), nhập mô tả chi tiết (tùy chọn, tối đa 1000 ký tự) và bấm "Gửi báo cáo". | Hệ thống tiếp nhận DTO `CreateReportReqDto` (`targetType`, `targetId`, `reason`, `description`). |
| 2 | - | Hệ thống kiểm tra tính hợp lệ của DTO qua validation pipe (`BR-INT-06`). |
| 3 | - | Hệ thống kiểm tra sự tồn tại của đối tượng mục tiêu (`targetId`) trong cơ sở dữ liệu (`BR-INT-06`). |
| 4 | - | Hệ thống kiểm tra phòng chống spam báo cáo: cùng 1 `reporterId` không được báo cáo trùng 1 đối tượng quá 1 lần trong vòng 24 giờ (`BR-INT-07`). |
| 5 | - | Hệ thống lưu bản ghi báo cáo vào bảng kiểm duyệt với trạng thái `PENDING`. |
| 6 | - | Hệ thống kiểm tra ngưỡng cảnh báo tự động: nếu tổng số report hợp lệ của video trong ngày vượt ngưỡng N (mặc định 10 lượt), tự động chuyển video sang trạng thái gắn cờ cảnh báo (`FLAGGED`) để Staff ưu tiên kiểm tra (`BR-MOD-02`). |
| 7 | - | Trả về mã HTTP 201 Created cùng đối tượng `ReportSubmissionResDto` (chứa `reportId`, `status = 'PENDING'`, `message = 'Report submitted successfully'`). |

### Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)

- **2a. Lý do báo cáo hoặc kiểu mục tiêu không hợp lệ**:
  - 2a1. Trả về mã lỗi HTTP 400 Bad Request kèm thông báo lỗi cấu trúc.
- **3a. Mục tiêu báo cáo không tồn tại (`targetId` không tìm thấy)**:
  - 3a1. Trả về mã lỗi HTTP 404 Not Found: `"Report target not found"` (`BR-INT-06`).
- **4a. Người dùng gửi báo cáo lặp lại trong 24 giờ**:
  - 4a1. Trả về mã lỗi HTTP 429 Too Many Requests: `"You have already reported this content recently"` (`BR-INT-07`).

---

## 10. UC-ADM-01: Quản trị Storage Nodes (Manage Storage Nodes)

- **Mã Use Case**: `UC-ADM-01`
- **Tên Use Case**: Quản trị Node Lưu trữ (Thêm mới, Cập nhật, Xóa, Health Check)
- **Actor chính**: Admin (`ACT-ADMIN`)
- **Actor phụ**: Storage Cluster (`ACT-EXT-STORAGE`)
- **Mã Interface Code**: `StorageNodeAdminService` (`create`, `update`, `remove`, `list`, `healthCheck`)
- **Điều kiện tiên quyết (Pre-conditions)**: Người thực hiện có quyền Quản trị viên tối cao (`Role = ADMIN`).
- **Điều kiện sau thành công (Post-conditions)**:
  1. Node lưu trữ mới được kiểm tra kết nối (Probe), lưu vào database và đưa vào pool khả dụng.
  2. Hoặc cấu hình node được cập nhật, pool được làm mới.
  3. Hoặc node bị xóa an toàn sau khi không còn tệp dữ liệu hoạt động.
- **Kích hoạt (Trigger)**: Admin thao tác trên bảng điều khiển Quản trị Storage Nodes.

### Luồng sự kiện chính (Thêm mới Storage Node - Create)

| Bước | Hành động của Actor (Actor Action) | Phản hồi của Hệ thống (System Response) |
| :---: | :--- | :--- |
| 1 | Admin nhập thông tin node lưu trữ mới: endpoint URL, bucket name, access key, secret key, quota dung lượng tối đa, khu vực (region). | Hệ thống tiếp nhận DTO `CreateStorageNodeReq`. |
| 2 | - | Hệ thống kiểm tra cú pháp và tính hợp lệ của tham số (`BR-ADM-01`). |
| 3 | - | Hệ thống thực hiện Probe kết nối thực tế tới bucket của Storage Node để xác thực quyền đọc/ghi (`BR-ADM-02`). |
| 4 | - | Nếu Probe thành công, hệ thống lưu bản ghi node vào cơ sở dữ liệu với trạng thái mặc định `ACTIVE`. |
| 5 | - | Hệ thống làm mới danh sách pool storage trong bộ nhớ ứng dụng để sẵn sàng định tuyến upload. |
| 6 | - | Trả về mã HTTP 201 Created cùng dữ liệu chi tiết `StorageNodeRes`. |

### Luồng sự kiện xóa Node (Remove Flow & Deletion Policy)

| Bước | Hành động của Actor (Actor Action) | Phản hồi của Hệ thống (System Response) |
| :---: | :--- | :--- |
| 1 | Admin chọn một Storage Node và gửi yêu cầu xóa (`nodeId`). | Hệ thống kiểm tra chính sách xóa an toàn `storage-node-deletion.policy` (`BR-ADM-04`). |
| 2 | - | Hệ thống đếm số lượng video và đối tượng lưu trữ đang ở trạng thái sẵn sàng (`READY`) trên node này. |
| 3 | - | Nếu còn đối tượng tồn tại trên node, hệ thống từ chối xóa và yêu cầu di chuyển dữ liệu (drain node) trước. |
| 4 | - | Nếu node rỗng (0 objects hoạt động), hệ thống xóa bản ghi khỏi cơ sở dữ liệu và loại bỏ node khỏi pool. |
| 5 | - | Trả về mã HTTP 204 No Content. |

### Luồng rẽ nhánh & Ngoại lệ (Alternative & Exception Flows)

- **3a. Thao tác Probe kết nối tới bucket thất bại khi tạo node**:
  - 3a1. Trả về mã lỗi HTTP 422 Unprocessable Entity: `"Storage node probe failed: Unable to connect to bucket with provided credentials"` (`BR-ADM-02`).
- **4a. Yêu cầu xóa node nhưng node vẫn còn dữ liệu (Vi phạm Deletion Policy)**:
  - 4a1. Trả về mã lỗi HTTP 409 Conflict: `"Cannot delete storage node: Node contains active objects. Please drain or migrate data before deletion"` (`BR-ADM-04`).
