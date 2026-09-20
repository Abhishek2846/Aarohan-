import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompensationService } from './compensation.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CheckJurisdiction } from '../common/decorators/jurisdiction.decorator';
import { Idempotent } from '../common/decorators/idempotent.decorator';

@ApiTags('Compensation')
@ApiBearerAuth()
@Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'PIA', 'CENTRAL_MINISTRY', 'AUDITOR', 'SYSTEM_ADMIN')
@Controller('compensation')
export class CompensationController {
  constructor(private readonly compensationService: CompensationService) {}

  @Get()
  @ApiOperation({ summary: 'Get compensation macro outlay, disbursement status and PFMS batches' })
  async getCompensation() {
    return this.compensationService.getCompensationOverview();
  }

  @Idempotent()
  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'PIA', 'CENTRAL_MINISTRY', 'SYSTEM_ADMIN')
  @Post()
  @ApiOperation({ summary: 'Compensation adapter: Calculate statutory award or dispatch PFMS batch' })
  async handleCompensationPost(@Body() body: any, @Req() req: any) {
    if (body.action === 'CALCULATE_AWARD') {
      const marketValue = Number(body.marketValueINR || 2500000);
      const multiplier = Number(body.multiplier || 1.25);
      const solatiumPct = Number(body.solatiumPct || 100);
      const interestDays = Number(body.interestDays || 365);
      const multipliedMarketValue = Math.round(marketValue * multiplier);
      const solatium = Math.round(multipliedMarketValue * (solatiumPct / 100));
      const interest = Math.round(marketValue * 0.12 * (interestDays / 365));
      const total = multipliedMarketValue + solatium + interest;

      return {
        status: 'SUCCESS',
        calculation: {
          baseMarketValueINR: marketValue,
          multiplier,
          multipliedMarketValueINR: multipliedMarketValue,
          solatiumINR: solatium,
          statutoryInterestINR: interest,
          totalAwardINR: total,
          formulaBreakdown: `${multipliedMarketValue} (Base x Multiplier) + ${solatium} (100% Solatium) + ${interest} (12% Interest)`,
          calculatedAt: new Date().toISOString(),
        },
      };
    }

    // PFMS DBT Dispatch
    const newBatch = await this.compensationService.createPfmsDispatch({
      projectRef: body.projectRef,
      amountINR: body.amountINR,
      beneficiariesCount: body.beneficiariesCount,
      userId: req.user.userId,
    });

    return {
      status: 'SUCCESS',
      message: 'PFMS DBT payment batch transmitted to Public Financial Management System successfully',
      data: newBatch,
    };
  }

  @Idempotent()
  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Post('award')
  @ApiOperation({ summary: 'Calculate award for a parcel' })
  async calculateAward(@Body() body: any, @Req() req: any) {
    return this.compensationService.calculateAward({ ...body, userId: req.user.userId });
  }

  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'PIA', 'SYSTEM_ADMIN')
  @Post('beneficiaries')
  @ApiOperation({ summary: 'Add a beneficiary to a case parcel' })
  async addBeneficiary(@Body() body: any) {
    return this.compensationService.addBeneficiary(body);
  }

  @Idempotent({ required: false })
  @CheckJurisdiction({ param: 'caseId', resource: 'case' })
  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Post('batches/:caseId')
  @ApiOperation({ summary: 'Create PFMS Payment Batch for a case' })
  async createPaymentBatch(@Param('caseId') caseId: string, @Req() req: any) {
    return this.compensationService.createPaymentBatch(caseId, req.user.userId);
  }

  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Post('batches/:batchId/mock-response')
  @ApiOperation({ summary: 'Mock PFMS webhook response' })
  async mockPfmsResponse(
    @Param('batchId') batchId: string,
    @Body('status') status: 'COMPLETED' | 'FAILED'
  ) {
    return this.compensationService.processMockPfmsResponse(batchId, status);
  }
}
