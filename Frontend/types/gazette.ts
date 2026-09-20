export type StatutorySection = 'SECTION_11' | 'SECTION_15' | 'SECTION_19' | 'SECTION_23_30';

export type PublicationStatus = 'DRAFT' | 'CALA_APPROVED' | 'PUBLISHED' | 'RESCINDED';

export interface CadastralParcel {
  ulpin: string;
  survey_no: string;
  village: string;
  taluk: string;
  district: string;
  extent_ha: number;
  land_use: string;
  owner_name: string;
  award_inr?: number;
}

export interface BilingualContent {
  hindi_title: string;
  english_title: string;
  ministry_hindi: string;
  ministry_english: string;
  competent_authority_hindi: string;
  competent_authority_english: string;
  hindi_body: string;
  english_body: string;
  solatium_pct?: number;
  additional_interest_pct?: number;
  multiplier_factor?: number;
  total_award_inr?: number;
  hearing_date?: string;
  hearing_venue_hindi?: string;
  hearing_venue_english?: string;
  objection_days?: number;
  gazette_category?: string;
  tax_exemption_clause?: string;
  signing_officer?: {
    officerName: string;
    officerDesignation: string;
    signedAt: string;
    remarks: string;
  };
  publication_metadata?: {
    publishedBy: string;
    pressVolume: string;
    gazetteReference: string;
    publishedAt: string;
    statutoryAct: string;
  };
}

export interface GazetteNotice {
  id: string;
  noticeNumber: string;
  projectId: string;
  projectCode?: string;
  projectTitle?: string;
  sector?: string;
  piaName?: string;
  caseId?: string;
  caseNumber?: string;
  district: string;
  state: string;
  noticeType: string;
  sectionReference: StatutorySection;
  gazetteReference?: string;
  gazetteVolumeIssue?: string;
  publicationStatus: PublicationStatus;
  publishedOn?: string | null;
  effectiveOn?: string | null;
  publicSummary?: string;
  publicUrl: string;
  sha256Hash: string;
  parcelCount: number;
  totalAreaHa: number;
  bilingualContent: BilingualContent;
  cadastralSchedule: CadastralParcel[];
  createdAt: string;
  updatedAt?: string;
}

export interface GazetteVerificationResult {
  verified: boolean;
  status: string;
  message: string;
  queriedReference?: string;
  noticeNumber?: string;
  gazetteReference?: string;
  gazetteVolumeIssue?: string;
  sectionReference?: string;
  publicationStatus?: string;
  publishedOn?: string | null;
  effectiveOn?: string | null;
  sha256Hash?: string;
  projectTitle?: string;
  projectCode?: string;
  sponsoringMinistry?: string;
  issuingAuthority?: string;
  signingOfficer?: {
    officerName: string;
    officerDesignation: string;
    signedAt: string;
    remarks: string;
  } | null;
  publicationMetadata?: {
    publishedBy: string;
    pressVolume: string;
    gazetteReference: string;
    publishedAt: string;
    statutoryAct: string;
  } | null;
  parcelCount?: number;
  totalAreaHa?: number;
  legalEnforceability?: string;
  verifiedAt: string;
}
