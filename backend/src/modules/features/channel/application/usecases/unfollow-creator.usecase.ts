import { FollowStatusResDto } from '../../dtos/res.dto';

export interface UnfollowCreatorUseCase {
  /**
   * User hủy theo dõi kênh.
   *
   * @param channelId - ID của kênh cần hủy theo dõi.
   * @param followerId - ID của user hủy theo dõi.
   * @returns Trạng thái follow và số lượng follower mới.
   */
  execute(
    channelId: string,
    followerId: string,
  ): Promise<FollowStatusResDto> | FollowStatusResDto;
}
