import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class NocWorkflowActionDto {
  @IsString()
  @IsNotEmpty()
  actionType!: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  documentRef?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
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
  coordinates: [number, number][];
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  remedyAction: string;
  remedyActionHi: string;
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
  nocs: any[];
  spatialConflicts: SpatialConflictPolygon[];
  availableLayers: any[];
}
