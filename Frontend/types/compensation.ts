export interface AwardCalculation {
  parcelId: string;
  ulpin: string;
  baseMarketRatePerSqm: number;
  multiplierFactor: number;
  totalMarketValueINR: number;
  solatiumINR: number; // 100% statutory solatium under RFCTLARR Act
  additionalInterestINR: number; // 12% per annum interest
  assetsOnLandINR: number; // Trees, structures, crops
  grossAwardINR: number;
}

export interface BeneficiaryRecord {
  id: string;
  beneficiaryRef: string;
  maskedName: string;
  sharePercentage: number;
  calculatedAmountINR: number;
  disbursementStatus: "PENDING" | "INITIATED" | "CREDITED" | "BOUNCED";
  pfmsTransactionId?: string;
  bankAccountMasked?: string;
  ifscMasked?: string;
  disbursedDate?: string;
}

export interface PFMSPaymentBatch {
  batchId: string;
  caseId: string;
  totalBeneficiaries: number;
  totalAmountINR: number;
  status: "CREATED" | "SENT_TO_TREASURY" | "ACKNOWLEDGED" | "COMPLETED" | "PARTIALLY_FAILED";
  initiatedAt: string;
  completedAt?: string;
}
