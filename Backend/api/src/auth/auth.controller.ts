import { Controller, Post, Get, Body, Req, Res, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'User login to obtain JWT access & refresh tokens' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'ananya.sharma@nic.in',
          description: 'Official user email or login name (e.g. ananya.sharma@nic.in, dc.bengaluru@karnataka.gov.in, v.malhotra@nhai.gov.in)',
        },
        password: {
          type: 'string',
          example: 'bhoomi2026',
          description: 'Account password (default seeded password: bhoomi2026)',
        },
      },
      required: ['email', 'password'],
    },
  })
  async login(@Body() body: any, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
    const userAgent = req.headers?.['user-agent'] || 'Swagger/Browser';
    return this.authService.login(body, ip, userAgent);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user profile and roles' })
  async getMe(@Req() req: any) {
    return this.authService.getMe(req.user.userId);
  }

  @Public()
  @Get('roles')
  @ApiOperation({ summary: 'List all available system roles' })
  async getRoles() {
    return this.authService.getRoles();
  }

  @Public()
  @Get('credentials')
  @ApiOperation({ summary: 'Get live credentials for all roles directly from PostgreSQL' })
  async getCredentials() {
    return this.authService.getCredentials();
  }

  @Public()
  @Post('update-credentials')
  @ApiOperation({ summary: 'Update user login credentials (email, login_name, password) in PostgreSQL' })
  async updateCredentials(@Body() body: any) {
    return this.authService.updateCredentials(body || {});
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT access token using a valid refresh_token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: {
          type: 'string',
          example: '389eb86b08dd7fabf4bc406d733f5f88d29ee699a5bffe7fc81e5b35cb3d379c',
          description: 'The opaque refresh token received from POST /auth/login',
        },
      },
      required: ['refresh_token'],
    },
  })
  async refresh(@Body() body: any) {
    const token = typeof body === 'string' ? body : (body?.refresh_token || body?.refreshToken);
    return this.authService.refreshToken(token);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('mock-sso')
  @ApiOperation({ summary: 'Mock SSO Login via Parichay Single Sign-On' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'ananya.sharma@nic.in',
          description: 'Official government officer email (e.g. ananya.sharma@nic.in, dc.bengaluru@karnataka.gov.in)',
        },
        secret: {
          type: 'string',
          example: 'mock-sso-secret',
          description: 'Shared secret for Parichay mock SSO gateway (default: mock-sso-secret)',
        },
      },
    },
  })
  async mockSso(@Body() body: any, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
    const userAgent = req.headers?.['user-agent'] || 'Swagger/Browser';
    return this.authService.ssoLogin(body || {}, ip, userAgent);
  }

  @Public()
  @Post('mock-ekyc')
  @ApiOperation({ summary: 'Mock e-KYC Verification via Aadhaar' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        aadhaar: {
          type: 'string',
          example: '123456789012',
          description: '12-digit Indian Aadhaar number',
        },
      },
      required: ['aadhaar'],
    },
  })
  async mockEkyc(@Body() body: any) {
    const cleaned = String(body?.aadhaar || '').replace(/\D/g, '');
    if (cleaned.length !== 12) {
      return { verified: false, message: 'Invalid Aadhaar format. Must be a 12-digit number.' };
    }
    return {
      verified: true,
      reference: 'KYC-' + Math.floor(100000 + Math.random() * 900000),
      maskedName: 'S**** K****',
    };
  }

  @Public()
  @Get('parichay/login')
  @ApiOperation({ summary: 'Initiate official Jan Parichay Government OAuth2 SSO login flow' })
  async parichayLogin(
    @Query('role') role: string,
    @Query('redirect') redirect: string,
    @Res() res: any
  ) {
    const { redirectUrl } = await this.authService.initiateParichayLogin(role, redirect);
    return res.redirect(redirectUrl);
  }

  @Public()
  @Get('parichay/callback')
  @ApiOperation({ summary: 'OAuth2 Authorization Code Callback endpoint for Jan Parichay SSO' })
  async parichayCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: any,
    @Res() res: any
  ) {
    const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
    const userAgent = req.headers?.['user-agent'] || 'Swagger/Browser';
    const result = await this.authService.handleParichayCallback(code, state, ip, userAgent);
    return res.redirect(result.redirectUrl);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke current active JWT access token and session' })
  async logout(@Req() req: any) {
    const sessionId = req.user?.sessionId;
    return this.authService.logout(sessionId, req.user?.userId);
  }

  @Post('revoke-user-sessions/:userId')
  @ApiBearerAuth()
  @Roles('SYSTEM_ADMIN', 'CENTRAL_MINISTRY')
  @ApiOperation({ summary: 'Emergency Kill Switch: Revoke all active sessions and force logout an officer' })
  async revokeUserSessions(@Param('userId') userId: string, @Req() req: any) {
    return this.authService.revokeUserSessions(userId, req.user?.userId);
  }
}
