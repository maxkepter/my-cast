import { Page } from '../../../../../common/dtos/page.dto';
import { UserRes } from '../../dtos/dto.res';
import { UserFilterReq } from '../../dtos/req.dto';

export interface GetUserUsecase {
  getUserById(userId: string): Promise<UserRes> | UserRes;

  getUser(req: UserFilterReq): Promise<Page<UserRes>> | Page<UserRes>;
}

