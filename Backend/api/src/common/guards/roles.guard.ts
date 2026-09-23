import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { isUuid } from '../utils/crypto.util';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.userId) {
      throw new ForbiddenException('Statutory authentication required: user session identity is missing');
    }

    let userRoleCodes: string[] = Array.isArray(user.roles) ? [...user.roles] : [];
    if (user.role && !userRoleCodes.includes(user.role)) {
      userRoleCodes.push(user.role);
    }

    if (userRoleCodes.length === 0) {
      if (isUuid(user.userId)) {
        const dbUserRoles = await this.prisma.user_roles.findMany({
          where: { user_id: user.userId },
          select: { role_code: true },
        });
        userRoleCodes = dbUserRoles.map((ur) => ur.role_code);
      } else {
        const dbUser = await this.prisma.users.findFirst({
          where: { OR: [{ login_name: user.userId }, { email: user.userId }] },
          include: { user_roles: true },
        });
        if (dbUser && dbUser.user_roles.length > 0) {
          userRoleCodes = dbUser.user_roles.map((ur) => ur.role_code);
        }
      }
    }

    // Global administrative role
    if (userRoleCodes.includes('SYSTEM_ADMIN')) {
      return true;
    }

    // Role equivalences / aliases across governance hierarchy
    const expandedUserRoles = new Set<string>(userRoleCodes);
    if (userRoleCodes.includes('CENTRAL_MINISTRY')) {
      expandedUserRoles.add('MINISTRY_OFFICIAL');
    }
    if (userRoleCodes.includes('STATE_AUTHORITY')) {
      expandedUserRoles.add('STATE_ADMIN');
    }

    const hasRole = requiredRoles.some((reqRole) => expandedUserRoles.has(reqRole));
    if (!hasRole) {
      throw new ForbiddenException(
        `Statutory Access Restricted: Your role [${userRoleCodes.join(', ')}] is not authorized to access this executive command. Required: [${requiredRoles.join(', ')}]`
      );
    }

    return true;
  }
}
