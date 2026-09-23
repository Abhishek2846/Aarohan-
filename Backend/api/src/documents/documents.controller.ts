import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // CITIZEN: browse & view their own notices/public docs. Officers: full access.
  @Roles('PIA', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'FIELD_OFFICER', 'AUDITOR', 'CITIZEN', 'SYSTEM_ADMIN')
  @Get()
  @ApiOperation({ summary: 'List and filter repository documents' })
  async searchDocuments(@Query() query: any) {
    return this.documentsService.searchDocuments(query);
  }

  @Roles('PIA', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'FIELD_OFFICER', 'AUDITOR', 'CITIZEN', 'SYSTEM_ADMIN')
  @Get(':id')
  @ApiOperation({ summary: 'Get document details and versions' })
  async getDocument(@Param('id') id: string) {
    return this.documentsService.getDocument(id);
  }

  // CITIZEN and AUDITOR cannot upload documents — view only
  @Roles('PIA', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'FIELD_OFFICER', 'SYSTEM_ADMIN')
  @Post('upload')
  @ApiOperation({ summary: 'Upload a document or new version' })
  async uploadDocument(@Body() body: any, @Req() req: any) {
    return this.documentsService.uploadDocument(body, req.user.userId);
  }

  // Document approve — officers only, CITIZEN excluded
  @Roles('SYSTEM_ADMIN', 'APPROVING_AUTHORITY', 'DISTRICT_OFFICER', 'STATE_AUTHORITY', 'CENTRAL_MINISTRY', 'PIA')
  @Post(':docId/versions/:versionId/approve')
  @ApiOperation({ summary: 'Approve or reject a document' })
  async approveDocument(
    @Param('docId') docId: string,
    @Param('versionId') versionId: string,
    @Body('action') action: 'APPROVED' | 'REJECTED' | 'RETURNED_FOR_REVISION',
    @Body('notes') notes: string,
    @Req() req: any
  ) {
    return this.documentsService.approveDocument(docId, versionId, action, req.user.userId, notes);
  }

  @Roles('PIA', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'FIELD_OFFICER', 'AUDITOR', 'SYSTEM_ADMIN')
  @Get('completeness-score')
  @ApiOperation({ summary: 'Get completeness score for a case stage' })
  async getCompletenessScore(
    @Query('caseId') caseId: string,
    @Query('stageCode') stageCode: string
  ) {
    return this.documentsService.getCompletenessScore(caseId, stageCode);
  }

  @Roles('PIA', 'CENTRAL_MINISTRY', 'STATE_AUTHORITY', 'DISTRICT_OFFICER', 'FIELD_OFFICER', 'AUDITOR', 'CITIZEN', 'SYSTEM_ADMIN')
  @Get('versions/:versionId/preview')
  @ApiOperation({ summary: 'Get secure preview URL for a document version' })
  async getPreviewUrl(@Param('versionId') versionId: string) {
    return this.documentsService.getPreviewUrl(versionId);
  }
}
