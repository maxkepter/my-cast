import { CreatePlaylistReq } from '../../dtos/req.dto';
import { PlaylistRes } from '../../dtos/res.dto';

export interface CreatePlaylistUseCase {
  /**
   *
   * Tao danh sách phát mới cho người dùng.
   *
   * Quy trình nghiệp vụ:
   * 1. Kiểm tra dữ liệu đầu vào hợp lệ (tên danh sách phát không rỗng, quyền truy cập hợp lệ).
   * 2. Kiểm tra trùng tên danh sách phát cho cùng tác giả.
   * 3. Tạo danh sách phát mới với thông tin từ `req` và `authorId`.
   * 4. Lưu danh sách phát vào cơ sở dữ liệu.
   *
   * @param authorId - Định danh người tạo danh sách phát.
   * @param req - Thông tin yêu cầu tạo danh sách phát (tên, mô tả, quyền truy cập).
   * @returns Thông tin danh sách phát vừa tạo.
   * @throws BadRequestException khi dữ liệu đầu vào không hợp lệ.
   * @throws ConflictException khi tên danh sách phát đã tồn tại cho cùng tác giả.
   */
  execute(
    authorId: string,
    req: CreatePlaylistReq,
  ): Promise<PlaylistRes> | PlaylistRes;
}

export type CreatePLaylistUsecase = CreatePlaylistUseCase;
