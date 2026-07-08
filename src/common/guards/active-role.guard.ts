import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleName } from '../enums/role.enum';

@Injectable()
export class ActiveRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.activeRole) {
      throw new ForbiddenException({
        success: false,
        message: 'Access denied: no active role set',
        error: { code: 'ACTIVE_ROLE_REQUIRED' },
      });
    }

    if (!requiredRoles.includes(user.activeRole)) {
      throw new ForbiddenException({
        success: false,
        message: `Access denied: active role must be one of ${requiredRoles.join(', ')}`,
        error: { code: 'ACTIVE_ROLE_MISMATCH' },
      });
    }

    return true;
  }
}
