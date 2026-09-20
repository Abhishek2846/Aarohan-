import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ParcelsService } from './parcels.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Parcels')
@ApiBearerAuth()
@Controller('parcels')
export class ParcelsController {
  constructor(private readonly parcelsService: ParcelsService) {}

  @Roles('FIELD_OFFICER', 'DISTRICT_OFFICER', 'PIA', 'STATE_AUTHORITY', 'SYSTEM_ADMIN')
  @Post()
  @ApiOperation({ summary: 'Create a land parcel' })
  async createParcel(@Body() body: any) {
    return this.parcelsService.createParcel(body);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter land parcels' })
  async searchParcels(@Query() query: any) {
    return this.parcelsService.searchParcels(query);
  }

  @Get('mock-ulpin/:ulpin')
  @ApiOperation({ summary: 'Fetch mock parcel data from national ULPIN DB' })
  async fetchMockUlpinData(@Param('ulpin') ulpin: string) {
    return this.parcelsService.fetchMockUlpinData(ulpin);
  }

  @Get('search/text')
  @ApiOperation({ summary: 'Search parcels by text (ULPIN, Survey No)' })
  async searchText(@Query('query') query: string) {
    return this.parcelsService.searchParcelsText(query);
  }

  @Get('search/spatial')
  @ApiOperation({ summary: 'Search parcels spatially (Mock)' })
  async searchSpatial(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radiusKm') radiusKm: number
  ) {
    return this.parcelsService.searchParcelsSpatial(Number(lat), Number(lng), Number(radiusKm));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get parcel by ID' })
  async getParcel(@Param('id') id: string) {
    return this.parcelsService.getParcel(id);
  }
}
