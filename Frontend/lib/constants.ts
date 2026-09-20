import { UserRole } from "@/types/user";

export const APP_NAME = "BhoomiSetu";
export const APP_TAGLINE = "National Land Acquisition Management Platform";
export const APP_SUBTITLE = "Smart India Hackathon 2026 • Problem Statement SIH26016";

export const USER_ROLES: { id: UserRole; label: string; description: string; badgeVariant: string }[] = [
  {
    id: "PIA",
    label: "Project Agency (NHAI / Rail / Infra)",
    description: "Plan project routes and submit land acquisition proposals",
    badgeVariant: "default",
  },
  {
    id: "CENTRAL_MINISTRY",
    label: "Central Ministry (National Oversight)",
    description: "National dashboard, project progress, and interstate tracking",
    badgeVariant: "secondary",
  },
  {
    id: "STATE_AUTHORITY",
    label: "State Revenue Department",
    description: "Approve projects, issue state orders, and route cases to districts",
    badgeVariant: "outline",
  },
  {
    id: "DISTRICT_OFFICER",
    label: "District Magistrate / Land Officer (CALA / DM)",
    description: "Farmer hearings, land verification, and final compensation approval",
    badgeVariant: "default",
  },
  {
    id: "FIELD_OFFICER",
    label: "Field Surveyor (Ground Land Survey)",
    description: "Field visits, measuring plot boundaries, and taking geotagged photos",
    badgeVariant: "secondary",
  },
  {
    id: "AUDITOR",
    label: "Compliance Auditor (Inspection & Verification)",
    description: "Verify records, check compensation bank payments, and inspect legal integrity",
    badgeVariant: "outline",
  },
  {
    id: "CITIZEN",
    label: "Farmer & Landowner Portal (नागरिक व किसान पोर्टल)",
    description: "Check your land details, compensation money status, and submit objections",
    badgeVariant: "default",
  },
];

export const WORKFLOW_STAGES = [
  { id: "PROPOSAL_SUBMITTED", label: "Stage 1: Project Proposal & Route Planning", order: 1 },
  { id: "ALIGNMENT_REVIEW", label: "Stage 2: Route & Land Boundary Check", order: 2 },
  { id: "PARCEL_IDENTIFICATION", label: "Stage 3: Identifying Land Plots & Survey Nos.", order: 3 },
  { id: "STATE_APPROVAL", label: "Stage 4: State Government Sanction", order: 4 },
  { id: "DISTRICT_SURVEY", label: "Stage 5: Joint Field Survey on Ground", order: 5 },
  { id: "NOTIFICATION_PUBLISHED", label: "Stage 6: First Land Notice Published (Section 11)", order: 6 },
  { id: "OBJECTIONS_HEARING", label: "Stage 7: Farmer Hearing & Objections (Section 15)", order: 7 },
  { id: "AWARD_ENACTED", label: "Stage 8: Final Compensation Decision (Section 23)", order: 8 },
  { id: "COMPENSATION_DISBURSED", label: "Stage 9: Money Sent to Bank Account (PFMS / DBT)", order: 9 },
  { id: "POSSESSION_HANDOVER", label: "Stage 10: Handing Over Land to Govt (Section 38)", order: 10 },
  { id: "RR_COMPLETED", label: "Stage 11: Family Relocation & Resettlement (R&R)", order: 11 },
  { id: "CASE_CLOSED", label: "Stage 12: Case Completed & Closed", order: 12 },
] as const;

export const SECTOR_TYPES = [
  "National Highways & Expressways",
  "Railways & Dedicated Freight Corridors",
  "Renewable Energy & Solar Parks",
  "Metro Rail & Urban Infrastructure",
  "Ports, Inland Waterways & Logistics",
  "Industrial Corridors & Smart Cities",
] as const;
