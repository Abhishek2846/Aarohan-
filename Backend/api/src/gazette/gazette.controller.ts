import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GazetteService } from './gazette.service';
import {
  CreateGazetteDraftDto,
  SignGazetteDto,
  PublishGazetteDto,
  GazetteFilterDto,
} from './dto/gazette.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Idempotent } from '../common/decorators/idempotent.decorator';

@ApiTags('Official Bilingual E-Gazette')
@Controller('gazette')
export class GazetteController {
  constructor(private readonly gazetteService: GazetteService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List statutory gazette notifications with filtering by project, section, or status' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'sectionReference', required: false })
  @ApiQuery({ name: 'publicationStatus', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listGazettes(@Query() filters: GazetteFilterDto) {
    const data = await this.gazetteService.listGazettes(filters);
    return {
      status: 'success',
      count: data.length,
      data,
    };
  }

  @Public()
  @Get('verify/:hashOrRef')
  @ApiOperation({ summary: 'Instant public cryptographic verification of e-Gazette notification by SHA-256 hash or gazette reference' })
  async verifyGazette(@Param('hashOrRef') hashOrRef: string) {
    const data = await this.gazetteService.verifyGazette(hashOrRef);
    return {
      status: 'success',
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get detailed bilingual gazette notice with cadastral parcel schedule' })
  async getGazetteById(@Param('id') id: string) {
    const data = await this.gazetteService.getGazetteById(id);
    return {
      status: 'success',
      data,
    };
  }

  @Idempotent({ required: false })
  @ApiBearerAuth()
  @Roles('DISTRICT_OFFICER', 'PIA', 'STATE_AUTHORITY', 'CENTRAL_MINISTRY', 'SYSTEM_ADMIN')
  @Post('draft')
  @ApiOperation({ summary: 'CALA / District Officer: Generate new statutory gazette draft' })
  async createDraft(@Body() dto: CreateGazetteDraftDto, @Req() req: any) {
    const userId = req?.user?.userId;
    const data = await this.gazetteService.createDraft(dto, userId);
    return {
      status: 'success',
      message: 'Statutory gazette notification draft compiled successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Roles('DISTRICT_OFFICER', 'STATE_AUTHORITY', 'CENTRAL_MINISTRY', 'SYSTEM_ADMIN')
  @Post(':id/sign')
  @ApiOperation({ summary: 'CALA / SDM: Digitally endorse and sign statutory gazette draft' })
  async signDraft(
    @Param('id') id: string,
    @Body() dto: SignGazetteDto,
    @Req() req: any,
  ) {
    const user = req?.user;
    const data = await this.gazetteService.signDraft(id, dto, user);
    return {
      status: 'success',
      message: 'Gazette draft signed and endorsed with digital CALA seal',
      data,
    };
  }

  @ApiBearerAuth()
  @Roles('STATE_AUTHORITY', 'CENTRAL_MINISTRY', 'SYSTEM_ADMIN')
  @Post(':id/publish')
  @ApiOperation({ summary: 'State Authority: Authorize and publish gazette to official eGazette press' })
  async publishToEgazette(
    @Param('id') id: string,
    @Body() dto: PublishGazetteDto,
    @Req() req: any,
  ) {
    const user = req?.user;
    const data = await this.gazetteService.publishToEgazette(id, dto, user);
    return {
      status: 'success',
      message: 'Statutory gazette notification published to Official Gazette with registration reference',
      data,
    };
  }
}
