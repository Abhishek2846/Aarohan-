import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FieldService } from './field.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Field Surveyor PWA')
@ApiBearerAuth()
@Roles('FIELD_OFFICER', 'DISTRICT_OFFICER', 'PIA', 'SYSTEM_ADMIN')
@Controller('field')
export class FieldController {
  constructor(private readonly fieldService: FieldService) {}

  @Get('tasks')
  @ApiOperation({ summary: 'Get assigned field survey demarcation tasks' })
  async getTasks(@Query('surveyorUserId') surveyorUserId?: string) {
    const tasks = await this.fieldService.getTasks(surveyorUserId);
    return {
      status: 'success',
      count: tasks.length,
      data: tasks,
    };
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get single field task details' })
  async getTask(@Param('id') id: string) {
    const task = await this.fieldService.getTask(id);
    return {
      status: 'success',
      data: task,
    };
  }

  @Roles('FIELD_OFFICER', 'DISTRICT_OFFICER', 'SYSTEM_ADMIN')
  @Patch('tasks/:id/status')
  @ApiOperation({ summary: 'Update field survey task status and measurements' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('measuredAreaHa') measuredAreaHa?: number,
    @Body('remarks') remarks?: string,
  ) {
    const updated = await this.fieldService.updateTaskStatus(id, status, measuredAreaHa, remarks);
    return {
      status: 'success',
      data: updated,
    };
  }

  @Roles('FIELD_OFFICER', 'SYSTEM_ADMIN')
  @Post('surveys')
  @ApiOperation({ summary: 'Save completed field walking survey with measured area and GPS coordinates' })
  async saveSurvey(
    @Body()
    body: {
      taskId?: string;
      measuredAreaSqM?: number;
      measuredAreaHa?: number;
      measuredAreaAcres?: number;
      positions?: Array<[number, number]>;
      surveyType?: string;
      observations?: string;
      witnessNames?: string[];
      demarcationConfirmed?: boolean;
      surveyorUserId?: string;
    },
  ) {
    const result = await this.fieldService.saveSurvey(body);
    return {
      status: 'success',
      data: result,
    };
  }
}
