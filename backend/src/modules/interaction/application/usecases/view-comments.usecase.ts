import { CommentItemResDto } from '../../dtos/res.dto';

export interface ViewCommentsUseCase {
  /**
   * Xem danh sách bình luận công khai dưới một video.
   *
   * @param videoId - ID video cần lấy bình luận.
   * @param parentId - ID bình luận cha (nếu muốn lấy reply của comment đó; null/undefined để lấy top-level).
   * @param page - Số trang (bắt đầu từ 1).
   * @param limit - Số lượng item mỗi trang.
   * @returns Danh sách CommentItemResDto.
   */
  execute(
    videoId: string,
    parentId?: string | null,
    page?: number,
    limit?: number,
  ): Promise<CommentItemResDto[]> | CommentItemResDto[];
}
