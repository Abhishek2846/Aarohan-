import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import {
  CHECK_JURISDICTION_KEY,
  JurisdictionCheckOptions,
} from '../decorators/jurisdiction.decorator';
import { isUuid } from '../utils/crypto.util';

@Injectable()
export class JurisdictionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<JurisdictionCheckOptions>(
      CHECK_JURISDICTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If endpoint has no jurisdiction scoping configured, permit
    if (!options) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // Unauthenticated requests handled by JwtAuthGuard
    if (!user || !user.userId) {
      return true;
    }

    const userRoles: string[] = Array.isArray(user.roles)
      ? [...user.roles]
      : user.role
      ? [user.role]
      : [];

    // National Level Executive Roles possess statutory jurisdiction across all states & districts
    if (
      userRoles.includes('SYSTEM_ADMIN') ||
      userRoles.includes('CENTRAL_MINISTRY') ||
      userRoles.includes('MINISTRY_OFFICIAL')
    ) {
      return true;
    }

    const paramName = options.param || 'id';
    const resourceId =
      req.params?.[paramName] ||
      req.body?.[options.bodyField || paramName] ||
      req.query?.[paramName];

    if (!resourceId || typeof resourceId !== 'string') {
      return true;
    }

    // Fetch user's assigned statutory jurisdictions
    let userJurisdictions: any[] = [];
    if (isUuid(user.userId)) {
      userJurisdictions = await this.prisma.user_jurisdictions.findMany({
        where: { user_id: user.userId },
        include: { jurisdictions: true },
      });
    } else if (user.userId) {
      const dbUser = await this.prisma.users.findFirst({
        where: { OR: [{ login_name: user.userId }, { email: user.userId }] },
        select: { user_id: true },
      });
      if (dbUser) {
        userJurisdictions = await this.prisma.user_jurisdictions.findMany({
          where: { user_id: dbUser.user_id },
          include: { jurisdictions: true },
        });
      }
    }

    const userJurisdictionIds = new Set(
      userJurisdictions.map((uj) => uj.jurisdiction_id),
    );

    if (options.resource === 'case') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourceId);
      const acqCase = await this.prisma.acquisition_cases.findFirst({
        where: isUuid
          ? { OR: [{ case_id: resourceId }, { case_number: resourceId }] }
          : { case_number: resourceId },
        select: {
          case_id: true,
          case_number: true,
          district_jurisdiction_id: true,
          state_jurisdiction_id: true,
        },
      });

      if (!acqCase) {
        return true; // Let controller handle 404
      }

      // If case has no specific administrative district or state bound yet, allow
      if (!acqCase.district_jurisdiction_id && !acqCase.state_jurisdiction_id) {
        return true;
      }

      // Check if user is State Authority
      if (userRoles.includes('STATE_AUTHORITY') || userRoles.includes('STATE_ADMIN')) {
        const hasStateAccess =
          !acqCase.state_jurisdiction_id ||
          userJurisdictionIds.has(acqCase.state_jurisdiction_id) ||
          userJurisdictions.some(
            (uj) =>
              uj.jurisdictions.jurisdiction_type === 'STATE' &&
              uj.jurisdictions.jurisdiction_id === acqCase.state_jurisdiction_id,
          );

        if (!hasStateAccess && userJurisdictionIds.size > 0) {
          throw new ForbiddenException(
            `Statutory Jurisdiction Violation: Case ${acqCase.case_number} belongs to a state outside your administrative authority.`,
          );
        }
        return true;
      }

      // District Officer / Field Officer / PIA: District-level scoping
      const hasDistrictAccess =
        (!acqCase.district_jurisdiction_id && !acqCase.state_jurisdiction_id) ||
        (acqCase.district_jurisdiction_id &&
          userJurisdictionIds.has(acqCase.district_jurisdiction_id)) ||
        (acqCase.state_jurisdiction_id &&
          userJurisdictionIds.has(acqCase.state_jurisdiction_id));

      if (!hasDistrictAccess && userJurisdictionIds.size > 0) {
        throw new ForbiddenException(
          `Statutory Jurisdiction Violation: Case ${acqCase.case_number} is situated outside your assigned administrative district jurisdiction.`,
        );
      }

      return true;
    }

    if (options.resource === 'project') {
      const project = await this.prisma.projects.findUnique({
        where: { project_id: resourceId },
        select: {
          project_id: true,
          project_code: true,
          primary_state_jurisdiction_id: true,
          project_jurisdictions: {
            select: { jurisdiction_id: true },
          },
        },
      });

      if (!project) {
        return true; // Let controller handle 404
      }

      const projectJurisdictionIds = new Set<string>([
        ...(project.primary_state_jurisdiction_id
          ? [project.primary_state_jurisdiction_id]
          : []),
        ...project.project_jurisdictions.map((pj) => pj.jurisdiction_id),
      ]);

      const hasOverlap = [...userJurisdictionIds].some((ujId) =>
        projectJurisdictionIds.has(ujId),
      );

      if (!hasOverlap && userJurisdictionIds.size > 0) {
        throw new ForbiddenException(
          `Statutory Jurisdiction Violation: Project ${project.project_code} is outside your assigned geographical jurisdiction.`,
        );
      }

      return true;
    }

    return true;
  }
}
