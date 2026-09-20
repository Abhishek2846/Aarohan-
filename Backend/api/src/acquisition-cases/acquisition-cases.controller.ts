import { Controller, Post, Get, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AcquisitionCasesService } from './acquisition-cases.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CheckJurisdiction } from '../common/decorators/jurisdiction.decorator';

@ApiTags('Acquisition Cases')
@ApiBearerAuth()
@Controller(['acquisition-cases', 'cases'])
export class AcquisitionCasesController {
  constructor(private readonly casesService: AcquisitionCasesService) {}

  @Roles('DISTRICT_OFFICER', 'PIA', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Post()
  @ApiOperation({ summary: 'Create a new acquisition case' })
  async createCase(@Body() body: any, @Req() req: any) {
    return this.casesService.createCase(body, req.user?.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter cases' })
  async searchCases(@Query() query: any) {
    return this.casesService.searchCases(query);
  }

  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'PIA', 'CENTRAL_MINISTRY', 'SYSTEM_ADMIN')
  @Get('district-roster')
  @ApiOperation({ summary: 'Get district collector roster with active cases, surveys, awards, and possession handovers' })
  async getDistrictRoster() {
    const data = await this.casesService.getDistrictRosterData();
    return {
      status: 'success',
      data,
    };
  }

  @CheckJurisdiction({ param: 'id', resource: 'case' })
  @Get(':id')
  @ApiOperation({ summary: 'Get single acquisition case details' })
  async getCase(@Param('id') id: string) {
    return this.casesService.getCase(id);
  }

  @CheckJurisdiction({ param: 'id', resource: 'case' })
  @Get(':id/stages')
  @ApiOperation({ summary: 'Get case stage history and timelines' })
  async getCaseStages(@Param('id') id: string) {
    return this.casesService.getCaseStages(id);
  }

  @CheckJurisdiction({ param: 'id', resource: 'case' })
  @Roles('DISTRICT_OFFICER', 'PIA', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Patch(':id')
  @ApiOperation({ summary: 'Update case metadata or stage' })
  async updateCase(@Param('id') id: string, @Body() body: any) {
    return this.casesService.updateCase(id, body);
  }

  @CheckJurisdiction({ param: 'id', resource: 'case' })
  @Roles('DISTRICT_OFFICER', 'PIA', 'FIELD_OFFICER', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Post(':id/parcels')
  @ApiOperation({ summary: 'Link a project parcel to the case' })
  async linkParcel(@Param('id') id: string, @Body('project_parcel_id') projectParcelId: string) {
    return this.casesService.linkParcel(id, projectParcelId);
  }
}
