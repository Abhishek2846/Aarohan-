export type ParcelStatus =
  | "IDENTIFIED"
  | "SURVEY_PENDING"
  | "SURVEY_COMPLETED"
  | "OBJECTION_LOGGED"
  | "AWARDED"
  | "COMPENSATION_DISBURSED"
  | "POSSESSION_ACQUIRED"
  | "LITIGATION_DISPUTED";

export interface LandParcel {
  id: string;
  ulpin: string; // 14-character authoritative parcel identifier
  surveyNumber: string; // e.g. "142/2A"
  khasraNumber: string;
  state: string;
  district: string;
  taluk: string;
  village: string;
  totalAreaHa: number;
  acquiredAreaHa: number;
  landUseCategory: "AGRICULTURAL" | "COMMERCIAL" | "RESIDENTIAL" | "FOREST_WATER" | "GOVERNMENT";
  status: ParcelStatus;
  // Official view vs Citizen privacy masking
  ownerReference: string; // "OWN-99482-A"
  ownerNameMasked?: string; // "R**** K****"
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  disputed: boolean;
  disputeReason?: string;
  estimatedMarketValueINR: number;
  awardAmountINR?: number;
}

export interface ParcelDigitalTwin extends LandParcel {
  caseId: string;
  projectId: string;
  projectName: string;
  notifications: {
    sectionId: string;
    publishedDate: string;
    gazetteRef: string;
  }[];
  objections: {
    id: string;
    filingDate: string;
    category: string;
    status: "PENDING" | "HEARING_SCHEDULED" | "RESOLVED" | "DISMISSED";
    resolutionNotes?: string;
  }[];
  fieldSurveyEvidence: {
    surveyedAt: string;
    surveyorName: string;
    gpsCoords: [number, number];
    photos: string[];
    demarcationConfirmed: boolean;
  }[];
  compensationRecord?: {
    awardDate: string;
    totalAmountINR: number;
    pfmsReference: string;
    paymentStatus: "PENDING" | "PROCESSING" | "CREDITED" | "FAILED";
    disbursedDate?: string;
  };
  possessionRecord?: {
    handoverDate: string;
    officerMemoUrl: string;
    physicalEvidencePhotos: string[];
    isPossessionComplete: boolean;
  };
  tamperEvidentAuditChain: {
    timestamp: string;
    action: string;
    actor: string;
    previousHash: string;
    currentHash: string;
  }[];
}
