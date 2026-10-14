import { FollowStatusResDto } from '../../dtos/res.dto';

export interface FollowCreatorUseCase {
  /**
   * User nhấn theo dõi creator / kênh.
   *
   * @param channelId - ID của kênh cần theo dõi.
   * @param followerId - ID của user theo dõi.
   * @returns Trạng thái follow và số lượng follower mới.
   */
  execute(
    channelId: string,
    followerId: string,
  ): Promise<FollowStatusResDto> | FollowStatusResDto;
}
