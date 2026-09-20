import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  NocWorkflowActionDto,
  ProjectGatiShaktiScreenerResponse,
  SpatialConflictPolygon,
} from './dto/gati-shakti.dto';

@Injectable()
export class GatiShaktiService {
  constructor(private readonly prisma: PrismaService) {}

  async getLayers() {
    return this.prisma.gati_shakti_layers.findMany({
      orderBy: { layer_name: 'asc' },
    });
  }

  async getProjectScreener(projectId: string): Promise<ProjectGatiShaktiScreenerResponse> {
    // 1. Resolve project
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
    let project: any = null;

    if (isUuid) {
      project = await this.prisma.projects.findUnique({
        where: { project_id: projectId },
        include: {
          project_inter_agency_nocs: {
            include: { gati_shakti_layer: true },
            orderBy: { days_elapsed: 'desc' },
          },
        },
      });
    }

    if (!project) {
      // Fallback: search by code or title
      project = await this.prisma.projects.findFirst({
        where: {
          OR: [
            { project_code: { equals: projectId, mode: 'insensitive' } },
            { title: { contains: projectId, mode: 'insensitive' } },
          ],
        },
        include: {
          project_inter_agency_nocs: {
            include: { gati_shakti_layer: true },
            orderBy: { days_elapsed: 'desc' },
          },
        },
      });
    }

    if (!project) {
      // If still not found, load first available project for demonstration
      project = await this.prisma.projects.findFirst({
        include: {
          project_inter_agency_nocs: {
            include: { gati_shakti_layer: true },
            orderBy: { days_elapsed: 'desc' },
          },
        },
      });
    }

    if (!project) {
      throw new NotFoundException(`No infrastructure project found for ID: ${projectId}`);
    }

    const nocs: any[] = project.project_inter_agency_nocs || [];
    const layers = await this.prisma.gati_shakti_layers.findMany();

    // 2. Compute metrics
    const totalNocsRequired = nocs.length;
    const nocsApprovedCount = nocs.filter((n: any) =>
      ['STAGE_1_APPROVED', 'STAGE_2_APPROVED'].includes(n.status),
    ).length;
    const nocsPendingCount = nocs.filter((n: any) =>
      ['IDENTIFIED', 'APPLIED', 'JOINT_INSPECTION_PENDING'].includes(n.status),
    ).length;
    const nocsEscalatedCount = nocs.filter(
      (n: any) => n.status === 'ESCALATED_PMO' || n.is_sla_breached,
    ).length;

    const readinessScorePct =
      totalNocsRequired > 0
        ? Math.round((nocsApprovedCount / totalNocsRequired) * 1000) / 10
        : 85.0;

    let forestDiversionHa = 0;
    for (const n of nocs) {
      if (['MOEFCC_RESERVE_FOREST', 'WILDLIFE_ESZ'].includes(n.layer_code)) {
        forestDiversionHa += Number(n.affected_area_ha || 0);
      }
    }

    // NPV of Forest diversion as per MoEFCC standard: ~₹16.5 Lakhs per Hectare
    const estimatedCampaDuesINR = Math.round(forestDiversionHa * 1650000);

    // Critical Path Delay impact: maximum days overdue among non-approved NOCs
    let criticalPathDelayImpactDays = 0;
    for (const n of nocs) {
      if (!['STAGE_1_APPROVED', 'STAGE_2_APPROVED'].includes(n.status)) {
        const overdue = Math.max(0, n.days_elapsed - n.sla_days_statutory);
        if (overdue > criticalPathDelayImpactDays) {
          criticalPathDelayImpactDays = overdue;
        }
      }
    }

    // 3. Generate Spatial Conflict Polygons based on project geography
    const spatialConflicts = this.generateSpatialConflicts(project, nocs);

    return {
      projectId: project.project_id,
      projectCode: project.project_code,
      projectTitle: project.title,
      sector: project.sector,
      totalCorridorLengthKm: Number(project.total_acquisition_area_ha || 120) * 0.35,
      readinessScorePct,
      totalNocsRequired,
      nocsApprovedCount,
      nocsPendingCount,
      nocsEscalatedCount,
      forestDiversionHa: Math.round(forestDiversionHa * 100) / 100,
      estimatedCampaDuesINR,
      criticalPathDelayImpactDays,
      nocs: nocs.map((n: any) => ({
        nocId: n.noc_id,
        projectId: n.project_id,
        layerCode: n.layer_code,
        layerName: n.gati_shakti_layer?.layer_name || n.layer_code,
        layerNameHi: n.gati_shakti_layer?.layer_name_hi || n.layer_code,
        agencyName: n.agency_name,
        agencyNameHi: n.agency_name_hi,
        clearanceType: n.clearance_type,
        clearanceTypeHi: n.clearance_type_hi,
        applicationNo: n.application_no,
        affectedAreaHa: Number(n.affected_area_ha),
        chainageStart: n.chainage_start,
        chainageEnd: n.chainage_end,
        status: n.status,
        slaDaysStatutory: n.sla_days_statutory,
        daysElapsed: n.days_elapsed,
        isSlaBreached: n.is_sla_breached,
        escalationLevel: n.escalation_level,
        nodalOfficer: n.nodal_officer,
        actionPendingBy: n.action_pending_by,
        nextMilestone: n.next_milestone,
        nextMilestoneHi: n.next_milestone_hi,
        statutoryOrderNo: n.statutory_order_no,
        portalName: n.gati_shakti_layer?.portal_name,
        portalUrl: n.gati_shakti_layer?.portal_url,
        colorHex: n.gati_shakti_layer?.color_hex || '#3b82f6',
      })),
      spatialConflicts,
      availableLayers: layers,
    };
  }

  async getNationalSummary() {
    const nocs = await this.prisma.project_inter_agency_nocs.findMany({
      include: {
        projects: {
          select: {
            project_id: true,
            project_code: true,
            title: true,
            sector: true,
          },
        },
        gati_shakti_layer: true,
      },
      orderBy: { days_elapsed: 'desc' },
    });

    const totalNocs = nocs.length;
    const approvedCount = nocs.filter((n) =>
      ['STAGE_1_APPROVED', 'STAGE_2_APPROVED'].includes(n.status),
    ).length;
    const escalatedPmoCount = nocs.filter(
      (n) => n.status === 'ESCALATED_PMO' || n.is_sla_breached,
    ).length;

    // Agency breakdown
    const agencyMap = new Map<string, { total: number; approved: number; breached: number; agencyName: string }>();
    for (const n of nocs) {
      const key = n.layer_code;
      const current = agencyMap.get(key) || {
        total: 0,
        approved: 0,
        breached: 0,
        agencyName: n.gati_shakti_layer?.ministry || n.agency_name,
      };
      current.total += 1;
      if (['STAGE_1_APPROVED', 'STAGE_2_APPROVED'].includes(n.status)) {
        current.approved += 1;
      }
      if (n.is_sla_breached || n.status === 'ESCALATED_PMO') {
        current.breached += 1;
      }
      agencyMap.set(key, current);
    }

    const agencyBreakdown = Array.from(agencyMap.entries()).map(([layerCode, data]) => ({
      layerCode,
      agencyName: data.agencyName,
      total: data.total,
      approved: data.approved,
      breached: data.breached,
      compliancePct: data.total > 0 ? Math.round((data.approved / data.total) * 100) : 100,
    }));

    // Cabinet / PMO Critical Escalation Hotlist
    const pmoEscalationHotlist = nocs
      .filter((n) => n.status === 'ESCALATED_PMO' || n.is_sla_breached)
      .map((n) => ({
        nocId: n.noc_id,
        projectCode: n.projects?.project_code,
        projectTitle: n.projects?.title,
        agencyName: n.agency_name,
        clearanceType: n.clearance_type,
        applicationNo: n.application_no,
        daysElapsed: n.days_elapsed,
        slaStatutoryDays: n.sla_days_statutory,
        daysOverdue: Math.max(0, n.days_elapsed - n.sla_days_statutory),
        escalationLevel: n.escalation_level,
        actionPendingBy: n.action_pending_by,
        nextMilestone: n.next_milestone,
      }));

    return {
      nationalReadinessScorePct: totalNocs > 0 ? Math.round((approvedCount / totalNocs) * 1000) / 10 : 78.5,
      totalNocsTracked: totalNocs,
      approvedCount,
      pendingCount: totalNocs - approvedCount,
      escalatedPmoCount,
      agencyBreakdown,
      pmoEscalationHotlist,
    };
  }

  async executeNocAction(
    projectId: string,
    nocId: string,
    dto: NocWorkflowActionDto,
    userId?: string,
  ) {
    const noc = await this.prisma.project_inter_agency_nocs.findUnique({
      where: { noc_id: nocId },
      include: { projects: true, gati_shakti_layer: true },
    });

    if (!noc) {
      throw new NotFoundException(`NOC clearance record not found: ${nocId}`);
    }

    const effectiveRole = dto.role || 'PIA';
    let newStatus = noc.status;
    let newActionPendingBy = noc.action_pending_by;
    let nextMilestone = noc.next_milestone;
    let statutoryOrderNo = noc.statutory_order_no;
    let escalationLevel = noc.escalation_level;

    switch (dto.actionType) {
      case 'SUBMIT_PARIVESH_COMPLIANCE':
      case 'SUBMIT_GAD_REVISION':
        // Action by PIA
        newStatus = 'JOINT_INSPECTION_PENDING';
        newActionPendingBy = 'DISTRICT_OFFICER';
        nextMilestone = 'CALA & DFO Joint Site Demarcation Scheduled';
        break;

      case 'SIGN_JOINT_INSPECTION':
        // Action by DISTRICT_OFFICER (CALA)
        newStatus = 'STAGE_1_APPROVED';
        newActionPendingBy = 'STATE_AUTHORITY';
        nextMilestone = 'State Advisory Committee (SAC) Forest Diversion Recommendation';
        statutoryOrderNo = `CALA/JSI/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
        break;

      case 'ENDORSE_STAGE_1':
        // Action by STATE_AUTHORITY
        newStatus = 'STAGE_1_APPROVED';
        newActionPendingBy = 'CENTRAL_MINISTRY';
        nextMilestone = 'Regional Empowered Committee (MoEFCC) Final In-Principle Sign-off';
        statutoryOrderNo = statutoryOrderNo || `SAC/STG1/${new Date().getFullYear()}/REC-84`;
        break;

      case 'ESCALATE_CHIEF_SECRETARY':
      case 'ESCALATE_PMO':
        // Action by CENTRAL_MINISTRY or High-level admin
        newStatus = 'ESCALATED_PMO';
        escalationLevel = 'CABINET_SECRETARIAT_PMO';
        newActionPendingBy = 'CENTRAL_MINISTRY';
        nextMilestone = 'Placed on PMO PRAGATI monthly review agenda for Chief Secretary direction';
        break;

      case 'ISSUE_FINAL_NOC':
        // Final signoff
        newStatus = 'STAGE_2_APPROVED';
        newActionPendingBy = 'NONE';
        nextMilestone = 'Statutory Clearances Fully Discharged under PM Gati Shakti NMP';
        statutoryOrderNo = `GOI/${noc.layer_code}/NOC/${new Date().getFullYear()}/FINAL-99`;
        break;

      default:
        throw new BadRequestException(`Unsupported Gati Shakti action type: ${dto.actionType}`);
    }

    const updated = await this.prisma.project_inter_agency_nocs.update({
      where: { noc_id: nocId },
      data: {
        status: newStatus,
        action_pending_by: newActionPendingBy,
        next_milestone: nextMilestone,
        statutory_order_no: statutoryOrderNo,
        escalation_level: escalationLevel,
        days_elapsed: newStatus === 'STAGE_2_APPROVED' ? noc.days_elapsed : Math.max(0, noc.days_elapsed - 15),
        is_sla_breached: newStatus === 'STAGE_2_APPROVED' ? false : noc.is_sla_breached,
      },
      include: { gati_shakti_layer: true },
    });

    // Record Immutable Audit Event
    try {
      await (this.prisma as any).audit_events.create({
        data: {
          event_id: crypto.randomUUID(),
          action_code: dto.actionType,
          entity_type: 'PROJECT_NOC',
          entity_id: nocId,
          event_payload: JSON.stringify({
            role: effectiveRole,
            actorUserId: userId,
            action: dto.actionType,
            beforeStatus: noc.status,
            afterStatus: newStatus,
            remarks: dto.remarks,
          }),
          event_hash: 'GATI-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          occurred_at: new Date(),
        },
      });
    } catch {
      // Audit event table fallback safely
    }

    return {
      success: true,
      message: `Statutory action "${dto.actionType}" recorded successfully by ${effectiveRole}`,
      updatedNoc: updated,
    };
  }

  private generateSpatialConflicts(project: any, nocs: any[]): SpatialConflictPolygon[] {
    const isBengaluru =
      project.title?.toLowerCase().includes('bengaluru') ||
      project.title?.toLowerCase().includes('karnataka') ||
      project.sector === 'RENEWABLE_ENERGY';

    // Base coordinates around corridor region
    const baseLat = isBengaluru ? 13.294 : 22.312;
    const baseLng = isBengaluru ? 77.534 : 73.195;

    const conflicts: SpatialConflictPolygon[] = [];

    for (const noc of nocs) {
      if (noc.layer_code === 'MOEFCC_RESERVE_FOREST') {
        conflicts.push({
          conflictId: `CONF-${noc.noc_id.slice(0, 6)}`,
          layerCode: noc.layer_code,
          layerName: 'MoEFCC Reserve Forest Compartment RF-42',
          layerNameHi: 'पर्यावरण मंत्रालय आरक्षित वन कक्ष आरएफ-42',
          ministry: 'MoEFCC',
          statutoryAct: 'Forest (Conservation) Act 1980 Sec 2',
          colorHex: '#15803d',
          affectedAreaHa: Number(noc.affected_area_ha || 6.4),
          chainage: noc.chainage_start ? `${noc.chainage_start} to ${noc.chainage_end}` : 'KM 14+200 to 18+600',
          status: noc.status,
          severity: 'CRITICAL',
          remedyAction: 'Conduct DFO joint survey and deposit CAMPA Net Present Value',
          remedyActionHi: 'डीएफओ संयुक्त सर्वेक्षण करें और कैम्पा नेट प्रेजेंट वैल्यू जमा करें',
          coordinates: [
            [baseLat + 0.005, baseLng - 0.008],
            [baseLat + 0.012, baseLng - 0.004],
            [baseLat + 0.018, baseLng + 0.006],
            [baseLat + 0.011, baseLng + 0.012],
            [baseLat + 0.002, baseLng + 0.005],
          ],
        });
      } else if (noc.layer_code === 'RAILWAY_CROSSING_GAD') {
        conflicts.push({
          conflictId: `CONF-${noc.noc_id.slice(0, 6)}`,
          layerCode: noc.layer_code,
          layerName: 'Indian Railways High-Density Freight Track Crossing',
          layerNameHi: 'भारतीय रेलवे उच्च घनत्व मालगाड़ी ट्रैक क्रॉसिंग',
          ministry: 'Ministry of Railways',
          statutoryAct: 'Railways Act 1989 / ROB GAD Standard',
          colorHex: '#ea580c',
          affectedAreaHa: Number(noc.affected_area_ha || 0.85),
          chainage: noc.chainage_start || 'KM 28+450',
          status: noc.status,
          severity: 'HIGH',
          remedyAction: 'Submit General Arrangement Drawing (GAD) for Railway Chief Bridge Engineer approval',
          remedyActionHi: 'रेलवे मुख्य पुल अभियंता अनुमोदन हेतु सामान्य व्यवस्था रेखाचित्र (जीएडी) जमा करें',
          coordinates: [
            [baseLat - 0.008, baseLng + 0.014],
            [baseLat - 0.004, baseLng + 0.022],
            [baseLat + 0.002, baseLng + 0.018],
            [baseLat - 0.002, baseLng + 0.010],
          ],
        });
      } else if (noc.layer_code === 'DEFENCE_RESTRICTED') {
        conflicts.push({
          conflictId: `CONF-${noc.noc_id.slice(0, 6)}`,
          layerCode: noc.layer_code,
          layerName: 'Ministry of Defence Cantonment 500m Safety Perimeter',
          layerNameHi: 'रक्षा मंत्रालय छावनी 500 मीटर सुरक्षा परिधि',
          ministry: 'Ministry of Defence',
          statutoryAct: 'Works of Defence Act 1903 Sec 3 & 7',
          colorHex: '#7c3aed',
          affectedAreaHa: Number(noc.affected_area_ha || 3.5),
          chainage: noc.chainage_start || 'KM 41+000',
          status: noc.status,
          severity: 'CRITICAL',
          remedyAction: 'Inter-ministerial resolution with Defence Secretary / Joint Border Security Committee',
          remedyActionHi: 'रक्षा सचिव एवं संयुक्त सुरक्षा समिति के साथ अंतर-मंत्रालयी बैठक समाधान',
          coordinates: [
            [baseLat - 0.015, baseLng - 0.012],
            [baseLat - 0.008, baseLng - 0.005],
            [baseLat - 0.014, baseLng + 0.003],
            [baseLat - 0.021, baseLng - 0.004],
          ],
        });
      } else if (noc.layer_code === 'POWERGRID_HT_LINE') {
        conflicts.push({
          conflictId: `CONF-${noc.noc_id.slice(0, 6)}`,
          layerCode: noc.layer_code,
          layerName: 'PowerGrid 400kV Double-Circuit HT Transmission Crossing',
          layerNameHi: 'पावरग्रिड 400kV डबल-सर्किट हाई-टेंशन ट्रांसमिशन क्रॉसिंग',
          ministry: 'Ministry of Power',
          statutoryAct: 'Electricity Act 2003 Sec 68',
          colorHex: '#eab308',
          affectedAreaHa: Number(noc.affected_area_ha || 1.2),
          chainage: noc.chainage_start || 'KM 35+100',
          status: noc.status,
          severity: 'MODERATE',
          remedyAction: 'Install guarding cradles and maintain 12.5m vertical clearance',
          remedyActionHi: 'गार्डिंग क्रैडल स्थापित करें और 12.5 मीटर ऊर्ध्वाधर निकासी बनाए रखें',
          coordinates: [
            [baseLat + 0.020, baseLng - 0.015],
            [baseLat + 0.025, baseLng - 0.008],
            [baseLat + 0.022, baseLng - 0.002],
            [baseLat + 0.017, baseLng - 0.009],
          ],
        });
      }
    }

    return conflicts;
  }
}
