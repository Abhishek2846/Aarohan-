"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient, unwrapApiData } from "@/lib/api";
import { InfrastructureProject } from "@/types/project";
import { AcquisitionCase } from "@/types/case";
import { StatutoryDocument } from "@/types/document";
import {
  ProjectDelayRiskAssessment,
  LifecycleRiskSnapshot,
  PortfolioRiskSummary,
  WhatIfSimulationResult,
} from "@/types/ai-delay";
import {
  GatiShaktiLayer,
  ProjectGatiShaktiScreenerResponse,
  NationalGatiShaktiSummary,
} from "@/types/gati-shakti";
import {
  GazetteNotice,
  GazetteVerificationResult,
  StatutorySection,
  PublicationStatus,
} from "@/types/gazette";

// ==========================================
// 1. Projects Queries & Mutations
// ==========================================
export function useProjectsQuery(search = "", status = "") {
  return useQuery({
    queryKey: ["projects", search, status],
    queryFn: async () => {
      const res = await apiClient<{ status: string; count: number; data: InfrastructureProject[] }>(
        "/projects",
        { params: { search, status } }
      );
      return unwrapApiData(res);
    },
    placeholderData: keepPreviousData,
  });
}

export function useProjectDetailQuery(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: InfrastructureProject }>(`/projects/${id}`);
      return unwrapApiData(res);
    },
    enabled: Boolean(id),
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newProject: Partial<InfrastructureProject>) =>
      apiClient<{ status: string; data: InfrastructureProject }>("/projects", {
        method: "POST",
        body: JSON.stringify(newProject),
      }).then(unwrapApiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// ==========================================
// 2. Acquisition Cases Queries & Mutations (With Optimistic Updates)
// ==========================================
export function useCasesQuery(search = "", stageId = "", projectId = "") {
  return useQuery({
    queryKey: ["cases", search, stageId, projectId],
    queryFn: async () => {
      const res = await apiClient<{ status: string; count: number; data: AcquisitionCase[] }>(
        "/cases",
        { params: { search, stage: stageId, projectId } }
      );
      return unwrapApiData(res);
    },
  });
}

export function useCaseDetailQuery(id: string) {
  return useQuery({
    queryKey: ["cases", id],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: AcquisitionCase }>(`/cases/${id}`);
      return unwrapApiData(res);
    },
    enabled: Boolean(id),
  });
}

export function useCreateCaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCase: Partial<AcquisitionCase>) =>
      apiClient<{ status: string; data: AcquisitionCase }>("/cases", {
        method: "POST",
        body: JSON.stringify(newCase),
      }).then(unwrapApiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useAdvanceStageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseId,
      nextStageId,
      nextStageName,
      officerSignature,
    }: {
      caseId: string;
      nextStageId: string;
      nextStageName: string;
      officerSignature?: string;
    }) =>
      apiClient<{ status: string; message: string; data: AcquisitionCase }>("/workflow", {
        method: "POST",
        body: JSON.stringify({ caseId, nextStageId, nextStageName, officerSignature }),
      }).then(unwrapApiData),

    // Optimistic Update: Update UI cache immediately before network round-trip
    onMutate: async ({ caseId, nextStageId, nextStageName }) => {
      await queryClient.cancelQueries({ queryKey: ["cases", caseId] });
      const previousCase = queryClient.getQueryData<AcquisitionCase>(["cases", caseId]);

      if (previousCase) {
        queryClient.setQueryData<AcquisitionCase>(["cases", caseId], {
          ...previousCase,
          currentStageId: nextStageId as any,
          currentStageName: nextStageName,
        });
      }

      return { previousCase };
    },

    // If server rejects, rollback to previous snapshot
    onError: (_err, { caseId }, context) => {
      if (context?.previousCase) {
        queryClient.setQueryData(["cases", caseId], context.previousCase);
      }
    },

    // Always invalidate after resolution to ensure server authority
    onSettled: (_data, _err, { caseId }) => {
      queryClient.invalidateQueries({ queryKey: ["cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

// ==========================================
// 3. Cadastral Parcels & 360 Digital Twin Queries
// ==========================================
export function useParcelsQuery(search = "", status = "") {
  return useQuery({
    queryKey: ["parcels", search, status],
    queryFn: async () => {
      const res = await apiClient<{ status: string; count: number; data: any[] }>("/parcels", {
        params: { search, status },
      });
      return unwrapApiData(res);
    },
  });
}

export function useParcelTwinQuery(id: string) {
  return useQuery({
    queryKey: ["parcels", "twin", id],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: any }>(`/parcels/${id}`);
      return unwrapApiData(res);
    },
    enabled: Boolean(id),
  });
}

// ==========================================
// 4. GIS Corridors & Spatial Buffer Queries
// ==========================================
export function useGisQuery(corridorId = "STRR_BLR") {
  return useQuery({
    queryKey: ["gis", corridorId],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: any }>("/gis", {
        params: { corridorId },
      });
      return unwrapApiData(res);
    },
  });
}

export function useSpatialBufferMutation() {
  return useMutation({
    mutationFn: (payload: { waypoints: [number, number][]; bufferWidthMeters: number }) =>
      apiClient<{ status: string; data: any }>("/gis", {
        method: "POST",
        body: JSON.stringify(payload),
      }).then(unwrapApiData),
  });
}

// ==========================================
// 5. Compensation & PFMS Queries
// ==========================================
export function useCompensationQuery() {
  return useQuery({
    queryKey: ["compensation"],
    queryFn: async () => {
      const res = await apiClient<{
        status: string;
        summary: any;
        pfmsBatches: any[];
        beneficiaries?: any[];
      }>("/compensation");
      return unwrapApiData(res);
    },
  });
}

export function useCalculateAwardMutation() {
  return useMutation({
    mutationFn: (payload: { marketValueINR: number; multiplier: number; solatiumPct: number; interestDays: number }) =>
      apiClient<{ status: string; calculation: any }>("/compensation", {
        method: "POST",
        body: JSON.stringify({ action: "CALCULATE_AWARD", ...payload }),
      }).then(unwrapApiData),
  });
}

export function usePfmsDispatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { projectRef: string; amountINR: number; beneficiariesCount: number; idempotencyKey?: string }) => {
      const idempotencyKey = payload.idempotencyKey || `pfms_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      return apiClient<{ status: string; message: string; data: any }>("/compensation", {
        method: "POST",
        idempotencyKey,
        body: JSON.stringify(payload),
      }).then(unwrapApiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compensation"] });
    },
  });
}

// ==========================================
// 6. Document Vault Queries
// ==========================================
export function useDocumentsQuery(type = "", search = "") {
  return useQuery({
    queryKey: ["documents", type, search],
    queryFn: async () => {
      const res = await apiClient<{ status: string; count: number; data: StatutoryDocument[] }>(
        "/documents",
        { params: { category: type, search } }
      );
      const documents = unwrapApiData<any[]>(res) || [];
      return documents.map((document) => ({
        ...document,
        projectName: document.projectName || document.projectId || "Unassigned project",
        caseNumber: document.caseNumber || document.caseId || "—",
        uploadedAt: document.uploadedAt || document.createdAt || "",
        fileSize: document.fileSize || `${Number(document.fileSizeBytes || 0) / 1024} KB`,
        version: String(document.version || 1),
        approvalStatus: document.approvalStatus || document.status || "PENDING_APPROVAL",
        versions: document.versions || [],
      })) as StatutoryDocument[];
    },
  });
}

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newDoc: Partial<StatutoryDocument>) =>
      apiClient<{ status: string; data: StatutoryDocument }>("/documents/upload", {
        method: "POST",
        body: JSON.stringify({
          title: newDoc.title,
          document_type_code: newDoc.category,
          project_id: newDoc.projectId,
          case_id: newDoc.caseId,
          original_filename: newDoc.fileSize || "document.txt",
          file_content: newDoc.title || "Aarohan document",
        }),
      }).then(unwrapApiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useApproveDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, versionId, notes }: { documentId: string; versionId: string; notes?: string }) =>
      apiClient(`/documents/${documentId}/versions/${versionId}/approve`, {
        method: "POST",
        body: JSON.stringify({ action: "APPROVED", notes }),
      }).then(unwrapApiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

// ==========================================
// 7. Rehabilitation & Resettlement (R&R)
// ==========================================
export function useRrQuery() {
  return useQuery({
    queryKey: ["rr"],
    queryFn: async () => {
      const res = await apiClient<{ status: string; summary: any; affectedFamilies: any[]; grievances: any[] }>(
        "/rr"
      );
      return unwrapApiData(res);
    },
  });
}

export function useSubmitGrievanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (grievance: any) =>
      apiClient<{ status: string; message: string; data: any }>("/rr", {
        method: "POST",
        body: JSON.stringify(grievance),
      }).then(unwrapApiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rr"] });
    },
  });
}

// ==========================================
// 8. Analytics & Interstate Benchmarks
// ==========================================
export function useAnalyticsQuery() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: any }>("/analytics");
      return unwrapApiData(res);
    },
  });
}

// ==========================================
// 9. Audit Trail & Cryptographic Ledger
// ==========================================
export function useAuditLedgerQuery() {
  return useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const res = await apiClient<{
        status: string;
        merkleRoot: string;
        totalBlocksCount: number;
        tamperEventsDetected: number;
        blocks: any[];
      }>("/audit");
      return unwrapApiData(res);
    },
  });
}

export function useVerifyLedgerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient<{ status: string; verificationStatus: string; message: string }>("/audit", {
      method: "POST",
    }).then(unwrapApiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

// ==========================================
// 10. Possession Handover Records
// ==========================================
export function usePossessionQuery() {
  return useQuery({
    queryKey: ["possession"],
    queryFn: async () => {
      const res = await apiClient<any[]>("/possession");
      return unwrapApiData(res);
    },
  });
}

// ==========================================
// 11. Litigation Cases
// ==========================================
export function useLitigationQuery(caseId = "") {
  return useQuery({
    queryKey: ["litigation", caseId],
    queryFn: async () => {
      const res = await apiClient<any[]>("/litigation", {
        params: caseId ? { caseId } : undefined,
      });
      return unwrapApiData(res);
    },
  });
}

// ==========================================
// 12. National Dashboard (Central Ministry)
// ==========================================
export function useNationalDashboardQuery() {
  return useQuery({
    queryKey: ["national-dashboard"],
    queryFn: async () => {
      const res = await apiClient<{
        status: string;
        data: {
          overview: any;
          benchmarks: any[];
          corridors: any[];
          escalations: any[];
          bottlenecks: any[];
          standards: any[];
        };
      }>("/analytics/national");
      return unwrapApiData(res);
    },
    staleTime: 30000,
  });
}

// ==========================================
// 13. State Dashboard (State Authority)
// ==========================================
export function useStateDashboardQuery() {
  return useQuery({
    queryKey: ["state-dashboard"],
    queryFn: async () => {
      const res = await apiClient<{
        status: string;
        data: {
          districts: any[];
          approvals: any[];
          appeals: any[];
          projects: any[];
        };
      }>("/workflow/state-dashboard");
      return unwrapApiData(res);
    },
    staleTime: 30000,
  });
}

export function useUpdateStateApprovalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: string; remarks?: string }) =>
      apiClient<{ status: string; data: any }>(`/workflow/state-approvals/${id}/action`, {
        method: "POST",
        body: JSON.stringify({ status, remarks }),
      }).then(unwrapApiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["state-dashboard"] });
    },
  });
}

// ==========================================
// 14. District Roster (District Officer / Collector)
// ==========================================
export function useDistrictRosterQuery() {
  return useQuery({
    queryKey: ["district-roster"],
    queryFn: async () => {
      const res = await apiClient<{
        status: string;
        data: {
          cases: any[];
          surveys: any[];
          awards: any[];
          possessions: any[];
          grievances: any[];
          fieldTasks: any[];
        };
      }>("/cases/district-roster");
      return unwrapApiData(res);
    },
    staleTime: 30000,
  });
}

// ==========================================
// 15. Auditor Anomalies
// ==========================================
export function useAuditorAnomaliesQuery() {
  return useQuery({
    queryKey: ["auditor-anomalies"],
    queryFn: async () => {
      const res = await apiClient<{
        status: string;
        count: number;
        data: any[];
      }>("/audit/anomalies");
      return unwrapApiData(res);
    },
    staleTime: 30000,
  });
}

export function useUpdateAnomalyStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient<{ status: string; data: any }>(`/audit/anomalies/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }).then(unwrapApiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auditor-anomalies"] });
    },
  });
}

// ==========================================
// 16. Field Surveyor Tasks
// ==========================================
export function useFieldTasksQuery(surveyorUserId = "") {
  return useQuery({
    queryKey: ["field-tasks", surveyorUserId],
    queryFn: async () => {
      const res = await apiClient<{
        status: string;
        count: number;
        data: any[];
      }>("/field/tasks", {
        params: surveyorUserId ? { surveyorUserId } : undefined,
      });
      return unwrapApiData(res);
    },
    staleTime: 30000,
  });
}

export function useUpdateFieldTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, measuredAreaHa, remarks }: { id: string; status: string; measuredAreaHa?: number; remarks?: string }) =>
      apiClient<{ status: string; data: any }>(`/field/tasks/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, measuredAreaHa, remarks }),
      }).then(unwrapApiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field-tasks"] });
    },
  });
}

export function useSaveFieldSurveyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (surveyData: {
      taskId?: string;
      measuredAreaSqM?: number;
      measuredAreaHa?: number;
      measuredAreaAcres?: number;
      positions?: Array<[number, number]>;
      surveyType?: string;
      observations?: string;
      witnessNames?: string[];
      demarcationConfirmed?: boolean;
    }) =>
      apiClient<{ status: string; data: any }>("/field/surveys", {
        method: "POST",
        body: JSON.stringify(surveyData),
      }).then(unwrapApiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

// ==========================================
// 17. Citizen Profile
// ==========================================
export function useCitizenProfileQuery(userId?: string, email?: string) {
  return useQuery({
    queryKey: ["citizen-profile", userId, email],
    queryFn: async () => {
      const res = await apiClient<{
        status: string;
        data: any;
      }>("/citizen/profile", {
        params: {
          ...(userId ? { userId } : {}),
          ...(email ? { email } : {}),
        },
      });
      return unwrapApiData(res);
    },
    staleTime: 10000,
  });
}

// ==========================================
// 17.1 Dynamic System Auth Credentials
// ==========================================
export function useAuthCredentialsQuery() {
  return useQuery({
    queryKey: ["auth-credentials"],
    queryFn: async () => {
      const res = await apiClient<{
        status: string;
        data: Record<string, any>;
      }>("/auth/credentials");
      return unwrapApiData(res);
    },
    staleTime: 5000,
  });
}

export function useUpdateCredentialsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      role?: string;
      userId?: string;
      email?: string;
      loginName?: string;
      password?: string;
      fullName?: string;
      phone?: string;
    }) => {
      const res = await apiClient<{ status: string; message: string; data: any }>("/auth/update-credentials", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return unwrapApiData(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-credentials"] });
      queryClient.invalidateQueries({ queryKey: ["citizen-profile"] });
    },
  });
}


// ==========================================
// 18. Simulation Scenarios
// ==========================================
export function useSimulationScenariosQuery() {
  return useQuery({
    queryKey: ["simulation-scenarios"],
    queryFn: async () => {
      const res = await apiClient<{
        status: string;
        count: number;
        data: any[];
      }>("/simulation/scenarios");
      return unwrapApiData(res);
    },
    staleTime: 30000,
  });
}

// ==========================================
// 19. Aarohan AI & ML Intelligence Hooks
// ==========================================
export interface AiChatRequest {
  query: string;
  role?: string;
  userId?: string;
  userEmail?: string;
  caseId?: string;
  projectId?: string;
  language?: string;
}

export interface AiDeepLinkItem {
  title: string;
  titleHi?: string;
  href: string;
  badge?: string;
}

export interface AiCalculatorData {
  areaAcres: number;
  areaHa: number;
  baseMarketRatePerAcre: number;
  totalMarketValueINR: number;
  multiplierFactor: number;
  multipliedMarketValueINR: number;
  solatiumPct: number;
  solatiumINR: number;
  additionalInterestPct: number;
  additionalInterestDays: number;
  additionalInterestINR: number;
  totalGrossAwardINR: number;
  taxDeductionINR: number;
  netPayableINR: number;
  taxExemptionSection: string;
}

export interface AiGazetteCardData {
  noticeNumber: string;
  gazetteReference?: string;
  gazetteVolumeIssue?: string;
  sectionReference: string;
  publicationStatus: string;
  publishedOn?: string;
  projectTitle?: string;
  sha256Hash?: string;
  parcelCount: number;
  verifyUrl: string;
}

export interface AiChatResponse {
  answer: string;
  suggestedQuestions?: string[];
  dataRef?: Record<string, any>;
  intent: string;
  sourcesUsed: string[];
  deepLinks?: AiDeepLinkItem[];
  calculatorData?: AiCalculatorData;
  gazetteCard?: AiGazetteCardData;
}

export function useAiChatMutation() {
  return useMutation({
    mutationFn: (payload: AiChatRequest) =>
      apiClient<{ status: string; data: AiChatResponse }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify(payload),
      }).then(unwrapApiData),
  });
}

export function useCaseDelayPredictionQuery(caseId = "default_case") {
  return useQuery({
    queryKey: ["ai-case-delay-prediction", caseId],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: any }>(`/ai/cases/${caseId}/predict`);
      return unwrapApiData(res);
    },
    enabled: Boolean(caseId),
    staleTime: 20000,
  });
}

export function useProjectForecastQuery(projectId = "STRR_BLR") {
  return useQuery({
    queryKey: ["ai-project-forecast", projectId],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: any }>(`/ai/projects/${projectId}/forecast`);
      return unwrapApiData(res);
    },
    enabled: Boolean(projectId),
    staleTime: 30000,
  });
}

export function useProjectSpatialRiskQuery(projectId = "STRR_BLR") {
  return useQuery({
    queryKey: ["ai-spatial-risk", projectId],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: any }>(`/ai/projects/${projectId}/spatial-risk`);
      return unwrapApiData(res);
    },
    enabled: Boolean(projectId),
    staleTime: 30000,
  });
}

export function useDocumentAuditQuery(caseId = "default_case") {
  return useQuery({
    queryKey: ["ai-document-audit", caseId],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: any }>(`/ai/cases/${caseId}/documents-audit`);
      return unwrapApiData(res);
    },
    enabled: Boolean(caseId),
    staleTime: 20000,
  });
}

export function useAiAnomaliesQuery(projectId?: string) {
  return useQuery({
    queryKey: ["ai-anomalies", projectId],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: any }>("/ai/anomalies", {
        params: projectId ? { projectId } : undefined,
      });
      return unwrapApiData(res);
    },
    staleTime: 30000,
  });
}

export function useOfficerPrioritiesQuery() {
  return useQuery({
    queryKey: ["ai-officer-priorities"],
    queryFn: async () => {
      const res = await apiClient<{ status: string; count: number; data: any[] }>("/ai/priorities");
      return unwrapApiData(res);
    },
    staleTime: 20000,
  });
}

export function useDetectActionIntentMutation() {
  return useMutation({
    mutationFn: (payload: AiChatRequest) =>
      apiClient<{ status: string; data: any }>("/ai/agent/detect", {
        method: "POST",
        body: JSON.stringify(payload),
      }).then(unwrapApiData),
  });
}

export function useExecuteAiActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { actionType: string; payload: any; user?: any }) =>
      apiClient<{ status: string; data: any }>("/ai/agent/execute", {
        method: "POST",
        body: JSON.stringify(payload),
      }).then(unwrapApiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rr"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

export function useProjectDelayRiskQuery(projectId: string, checkpoint?: string) {
  return useQuery({
    queryKey: ["ai-project-delay-risk", projectId, checkpoint],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: ProjectDelayRiskAssessment }>(
        `/ai/projects/${projectId}/delay-risk`,
        { params: checkpoint ? { checkpoint } : undefined }
      );
      return unwrapApiData(res);
    },
    enabled: Boolean(projectId),
    staleTime: 20000,
  });
}

export function useProjectRiskTrajectoryQuery(projectId: string) {
  return useQuery({
    queryKey: ["ai-project-risk-trajectory", projectId],
    queryFn: async () => {
      const res = await apiClient<{
        status: string;
        data: {
          projectId: string;
          trajectory: LifecycleRiskSnapshot[];
          currentAssessment: ProjectDelayRiskAssessment;
        };
      }>(`/ai/projects/${projectId}/risk-trajectory`);
      return unwrapApiData(res);
    },
    enabled: Boolean(projectId),
    staleTime: 20000,
  });
}

export function usePortfolioRiskQuery() {
  return useQuery({
    queryKey: ["ai-portfolio-risk"],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: PortfolioRiskSummary }>(
        "/ai/projects/portfolio-risk"
      );
      return unwrapApiData(res);
    },
    staleTime: 30000,
  });
}

export function useSimulateWhatIfMutation(projectId: string) {
  return useMutation({
    mutationFn: (interventions: {
      resolveLitigations?: boolean;
      accelerateDbtDisbursementPct?: number;
      deployAdditionalSlao?: boolean;
      resolveSection15Objections?: boolean;
      completeCadastralSurveys?: boolean;
    }) =>
      apiClient<{ status: string; data: WhatIfSimulationResult }>(
        `/ai/projects/${projectId}/what-if`,
        {
          method: "POST",
          body: JSON.stringify(interventions),
        }
      ).then(unwrapApiData),
  });
}

// ==========================================
// 12. PM Gati Shakti National Master Plan Queries & Mutations
// ==========================================
export function useGatiShaktiLayersQuery() {
  return useQuery({
    queryKey: ["gati-shakti-layers"],
    queryFn: async () => {
      const res = await apiClient<{ status: string; count: number; data: GatiShaktiLayer[] }>(
        "/gati-shakti/layers"
      );
      return unwrapApiData(res);
    },
    staleTime: 60000,
  });
}

export function useGatiShaktiScreenerQuery(projectId: string) {
  return useQuery({
    queryKey: ["gati-shakti-screener", projectId],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: ProjectGatiShaktiScreenerResponse }>(
        `/gati-shakti/projects/${projectId}/screener`
      );
      return unwrapApiData(res);
    },
    enabled: Boolean(projectId),
    staleTime: 15000,
  });
}

export function useNationalGatiShaktiSummaryQuery() {
  return useQuery({
    queryKey: ["gati-shakti-national-summary"],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: NationalGatiShaktiSummary }>(
        "/gati-shakti/national-summary"
      );
      return unwrapApiData(res);
    },
    staleTime: 20000,
  });
}

export function useNocWorkflowActionMutation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      nocId,
      actionType,
      role,
      remarks,
    }: {
      nocId: string;
      actionType: string;
      role?: string;
      remarks?: string;
    }) =>
      apiClient<{ success: boolean; message: string; updatedNoc: any }>(
        `/gati-shakti/projects/${projectId}/nocs/${nocId}/action`,
        {
          method: "POST",
          body: JSON.stringify({ actionType, role, remarks }),
        }
      ).then(unwrapApiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gati-shakti-screener", projectId] });
      queryClient.invalidateQueries({ queryKey: ["gati-shakti-national-summary"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// ==========================================
// 19. Official Bilingual E-Gazette Hooks
// ==========================================
export function useGazetteListQuery(filters?: {
  projectId?: string;
  sectionReference?: string;
  publicationStatus?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["gazette-list", filters],
    queryFn: async () => {
      const res = await apiClient<{ status: string; count: number; data: GazetteNotice[] }>(
        "/gazette",
        { params: filters }
      );
      return unwrapApiData(res);
    },
    staleTime: 10000,
  });
}

export function useGazetteDetailQuery(id: string) {
  return useQuery({
    queryKey: ["gazette-detail", id],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: GazetteNotice }>(
        `/gazette/${id}`
      );
      return unwrapApiData(res);
    },
    enabled: Boolean(id),
  });
}

export function useGazetteVerificationQuery(hashOrRef: string) {
  return useQuery({
    queryKey: ["gazette-verification", hashOrRef],
    queryFn: async () => {
      const res = await apiClient<{ status: string; data: GazetteVerificationResult }>(
        `/gazette/verify/${encodeURIComponent(hashOrRef)}`
      );
      return unwrapApiData(res);
    },
    enabled: Boolean(hashOrRef && hashOrRef.trim().length > 0),
  });
}

export function useCreateGazetteDraftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draftData: any) => {
      const idempotencyKey = draftData.idempotencyKey || `gaz_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      return apiClient<{ status: string; message: string; data: GazetteNotice }>("/gazette/draft", {
        method: "POST",
        idempotencyKey,
        body: JSON.stringify(draftData),
      }).then(unwrapApiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gazette-list"] });
    },
  });
}

export function useSignGazetteMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (signData: { officerName?: string; officerDesignation?: string; remarks?: string }) =>
      apiClient<{ status: string; message: string; data: GazetteNotice }>(`/gazette/${id}/sign`, {
        method: "POST",
        body: JSON.stringify(signData),
      }).then(unwrapApiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gazette-list"] });
      queryClient.invalidateQueries({ queryKey: ["gazette-detail", id] });
    },
  });
}

export function usePublishGazetteMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publishData: { gazetteVolumeIssue: string; gazetteReference?: string; effectiveOn?: string }) =>
      apiClient<{ status: string; message: string; data: GazetteNotice }>(`/gazette/${id}/publish`, {
        method: "POST",
        body: JSON.stringify(publishData),
      }).then(unwrapApiData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gazette-list"] });
      queryClient.invalidateQueries({ queryKey: ["gazette-detail", id] });
    },
  });
}







