import { UserRole } from "./user";

export interface WorkflowStageConfig {
  id: string;
  name: string;
  order: number;
  slaDays: number;
  authorizedRoles: UserRole[];
  requiredDocuments: {
    code: string;
    label: string;
    isMandatory: boolean;
  }[];
  escalationRole: UserRole;
}

export interface WorkflowTransition {
  id: string;
  caseId: string;
  fromStageId: string;
  toStageId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: "APPROVED" | "REJECTED" | "ESCALATED" | "RETURNED_FOR_CLARIFICATION";
  notes?: string;
  timestamp: string;
  verificationHash: string;
}
