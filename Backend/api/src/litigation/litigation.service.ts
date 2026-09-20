import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LitigationService {
  constructor(private readonly prisma: PrismaService) {}

  async fileLitigation(data: {
    courtName: string;
    caseNumber: string;
    caseId?: string;
    parcelId?: string;
    description?: string;
    userId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const litigation = await tx.litigation_cases.create({
        data: {
          litigation_id: uuidv4(),
          court_name: data.courtName,
          case_number: data.caseNumber,
          case_id: data.caseId,
          parcel_id: data.parcelId,
          description: data.description,
          created_by: data.userId,
          litigation_status: 'FILED'
        }
      });

      // Escalation Risk
      if (data.caseId) {
        await tx.acquisition_cases.update({
          where: { case_id: data.caseId },
          data: { delay_risk_level: 'CRITICAL' }
        });
      }

      return litigation;
    });
  }

  async updateLitigationStatus(litigationId: string, status: any) {
    return this.prisma.litigation_cases.update({
      where: { litigation_id: litigationId },
      data: { litigation_status: status }
    });
  }

  async getLitigations(filters?: any) {
    const where: any = {};
    if (filters?.caseId) where.case_id = filters.caseId;
    if (filters?.status && filters.status !== 'ALL') where.litigation_status = filters.status;

    const cases = await this.prisma.litigation_cases.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    const caseIds = cases.map((c) => c.case_id).filter(Boolean) as string[];
    const acqCases =
      caseIds.length > 0
        ? await this.prisma.acquisition_cases.findMany({
            where: { case_id: { in: caseIds } },
            include: { projects: { select: { title: true, project_code: true } } },
          })
        : [];
    const acqCaseMap = new Map(acqCases.map((ac) => [ac.case_id, ac]));

    const parcelIds = cases.map((c) => c.parcel_id).filter(Boolean) as string[];
    const parcelsList =
      parcelIds.length > 0
        ? await this.prisma.parcels.findMany({
            where: { parcel_id: { in: parcelIds } },
            select: { parcel_id: true, ulpin: true, village_name: true, survey_number: true },
          })
        : [];
    const parcelMap = new Map(parcelsList.map((p) => [p.parcel_id, p]));

    return cases.map((c) => {
      const ac = c.case_id ? acqCaseMap.get(c.case_id) : null;
      const p = c.parcel_id ? parcelMap.get(c.parcel_id) : null;
      return {
        id: c.litigation_id,
        courtName: c.court_name,
        caseNumber: c.case_number,
        caseId: c.case_id,
        caseRef: ac?.case_number,
        projectName: ac?.projects?.title,
        parcelId: c.parcel_id,
        ulpin: p?.ulpin,
        village: p?.village_name,
        surveyNo: p?.survey_number,
        description: c.description,
        status: c.litigation_status,
        createdAt: c.created_at.toISOString(),
        updatedAt: c.updated_at.toISOString(),
      };
    });
  }
}
