import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('projects')
  @Roles('STATE_AUTHORITY', 'CENTRAL_MINISTRY', 'AUDITOR', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Generate high-level project summary report' })
  async getProjectSummaryReport() {
    return this.reportsService.generateProjectSummaryReport();
  }

  @Get('compliance')
  @Roles('STATE_AUTHORITY', 'CENTRAL_MINISTRY', 'AUDITOR', 'DISTRICT_OFFICER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Generate case compliance and SLA report' })
  @ApiQuery({ name: 'projectId', required: false })
  async getComplianceReport(@Query('projectId') projectId?: string) {
    return this.reportsService.generateCaseComplianceReport(projectId);
  }
}
