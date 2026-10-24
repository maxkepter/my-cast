import { ChannelDetailResDto } from '../../dtos/res.dto';

export interface ViewChannelUseCase {
  /**
   * Xem thông tin chi tiết một channel qua `channelId` hoặc `handle`.
   *
   * @param identifier - channelId (UUID) hoặc handle (@name) của kênh.
   * @param viewerId - ID của người đang xem (optional, dùng để xác định isFollowedByViewer).
   * @returns Chi tiết channel metadata, stats và trạng thái follow.
   */
  execute(
    identifier: string,
    viewerId?: string | null,
  ): Promise<ChannelDetailResDto> | ChannelDetailResDto;
}
