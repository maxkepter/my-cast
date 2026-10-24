import { WatchVideoRes } from '../../dtos/res.dto';

export interface WatchVideoUseCase {
  /**
   * Xem video theo luồng chuẩn YouTube (metadata + playback stream).
   *
   * Quy trình nghiệp vụ:
   * 1. Kiểm tra tồn tại video theo `videoId`.
   * 2. Kiểm tra quyền truy cập theo visibility:
   *    - PUBLIC / UNLISTED: cho phép mọi người xem (kể cả guest).
   *    - PRIVATE: chỉ cho phép tác giả (`userId === authorId`).
   *    - SCHEDULED: chỉ cho phép xem khi đã tới giờ phát hành hoặc là tác giả.
   * 3. Lấy nguồn phát video (HLS stream / file media).
   * 4. Tăng lượt xem (view count) / bắn sự kiện view analytics.
   * 5. Lưu lịch sử xem (watch history) nếu có `userId`.
   *
   * @param videoId - Định danh video cần xem.
   * @param userId - Định danh người xem (null/undefined nếu là guest).
   * @returns Metadata video, URL phát media và thông tin hiển thị.
   * @throws NotFoundException khi không tìm thấy video hoặc video đã bị xoá.
   * @throws ForbiddenException khi video ở chế độ riêng tư hoặc chưa phát hành.
   */
  execute(
    videoId: string,
    userId?: string | null,
  ): Promise<WatchVideoRes> | WatchVideoRes;
}
