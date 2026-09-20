import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GrievancesService } from './grievances.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Grievances')
@Controller('grievances')
export class GrievancesController {
  constructor(private readonly grievancesService: GrievancesService) {}

  @Public()
  @Post('submit')
  @ApiOperation({ summary: 'Submit a new grievance (Public API)' })
  async submitGrievance(@Body() body: any) {
    return this.grievancesService.submitGrievance(body);
  }

  @ApiBearerAuth()
  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign a grievance to an officer' })
  async assignGrievance(@Param('id') id: string, @Body('officerId') officerId: string) {
    return this.grievancesService.assignGrievance(id, officerId);
  }

  @ApiBearerAuth()
  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve a grievance' })
  async resolveGrievance(@Param('id') id: string, @Body('notes') notes: string) {
    return this.grievancesService.resolveGrievance(id, notes);
  }

  @ApiBearerAuth()
  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Post(':id/hearings')
  @ApiOperation({ summary: 'Schedule a hearing for a grievance' })
  async scheduleHearing(@Param('id') id: string, @Body() body: any) {
    return this.grievancesService.scheduleHearing(id, body);
  }
}
