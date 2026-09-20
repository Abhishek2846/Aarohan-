export class PublicParcelMapDto {
  id!: string;
  village!: string;
  district!: string;
  state!: string;
  status!: string;
  areaHa!: number;
  coordinates!: [number, number][]; // Generalized or authorized
}

export class PiaParcelMapDto {
  id!: string;
  ulpin!: string;
  khasra!: string;
  surveyNo!: string;
  village!: string;
  district!: string;
  areaHa!: number;
  landCategory!: string;
  status!: string;
  estimatedAwardINR!: number;
  coordinates!: [number, number][];
}

export class FieldSurveyParcelDto {
  id!: string;
  ulpin!: string;
  surveyNo!: string;
  coordinates!: [number, number][];
  status!: string;
  dueDate?: string;
  priority?: string;
}

export class DistrictParcelDto {
  id!: string;
  ulpin!: string;
  village!: string;
  district!: string;
  status!: string;
  surveyCompletion!: number;
  coordinates!: [number, number][];
  disputed!: boolean;
}

export class StateMonitoringParcelDto {
  id!: string;
  district!: string;
  status!: string;
  areaHa!: number;
  coordinates!: [number, number][]; // Generalized
}

export class AuditorParcelDto {
  id!: string;
  ulpin!: string;
  surveyNo!: string;
  status!: string;
  coordinates!: [number, number][];
  evidencePoints!: [number, number][];
  documentCompletenessScore!: number;
}
