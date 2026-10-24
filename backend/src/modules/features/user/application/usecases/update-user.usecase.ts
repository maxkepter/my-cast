import { UserRes } from '../../dtos/dto.res';
import { UserUpdateReq } from '../../dtos/req.dto';
import { Role } from '../../domain/enums/role.enum';

export interface UpdateUserUsecase {
  updateUser(userId: string, req: UserUpdateReq): Promise<UserRes> | UserRes;

  updateRole(userId: string, newRole: Role): Promise<UserRes> | UserRes;

  deactivateUser(userId: string): Promise<UserRes> | UserRes;
}

