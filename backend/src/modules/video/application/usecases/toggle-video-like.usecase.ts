import { ToggleVideoLikeReqDto } from '../../dtos/req.dto';
import { VideoLikeResDto } from '../../dtos/res.dto';

export interface ToggleVideoLikeUseCase {
  execute(
    userId: string,
    req: ToggleVideoLikeReqDto,
  ): Promise<VideoLikeResDto> | VideoLikeResDto;
}
