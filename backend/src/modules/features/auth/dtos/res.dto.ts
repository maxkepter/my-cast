import { Role } from '../../user/domain/enums/role.enum';
import { UserRes } from '../../user/dtos/dto.res';

export class JwtRes {
  sub: string;
  role: Role;
}

export class TokenRes {
  accessToken: string;
  refreshToken: string;
}

export class AuthRes extends TokenRes {
  user: UserRes;
}
