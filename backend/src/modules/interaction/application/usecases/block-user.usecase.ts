import { BlockUserReqDto } from '../../dtos/req.dto';
import { BlockStatusResDto } from '../../dtos/res.dto';

export interface BlockUserUseCase {
  /**
   * Chặn người dùng khác nhằm ngăn tương tác, phản hồi hoặc gửi tin.
   *
   * @param blockerId - ID người yêu cầu chặn.
   * @param dto - Thông tin người bị chặn.
   * @returns BlockStatusResDto.
   */
  execute(
    blockerId: string,
    dto: BlockUserReqDto,
  ): Promise<BlockStatusResDto> | BlockStatusResDto;
}
