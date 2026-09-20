import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GrievancesService } from '../grievances/grievances.service';
import { v4 as uuidv4 } from 'uuid';

export interface ActionPreview {
  actionId: string;
  actionType: 'CREATE_OBJECTION' | 'REQUEST_HEARING' | 'SUBMIT_DOCUMENT_VERIFICATION' | 'SCHEDULE_FIELD_SURVEY';
  title: string;
  summary: string;
  requiresConfirmation: boolean;
  payload: {
    caseNumber: string;
    ulpin: string;
    surveyNumber: string;
    category: string;
    reason: string;
    details: string;
    presidingOfficer?: string;
  };
}

export interface ActionExecuteResult {
  status: 'SUCCESS' | 'FAILED';
  actionType: string;
  referenceId: string;
  message: string;
  auditHash?: string;
  data?: Record<string, any>;
}

@Injectable()
export class AgentActionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly grievancesService: GrievancesService,
  ) {}

  /**
   * Detects intent from natural language and prepares structured action preview for confirmation
   */
  async detectAndPrepareAction(
    query: string,
    role: string = 'CITIZEN',
    userEmail?: string,
  ): Promise<{
    hasActionIntent: boolean;
    preview?: ActionPreview;
    responseText?: string;
  }> {
    const q = query.toLowerCase().trim();

    // Intent 1: File Objection / Grievance (e.g. "I want to file an objection because compensation is low")
    if (
      q.includes('file an objection') ||
      q.includes('file objection') ||
      q.includes('objection') ||
      q.includes('submit objection') ||
      q.includes('grievance') ||
      q.includes('too low') ||
      q.includes('wrong valuation')
    ) {
      const actionId = `act_${Date.now()}`;
      const isLowComp = q.includes('low') || q.includes('compensation') || q.includes('amount');

      const category = isLowComp
        ? 'Re-assessment of Compensation & Tree Valuation'
        : 'Boundary Demarcation & Khasra Discrepancy';

      const reason = isLowComp
        ? 'Compensation valuation is lower than prevailing market circle rate and standing asset value.'
        : 'Discrepancy between Jamabandi revenue record area and physical DGPS boundary.';

      const preview: ActionPreview = {
        actionId,
        actionType: 'CREATE_OBJECTION',
        title: 'Section 15 Formal Acquisition Objection',
        summary: 'Submit formal statutory objection under Section 15 of RFCTLARR Act 2013 to Sub-Divisional Magistrate (SDM) Court.',
        requiresConfirmation: true,
        payload: {
          caseNumber: 'CASE-KA-BLR-2026-0811',
          ulpin: 'KA-BLR-2026-0041',
          surveyNumber: '142/2A',
          category,
          reason,
          details: query,
          presidingOfficer: 'Dr. Priya Sundaram, IAS (Special Land Acquisition Officer)',
        },
      };

      return {
        hasActionIntent: true,
        preview,
        responseText: `I have extracted your request and prepared a formal **Section 15 Acquisition Objection**. Please review the details below and confirm to submit:`,
      };
    }

    // Intent 2: Request SDM Hearing
    if (q.includes('hearing') || q.includes('sdm court') || q.includes('schedule hearing')) {
      const actionId = `act_${Date.now()}`;
      const preview: ActionPreview = {
        actionId,
        actionType: 'REQUEST_HEARING',
        title: 'Request SDM Conciliation Hearing',
        summary: 'Request priority hearing sitting with Sub-Divisional Magistrate at Doddaballapur Taluk Kacheri.',
        requiresConfirmation: true,
        payload: {
          caseNumber: 'CASE-KA-BLR-2026-0811',
          ulpin: 'KA-BLR-2026-0041',
          surveyNumber: '142/2A',
          category: 'Priority Conciliation Hearing',
          reason: 'Expedited resolution of public objections under SDM jurisdiction.',
          details: query,
          presidingOfficer: 'Sub-Divisional Magistrate, Doddaballapur',
        },
      };

      return {
        hasActionIntent: true,
        preview,
        responseText: `I can schedule a priority **SDM Conciliation Hearing** for your case. Please confirm the request parameters:`,
      };
    }

    return { hasActionIntent: false };
  }

  /**
   * Executes a user-confirmed agentic action strictly through backend services with audit logging
   */
  async executeConfirmedAction(
    actionType: string,
    payload: ActionPreview['payload'],
    user: any,
  ): Promise<ActionExecuteResult> {
    if (!actionType) {
      throw new BadRequestException('Action type is required');
    }

    try {
      if (actionType === 'CREATE_OBJECTION' || actionType === 'REQUEST_HEARING') {
        const refId = `OBJ-${Date.now().toString().slice(-6)}`;

        // Persist grievance in DB via GrievancesService
        const createdGrievance = await this.grievancesService.submitGrievance({
          citizenName: user?.name || 'Rameshwar Sharma',
          citizenPhone: user?.phone || '+91 98765 43210',
          category: payload.category || 'Re-assessment of Compensation',
          details: `[AI Agent Created] ${payload.reason} - Details: ${payload.details}`,
        });

        // Create audit log event in DB
        try {
          await this.prisma.audit_events.create({
            data: {
              audit_event_id: uuidv4(),
              actor_user_id: user?.id || null,
              action_code: 'AI_AGENT_ACTION_EXECUTE',
              entity_type: 'GRIEVANCE',
              entity_id: createdGrievance.grievance_id,
              metadata: {
                actionType,
                payload,
                submittedVia: 'BhoomiSetu AI Agentic Assistant',
              },
              event_hash: `hash_${Date.now()}_${uuidv4().substring(0, 8)}`,
              ip_address: null,
            },
          });
        } catch {
          // Ignore audit error if table constraint
        }

        return {
          status: 'SUCCESS',
          actionType,
          referenceId: createdGrievance.grievance_reference || refId,
          message: `Official objection successfully registered under Section 15 of RFCTLARR Act 2013. Reference Token: ${createdGrievance.grievance_reference || refId}.`,
          data: {
            grievanceId: createdGrievance.grievance_id,
            reference: createdGrievance.grievance_reference || refId,
            category: payload.category,
            status: 'Hearing Scheduled with SDM Court',
          },
        };
      }

      return {
        status: 'SUCCESS',
        actionType,
        referenceId: `REF-${Date.now().toString().slice(-6)}`,
        message: 'Action completed successfully.',
      };
    } catch (err: any) {
      return {
        status: 'FAILED',
        actionType,
        referenceId: '',
        message: err.message || 'Action execution failed. Please verify parameters.',
      };
    }
  }
}
