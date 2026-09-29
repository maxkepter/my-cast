import { UserRes } from '../../../user/dtos/dto.res';
import { RegisterReq, VerifyEmailReq } from '../../dtos/req.dto';
import { RegisterPendingRes } from '../../dtos/res.dto';

export interface RegisterUseCase {
  register(req: RegisterReq): Promise<RegisterPendingRes>;
  verifyEmail(req: VerifyEmailReq): Promise<UserRes>;
}
