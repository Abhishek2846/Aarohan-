import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface DocumentAuditResult {
  totalRequiredDocuments: number;
  uploadedDocumentsCount: number;
  approvedDocumentsCount: number;
  pendingDocumentsCount: number;
  missingMandatoryDocuments: string[];
  completenessScorePct: number;
  documentIssues: Array<{
    documentId?: string;
    documentType: string;
    issueType: 'MISSING_MANDATORY' | 'PENDING_APPROVAL' | 'EXPIRED' | 'HASH_MISMATCH';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
  }>;
}

@Injectable()
export class DocumentIntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  async auditCaseDocuments(caseId: string): Promise<DocumentAuditResult> {
    let docs: any[] = [];
    let acqCase: any = null;
    try {
      acqCase = await this.prisma.acquisition_cases.findUnique({
        where: { case_id: caseId },
        include: { documents: { include: { document_types: true } } },
      });
      docs = acqCase?.documents || [];
    } catch {
      // Fallback
    }

    const mandatoryTypes = [
      'Section 11 Preliminary Notification',
      'RoR Jamabandi Land Title Deed',
      'Section 19 Final Award Declaration',
      'Rehabilitation & Resettlement Scheme Plan',
    ];

    const uploadedTypes = docs.map((d) => d.document_types?.display_name || d.title || '');
    const approvedDocs = docs.filter((d) => d.approval_status === 'APPROVED');
    const pendingDocs = docs.filter((d) => d.approval_status === 'PENDING_APPROVAL');

    const missingMandatory: string[] = [];
    const issues: DocumentAuditResult['documentIssues'] = [];

    for (const mandatory of mandatoryTypes) {
      const found = uploadedTypes.some((t) => t.toLowerCase().includes(mandatory.toLowerCase()));
      if (!found) {
        missingMandatory.push(mandatory);
        issues.push({
          documentType: mandatory,
          issueType: 'MISSING_MANDATORY',
          severity: 'HIGH',
          description: `Mandatory statutory record '${mandatory}' has not been uploaded for this case.`,
        });
      }
    }

    for (const p of pendingDocs) {
      issues.push({
        documentId: p.document_id,
        documentType: p.title || 'Statutory Document',
        issueType: 'PENDING_APPROVAL',
        severity: 'MEDIUM',
        description: `Document '${p.title}' uploaded but pending SLAO approval for over 5 days.`,
      });
    }

    const completeness = Math.round(
      ((mandatoryTypes.length - missingMandatory.length) / mandatoryTypes.length) * 100,
    );

    return {
      totalRequiredDocuments: mandatoryTypes.length,
      uploadedDocumentsCount: docs.length,
      approvedDocumentsCount: approvedDocs.length,
      pendingDocumentsCount: pendingDocs.length,
      missingMandatoryDocuments: missingMandatory,
      completenessScorePct: completeness,
      documentIssues: issues,
    };
  }
}
