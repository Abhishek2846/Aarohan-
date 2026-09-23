import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { access_type } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (Admin / Ministry / State Authority)' })
  @Roles('SYSTEM_ADMIN', 'STATE_ADMIN', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'rajesh.verma@gov.in',
          description: 'Official email address for the user',
        },
        full_name: {
          type: 'string',
          example: 'Rajesh Verma',
          description: 'Full name of the officer',
        },
        password: {
          type: 'string',
          example: 'bhoomi2026',
          description: 'Initial login password (defaults to bhoomi2026)',
        },
        login_name: {
          type: 'string',
          example: 'rajesh.verma',
          description: 'Unique login handle (defaults to username from email)',
        },
        designation: {
          type: 'string',
          example: 'Competent Authority Land Acquisition (CALA)',
          description: 'Official designation',
        },
        department: {
          type: 'string',
          example: 'Revenue & Disaster Management',
          description: 'Department name',
        },
        phone_e164: {
          type: 'string',
          example: '+919876543210',
          description: 'E.164 formatted phone number',
        },
        role_code: {
          type: 'string',
          example: 'DISTRICT_OFFICER',
          description: 'Initial role to assign (e.g. CENTRAL_MINISTRY, STATE_AUTHORITY, DISTRICT_OFFICER, PIA, FIELD_OFFICER, AUDITOR, CITIZEN)',
        },
      },
      required: ['email', 'full_name'],
    },
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request: Missing or invalid required fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Valid JWT Bearer token required' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient privileges (Requires Admin or Ministry role)' })
  @ApiResponse({ status: 409, description: 'Conflict: Email already registered' })
  async createUser(@Body() body: any) {
    return this.usersService.createUser(body);
  }

  @Roles('SYSTEM_ADMIN', 'STATE_ADMIN', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY')
  @Get()
  @ApiOperation({ summary: 'List and filter users (Admin / Ministry / State)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'role', required: false, description: 'Filter users by role code' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for name or email' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max number of records to return' })
  @ApiResponse({ status: 200, description: 'List of users with roles' })
  async listUsers(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  @Roles('SYSTEM_ADMIN', 'STATE_ADMIN', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER')
  @Get(':id')
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id/profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        full_name: { type: 'string', example: 'Dr. Ananya Sharma, IAS' },
        preferred_language: { type: 'string', example: 'hi' },
        phone_e164: { type: 'string', example: '+919876543210' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const res = await this.usersService.updateProfile(id, body);
    await this.usersService.logAudit(req.user.userId, 'PUT', `/users/${id}/profile`, body, 200);
    return res;
  }

  @Post(':id/roles')
  @ApiOperation({ summary: 'Assign a role to a user (Admin / Ministry)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role_code: {
          type: 'string',
          example: 'DISTRICT_OFFICER',
          description: 'Role code to assign',
        },
      },
      required: ['role_code'],
    },
  })
  @ApiResponse({ status: 201, description: 'Role assigned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient privileges' })
  async assignRole(@Param('id') userId: string, @Body('role_code') roleCode: string, @Req() req: any) {
    const res = await this.usersService.assignRole(userId, roleCode, req.user.userId);
    await this.usersService.logAudit(req.user.userId, 'POST', `/users/${userId}/roles`, { roleCode }, 201);
    return res;
  }

  @Post(':id/jurisdictions')
  @ApiOperation({ summary: 'Assign a jurisdiction to a user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN', 'STATE_ADMIN', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        jurisdiction_id: { type: 'string', example: 'uuid-jurisdiction' },
        access_type: { type: 'string', enum: ['VIEW', 'READ_WRITE', 'APPROVER', 'SUPERVISOR'], example: 'READ_WRITE' },
      },
      required: ['jurisdiction_id'],
    },
  })
  @ApiResponse({ status: 201, description: 'Jurisdiction assigned' })
  async assignJurisdiction(
    @Param('id') userId: string, 
    @Body('jurisdiction_id') jurisdictionId: string,
    @Body('access_type') accessType: access_type,
    @Req() req: any
  ) {
    const res = await this.usersService.assignJurisdiction(userId, jurisdictionId, accessType || 'VIEW', req.user.userId);
    await this.usersService.logAudit(req.user.userId, 'POST', `/users/${userId}/jurisdictions`, { jurisdictionId, accessType }, 201);
    return res;
  }
}
