import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('System')
@Controller()
export class AppController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'System health and readiness check' })
  getHealth() {
    return {
      status: 'ok',
      service: 'bhoomi-setu-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  @Public()
  @Version(VERSION_NEUTRAL)
  @Get('health')
  @ApiOperation({ summary: 'System health check (unversioned)' })
  getUnversionedHealth() {
    return {
      status: 'ok',
      service: 'bhoomi-setu-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
