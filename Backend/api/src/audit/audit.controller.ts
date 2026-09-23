import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Audit')
@ApiBearerAuth()
@Roles('AUDITOR', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get cryptographic audit trail, sequential blocks, and Merkle root' })
  async getAuditLedger() {
    return this.auditService.getAuditLedger();
  }

  @Post()
  @ApiOperation({ summary: 'Run cryptographic verification on the entire audit ledger' })
  async verifyLedger() {
    return this.auditService.verifyLedger();
  }

  @Get('verify-chain')
  @ApiOperation({ summary: 'Verify the cryptographic integrity of the audit chain' })
  async verifyChain() {
    return this.auditService.verifyChain();
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Get automated statutory anomalies, inflated rates, and SLA breaches' })
  async getAnomalies() {
    const data = await this.auditService.getAnomalies();
    return {
      status: 'success',
      count: data.length,
      data,
    };
  }

  // Auditor is strictly read-only: only State, Ministry, or System Admin may resolve or update anomaly status
  @Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Post('anomalies/:id/status')
  @ApiOperation({ summary: 'Update audit anomaly status' })
  async updateAnomalyStatus(@Param('id') id: string, @Body('status') status: string) {
    const result = await this.auditService.updateAnomalyStatus(id, status);
    return {
      status: 'success',
      data: result,
    };
  }
}
