import { Role } from '../../user/domain/enums/role.enum';

export class JwtRes {
  sub: string;
  role: Role;
}
