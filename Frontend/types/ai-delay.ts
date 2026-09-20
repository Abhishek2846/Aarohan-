export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface ProjectShapFactor {
  factor: string;
  category: 'LAND_GIS' | 'FINANCIAL_DBT' | 'LEGAL_DISPUTES' | 'STATUTORY_VELOCITY' | 'DISTRICT_ADMIN';
  shapWeight: number; // Signed percentage (+24.5 or -14.2)
  impactDays: number; // Signed delay days impact (+32 or -18)
  direction: 'RISK_INCREASING' | 'RISK_MITIGATING';
  isMitigating: boolean;
  featureValue: string;
  description: string;
  descriptionHi: string;
}

export interface PrescriptiveAction {
  id: string;
  actionTitle: string;
  actionTitleHi: string;
  urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM';
  statutoryReference: string;
  description: string;
  expectedDelayReductionDays: number;
  expectedRiskReductionPct: number;
}

export interface ProjectDelayRiskAssessment {
  projectId: string;
  projectCode: string;
  title: string;
  sector: string;
  evaluatedAt: string;
  lifecycleCheckpoint: string;
  stageCode: string;

  // 90-Day Delay Threshold
  isLikelyToCross90DayDelay: boolean;
  delayThresholdDays: number;
  delayProbability: number; // 0.00 to 1.00
  delayProbabilityPct: number; // 0.0% to 100.0%
  predictedDelayDays: number;
  daysToThreshold: number;

  // Risk Classification
  riskLevel: RiskLevel;
  riskScore: number;
  confidenceScorePct: number;
  confidenceIntervalDays: [number, number];

  // Dominant Risk Signal
  dominantRiskCategory: string;
  dominantRiskFactor: string;
  dominantRiskImpactPct: number;
  primaryBottleneckStage: string;

  // TreeSHAP Attributions
  shapFactors: ProjectShapFactor[];
  riskIncreasingFactors: ProjectShapFactor[];
  riskMitigatingFactors: ProjectShapFactor[];

  // Actionable Prescriptions
  prescriptiveActions: PrescriptiveAction[];
  featureValues: Record<string, any>;
  modelMetadata: {
    modelType: string;
    targetThreshold: string;
    calibrationMethod: string;
    explainedVariancePct: number;
    trainingSampleSize: number;
  };
}

export interface LifecycleRiskSnapshot {
  snapshotId: string;
  projectId: string;
  lifecycleCheckpoint: string;
  stageCode: string;
  snapshotDate: string;
  delayProbabilityPct: number;
  riskLevel: RiskLevel;
  predictedDelayDays: number;
  confidenceScorePct: number;
  dominantRiskCategory: string;
  dominantRiskFactor?: string;
}

export interface PrioritizedProjectItem {
  priorityRank: number;
  projectId: string;
  projectCode: string;
  title: string;
  sector: string;
  riskLevel: RiskLevel;
  delayProbabilityPct: number;
  predictedDelayDays: number;
  isLikelyToCross90DayDelay: boolean;
  dominantRiskFactor: string;
  dominantRiskCategory: string;
  topPrescriptiveAction: string;
  estimatedBudgetINR: number;
  totalAreaHa: number;
}

export interface PortfolioRiskSummary {
  totalActiveProjects: number;
  projectsCrossing90DayThreshold: number;
  projectsCrossingThresholdPct: number;
  portfolioAverageDelayProbPct: number;
  strategicCapitalAtRiskINR: number;
  landAreaAtRiskHa: number;

  distribution: {
    criticalCount: number;
    criticalPct: number;
    highCount: number;
    highPct: number;
    moderateCount: number;
    moderatePct: number;
    lowCount: number;
    lowPct: number;
  };

  sectorBreakdown: {
    sector: string;
    projectCount: number;
    avgDelayProbabilityPct: number;
    highOrCriticalCount: number;
  }[];

  prioritizedLeaderboard: PrioritizedProjectItem[];
}

export interface WhatIfSimulationResult {
  projectId: string;
  baseline: {
    delayProbabilityPct: number;
    riskLevel: RiskLevel;
    predictedDelayDays: number;
  };
  simulated: {
    delayProbabilityPct: number;
    riskLevel: RiskLevel;
    predictedDelayDays: number;
  };
  impact: {
    probabilityDeltaPct: number;
    daysSaved: number;
    riskLevelShift: string;
    isDelayCrossAvoided: boolean;
  };
  simulatedShapFactors: ProjectShapFactor[];
  implementedInterventions: string[];
}
