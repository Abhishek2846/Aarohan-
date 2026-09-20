export type DelayRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface DelayRiskEvaluation {
  score: number; // 0 to 100
  level: DelayRiskLevel;
  reasons: string[]; // e.g. ["Final gazette declaration overdue by 14 days", "Survey photos incomplete for 3 parcels"]
  recommendedActions: string[]; // e.g. ["Escalate to District Magistrate", "Schedule pending compensation hearing"]
  calculatedAt: string;
}

export interface DataQualityScore {
  score: number; // 0 to 100
  passedChecks: number;
  totalChecks: number;
  missingItems: string[]; // e.g. ["Gazette notification copy missing", "Survey boundary GPS points missing"]
}

export interface AcquisitionCase {
  id: string;
  caseNumber: string;
  projectId: string;
  projectName: string;
  state: string;
  district: string;
  currentStageId: string;
  currentStageName: string;
  stageUpdatedAt: string;
  slaDeadline: string;
  isSlaBreached: boolean;
  daysRemainingInSla: number;
  parcelsCount: number;
  totalAcquisitionAreaHa: number;
  totalBeneficiariesCount: number;
  dataQuality: DataQualityScore;
  delayRisk: DelayRiskEvaluation;
  estimatedCompensationINR: number;
  disbursedCompensationINR: number;
  assignedOfficer: {
    id: string;
    name: string;
    designation: string;
  };
  createdAt: string;
  updatedAt: string;
}
