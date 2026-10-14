import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PageReq } from '../../../common/dtos/page.dto';
import { AtLeastNonEmpty } from '../../../common/validators/at-least-non-empty.validator';
import { Role } from '../domain/enums/role.enum';

export class UserCreateReq {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

@AtLeastNonEmpty(1)
export class UserUpdateReq {
  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class UserUpdateRoleReq {
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export class UserFilterReq extends PageReq {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

