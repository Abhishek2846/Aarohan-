import { Controller, Get, Post, Body, Param, Patch, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LitigationService } from './litigation.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Litigation')
@ApiBearerAuth()
@Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'PIA', 'CENTRAL_MINISTRY', 'AUDITOR', 'SYSTEM_ADMIN')
@Controller('litigation')
export class LitigationController {
  constructor(private readonly litigationService: LitigationService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of active litigation cases' })
  async getLitigations(@Query() query: any) {
    return this.litigationService.getLitigations(query);
  }

  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'PIA', 'SYSTEM_ADMIN')
  @Post('file')
  @ApiOperation({ summary: 'File a new litigation case' })
  async fileLitigation(@Body() body: any, @Req() req: any) {
    return this.litigationService.fileLitigation({ ...body, userId: req.user?.userId });
  }

  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'PIA', 'SYSTEM_ADMIN')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update litigation status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.litigationService.updateLitigationStatus(id, status);
  }
}
