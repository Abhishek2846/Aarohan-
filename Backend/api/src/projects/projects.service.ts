import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(data: any, userId?: string) {
    const newProjectId = uuidv4();
    const projectCode = data.projectCode || data.project_code || `PRJ-${Date.now().toString().slice(-6)}`;
    const budget = data.estimatedBudgetINR || data.estimated_budget_inr || 5000000000;
    const totalArea = data.totalAcquisitionAreaHa || data.total_acquisition_area_ha || 120;
    const validUserId = userId && userId.length > 10 ? userId : undefined;

    let primaryStateId = data.primaryStateJurisdictionId || data.primary_state_jurisdiction_id;
    if (!primaryStateId && data.state) {
      const stateJurisdiction = await this.prisma.jurisdictions.findFirst({
        where: {
          OR: [
            { name: { contains: data.state, mode: 'insensitive' } },
            { jurisdiction_code: { equals: data.state, mode: 'insensitive' } },
          ],
        },
      });
      if (stateJurisdiction) {
        primaryStateId = stateJurisdiction.jurisdiction_id;
      }
    }

    await this.prisma.projects.create({
      data: {
        project_id: newProjectId,
        project_code: projectCode,
        title: data.title || 'Untitled Infrastructure Project',
        sector: data.sector || 'HIGHWAYS',
        pia_name: data.piaName || data.pia_name || 'NHAI',
        estimated_budget_inr: budget,
        total_acquisition_area_ha: totalArea,
        project_status: data.status || data.project_status || 'PLANNING',
        primary_state_jurisdiction_id: primaryStateId || undefined,
        start_date: data.startDate || data.start_date ? new Date(data.startDate || data.start_date) : new Date(),
        target_completion_date: data.targetCompletionDate || data.target_completion_date ? new Date(data.targetCompletionDate || data.target_completion_date) : null,
        created_by: validUserId,
        updated_by: validUserId,
        pia_user_id: validUserId,
      },
    });

    if (Array.isArray(data.districts) && data.districts.length > 0) {
      for (const distName of data.districts) {
        const distJurisdiction = await this.prisma.jurisdictions.findFirst({
          where: {
            name: { contains: distName, mode: 'insensitive' },
          },
        });
        if (distJurisdiction) {
          await this.prisma.project_jurisdictions.create({
            data: {
              project_id: newProjectId,
              jurisdiction_id: distJurisdiction.jurisdiction_id,
              is_primary: false,
            },
          }).catch(() => {});
        }
      }
    }

    return this.getProject(newProjectId);
  }


  async assignPia(projectId: string, piaUserId: string) {
    return this.prisma.projects.update({
      where: { project_id: projectId },
      data: { pia_user_id: piaUserId }
    });
  }

  async addJurisdiction(projectId: string, jurisdictionId: string, isPrimary: boolean) {
    if (isPrimary) {
      await this.prisma.projects.update({
        where: { project_id: projectId },
        data: { primary_state_jurisdiction_id: jurisdictionId }
      });
    }
    return this.prisma.project_jurisdictions.create({
      data: {
        project_id: projectId,
        jurisdiction_id: jurisdictionId,
        is_primary: isPrimary
      }
    });
  }

  async searchProjects(filters: any) {
    const where: any = { archived_at: null };
    if (filters.status && filters.status !== 'ALL') where.project_status = filters.status;
    if (filters.sector) where.sector = filters.sector;
    if (filters.state) where.primary_state_jurisdiction_id = filters.state;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { project_code: { contains: filters.search } },
        { pia_name: { contains: filters.search } },
      ];
    }

    const projects = await this.prisma.projects.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        primary_state: true,
        project_jurisdictions: { include: { jurisdictions: true } },
        acquisition_cases: { select: { case_id: true } },
        project_parcels: { select: { project_parcel_id: true } },
      },
    });

    return projects.map((p) => {
      const districts = p.project_jurisdictions.map((pj) => pj.jurisdictions?.name).filter(Boolean);
      return {
        id: p.project_id,
        projectCode: p.project_code,
        title: p.title,
        sector: p.sector,
        piaName: p.pia_name || 'NHAI',
        state: p.primary_state?.name || 'Karnataka',
        districts: districts.length > 0 ? districts : ['Bengaluru Rural'],
        estimatedBudgetINR: Number(p.estimated_budget_inr || 4500000000),
        totalAcquisitionAreaHa: 120,
        startDate: p.start_date ? p.start_date.toISOString().split('T')[0] : '2024-03-15',
        targetCompletionDate: p.target_completion_date ? p.target_completion_date.toISOString().split('T')[0] : '2027-06-30',
        status: p.project_status,
        casesCount: p.acquisition_cases.length,
        affectedParcelsCount: p.project_parcels.length,
        createdAt: p.created_at.toISOString(),
        updatedAt: p.updated_at.toISOString(),
      };
    });
  }

  async getProject(projectId: string) {
    const project = await this.prisma.projects.findFirst({
      where: {
        OR: [{ project_id: projectId }, { project_code: projectId }],
      },
      include: {
        primary_state: true,
        project_jurisdictions: { include: { jurisdictions: true } },
        pia_user: { select: { full_name: true, email: true } },
        acquisition_cases: {
          include: {
            workflow_stage_definitions: true,
            case_parcels: true,
          },
        },
        project_parcels: {
          include: { parcels: true },
        },
      },
    });
    if (!project) throw new NotFoundException('Project not found');

    const districts = project.project_jurisdictions.map((pj) => pj.jurisdictions?.name).filter(Boolean);

    return {
      id: project.project_id,
      projectCode: project.project_code,
      title: project.title,
      sector: project.sector,
      piaName: project.pia_name || 'National Highways Authority of India (NHAI)',
      state: project.primary_state?.name || 'Karnataka',
      districts: districts.length > 0 ? districts : ['Bengaluru Rural'],
      estimatedBudgetINR: Number(project.estimated_budget_inr || 4500000000),
      totalAcquisitionAreaHa: 120,
      startDate: project.start_date ? project.start_date.toISOString().split('T')[0] : '2024-03-15',
      targetCompletionDate: project.target_completion_date ? project.target_completion_date.toISOString().split('T')[0] : '2027-06-30',
      status: project.project_status,
      casesCount: project.acquisition_cases.length,
      affectedParcelsCount: project.project_parcels.length,
      cases: project.acquisition_cases.map((c) => ({
        id: c.case_id,
        caseNumber: c.case_number,
        currentStageName: c.workflow_stage_definitions?.display_name || c.current_stage_code,
        parcelsCount: c.case_parcels.length,
        status: c.case_status,
      })),
      createdAt: project.created_at.toISOString(),
      updatedAt: project.updated_at.toISOString(),
    };
  }

  async updateProject(projectId: string, data: any) {
    await this.prisma.projects.update({
      where: { project_id: projectId },
      data: {
        title: data.title,
        project_status: data.status || data.project_status,
        pia_name: data.piaName || data.pia_name,
        estimated_budget_inr: data.estimatedBudgetINR || data.estimated_budget_inr,
      },
    });
    return this.getProject(projectId);
  }

  async getProjectAlignments(projectId: string) {
    return this.prisma.project_alignments.findMany({
      where: { project_id: projectId },
      orderBy: { version_no: 'desc' },
    });
  }

  async getProjectProgress(projectId: string) {
    const cases = await this.prisma.acquisition_cases.findMany({
      where: { project_id: projectId },
      select: { case_status: true, total_acquisition_area_ha: true }
    });

    const totalArea = cases.reduce((sum, c) => sum + Number(c.total_acquisition_area_ha), 0);
    const completedArea = cases
      .filter(c => c.case_status === 'COMPLETED')
      .reduce((sum, c) => sum + Number(c.total_acquisition_area_ha), 0);

    return {
      totalCases: cases.length,
      completedCases: cases.filter(c => c.case_status === 'COMPLETED').length,
      totalAreaHa: totalArea,
      completedAreaHa: completedArea,
      progressPercentage: totalArea > 0 ? (completedArea / totalArea) * 100 : 0
    };
  }
}
