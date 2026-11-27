import { InitiateVideoUploadReq } from '../../dtos/req.dto';
import { InitiateVideoUploadRes } from '../../dtos/res.dto';

export interface UploadVideoUseCase {
  execute(
    authorId: string,
    req: InitiateVideoUploadReq,
  ): Promise<InitiateVideoUploadRes>;
}
