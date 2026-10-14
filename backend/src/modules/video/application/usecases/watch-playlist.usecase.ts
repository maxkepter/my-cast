import { Page, PageReq } from '../../../../common/dtos/page.dto';
import { PlaylistRes } from '../../dtos/res.dto';

export interface WatchPlaylistUseCase {
  /**
   * Xem và phát danh sách phát theo luồng chuẩn YouTube.
   *
   * Quy trình nghiệp vụ:
   * 1. Kiểm tra tồn tại danh sách phát theo `playlistId`.
   * 2. Kiểm tra quyền truy cập danh sách phát theo visibility:
   *    - PUBLIC / UNLISTED: cho phép mọi người xem (kể cả guest).
   *    - PRIVATE: chỉ cho phép chủ sở hữu danh sách phát (`userId === authorId`).
   * 3. Lọc danh sách video: loại bỏ video đã xoá hoặc video PRIVATE của người khác.
   * 4. Trả về thông tin danh sách phát kèm thứ tự các video phát tiếp theo.
   *
   * @param playlistId - Định danh danh sách phát cần xem.
   * @param userId - Định danh người xem (null/undefined nếu là guest).
   * @returns Thông tin danh sách phát và danh sách video hiển thị.
   * @throws NotFoundException khi danh sách phát không tồn tại.
   * @throws ForbiddenException khi danh sách phát ở chế độ riêng tư.
   */
  execute(
    playlistId: string,
    userId?: string | null,
  ): Promise<PlaylistRes> | PlaylistRes;

  execute(
    playlistId: string,
    userId: string | null | undefined,
    pageReq: PageReq,
  ): Promise<Page<PlaylistRes>> | Page<PlaylistRes>;

  /**
   * Lấy danh sách phát theo kênh/tác giả (tương tự tab Playlist trên kênh YouTube).
   *
   * Quy trình nghiệp vụ:
   * 1. Truy vấn các danh sách phát thuộc về `authorId`.
   * 2. Lọc theo quyền xem:
   *    - Nếu `userId === authorId`: hiển thị tất cả (PUBLIC, UNLISTED, PRIVATE).
   *    - Nếu guest hoặc người dùng khác (`userId !== authorId`): chỉ hiển thị PUBLIC.
   *
   * @param authorId - Định danh kênh/tác giả sở hữu playlist.
   * @param userId - Định danh người đang xem (để phân quyền xem playlist riêng tư).
   * @returns Mảng danh sách phát hợp lệ với quyền của người xem.
   */
  getPlayListByAuthorId(
    authorId: string,
    userId?: string | null,
  ): Promise<PlaylistRes[]> | PlaylistRes[];

  getPlayListByAuthorId(
    authorId: string,
    userId: string | null | undefined,
    pageReq: PageReq,
  ): Promise<Page<PlaylistRes>> | Page<PlaylistRes>;
}
