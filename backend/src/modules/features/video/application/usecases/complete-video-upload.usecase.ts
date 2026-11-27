import { CompleteVideoUploadReq } from '../../dtos/req.dto';
import { CompleteVideoUploadRes } from '../../dtos/res.dto';

export interface CompleteVideoUploadUseCase {
  execute(
    authorId: string,
    req: CompleteVideoUploadReq,
  ): Promise<CompleteVideoUploadRes>;
}
