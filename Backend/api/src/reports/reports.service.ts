import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

const serializeBigInts = (data: any) =>
  JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? Number(v) : v))
  );

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateProjectSummaryReport() {
    const summaries = await this.prisma.$queryRaw`SELECT * FROM v_project_summary LIMIT 100`;
    
    return {
      reportType: 'PROJECT_SUMMARY',
      generatedAt: new Date(),
      data: serializeBigInts(summaries),
      mockDownloadLinks: {
        csv: '/v1/reports/download/mock-summary.csv',
        pdf: '/v1/reports/download/mock-summary.pdf'
      }
    };
  }

  async generateCaseComplianceReport(projectId?: string) {
    const cases = projectId 
      ? await this.prisma.$queryRaw`SELECT * FROM v_case_dashboard WHERE project_id = ${projectId}`
      : await this.prisma.$queryRaw`SELECT * FROM v_case_dashboard LIMIT 100`;

    return {
      reportType: 'COMPLIANCE_AND_SLA',
      generatedAt: new Date(),
      totalCases: Array.isArray(cases) ? cases.length : 0,
      data: serializeBigInts(cases),
      mockDownloadLinks: {
        csv: '/v1/reports/download/mock-compliance.csv',
        pdf: '/v1/reports/download/mock-compliance.pdf'
      }
    };
  }
}
