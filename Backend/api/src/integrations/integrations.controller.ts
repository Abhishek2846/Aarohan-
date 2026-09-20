import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Integrations')
@ApiBearerAuth()
@Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get integrations status' })
  getStatus() {
    return this.integrationsService.getStatus();
  }
}
