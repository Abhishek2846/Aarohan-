import { z } from "zod";

export const projectFormSchema = z.object({
  name: z.string().min(3, "Project corridor name must be at least 3 characters long."),
  code: z.string().min(3, "Project code is required (e.g. NHAI/EXP/2026/01)."),
  description: z.string().optional(),
  sponsoringAgency: z.string().min(2, "Sponsoring agency is required."),
  centralMinistry: z.string().min(2, "Central ministry is required."),
  estimatedLandHectares: z.coerce.number().positive("Land extent must be greater than 0 Hectares."),
  totalBudgetINR: z.coerce.number().positive("Estimated budget must be positive."),
  corridorLengthKm: z.coerce.number().positive("Corridor length must be greater than 0 Km."),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const caseFormSchema = z.object({
  caseNumber: z.string().min(4, "Statutory docket number is required (e.g. CASE-2026-009)."),
  projectId: z.string().min(1, "Associated infrastructure project is required."),
  taluk: z.string().min(2, "Taluk / Tehsil name is required."),
  district: z.string().min(2, "District is required."),
  state: z.string().min(2, "State is required."),
  assignedOfficerName: z.string().min(3, "Authorized CALA / LAO officer name is required."),
  totalAcquisitionAreaHa: z.coerce.number().positive("Total area must be greater than 0 Ha."),
  estimatedCompensationINR: z.coerce.number().positive("Estimated compensation must be positive."),
});

export type CaseFormValues = z.infer<typeof caseFormSchema>;

export const surveyFormSchema = z.object({
  ulpin: z.string().min(10, "Authoritative 14-digit ULPIN / Bhu-Aadhaar is required."),
  khasra: z.string().min(1, "Survey or Khasra number is required."),
  village: z.string().min(2, "Revenue village name is required."),
  treesCount: z.coerce.number().min(0, "Trees count cannot be negative."),
  borewellsCount: z.coerce.number().min(0, "Borewells count cannot be negative."),
  structuresCount: z.coerce.number().min(0, "Structures count cannot be negative."),
  witnessName: z.string().min(3, "Panchayat / local witness name is mandatory."),
  remarks: z.string().min(5, "Surveyor field verification remarks are required."),
});

export type SurveyFormValues = z.infer<typeof surveyFormSchema>;

export const compensationCalcSchema = z.object({
  marketValueINR: z.coerce.number().positive("Base market value must be positive."),
  ruralMultiplier: z.coerce.number().min(1.0).max(2.0, "Multiplier must be between 1.0x and 2.0x."),
  solatiumPct: z.coerce.number().min(100, "Statutory solatium must be at least 100% under RFCTLARR Section 30."),
  interestDays: z.coerce.number().min(0, "Interest days cannot be negative."),
});

export type CompensationCalcValues = z.infer<typeof compensationCalcSchema>;

export const grievanceFormSchema = z.object({
  complainantName: z.string().min(3, "Complainant full name is required."),
  surveyNo: z.string().min(1, "Survey / Khasra number is required."),
  category: z.string().min(3, "Objection category is required."),
  description: z.string().min(10, "Detailed grounds for Section 15 objection required (min 10 chars)."),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number."),
});

export type GrievanceFormValues = z.infer<typeof grievanceFormSchema>;
