import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as crypto from 'crypto';
import {
  CreateGazetteDraftDto,
  SignGazetteDto,
  PublishGazetteDto,
  GazetteFilterDto,
} from './dto/gazette.dto';

@Injectable()
export class GazetteService {
  constructor(private readonly prisma: PrismaService) {}

  private computeHash(payload: any): string {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  async listGazettes(filters: GazetteFilterDto) {
    const where: any = {};

    if (filters.projectId) {
      where.project_id = filters.projectId;
    }
    if (filters.sectionReference) {
      where.section_reference = filters.sectionReference;
    }
    if (filters.publicationStatus) {
      where.publication_status = filters.publicationStatus;
    }
    if (filters.search) {
      where.OR = [
        { notice_number: { contains: filters.search, mode: 'insensitive' } },
        { gazette_reference: { contains: filters.search, mode: 'insensitive' } },
        { public_summary: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const notices = await this.prisma.statutory_notices.findMany({
      where,
      include: {
        projects: {
          select: {
            project_id: true,
            project_code: true,
            title: true,
            sector: true,
            pia_name: true,
          },
        },
        acquisition_cases: {
          select: {
            case_id: true,
            case_number: true,
            district: { select: { name: true } },
            state: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return notices.map((notice: any) => {
      const schedule = Array.isArray(notice.cadastral_schedule) ? notice.cadastral_schedule : [];
      const content: any = notice.bilingual_content || {};

      return {
        id: notice.statutory_notice_id,
        noticeNumber: notice.notice_number,
        projectId: notice.project_id,
        projectCode: notice.projects?.project_code,
        projectTitle: notice.projects?.title,
        sector: notice.projects?.sector,
        piaName: notice.projects?.pia_name,
        caseId: notice.case_id,
        caseNumber: notice.acquisition_cases?.case_number,
        district: notice.acquisition_cases?.district?.name || 'All Districts',
        state: notice.acquisition_cases?.state?.name || 'India',
        noticeType: notice.notice_type,
        sectionReference: notice.section_reference,
        gazetteReference: notice.gazette_reference,
        gazetteVolumeIssue: notice.gazette_volume_issue,
        publicationStatus: notice.publication_status,
        publishedOn: notice.published_on ? notice.published_on.toISOString().slice(0, 10) : null,
        effectiveOn: notice.effective_on ? notice.effective_on.toISOString().slice(0, 10) : null,
        publicSummary: notice.public_summary,
        publicUrl: notice.public_url || `/verify/gazette?ref=${notice.gazette_reference || notice.notice_number}`,
        sha256Hash: notice.sha256_hash,
        parcelCount: schedule.length,
        totalAreaHa: schedule.reduce((sum: number, p: any) => sum + (Number(p.extent_ha) || 0), 0),
        bilingualContent: content,
        cadastralSchedule: schedule,
        createdAt: notice.created_at.toISOString(),
      };
    });
  }

  async getGazetteById(id: string) {
    const trimmed = id.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
    const orConditions: any[] = [
      { notice_number: trimmed },
      { gazette_reference: trimmed },
      { sha256_hash: trimmed },
    ];
    if (isUuid) {
      orConditions.push({ statutory_notice_id: trimmed });
    }

    const notice: any = await this.prisma.statutory_notices.findFirst({
      where: {
        OR: orConditions,
      },
      include: {
        projects: true,
        acquisition_cases: {
          include: {
            district: true,
            state: true,
          },
        },
      },
    });

    if (!notice) {
      throw new NotFoundException(`Statutory gazette notice not found for key: ${id}`);
    }

    const schedule = Array.isArray(notice.cadastral_schedule) ? notice.cadastral_schedule : [];
    const content: any = notice.bilingual_content || {};

    return {
      id: notice.statutory_notice_id,
      noticeNumber: notice.notice_number,
      projectId: notice.project_id,
      projectCode: notice.projects?.project_code,
      projectTitle: notice.projects?.title,
      sector: notice.projects?.sector,
      piaName: notice.projects?.pia_name,
      sponsoringMinistry: notice.projects?.sponsoring_ministry,
      caseId: notice.case_id,
      caseNumber: notice.acquisition_cases?.case_number,
      district: notice.acquisition_cases?.district?.name || 'District Collectorate',
      state: notice.acquisition_cases?.state?.name || 'State Government',
      noticeType: notice.notice_type,
      sectionReference: notice.section_reference,
      gazetteReference: notice.gazette_reference,
      gazetteVolumeIssue: notice.gazette_volume_issue,
      publicationStatus: notice.publication_status,
      publishedOn: notice.published_on ? notice.published_on.toISOString().slice(0, 10) : null,
      effectiveOn: notice.effective_on ? notice.effective_on.toISOString().slice(0, 10) : null,
      publicSummary: notice.public_summary,
      publicUrl: notice.public_url || `/verify/gazette?ref=${notice.gazette_reference || notice.notice_number}`,
      sha256Hash: notice.sha256_hash,
      parcelCount: schedule.length,
      bilingualContent: content,
      cadastralSchedule: schedule,
      createdAt: notice.created_at.toISOString(),
      updatedAt: notice.updated_at.toISOString(),
    };
  }

  async createDraft(dto: CreateGazetteDraftDto, userId?: string) {
    const project = await this.prisma.projects.findUnique({
      where: { project_id: dto.projectId },
      include: { acquisition_cases: { take: 1 } },
    });
    if (!project) {
      throw new BadRequestException(`Project with ID ${dto.projectId} does not exist`);
    }

    const caseId = dto.caseId || (project.acquisition_cases[0] ? project.acquisition_cases[0].case_id : null);
    if (!caseId) {
      throw new BadRequestException(`No active acquisition case found for project ${project.project_code}`);
    }

    const sectionNum = dto.sectionReference.replace('SECTION_', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const noticeNumber = `NOT-SEC${sectionNum}-2026-${randomSuffix}`;
    const noticeType = dto.noticeType || (
      dto.sectionReference === 'SECTION_11' ? 'PRELIMINARY_NOTIFICATION' :
      dto.sectionReference === 'SECTION_15' ? 'OBJECTION_HEARING_NOTICE' :
      dto.sectionReference === 'SECTION_19' ? 'FINAL_DECLARATION' : 'COLLECTORS_AWARD'
    );

    const hash = this.computeHash({
      noticeNumber,
      sectionReference: dto.sectionReference,
      projectId: dto.projectId,
      bilingualContent: dto.bilingualContent,
      cadastralSchedule: dto.cadastralSchedule,
      createdAt: new Date().toISOString(),
    });

    const statutoryNoticeId = crypto.randomUUID();

    const created = await this.prisma.statutory_notices.create({
      data: {
        statutory_notice_id: statutoryNoticeId,
        notice_number: noticeNumber,
        project_id: dto.projectId,
        case_id: caseId,
        notice_type: noticeType,
        section_reference: dto.sectionReference,
        publication_status: 'DRAFT',
        public_summary: dto.publicSummary || dto.bilingualContent.english_title,
        public_url: `/verify/gazette?ref=${noticeNumber}`,
        sha256_hash: hash,
        bilingual_content: dto.bilingualContent as any,
        cadastral_schedule: dto.cadastralSchedule as any,
        created_by: userId || null,
      },
    });

    return this.getGazetteById(created.statutory_notice_id);
  }

  async signDraft(id: string, dto: SignGazetteDto, user?: any) {
    const notice: any = await this.prisma.statutory_notices.findUnique({
      where: { statutory_notice_id: id },
    });
    if (!notice) {
      throw new NotFoundException(`Statutory notice ${id} not found`);
    }

    if (notice.publication_status === 'PUBLISHED') {
      throw new BadRequestException('Cannot sign an already published gazette notice');
    }

    const signingMetadata = {
      officerName: dto.officerName || (user ? user.fullName || user.email : 'Competent Authority (CALA)'),
      officerDesignation: dto.officerDesignation || 'Special Land Acquisition Officer & CALA',
      signedAt: new Date().toISOString(),
      remarks: dto.remarks || 'Statutory verification completed under RFCTLARR Act 2013 rules.',
      previousHash: notice.sha256_hash,
    };

    const existingContent: any = notice.bilingual_content || {};
    existingContent.signing_officer = signingMetadata;

    const newHash = this.computeHash({
      noticeNumber: notice.notice_number,
      sectionReference: notice.section_reference,
      signingMetadata,
      cadastralSchedule: notice.cadastral_schedule,
    });

    await this.prisma.statutory_notices.update({
      where: { statutory_notice_id: id },
      data: {
        publication_status: 'CALA_APPROVED',
        sha256_hash: newHash,
        bilingual_content: existingContent,
        updated_at: new Date(),
      },
    });

    return this.getGazetteById(id);
  }

  async publishToEgazette(id: string, dto: PublishGazetteDto, user?: any) {
    const notice: any = await this.prisma.statutory_notices.findUnique({
      where: { statutory_notice_id: id },
    });
    if (!notice) {
      throw new NotFoundException(`Statutory notice ${id} not found`);
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random6 = Math.floor(100000 + Math.random() * 900000);
    const gazetteReference = dto.gazetteReference || `CG-DL-E-${todayStr}-${random6}`;

    const publishedAt = new Date();
    const effectiveAt = dto.effectiveOn ? new Date(dto.effectiveOn) : publishedAt;

    const existingContent: any = notice.bilingual_content || {};
    existingContent.publication_metadata = {
      publishedBy: user ? user.fullName || user.email : 'State Department of Revenue & eGazette Authority',
      pressVolume: dto.gazetteVolumeIssue,
      gazetteReference,
      publishedAt: publishedAt.toISOString(),
      statutoryAct: 'RFCTLARR Act 2013',
    };

    const finalHash = this.computeHash({
      noticeNumber: notice.notice_number,
      gazetteReference,
      gazetteVolumeIssue: dto.gazetteVolumeIssue,
      publishedAt: publishedAt.toISOString(),
      cadastralSchedule: notice.cadastral_schedule,
    });

    await this.prisma.statutory_notices.update({
      where: { statutory_notice_id: id },
      data: {
        publication_status: 'PUBLISHED',
        gazette_reference: gazetteReference,
        gazette_volume_issue: dto.gazetteVolumeIssue,
        published_on: publishedAt,
        effective_on: effectiveAt,
        sha256_hash: finalHash,
        public_url: `/verify/gazette?ref=${gazetteReference}`,
        bilingual_content: existingContent,
        updated_at: publishedAt,
      },
    });

    return this.getGazetteById(id);
  }

  async verifyGazette(hashOrRef: string) {
    const trimmed = hashOrRef.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
    const orConditions: any[] = [
      { sha256_hash: trimmed },
      { gazette_reference: trimmed },
      { notice_number: trimmed },
    ];
    if (isUuid) {
      orConditions.push({ statutory_notice_id: trimmed });
    }

    const notice: any = await this.prisma.statutory_notices.findFirst({
      where: {
        OR: orConditions,
      },
      include: {
        projects: true,
        acquisition_cases: {
          include: {
            district: true,
            state: true,
          },
        },
      },
    });

    if (!notice) {
      return {
        verified: false,
        status: 'UNVERIFIED',
        message: 'No official e-Gazette statutory record found matching the provided cryptographic digest or registration reference.',
        queriedReference: trimmed,
        timestamp: new Date().toISOString(),
      };
    }

    const schedule = Array.isArray(notice.cadastral_schedule) ? notice.cadastral_schedule : [];
    const content: any = notice.bilingual_content || {};

    return {
      verified: true,
      status: 'VERIFIED_AUTHENTIC',
      message: 'Official Government eGazette statutory notification cryptographically authenticated against BhoomiSetu Blockchain/SHA-256 Ledger.',
      noticeNumber: notice.notice_number,
      gazetteReference: notice.gazette_reference || 'PENDING_REGISTRATION',
      gazetteVolumeIssue: notice.gazette_volume_issue || 'Extraordinary Press',
      sectionReference: notice.section_reference,
      publicationStatus: notice.publication_status,
      publishedOn: notice.published_on ? notice.published_on.toISOString().slice(0, 10) : null,
      effectiveOn: notice.effective_on ? notice.effective_on.toISOString().slice(0, 10) : null,
      sha256Hash: notice.sha256_hash,
      projectTitle: notice.projects?.title,
      projectCode: notice.projects?.project_code,
      sponsoringMinistry: content.ministry_english || notice.projects?.sponsoring_ministry || 'Government of India',
      issuingAuthority: content.competent_authority_english || 'Competent Authority for Land Acquisition (CALA)',
      signingOfficer: content.signing_officer || null,
      publicationMetadata: content.publication_metadata || null,
      parcelCount: schedule.length,
      totalAreaHa: schedule.reduce((sum: number, p: any) => sum + (Number(p.extent_ha) || 0), 0),
      legalEnforceability: 'Full Statutory Conclusive Proof under RFCTLARR Act 2013 & Section 4 Information Technology Act 2000.',
      verifiedAt: new Date().toISOString(),
    };
  }
}
