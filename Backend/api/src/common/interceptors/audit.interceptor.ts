import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    // Only audit database mutations (POST, PUT, PATCH, DELETE)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const userId = req.user?.userId || null;
      const url = req.url;
      const body = req.body;
      const ip = req.ip;

      return next.handle().pipe(
        tap((data) => {
          // Log asynchronously after successful response
          // Transform URL /v1/projects to ACTION_CODE: POST_V1_PROJECTS
          const actionCode = `${method}_${url.split('?')[0].replace(/\//g, '_').toUpperCase()}`.substring(0, 100);

          this.auditService.logEvent({
            actorUserId: userId,
            actionCode: actionCode,
            entityType: 'HTTP_MUTATION',
            metadata: {
              url,
              method,
              requestBody: body,
            },
            ipAddress: ip,
            // Note: In a true global interceptor we can't always deduce the exact entity ID, 
            // but the payload and URL are securely hashed into the audit chain.
          }).catch(err => this.logger.error(`Failed to write audit log for ${actionCode}`, err));
        }),
      );
    }

    // Pass through GET requests without auditing
    return next.handle();
  }
}
