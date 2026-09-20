import { Controller, Get, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CitizenService } from './citizen.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Citizen Portal')
@ApiBearerAuth()
@Roles('CITIZEN', 'DISTRICT_OFFICER', 'SYSTEM_ADMIN')
@Controller('citizen')
export class CitizenController {
  constructor(private readonly citizenService: CitizenService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get personalized landowner profile, plot boundaries, award, and DBT status' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'email', required: false })
  async getProfile(
    @Query('userId') queryUserId?: string,
    @Query('email') queryEmail?: string,
    @Req() req?: any,
  ) {
    const userId = queryUserId || req?.user?.userId;
    const data = await this.citizenService.getCitizenProfile(userId, queryEmail);
    return {
      status: 'success',
      data,
    };
  }
}

