import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RrService } from './rr.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('R&R')
@Controller('rr')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RrController {
  constructor(private readonly rrService: RrService) {}

  @Roles('PIA', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'SYSTEM_ADMIN')
  @Get()
  @ApiOperation({ summary: 'Get Rehabilitation & Resettlement roster, grants summary, and grievances' })
  async getRr() {
    return this.rrService.getRrOverview();
  }

  @Roles('CITIZEN', 'DISTRICT_OFFICER', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Post()
  @ApiOperation({ summary: 'Submit a grievance or R&R application' })
  async submitGrievance(@Body() body: any, @Req() req: any) {
    return this.rrService.submitGrievanceOrRr(body, req.user?.userId);
  }

  @Roles('DISTRICT_OFFICER', 'FIELD_OFFICER', 'SYSTEM_ADMIN')
  @Post('families')
  @ApiOperation({ summary: 'Register an affected family' })
  async registerFamily(@Body() body: any) {
    return this.rrService.registerAffectedFamily(body);
  }

  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Post('families/:familyId/benefits')
  @ApiOperation({ summary: 'Add a benefit to an affected family' })
  async addBenefit(@Param('familyId') familyId: string, @Body() body: any) {
    return this.rrService.addBenefit(familyId, body);
  }

  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Patch('benefits/:id/disburse')
  @ApiOperation({ summary: 'Mark benefit as disbursed' })
  async markBenefitDisbursed(@Param('id') id: string) {
    return this.rrService.markBenefitDisbursed(id);
  }
}
