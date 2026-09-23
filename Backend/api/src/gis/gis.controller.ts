import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GisService } from './gis.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('GIS')
@ApiBearerAuth()
@Controller('gis')
export class GisController {
  constructor(private readonly gisService: GisService) {}

  @Roles('PIA', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'FIELD_OFFICER', 'AUDITOR', 'CITIZEN', 'SYSTEM_ADMIN')
  @Get()
  @ApiOperation({
    summary:
      'Get GIS corridor alignment, cadastral parcels, and geotagged field photos. Payload is role-shaped: CITIZEN receives masked own-plot view only; AUDITOR sees evidence points; officers see full cadastral data.',
  })
  async getGis(@Query('corridorId') corridorId?: string, @Req() req?: any) {
    const userId = req?.user?.userId;
    return this.gisService.getGisData(corridorId, userId);
  }

  // Spatial buffer write — CITIZEN excluded (view-only per RFCTLARR product matrix)
  @Roles('PIA', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'FIELD_OFFICER', 'SYSTEM_ADMIN')
  @Post()
  @ApiOperation({
    summary: 'Run spatial buffer calculation against alignment waypoints',
  })
  async calculateSpatialBuffer(
    @Body() body: { waypoints: [number, number][]; bufferWidthMeters?: number },
  ) {
    return this.gisService.calculateSpatialBuffer(
      body.waypoints,
      body.bufferWidthMeters,
    );
  }
}
