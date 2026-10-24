import { UploadVideoReq } from '../../dtos/req.dto';
import { VideoRes } from '../../dtos/res.dto';

export interface UploadVideoUseCase {
  execute(authorId: string, req: UploadVideoReq): Promise<VideoRes> | VideoRes;
}
