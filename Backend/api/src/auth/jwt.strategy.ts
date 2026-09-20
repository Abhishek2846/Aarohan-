import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'bhoomi-setu-jwt-secret-key-sih2026',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.users.findUnique({
      where: { user_id: payload.sub },
      include: { user_roles: true },
    });

    if (!user || user.account_status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    const roles = user.user_roles.map((r: any) => r.role_code);
    if (payload.role && !roles.includes(payload.role)) {
      roles.push(payload.role);
    }

    // Option C: Session Revocation / Force Logout Kill Switch check
    if (payload.jti) {
      const session = await this.prisma.auth_sessions.findUnique({
        where: { session_id: payload.jti },
      });
      if (!session) {
        throw new UnauthorizedException('Session not found or has been terminated');
      }
      if (session.revoked_at !== null) {
        throw new UnauthorizedException('Session has been revoked / officer force-logged out');
      }
      if (session.expires_at && session.expires_at < new Date()) {
        throw new UnauthorizedException('Session has expired');
      }
    }

    return {
      userId: user.user_id,
      username: user.login_name,
      email: user.email,
      role: payload.role || roles[0] || 'CITIZEN',
      roles,
      sessionId: payload.jti,
    };
  }
}
