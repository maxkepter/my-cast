import { VideoLikeResDto } from '../../dtos/res.dto';

export interface GetVideoReactionStatusUseCase {
  execute(
    videoId: string,
    userId?: string | null,
  ): Promise<VideoLikeResDto> | VideoLikeResDto;
}
