import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRes } from '../../../user/dtos/dto.res';

export const CurrentUser = createParamDecorator(
  (data: keyof UserRes | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserRes;
    return data ? user?.[data] : user;
  },
);
