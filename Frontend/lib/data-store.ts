import { Project } from "@/types/project";
import { AcquisitionCase } from "@/types/case";
import { LandParcel } from "@/types/parcel";

export interface SystemDocument {
  id: string;
  documentNumber: string;
  title: string;
  category: "GAZETTE" | "SURVEY_REPORT" | "AWARD_ORDER" | "POSSESSION_MEMO" | "OBJECTION_RECORD";
  projectId: string;
  projectName: string;
  caseId?: string;
  caseNumber?: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: string;
  version: string;
  latestVersionId?: string;
  sha256Hash: string;
  approvalStatus: "PENDING_APPROVAL" | "APPROVED" | "RETURNED_FOR_REVISION";
  approvalNotes?: string;
  approvedBy?: string;
  downloadUrl?: string;
  versions: {
    version: string;
    uploadedAt: string;
    uploadedBy: string;
    sha256Hash: string;
    changeSummary: string;
  }[];
}

export interface AffectedFamilyRecord {
  id: string;
  familyHeadName: string;
  vulnerabilityCategory: "SC" | "ST" | "BPL" | "WOMAN_HEADED" | "GENERAL";
  familyMembersCount: number;
  caseId: string;
  caseNumber: string;
  displacedFromVillage: string;
  housingGrantStatus: "ELIGIBLE" | "SANCTIONED" | "DISBURSED";
  subsistenceAllowanceStatus: "ELIGIBLE" | "SANCTIONED" | "DISBURSED";
  totalEntitlementINR: number;
  disbursedAmountINR: number;
}

export interface PossessionRecord {
  id: string;
  memoNumber: string;
  caseId: string;
  caseNumber: string;
  parcelsCount: number;
  totalAreaHa: number;
  handoverDate: string;
  takenOverByAgency: string;
  panchanamaWitnesses: string[];
  fieldOfficerName: string;
  panchanamaSigned: boolean;
  status: "SCHEDULED" | "COMPLETED" | "DISPUTED";
  remarks: string;
  evidencePhotosCount: number;
}

export interface PublicGrievance {
  id: string;
  grievanceRef: string;
  citizenPhone: string;
  ulpin: string;
  category: string;
  details: string;
  status: "LOGGED" | "HEARING_SCHEDULED" | "RESOLVED" | "DISMISSED";
  filedAt: string;
  slaDeadlineDays: number;
  hearingDate?: string;
}

// Initial Mock Seed Data
const INITIAL_PROJECTS: Project[] = [
  {
    id: "PRJ-NHAI-01",
    projectCode: "NHAI/EXP/DEL-MUM/PKG-04",
    title: "Delhi-Mumbai Expressway (Vadodara-Kim Section)",
    sector: "National Highways & Expressways",
    piaName: "National Highways Authority of India (NHAI)",
    state: "Gujarat",
    districts: ["Vadodara", "Bharuch", "Surat"],
    estimatedBudgetINR: 42500000000,
    totalAcquisitionAreaHa: 480.25,
    startDate: "2024-03-15",
    targetCompletionDate: "2027-06-30",
    status: "IN_PROGRESS",
    casesCount: 8,
    affectedParcelsCount: 1240,
    createdAt: "2024-03-15T10:00:00Z",
    updatedAt: "2026-09-08T12:00:00Z",
  },
  {
    id: "PRJ-DFCC-02",
    projectCode: "DFCCIL/WDFC/REWARI-MUM/02",
    title: "Western Dedicated Freight Corridor (Rewari-JNPT)",
    sector: "Railways & Dedicated Freight Corridors",
    piaName: "Dedicated Freight Corridor Corporation (DFCCIL)",
    state: "Rajasthan",
    districts: ["Alwar", "Jaipur", "Ajmer"],
    estimatedBudgetINR: 58000000000,
    totalAcquisitionAreaHa: 620.1,
    startDate: "2023-11-01",
    targetCompletionDate: "2026-12-31",
    status: "IN_PROGRESS",
    casesCount: 12,
    affectedParcelsCount: 1890,
    createdAt: "2023-11-01T09:00:00Z",
    updatedAt: "2026-09-07T15:30:00Z",
  },
  {
    id: "PRJ-STRR-03",
    projectCode: "KRDCL/STRR/BLR-RURAL/01",
    title: "Bengaluru Satellite Town Ring Road (STRR) - Package 2",
    sector: "Metro Rail & Urban Infrastructure",
    piaName: "Karnataka Road Development Corp (KRDCL)",
    state: "Karnataka",
    districts: ["Bengaluru Rural", "Ramanagara"],
    estimatedBudgetINR: 28000000000,
    totalAcquisitionAreaHa: 310.5,
    startDate: "2025-01-10",
    targetCompletionDate: "2028-03-31",
    status: "IN_PROGRESS",
    casesCount: 5,
    affectedParcelsCount: 840,
    createdAt: "2025-01-10T11:00:00Z",
    updatedAt: "2026-09-09T08:00:00Z",
  },
];

const INITIAL_CASES: AcquisitionCase[] = [
  {
    id: "CAS-01",
    caseNumber: "LAC/2026/DEL-MUM/089",
    projectId: "PRJ-NHAI-01",
    projectName: "Delhi-Mumbai Expressway (Vadodara-Kim Section)",
    state: "Gujarat",
    district: "Vadodara",
    currentStageId: "AWARD_ENACTED",
    currentStageName: "Award Inquiry & Calculation (Section 23)",
    stageUpdatedAt: "2026-09-01T10:00:00Z",
    slaDeadline: "2026-09-20T18:00:00Z",
    isSlaBreached: true,
    daysRemainingInSla: -12,
    parcelsCount: 312,
    totalAcquisitionAreaHa: 142.4,
    totalBeneficiariesCount: 420,
    dataQuality: {
      score: 82,
      passedChecks: 9,
      totalChecks: 11,
      missingItems: [
        "Khasra survey boundary confirmation pending for Parcel 402/1A",
        "Public notice newspaper clipping verification awaiting SLA signoff",
      ],
    },
    delayRisk: {
      score: 74,
      level: "HIGH",
      reasons: [
        "Section 19 declaration overdue by 12 days for taluk Channapatna",
        "3 public objections filed regarding solatium multiplier awaiting SDM hearing",
        "Joint field survey pending for 4 forest-buffer parcels",
      ],
      recommendedActions: [
        "Schedule Special District Hearing",
        "Notify State Principal Secretary",
        "Deploy Mobile Field Officer PWA",
      ],
      calculatedAt: "2026-09-09T10:00:00Z",
    },
    estimatedCompensationINR: 2850000000,
    disbursedCompensationINR: 2100000000,
    assignedOfficer: {
      id: "usr_dist_01",
      name: "Priya Sundaram, IAS",
      designation: "District Magistrate & SLAO",
    },
    createdAt: "2025-02-14T09:00:00Z",
    updatedAt: "2026-09-09T12:00:00Z",
  },
  {
    id: "CAS-02",
    caseNumber: "LAC/2026/STRR/KA-042",
    projectId: "PRJ-STRR-03",
    projectName: "Bengaluru Satellite Town Ring Road (STRR) - Package 2",
    state: "Karnataka",
    district: "Bengaluru Rural",
    currentStageId: "OBJECTIONS_HEARING",
    currentStageName: "Public Objections & Hearing (Section 15)",
    stageUpdatedAt: "2026-08-25T11:30:00Z",
    slaDeadline: "2026-09-28T18:00:00Z",
    isSlaBreached: false,
    daysRemainingInSla: 18,
    parcelsCount: 185,
    totalAcquisitionAreaHa: 89.2,
    totalBeneficiariesCount: 260,
    dataQuality: {
      score: 91,
      passedChecks: 10,
      totalChecks: 11,
      missingItems: ["Environmental Clearance certificate copy pending upload"],
    },
    delayRisk: {
      score: 45,
      level: "MEDIUM",
      reasons: ["Objection hearings scheduled across two taluk centers"],
      recommendedActions: ["Expedite taluk revenue inspector reports"],
      calculatedAt: "2026-09-09T10:00:00Z",
    },
    estimatedCompensationINR: 1940000000,
    disbursedCompensationINR: 450000000,
    assignedOfficer: {
      id: "usr_dist_02",
      name: "N. Venkatesh, KAS",
      designation: "Special Land Acquisition Officer",
    },
    createdAt: "2025-05-20T10:30:00Z",
    updatedAt: "2026-09-08T16:00:00Z",
  },
];

const INITIAL_DOCUMENTS: SystemDocument[] = [
  {
    id: "DOC-01",
    documentNumber: "GOI-GAZ-2026-SEC11-094",
    title: "Section 11(1) Preliminary Notification Gazette (English & Hindi)",
    category: "GAZETTE",
    projectId: "PRJ-NHAI-01",
    projectName: "Delhi-Mumbai Expressway Pkg 4",
    caseId: "CAS-01",
    caseNumber: "LAC/2026/DEL-MUM/089",
    uploadedBy: "Priya Sundaram, IAS",
    uploadedAt: "12 May 2026",
    fileSize: "2.4 MB (PDF/A)",
    version: "v2.0",
    sha256Hash: "8a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
    approvalStatus: "APPROVED",
    approvedBy: "Rajeshwar Rao (Principal Secretary)",
    versions: [
      {
        version: "v2.0",
        uploadedAt: "12 May 2026",
        uploadedBy: "Priya Sundaram, IAS",
        sha256Hash: "8a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
        changeSummary: "Incorporated Gazette Extraordinary corrections for Channapatna taluk",
      },
      {
        version: "v1.0",
        uploadedAt: "28 Apr 2026",
        uploadedBy: "Vikram Malhotra (PIA)",
        sha256Hash: "3f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f",
        changeSummary: "Initial draft preliminary notification with preliminary parcel schedules",
      },
    ],
  },
  {
    id: "DOC-02",
    documentNumber: "SRV-REP-2026-BLR-018",
    title: "Joint Field Survey & Demarcation Report with GPS Boundaries",
    category: "SURVEY_REPORT",
    projectId: "PRJ-STRR-03",
    projectName: "Bengaluru STRR Ring Road",
    caseId: "CAS-02",
    caseNumber: "LAC/2026/STRR/KA-042",
    uploadedBy: "Suresh Patil (Field Surveyor)",
    uploadedAt: "18 Aug 2026",
    fileSize: "5.8 MB (GeoJSON + PDF)",
    version: "v1.0",
    sha256Hash: "9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
    approvalStatus: "APPROVED",
    approvedBy: "Priya Sundaram, IAS",
    versions: [
      {
        version: "v1.0",
        uploadedAt: "18 Aug 2026",
        uploadedBy: "Suresh Patil (Field Surveyor)",
        sha256Hash: "9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
        changeSummary: "Demarcation verification of 185 parcels with differential GPS coordinates",
      },
    ],
  },
];

// Helper to access LocalStorage safely
class DataStore {
  private getStorage<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Storage write error", e);
    }
  }

  // Projects CRUD
  getProjects(): Project[] {
    return this.getStorage<Project[]>("bhoomi_projects", INITIAL_PROJECTS);
  }

  getProjectById(id: string): Project | undefined {
    return this.getProjects().find((p) => p.id === id || p.projectCode === id);
  }

  addProject(project: Omit<Project, "id" | "casesCount" | "affectedParcelsCount" | "createdAt" | "updatedAt">): Project {
    const projects = this.getProjects();
    const newPrj: Project = {
      ...project,
      id: `PRJ-${Date.now()}`,
      casesCount: 0,
      affectedParcelsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects.unshift(newPrj);
    this.setStorage("bhoomi_projects", projects);
    return newPrj;
  }

  updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const projects = this.getProjects();
    const idx = projects.findIndex((p) => p.id === id || p.projectCode === id);
    if (idx === -1) return undefined;
    projects[idx] = {
      ...projects[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.setStorage("bhoomi_projects", projects);
    return projects[idx];
  }

  // Cases CRUD
  getCases(): AcquisitionCase[] {
    return this.getStorage<AcquisitionCase[]>("bhoomi_cases", INITIAL_CASES);
  }

  getCaseById(id: string): AcquisitionCase | undefined {
    return this.getCases().find((c) => c.id === id || c.caseNumber === id);
  }

  addCase(caseData: Partial<AcquisitionCase>): AcquisitionCase {
    const cases = this.getCases();
    const newCase: AcquisitionCase = {
      id: `CAS-${Date.now()}`,
      caseNumber: `LAC/2026/${caseData.district?.toUpperCase().slice(0, 3) || "GEN"}/${Math.floor(100 + Math.random() * 900)}`,
      projectId: caseData.projectId || "PRJ-NHAI-01",
      projectName: caseData.projectName || "Default Infrastructure Project",
      state: caseData.state || "Karnataka",
      district: caseData.district || "Bengaluru Rural",
      currentStageId: "PROPOSAL_SUBMITTED",
      currentStageName: "Proposal Submitted",
      stageUpdatedAt: new Date().toISOString(),
      slaDeadline: new Date(Date.now() + 30 * 86400000).toISOString(),
      isSlaBreached: false,
      daysRemainingInSla: 30,
      parcelsCount: caseData.parcelsCount || 1,
      totalAcquisitionAreaHa: caseData.totalAcquisitionAreaHa || 1.2,
      totalBeneficiariesCount: caseData.totalBeneficiariesCount || 2,
      dataQuality: {
        score: 65,
        passedChecks: 6,
        totalChecks: 11,
        missingItems: ["Joint field survey pending", "Section 11 notification pending"],
      },
      delayRisk: {
        score: 25,
        level: "LOW",
        reasons: ["Case freshly initiated"],
        recommendedActions: ["Assign field surveyor"],
        calculatedAt: new Date().toISOString(),
      },
      estimatedCompensationINR: caseData.estimatedCompensationINR || 25000000,
      disbursedCompensationINR: 0,
      assignedOfficer: {
        id: "usr_dist_01",
        name: "Priya Sundaram, IAS",
        designation: "District Magistrate & SLAO",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    cases.unshift(newCase);
    this.setStorage("bhoomi_cases", cases);
    return newCase;
  }

  updateCaseStage(caseId: string, newStageId: string, newStageName: string): AcquisitionCase | undefined {
    const cases = this.getCases();
    const idx = cases.findIndex((c) => c.id === caseId);
    if (idx === -1) return undefined;

    cases[idx] = {
      ...cases[idx],
      currentStageId: newStageId,
      currentStageName: newStageName,
      stageUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dataQuality: {
        ...cases[idx].dataQuality,
        score: Math.min(100, cases[idx].dataQuality.score + 5),
      },
    };
    this.setStorage("bhoomi_cases", cases);
    return cases[idx];
  }

  // Documents CRUD
  getDocuments(): SystemDocument[] {
    return this.getStorage<SystemDocument[]>("bhoomi_documents", INITIAL_DOCUMENTS);
  }

  addDocument(doc: Omit<SystemDocument, "id" | "uploadedAt" | "version" | "approvalStatus" | "versions">): SystemDocument {
    const docs = this.getDocuments();
    const newDoc: SystemDocument = {
      ...doc,
      id: `DOC-${Date.now()}`,
      uploadedAt: "Just now",
      version: "v1.0",
      approvalStatus: "PENDING_APPROVAL",
      versions: [
        {
          version: "v1.0",
          uploadedAt: "Just now",
          uploadedBy: doc.uploadedBy,
          sha256Hash: doc.sha256Hash,
          changeSummary: "Initial official statutory document upload",
        },
      ],
    };
    docs.unshift(newDoc);
    this.setStorage("bhoomi_documents", docs);
    return newDoc;
  }

  updateDocumentApproval(docId: string, status: "APPROVED" | "RETURNED_FOR_REVISION", notes: string, approver: string): void {
    const docs = this.getDocuments();
    const idx = docs.findIndex((d) => d.id === docId);
    if (idx !== -1) {
      docs[idx].approvalStatus = status;
      docs[idx].approvalNotes = notes;
      docs[idx].approvedBy = approver;
      this.setStorage("bhoomi_documents", docs);
    }
  }
}

export const dataStore = new DataStore();
