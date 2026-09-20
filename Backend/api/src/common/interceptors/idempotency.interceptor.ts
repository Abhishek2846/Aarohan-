import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  IDEMPOTENT_KEY,
  IdempotentOptions,
} from '../decorators/idempotent.decorator';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const options = this.reflector.getAllAndOverride<IdempotentOptions>(
      IDEMPOTENT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    let rawKey =
      req.headers?.['idempotency-key'] || req.headers?.['x-idempotency-key'];

    if (!rawKey && options.required) {
      throw new BadRequestException(
        'Idempotency-Key header is strictly required for this statutory transaction.',
      );
    }

    const bodyStr = JSON.stringify(req.body || {});
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${req.method}:${req.path}:${bodyStr}`)
      .digest('hex');

    if (!rawKey) {
      // Auto-generate key from fingerprint if not explicitly supplied
      rawKey = `auto-${fingerprint.substring(0, 32)}`;
    }

    const key = String(rawKey).trim().substring(0, 128);
    const userId = req.user?.userId || null;

    // Check existing key in PostgreSQL
    const existing = await this.prisma.api_idempotency_keys.findUnique({
      where: { idempotency_key: key },
    });

    if (existing) {
      // Check if key is expired
      if (existing.expires_at < new Date()) {
        await this.prisma.api_idempotency_keys.delete({
          where: { idempotency_key: key },
        });
      } else if (existing.response_status !== null) {
        // Return cached response instantly
        res.setHeader('X-Idempotent-Replayed', 'true');
        res.setHeader('X-Idempotency-Key', key);
        res.status(existing.response_status);
        return of(existing.response_body);
      } else {
        // Request currently in progress
        throw new ConflictException(
          'A statutory transaction with this Idempotency-Key is currently in-flight. Please wait a few moments before retrying.',
        );
      }
    }

    // Insert lock record
    const ttlSeconds = options.ttlSeconds || 86400;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    try {
      await this.prisma.api_idempotency_keys.create({
        data: {
          idempotency_key: key,
          user_id: userId,
          request_method: req.method.substring(0, 12),
          request_path: req.path.substring(0, 255),
          request_fingerprint: fingerprint,
          response_status: null,
          response_body: undefined,
          expires_at: expiresAt,
        },
      });
    } catch {
      // Concurrent race condition
      throw new ConflictException(
        'Concurrent transaction detected with identical Idempotency-Key.',
      );
    }

    res.setHeader('X-Idempotency-Key', key);

    return next.handle().pipe(
      tap({
        next: async (data) => {
          try {
            const statusCode = res.statusCode || 200;
            await this.prisma.api_idempotency_keys.update({
              where: { idempotency_key: key },
              data: {
                response_status: statusCode,
                response_body: data,
              },
            });
          } catch (e) {
            console.error('Failed to cache idempotency response:', e);
          }
        },
        error: async () => {
          try {
            await this.prisma.api_idempotency_keys.delete({
              where: { idempotency_key: key },
            });
          } catch {}
        },
      }),
    );
  }
}
