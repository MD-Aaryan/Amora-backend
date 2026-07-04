import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleName } from '../enums/role.enum';

@Injectable()
export class ActiveRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.activeRole) {
      throw new ForbiddenException({
        success: false,
        message: 'Access denied: active role check failed',
        error: {
          code: 'PERMISSION_DENIED',
        },
      });
    }

    const hasActiveRole = requiredRoles.includes(user.activeRole);
    if (!hasActiveRole) {
      throw new ForbiddenException({
        success: false,
        message: `Access denied: active role must be one of: ${requiredRoles.join(', ')}`,
        error: {
          code: 'PERMISSION_DENIED',
        },
      });
    }

    return true;
  }
}
