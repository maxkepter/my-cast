import { ShareVideoReqDto } from '../../dtos/req.dto';
import { ShareVideoResDto } from '../../dtos/res.dto';

export interface ShareVideoUseCase {
  execute(
    req: ShareVideoReqDto,
    userId?: string | null,
  ): Promise<ShareVideoResDto> | ShareVideoResDto;
}
