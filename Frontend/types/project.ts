export interface Project {
  id: string;
  projectCode: string;
  title: string;
  sector: string;
  piaName: string;
  state: string;
  districts: string[];
  estimatedBudgetINR: number;
  totalAcquisitionAreaHa: number;
  startDate: string;
  targetCompletionDate: string;
  alignmentGeoJson?: GeoJSON.FeatureCollection | GeoJSON.Feature;
  status: "PLANNING" | "IN_PROGRESS" | "STALLED" | "COMPLETED";
  casesCount: number;
  affectedParcelsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type InfrastructureProject = Project;

export interface ImpactSimulationResult {
  projectAlignmentId: string;
  totalAffectedParcels: number;
  totalAffectedAreaHa: number;
  landUseBreakdown: {
    agriculturalHa: number;
    commercialHa: number;
    residentialHa: number;
    forestWaterHa: number;
  };
  estimatedFamiliesAffected: number;
  estimatedCompensationINR: number;
  highRiskParcelsCount: number;
  districtBreakdown: { districtName: string; parcelCount: number; areaHa: number }[];
}
