import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'PIA', 'AUDITOR', 'DISTRICT_OFFICER', 'SYSTEM_ADMIN')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('national')
  @ApiOperation({ summary: 'Get national dashboard data: benchmarks, corridors, escalations, bottlenecks, and standards' })
  async getNationalData() {
    const data = await this.analyticsService.getNationalDashboardData();
    return {
      status: 'success',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get interstate national acquisition analytics, benchmarks, and bottlenecks' })
  async getAnalytics() {
    return this.analyticsService.getAnalyticsData();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get analytics operational status' })
  getStatus() {
    return this.analyticsService.getStatus();
  }
}
