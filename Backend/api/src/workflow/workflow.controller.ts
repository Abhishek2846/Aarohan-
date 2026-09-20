import { Controller, Post, Get, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Workflow Engine')
@ApiBearerAuth()
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Roles('STATE_AUTHORITY', 'CENTRAL_MINISTRY', 'SYSTEM_ADMIN')
  @Get('state-dashboard')
  @ApiOperation({ summary: 'Get state authority dashboard: district metrics, pending approvals, and tribunal appeals' })
  async getStateDashboard() {
    const data = await this.workflowService.getStateDashboardData();
    return {
      status: 'success',
      data,
    };
  }

  @Roles('STATE_AUTHORITY', 'CENTRAL_MINISTRY', 'SYSTEM_ADMIN')
  @Post('state-approvals/:id/action')
  @ApiOperation({ summary: 'Approve or return a state acquisition dossier' })
  async updateApprovalAction(@Param('id') id: string, @Body() body: any) {
    const { status, remarks } = body;
    const result = await this.workflowService.updateStateApproval(id, status, remarks);
    return {
      status: 'success',
      data: result,
    };
  }

  @Get('stages')
  @ApiOperation({ summary: 'List all configured workflow stage definitions' })
  async getStages() {
    return this.workflowService.getAllStages();
  }

  @Roles('STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'SYSTEM_ADMIN')
  @Post()
  @ApiOperation({ summary: 'Progress case workflow (Frontend compatibility adapter)' })
  async progressWorkflow(@Body() body: any, @Req() req: any) {
    const caseId = body.caseId || body.case_id;
    const nextStageCode = body.nextStageId || body.next_stage_code || body.nextStageCode;
    const actionCode = body.actionCode || body.action_code || 'APPROVE';
    const notes = body.notes || `Advanced to ${body.nextStageName || nextStageCode}`;
    const result = await this.workflowService.progressCase(caseId, nextStageCode, actionCode, req.user.userId, notes);
    return {
      message: `Stage successfully transitioned to ${body.nextStageName || nextStageCode}`,
      data: result,
    };
  }

  @Roles('SYSTEM_ADMIN')
  @Post('stages')
  @ApiOperation({ summary: 'Create a workflow stage definition' })
  async createStage(@Body() body: any) {
    return this.workflowService.createStageDefinition(body);
  }

  @Roles('SYSTEM_ADMIN')
  @Post('stages/:code/roles')
  @ApiOperation({ summary: 'Set roles allowed for a workflow stage' })
  async setStageRoles(@Param('code') code: string, @Body('roles') roles: any[]) {
    return this.workflowService.setStageRoles(code, roles);
  }

  @Roles('STATE_AUTHORITY', 'DISTRICT_OFFICER', 'PIA', 'SYSTEM_ADMIN')
  @Post('cases/:caseId/progress')
  @ApiOperation({ summary: 'Progress a case to the next workflow stage' })
  async progressCase(
    @Param('caseId') caseId: string,
    @Body('action_code') actionCode: string,
    @Body('next_stage_code') nextStageCode: string,
    @Body('notes') notes: string,
    @Req() req: any
  ) {
    return this.workflowService.progressCase(caseId, nextStageCode, actionCode || 'APPROVE', req.user.userId, notes);
  }
}
