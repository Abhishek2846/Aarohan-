import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GatiShaktiService } from './gati-shakti.service';
import { NocWorkflowActionDto } from './dto/gati-shakti.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('PM Gati Shakti NMP')
@ApiBearerAuth()
@Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'AUDITOR', 'SYSTEM_ADMIN')
@Controller('gati-shakti')
export class GatiShaktiController {
  constructor(private readonly gatiShaktiService: GatiShaktiService) {}

  @Get('layers')
  @ApiOperation({
    summary: 'Get all statutory PM Gati Shakti National Master Plan GIS layers',
  })
  async getLayers() {
    const layers = await this.gatiShaktiService.getLayers();
    return {
      status: 'success',
      count: layers.length,
      data: layers,
    };
  }

  @Get('national-summary')
  @ApiOperation({
    summary:
      'Get national multi-agency clearance portfolio summary for Cabinet Secretariat & Central Ministries',
  })
  async getNationalSummary() {
    const summary = await this.gatiShaktiService.getNationalSummary();
    return {
      status: 'success',
      data: summary,
    };
  }

  @Get('projects/:projectId/screener')
  @ApiOperation({
    summary:
      'Run Gati Shakti Geo-Clearance screener against project alignment, conflicts, and inter-agency NOCs',
  })
  async getProjectScreener(@Param('projectId') projectId: string) {
    const screener = await this.gatiShaktiService.getProjectScreener(projectId);
    return {
      status: 'success',
      data: screener,
    };
  }

  @Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'SYSTEM_ADMIN')
  @Post('projects/:projectId/nocs/:nocId/action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Execute role-based statutory clearance workflow action (PIA / District Officer / State Authority / Central Ministry)',
  })
  async executeNocAction(
    @Param('projectId') projectId: string,
    @Param('nocId') nocId: string,
    @Body() dto: NocWorkflowActionDto,
    @Req() req: any,
  ) {
    const userId = req?.user?.userId;
    const result = await this.gatiShaktiService.executeNocAction(
      projectId,
      nocId,
      dto,
      userId,
    );
    return result;
  }
}
