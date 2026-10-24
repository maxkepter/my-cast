import { UserRes } from '../../dtos/dto.res';
import { UserCreateReq } from '../../dtos/req.dto';

export interface UserCreatUsecase {
  createUser(req: UserCreateReq): Promise<UserRes> | UserRes;
}
