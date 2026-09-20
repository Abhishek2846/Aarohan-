import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { account_status, access_type } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: any) {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Request body must be a valid JSON object');
    }
    if (!data.email || typeof data.email !== 'string') {
      throw new BadRequestException('Field "email" is required and must be a valid email string');
    }
    if (!data.full_name || typeof data.full_name !== 'string') {
      throw new BadRequestException('Field "full_name" is required and must be a non-empty string');
    }

    const existing = await this.prisma.users.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException(`User with email "${data.email}" already exists`);

    const rawPassword = data.password && typeof data.password === 'string' ? data.password : 'bhoomi2026';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const loginName = data.login_name || data.email.split('@')[0];

    const user = await this.prisma.users.create({
      data: {
        user_id: uuidv4(),
        login_name: loginName,
        email: data.email,
        full_name: data.full_name,
        password_hash: hashedPassword,
        designation: data.designation || null,
        department: data.department || null,
        phone_e164: data.phone_e164 || null,
        account_status: 'ACTIVE',
      },
      select: {
        user_id: true,
        login_name: true,
        email: true,
        full_name: true,
        designation: true,
        department: true,
        account_status: true,
        created_at: true,
      }
    });

    // Auto-assign role if provided
    if (data.role_code) {
      try {
        await this.prisma.user_roles.create({
          data: {
            user_id: user.user_id,
            role_code: data.role_code,
            assigned_by: user.user_id,
          },
        });
      } catch (err) {
        // Log warning if role does not exist
        console.warn(`Could not assign role ${data.role_code} to user ${user.user_id}:`, err);
      }
    }

    return user;
  }

  async findAll(query?: any) {
    const where: any = {};
    if (query?.role) {
      where.user_roles = {
        some: { role_code: query.role },
      };
    }
    if (query?.search) {
      where.OR = [
        { full_name: { contains: query.search } },
        { email: { contains: query.search } },
        { login_name: { contains: query.search } },
      ];
    }
    return this.prisma.users.findMany({
      where,
      select: {
        user_id: true,
        login_name: true,
        email: true,
        full_name: true,
        designation: true,
        department: true,
        phone_e164: true,
        account_status: true,
        last_login_at: true,
        created_at: true,
        user_roles: {
          select: {
            role_code: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: query?.limit ? parseInt(query.limit, 10) : 50,
    });
  }

  async findOne(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        user_roles: true,
        user_jurisdictions: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { password_hash, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, data: any) {
    const updated = await this.prisma.users.update({
      where: { user_id: userId },
      data: {
        full_name: data.full_name,
        preferred_language: data.preferred_language,
        phone_e164: data.phone_e164,
      },
    });
    const { password_hash, ...result } = updated;
    return result;
  }

  async assignRole(userId: string, roleCode: string, assignedBy: string) {
    return this.prisma.user_roles.create({
      data: {
        user_id: userId,
        role_code: roleCode,
        assigned_by: assignedBy,
      },
    });
  }

  async assignJurisdiction(userId: string, jurisdictionId: string, accessType: access_type, assignedBy: string) {
    return this.prisma.user_jurisdictions.create({
      data: {
        user_id: userId,
        jurisdiction_id: jurisdictionId,
        access_type: accessType,
        assigned_by: assignedBy,
      },
    });
  }

  async logAudit(userId: string, method: string, path: string, body: any, status: number) {
    return this.prisma.api_idempotency_keys.create({
      data: {
        idempotency_key: uuidv4(),
        user_id: userId,
        request_method: method,
        request_path: path.substring(0, 255),
        request_fingerprint: 'manual-audit-log',
        response_status: status,
        response_body: body || {},
        expires_at: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });
  }
}
