import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SimulationService } from './simulation.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Corridor Simulation')
@ApiBearerAuth()
@Roles('CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'PIA', 'DISTRICT_OFFICER', 'SYSTEM_ADMIN')
@Controller('simulation')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Get('scenarios')
  @ApiOperation({ summary: 'Get corridor alignment What-If simulation scenarios' })
  async getScenarios() {
    const data = await this.simulationService.getScenarios();
    return {
      status: 'success',
      count: data.length,
      data,
    };
  }
}
