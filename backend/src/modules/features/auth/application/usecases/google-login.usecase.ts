import { GoogleLoginReq } from '../../dtos/req.dto';
import { AuthRes } from '../../dtos/res.dto';

export interface GoogleLoginUseCase {
  googleLogin(req: GoogleLoginReq): Promise<AuthRes>;
}
