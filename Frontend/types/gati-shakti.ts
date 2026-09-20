export interface GatiShaktiLayer {
  layer_id: string;
  layer_code: string;
  layer_name: string;
  layer_name_hi: string;
  ministry: string;
  statutory_act: string;
  portal_name: string;
  portal_url?: string;
  color_hex: string;
  buffer_default_m: number;
  is_critical: boolean;
}

export interface GatiShaktiNoc {
  nocId: string;
  projectId: string;
  layerCode: string;
  layerName: string;
  layerNameHi: string;
  agencyName: string;
  agencyNameHi?: string;
  clearanceType: string;
  clearanceTypeHi?: string;
  applicationNo: string;
  affectedAreaHa: number;
  chainageStart?: string;
  chainageEnd?: string;
  status:
    | 'IDENTIFIED'
    | 'APPLIED'
    | 'JOINT_INSPECTION_PENDING'
    | 'STAGE_1_APPROVED'
    | 'STAGE_2_APPROVED'
    | 'ESCALATED_PMO'
    | 'REJECTED';
  slaDaysStatutory: number;
  daysElapsed: number;
  isSlaBreached: boolean;
  escalationLevel:
    | 'NONE'
    | 'DISTRICT_COLLECTOR'
    | 'STATE_CHIEF_SECRETARY'
    | 'CABINET_SECRETARIAT_PMO';
  nodalOfficer?: string;
  actionPendingBy:
    | 'PIA'
    | 'DISTRICT_OFFICER'
    | 'STATE_AUTHORITY'
    | 'CENTRAL_MINISTRY'
    | 'NONE';
  nextMilestone: string;
  nextMilestoneHi?: string;
  statutoryOrderNo?: string;
  portalName?: string;
  portalUrl?: string;
  colorHex?: string;
}

export interface SpatialConflictPolygon {
  conflictId: string;
  layerCode: string;
  layerName: string;
  layerNameHi: string;
  ministry: string;
  statutoryAct: string;
  colorHex: string;
  affectedAreaHa: number;
  chainage: string;
  status: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  remedyAction: string;
  remedyActionHi: string;
  coordinates: [number, number][];
}

export interface ProjectGatiShaktiScreenerResponse {
  projectId: string;
  projectCode: string;
  projectTitle: string;
  sector: string;
  totalCorridorLengthKm: number;
  readinessScorePct: number;
  totalNocsRequired: number;
  nocsApprovedCount: number;
  nocsPendingCount: number;
  nocsEscalatedCount: number;
  forestDiversionHa: number;
  estimatedCampaDuesINR: number;
  criticalPathDelayImpactDays: number;
  nocs: GatiShaktiNoc[];
  spatialConflicts: SpatialConflictPolygon[];
  availableLayers: GatiShaktiLayer[];
}

export interface AgencyBreakdown {
  layerCode: string;
  agencyName: string;
  total: number;
  approved: number;
  breached: number;
  compliancePct: number;
}

export interface PmoEscalationItem {
  nocId: string;
  projectCode: string;
  projectTitle: string;
  agencyName: string;
  clearanceType: string;
  applicationNo: string;
  daysElapsed: number;
  slaStatutoryDays: number;
  daysOverdue: number;
  escalationLevel: string;
  actionPendingBy: string;
  nextMilestone: string;
}

export interface NationalGatiShaktiSummary {
  nationalReadinessScorePct: number;
  totalNocsTracked: number;
  approvedCount: number;
  pendingCount: number;
  escalatedPmoCount: number;
  agencyBreakdown: AgencyBreakdown[];
  pmoEscalationHotlist: PmoEscalationItem[];
}
