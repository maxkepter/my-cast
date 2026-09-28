import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs/internal/Observable';
import { Role } from '../../../user/domain/enums/role.enum';
import { ROLES_KEY } from '../decorators/role.decorator';

export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required, allow access
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    return user && user.role && requiredRoles.includes(user.role);
  }
}
