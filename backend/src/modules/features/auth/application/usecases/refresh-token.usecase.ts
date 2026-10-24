import { AuthRes } from '../../dtos/res.dto';

export interface RefreshTokenUseCase {
  refreshToken(token: string): Promise<AuthRes> | AuthRes;
}
