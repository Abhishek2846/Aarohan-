import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AcquisitionCasesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCase(data: any, userId: string) {
    const defaultStage = await this.prisma.workflow_stage_definitions.findFirst({
      orderBy: { stage_order: 'asc' }
    });

    if (!defaultStage) throw new BadRequestException('Workflow stages not configured');

    const newCaseId = uuidv4();
    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + (defaultStage.default_sla_days || 30));

    let projectId = data.projectId || data.project_id;
    if (!projectId) {
      const firstProj = await this.prisma.projects.findFirst();
      projectId = firstProj ? firstProj.project_id : uuidv4();
    }

    const caseNumber = data.caseNumber || data.case_number || `LAC/2026/${Math.floor(100 + Math.random() * 900)}`;

    await this.prisma.$transaction(async (tx) => {
      await tx.acquisition_cases.create({
        data: {
          case_id: newCaseId,
          case_number: caseNumber,
          project_id: projectId,
          current_stage_code: defaultStage.stage_code,
          sla_deadline: slaDeadline,
          total_acquisition_area_ha: data.totalAcquisitionAreaHa || data.total_acquisition_area_ha || 15.5,
          created_by: userId,
          assigned_officer_user_id: data.assigned_officer_user_id || userId,
        }
      });

      await tx.case_stage_instances.create({
        data: {
          stage_instance_id: uuidv4(),
          case_id: newCaseId,
          stage_code: defaultStage.stage_code,
          sequence_no: 1,
          stage_status: 'IN_PROGRESS',
          due_at: slaDeadline,
          entered_at: new Date(),
        }
      });
    });

    return this.getCase(newCaseId);
  }


  async linkParcel(caseId: string, projectParcelId: string) {
    const projectParcel = await this.prisma.project_parcels.findUnique({
      where: { project_parcel_id: projectParcelId }
    });
    if (!projectParcel) throw new NotFoundException('Project Parcel not found');

    return this.prisma.$transaction(async (tx) => {
      const caseParcel = await tx.case_parcels.create({
        data: {
          case_parcel_id: uuidv4(),
          case_id: caseId,
          project_parcel_id: projectParcelId,
          acquired_area_ha: projectParcel.impacted_area_ha
        }
      });

      // Update case total area
      const allParcels = await tx.case_parcels.findMany({ where: { case_id: caseId } });
      const totalArea = allParcels.reduce((sum, cp) => sum + Number(cp.acquired_area_ha), 0);
      
      await tx.acquisition_cases.update({
        where: { case_id: caseId },
        data: { total_acquisition_area_ha: totalArea }
      });

      return caseParcel;
    });
  }

  async searchCases(filters: any) {
    const where: any = {};
    if (filters.project_id) where.project_id = filters.project_id;
    if (filters.projectId) where.project_id = filters.projectId;
    if (filters.status) where.case_status = filters.status;
    if (filters.stage) where.current_stage_code = filters.stage;
    if (filters.risk_level) where.delay_risk_level = filters.risk_level;
    if (filters.search) {
      where.OR = [
        { case_number: { contains: filters.search } },
        { projects: { title: { contains: filters.search } } },
      ];
    }

    const cases = await this.prisma.acquisition_cases.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        projects: { select: { project_code: true, title: true } },
        workflow_stage_definitions: { select: { display_name: true } },
        officer: { select: { user_id: true, full_name: true, designation: true } },
        case_parcels: { select: { case_parcel_id: true } },
      },
    });

    return cases.map((c) => ({
      id: c.case_id,
      caseNumber: c.case_number,
      projectId: c.project_id,
      projectName: c.projects?.title || 'Unknown Project',
      projectCode: c.projects?.project_code || 'PRJ-GEN',
      state: 'Karnataka',
      district: 'Bengaluru Rural',
      currentStageId: c.current_stage_code,
      currentStageName: c.workflow_stage_definitions?.display_name || c.current_stage_code,
      stageUpdatedAt: c.stage_updated_at?.toISOString() || c.updated_at.toISOString(),
      slaDeadline: c.sla_deadline?.toISOString() || new Date(Date.now() + 14 * 86400000).toISOString(),
      isSlaBreached: c.is_sla_breached ?? false,
      daysRemainingInSla: c.days_remaining_in_sla ?? 14,
      parcelsCount: c.case_parcels.length,
      totalAcquisitionAreaHa: Number(c.total_acquisition_area_ha || 0),
      totalBeneficiariesCount: c.total_beneficiaries_count || 0,
      dataQuality: {
        score: Number(c.data_quality_score || 85),
        passedChecks: Number(c.data_quality_passed_checks || 10),
        totalChecks: Number(c.data_quality_total_checks || 12),
      },
      delayRisk: {
        score: c.delay_risk_level === 'CRITICAL' ? 90 : c.delay_risk_level === 'HIGH' ? 75 : c.delay_risk_level === 'MEDIUM' ? 50 : 25,
        level: c.delay_risk_level || 'LOW',
      },
      estimatedCompensationINR: Number(c.estimated_compensation_inr || 15000000),
      disbursedCompensationINR: Number(c.disbursed_compensation_inr || 0),
      assignedOfficer: c.officer
        ? {
            id: c.officer.user_id,
            name: c.officer.full_name,
            designation: c.officer.designation || 'SLAO Officer',
          }
        : undefined,
      createdAt: c.created_at.toISOString(),
      updatedAt: c.updated_at.toISOString(),
    }));
  }

  async getCase(id: string) {
    const acCase = await this.prisma.acquisition_cases.findFirst({
      where: {
        OR: [{ case_id: id }, { case_number: id }],
      },
      include: {
        projects: true,
        workflow_stage_definitions: true,
        officer: {
          select: { user_id: true, full_name: true, designation: true },
        },
        case_stage_instances: {
          include: { workflow_stage_definitions: true },
          orderBy: { sequence_no: 'asc' },
        },
        case_parcels: {
          include: {
            project_parcels: {
              include: { parcels: true },
            },
          },
        },
        documents: {
          include: { document_types: true },
        },
      },
    });

    if (!acCase) throw new NotFoundException(`Case ${id} not found`);

    const daysRemaining = acCase.days_remaining_in_sla ?? 14;
    const isBreached = acCase.is_sla_breached ?? false;

    return {
      id: acCase.case_id,
      caseNumber: acCase.case_number,
      projectId: acCase.project_id,
      projectName: acCase.projects?.title || 'Unknown Project',
      projectCode: acCase.projects?.project_code || 'PRJ-GEN',
      state: 'Karnataka',
      district: 'Bengaluru Rural',
      currentStageId: acCase.current_stage_code,
      currentStageName: acCase.workflow_stage_definitions?.display_name || acCase.current_stage_code,
      stageUpdatedAt: acCase.stage_updated_at?.toISOString() || acCase.updated_at.toISOString(),
      slaDeadline: acCase.sla_deadline?.toISOString() || new Date(Date.now() + 14 * 86400000).toISOString(),
      isSlaBreached: isBreached,
      daysRemainingInSla: daysRemaining,
      parcelsCount: acCase.case_parcels.length,
      totalAcquisitionAreaHa: Number(acCase.total_acquisition_area_ha || 0),
      totalBeneficiariesCount: acCase.total_beneficiaries_count || 0,
      dataQuality: {
        score: Number(acCase.data_quality_score || 85),
        passedChecks: Number(acCase.data_quality_passed_checks || 10),
        totalChecks: Number(acCase.data_quality_total_checks || 12),
        missingItems: [
          'Khasra boundary verification confirmed by Revenue Inspector',
          'Notice publication newspaper clipping verified',
        ],
      },
      delayRisk: {
        score: isBreached ? 80 : 35,
        level: acCase.delay_risk_level || 'LOW',
        reasons: isBreached
          ? ['Statutory objection hearing window has elapsed']
          : ['All statutory notices currently within timeline'],
        recommendedActions: isBreached
          ? ['Schedule Special Land Acquisition Hearing', 'Notify District Magistrate']
          : ['Proceed with Section 19 declaration preparation'],
        calculatedAt: new Date().toISOString(),
      },
      estimatedCompensationINR: Number(acCase.estimated_compensation_inr || 15000000),
      disbursedCompensationINR: Number(acCase.disbursed_compensation_inr || 0),
      assignedOfficer: acCase.officer
        ? {
            id: acCase.officer.user_id,
            name: acCase.officer.full_name,
            designation: acCase.officer.designation || 'SLAO Officer',
          }
        : undefined,
      parcels: acCase.case_parcels.map((cp) => ({
        id: cp.case_parcel_id,
        projectParcelId: cp.project_parcel_id,
        ulpin: cp.project_parcels?.parcels?.ulpin || `ULPIN-${cp.case_parcel_id.slice(0, 8)}`,
        khasra: cp.project_parcels?.parcels?.survey_number || cp.project_parcels?.parcels?.khasra_number || '101/1',
        village: cp.project_parcels?.parcels?.village_name || 'Doddaballapur',
        areaHa: Number(cp.acquired_area_ha || 0),
        status: cp.case_parcel_status,
      })),
      stages: acCase.case_stage_instances.map((s) => ({
        id: s.stage_instance_id,
        stageCode: s.stage_code,
        stageName: s.workflow_stage_definitions?.display_name || s.stage_code,
        sequenceNo: s.sequence_no,
        status: s.stage_status,
        startedAt: s.entered_at,
        completedAt: s.completed_at,
        dueAt: s.due_at,
      })),
      documents: acCase.documents.map((d) => ({
        id: d.document_id,
        documentTypeCode: d.document_type_code,
        documentType: d.document_types?.display_name || d.document_type_code,
        title: d.title,
        status: d.approval_status,
        verified: d.approval_status === 'APPROVED',
        uploadedAt: d.created_at,
      })),
      createdAt: acCase.created_at.toISOString(),
      updatedAt: acCase.updated_at.toISOString(),
    };
  }

  async getCaseStages(caseId: string) {
    return this.prisma.case_stage_instances.findMany({
      where: { case_id: caseId },
      include: { workflow_stage_definitions: true },
      orderBy: { sequence_no: 'asc' },
    });
  }

  async updateCase(caseId: string, data: any) {
    const updated = await this.prisma.acquisition_cases.update({
      where: { case_id: caseId },
      data: {
        assigned_officer_user_id: data.assignedOfficerId || data.assigned_officer_user_id || undefined,
        current_stage_code: data.stageId || data.current_stage_code || undefined,
        stage_updated_at: data.stageId ? new Date() : undefined,
      },
    });
    return this.getCase(caseId);
  }

  async updateSlaRisk() {
    const now = new Date();
    const cases = await this.prisma.acquisition_cases.findMany({
      where: { case_status: 'ACTIVE', sla_deadline: { not: null } }
    });

    for (const c of cases) {
      if (!c.sla_deadline) continue;
      const daysRemaining = Math.floor((c.sla_deadline.getTime() - now.getTime()) / (1000 * 3600 * 24));
      
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (daysRemaining < 0) riskLevel = 'CRITICAL';
      else if (daysRemaining < 3) riskLevel = 'HIGH';
      else if (daysRemaining < 7) riskLevel = 'MEDIUM';

      await this.prisma.acquisition_cases.update({
        where: { case_id: c.case_id },
        data: { 
          days_remaining_in_sla: daysRemaining,
          is_sla_breached: daysRemaining < 0,
          delay_risk_level: riskLevel
        }
      });
    }
  }

  async getDistrictRosterData() {
    try {
      const [cases, surveys, awards, possessions, grievances, fieldTasks] = await Promise.all([
        this.prisma.acquisition_cases.findMany({
          include: {
            projects: true,
            case_parcels: {
              include: {
                project_parcels: {
                  include: {
                    parcels: true,
                  },
                },
              },
            },
          },
          orderBy: { stage_updated_at: 'desc' },
        }),
        this.prisma.field_surveys.findMany({ take: 10, orderBy: { surveyed_at: 'desc' } }),
        this.prisma.award_calculations.findMany({ take: 10, orderBy: { calculation_version: 'desc' } }),
        this.prisma.possession_records.findMany({ take: 10, orderBy: { handover_date: 'desc' } }),
        this.prisma.grievances.findMany({ take: 10, orderBy: { filed_at: 'desc' } }),
        (this.prisma as any).field_tasks.findMany({ take: 10, orderBy: { due_date: 'asc' } }),
      ]);

      return {
        cases: cases.map((c) => ({
          id: c.case_id,
          caseNumber: c.case_number,
          projectName: c.projects?.title || 'Bengaluru Infrastructure Corridor',
          stage: c.current_stage_code,
          status: c.case_status,
          totalAreaHa: Number(c.total_acquisition_area_ha || 0),
          beneficiariesCount: c.total_beneficiaries_count || 0,
          qualityScore: c.data_quality_score || 85,
          riskLevel: c.delay_risk_level || 'LOW',
          slaDaysRemaining: c.days_remaining_in_sla ?? 14,
          estimatedCompensation: Number(c.estimated_compensation_inr || 0),
          disbursedCompensation: Number(c.disbursed_compensation_inr || 0),
          parcelsCount: c.case_parcels.length,
        })),
        surveys,
        awards,
        possessions,
        grievances,
        fieldTasks,
      };
    } catch (error) {
      console.error('Error fetching district roster data:', error);
      return { cases: [], surveys: [], awards: [], possessions: [], grievances: [], fieldTasks: [] };
    }
  }
}
