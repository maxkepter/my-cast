import { UpdateVideoReq } from '../../dtos/req.dto';
import { VideoRes } from '../../dtos/res.dto';

export interface UpdateVideoUseCase {
  /**
   *
   * Cập nhật thông tin video
   *
   * 1. Kiểm tra quyền sở hữu video: chỉ chủ sở hữu video mới có quyền cập nhật thông tin.
   * 2. Cập nhật các trường thông tin video theo yêu cầu:
   *   - visibility: PUBLIC, PRIVATE, UNLISTED, SCHEDULED
   *  - allowComments: true/false
   *  - scheduleAt: ngày giờ lên lịch phát video (chỉ áp dụng khi visibility = SCHEDULED), nếu visibility != SCHEDULED thì báo lỗi.
   * - title: tiêu đề video
   * - description: mô tả video
   * 3. Trả về thông tin video đã được cập nhật.
   *
   * @param authorId - Định danh người sở hữu video (chủ sở hữu).
   * @param videoId - Định danh video cần cập nhật.
   * @param req - Dữ liệu yêu cầu cập nhật video.
   * @returns Thông tin video đã được cập nhật.
   * @throws NotFoundException khi video không tồn tại.
   * @throws ForbiddenException khi người dùng không phải là chủ sở hữu video.
   * @throws BadRequestException khi dữ liệu yêu cầu không hợp lệ (ví dụ: visibility = SCHEDULED nhưng scheduleAt không được cung cấp).
   */
  execute(
    authorId: string,
    videoId: string,
    req: UpdateVideoReq,
  ): Promise<VideoRes> | VideoRes;
}
