import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadDocument(data: any, userId: string) {
    // In real app, we would process multipart/form-data. 
    // MOCKING File upload mechanics.
    const fileContent = data.file_content || 'MOCK_FILE_CONTENT';
    const sha256Hash = crypto.createHash('sha256').update(fileContent).digest('hex');
    const fileSize = Buffer.byteLength(fileContent, 'utf8');

    // For local mock storage
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
    const objectKey = `doc_${uuidv4()}.txt`;
    fs.writeFileSync(path.join(uploadsDir, objectKey), fileContent);

    return this.prisma.$transaction(async (tx) => {
      let docId = data.document_id;
      let versionNo = 1;

      if (docId) {
        // Uploading new version
        const existingDoc = await tx.documents.findUnique({ where: { document_id: docId } });
        if (!existingDoc) throw new NotFoundException('Document not found');
        versionNo = existingDoc.current_version_no + 1;

        await tx.documents.update({
          where: { document_id: docId },
          data: {
            current_version_no: versionNo,
            approval_status: 'PENDING_APPROVAL',
            updated_at: new Date()
          }
        });
      } else {
        // Creating new document
        docId = uuidv4();
        await tx.documents.create({
          data: {
            document_id: docId,
            document_number: `DOC-${Date.now()}`,
            document_type_code: data.document_type_code,
            title: data.title,
            project_id: data.project_id,
            case_id: data.case_id,
            uploaded_by: userId,
            approval_status: 'PENDING_APPROVAL',
          }
        });
      }

      const docVersionId = uuidv4();
      await tx.document_versions.create({
        data: {
          document_version_id: docVersionId,
          document_id: docId,
          version_no: versionNo,
          storage_provider: 'LOCAL',
          storage_bucket: 'uploads',
          object_key: objectKey,
          original_filename: data.original_filename || 'unknown.txt',
          mime_type: 'text/plain',
          file_size_bytes: fileSize,
          sha256_hash: sha256Hash,
          uploaded_by: userId
        }
      });

      return { document_id: docId, document_version_id: docVersionId, sha256_hash: sha256Hash };
    });
  }

  async approveDocument(documentId: string, versionId: string, action: 'APPROVED' | 'REJECTED' | 'RETURNED_FOR_REVISION', userId: string, notes?: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.document_approvals.create({
        data: {
          document_approval_id: uuidv4(),
          document_id: documentId,
          document_version_id: versionId,
          action: action,
          actor_user_id: userId,
          notes: notes
        }
      });

      return tx.documents.update({
        where: { document_id: documentId },
        data: {
          approval_status: action,
          approved_by: userId,
          approved_at: new Date(),
          approval_notes: notes
        }
      });
    });
  }

  async getCompletenessScore(caseId: string, stageCode: string) {
    const requiredDocs = await this.prisma.workflow_stage_required_documents.findMany({
      where: { stage_code: stageCode, is_mandatory: true }
    });

    const uploadedDocs = await this.prisma.documents.findMany({
      where: { 
        case_id: caseId, 
        document_type_code: { in: requiredDocs.map(d => d.document_type_code) },
        approval_status: 'APPROVED'
      }
    });

    const requiredCount = requiredDocs.length;
    const uploadedCount = uploadedDocs.length;
    
    return {
      required: requiredCount,
      approved: uploadedCount,
      isComplete: requiredCount === 0 ? true : uploadedCount >= requiredCount,
      missingTypes: requiredDocs
        .filter(rd => !uploadedDocs.some(ud => ud.document_type_code === rd.document_type_code))
        .map(rd => rd.document_type_code)
    };
  }

  async searchDocuments(filters: any) {
    const where: any = {};
    if (filters.caseId) {
      where.OR = [
        { case_id: filters.caseId },
        { acquisition_cases: { case_number: filters.caseId } },
      ];
    }
    if (filters.projectId) where.project_id = filters.projectId;
    if (filters.category && filters.category !== 'ALL') where.document_type_code = filters.category;
    if (filters.status && filters.status !== 'ALL') where.approval_status = filters.status;
    if (filters.search) {
      where.OR = [
        { document_number: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const docs = await this.prisma.documents.findMany({
      where,
      include: {
        document_types: true,
        document_versions: {
          orderBy: { version_no: 'desc' },
          take: 1,
        },
        uploader: {
          select: { full_name: true, designation: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return docs.map((d) => {
      const latestVer = d.document_versions[0];
      return {
        id: d.document_id,
        documentNumber: d.document_number,
        title: d.title,
        category: d.document_type_code,
        categoryName: d.document_types?.display_name || d.document_type_code,
        caseId: d.case_id,
        projectId: d.project_id,
        status: d.approval_status,
        approvalStatus: d.approval_status,
        version: d.current_version_no,
        latestVersionId: latestVer?.document_version_id,
        sha256Hash: latestVer?.sha256_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        fileSizeBytes: latestVer?.file_size_bytes ? Number(latestVer.file_size_bytes) : 248000,
        uploadedBy: d.uploader?.full_name || 'Revenue Officer',
        verified: d.approval_status === 'APPROVED',
        createdAt: d.created_at.toISOString(),
      };
    });
  }

  async getDocument(documentId: string) {
    const doc = await this.prisma.documents.findUnique({
      where: { document_id: documentId },
      include: {
        document_types: true,
        document_versions: { orderBy: { version_no: 'desc' } },
        document_approvals: true,
        uploader: { select: { full_name: true, designation: true } },
      },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async getPreviewUrl(versionId: string) {
    const version = await this.prisma.document_versions.findUnique({
      where: { document_version_id: versionId },
    });
    if (!version) throw new NotFoundException('Document version not found');
    return {
      versionId,
      url: `/documents/download/${version.object_key}`,
      originalFilename: version.original_filename,
      mimeType: version.mime_type,
    };
  }
}
