import { Controller, Get, Post, Body, Param, Patch, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PossessionService } from './possession.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Possession')
@ApiBearerAuth()
@Roles('DISTRICT_OFFICER', 'FIELD_OFFICER', 'PIA', 'STATE_AUTHORITY', 'CENTRAL_MINISTRY', 'SYSTEM_ADMIN')
@Controller('possession')
export class PossessionController {
  constructor(private readonly possessionService: PossessionService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of possession handovers' })
  async getPossessions() {
    return this.possessionService.getPossessionRecords();
  }

  @Roles('DISTRICT_OFFICER', 'FIELD_OFFICER', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Post()
  @ApiOperation({ summary: 'Generate Section 38 Panchanama Memo' })
  async generateMemo(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId;
    return this.possessionService.generatePanchanamaMemo(body, userId);
  }

  @Roles('DISTRICT_OFFICER', 'FIELD_OFFICER', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Post('memos')
  @ApiOperation({ summary: 'Generate Section 38 Panchanama Memo' })
  async generateMemoAlt(@Body() body: any, @Req() req: any) {
    const userId = req.user?.userId;
    return this.possessionService.generatePanchanamaMemo(body, userId);
  }

  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Post('schedule')
  @ApiOperation({ summary: 'Schedule land possession handover' })
  async schedulePossession(@Body() body: any, @Req() req: any) {
    return this.possessionService.schedulePossession({ ...body, userId: req.user?.userId });
  }

  @Roles('FIELD_OFFICER', 'DISTRICT_OFFICER', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark possession as complete and attach Panchanama' })
  async markPossessionComplete(
    @Param('id') id: string,
    @Body('documentId') documentId: string
  ) {
    return this.possessionService.markPossessionComplete(id, documentId);
  }
}
