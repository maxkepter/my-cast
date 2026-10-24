import { UpdateChannelReqDto } from '../../dtos/req.dto';
import { ChannelDetailResDto } from '../../dtos/res.dto';

export interface ManageChannelUseCase {
  /**
   * Creator cập nhật thông tin kênh (tên, bio, avatar, banner, social links).
   *
   * @param channelId - ID của kênh cần cập nhật.
   * @param ownerId - ID của creator sở hữu kênh (xác thực quyền sở hữu).
   * @param dto - Dữ liệu cập nhật.
   * @returns Chi tiết channel sau khi cập nhật.
   */
  execute(
    channelId: string,
    ownerId: string,
    dto: UpdateChannelReqDto,
  ): Promise<ChannelDetailResDto> | ChannelDetailResDto;
}
