import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { PrismaModule } from './common/prisma/prisma.module';
import { PiiModule } from './common/services/pii.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { AcquisitionCasesModule } from './acquisition-cases/acquisition-cases.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ParcelsModule } from './parcels/parcels.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CompensationModule } from './compensation/compensation.module';
import { PossessionModule } from './possession/possession.module';
import { RrModule } from './rr/rr.module';
import { GrievancesModule } from './grievances/grievances.module';
import { LitigationModule } from './litigation/litigation.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { GisModule } from './gis/gis.module';
import { FieldModule } from './field/field.module';
import { SimulationModule } from './simulation/simulation.module';
import { CitizenModule } from './citizen/citizen.module';
import { AiModule } from './ai/ai.module';
import { GatiShaktiModule } from './gati-shakti/gati-shakti.module';
import { GazetteModule } from './gazette/gazette.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { JurisdictionGuard } from './common/guards/jurisdiction.guard';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'burst',
        ttl: 1000,
        limit: 10,
      },
    ]),
    PrismaModule,
    PiiModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    AcquisitionCasesModule,
    WorkflowModule,
    ParcelsModule,
    DocumentsModule,
    NotificationsModule,
    CompensationModule,
    PossessionModule,
    RrModule,
    GrievancesModule,
    LitigationModule,
    AnalyticsModule,
    ReportsModule,
    AuditModule,
    IntegrationsModule,
    GisModule,
    FieldModule,
    SimulationModule,
    CitizenModule,
    AiModule,
    GatiShaktiModule,
    GazetteModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JurisdictionGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule {}
