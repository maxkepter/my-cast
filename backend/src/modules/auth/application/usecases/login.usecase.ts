import { LoginReq } from '../../dtos/req.dto';
import { AuthRes } from '../../dtos/res.dto';

export interface LoginUseCase {
  login(req: LoginReq): Promise<AuthRes>;
}
