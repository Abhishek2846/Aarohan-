import { Controller, Post, Get, Put, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CheckJurisdiction } from '../common/decorators/jurisdiction.decorator';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @Roles('SYSTEM_ADMIN', 'MINISTRY_OFFICIAL', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'PIA')
  async createProject(@Body() body: any, @Req() req: any) {
    return this.projectsService.createProject(body, req.user?.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter projects' })
  async searchProjects(@Query() query: any) {
    return this.projectsService.searchProjects(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details' })
  async getProject(@Param('id') id: string) {
    return this.projectsService.getProject(id);
  }

  @CheckJurisdiction({ param: 'id', resource: 'project' })
  @Roles('SYSTEM_ADMIN', 'MINISTRY_OFFICIAL', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'PIA')
  @Patch(':id')
  @ApiOperation({ summary: 'Update project details' })
  async updateProject(@Param('id') id: string, @Body() body: any) {
    return this.projectsService.updateProject(id, body);
  }

  @Get(':id/alignments')
  @ApiOperation({ summary: 'Get project alignment GIS route versions' })
  async getProjectAlignments(@Param('id') id: string) {
    return this.projectsService.getProjectAlignments(id);
  }

  @CheckJurisdiction({ param: 'id', resource: 'project' })
  @Put(':id/pia')
  @ApiOperation({ summary: 'Assign PIA to project' })
  @Roles('SYSTEM_ADMIN', 'MINISTRY_OFFICIAL', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'PIA')
  async assignPia(@Param('id') id: string, @Body('piaUserId') piaUserId: string) {
    return this.projectsService.assignPia(id, piaUserId);
  }

  @CheckJurisdiction({ param: 'id', resource: 'project' })
  @Post(':id/jurisdictions')
  @ApiOperation({ summary: 'Add jurisdiction (geography) to project' })
  @Roles('SYSTEM_ADMIN', 'MINISTRY_OFFICIAL', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'PIA')
  async addJurisdiction(@Param('id') id: string, @Body() body: any) {
    return this.projectsService.addJurisdiction(id, body.jurisdictionId, body.isPrimary);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get overall project progress based on cases' })
  async getProgress(@Param('id') id: string) {
    return this.projectsService.getProjectProgress(id);
  }
}

