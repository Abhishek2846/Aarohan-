import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class WorkflowSeederService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultStages();
  }

  private async seedDefaultStages() {
    const existingCount = await this.prisma.workflow_stage_definitions.count();
    if (existingCount > 0) {
      console.log(`✅ Workflow Stage Definitions already seeded (${existingCount} stages found)`);
      return;
    }

    const defaultStages = [
      { code: 'PROPOSAL', order: 1, name: 'Proposal', sla: 15 },
      { code: 'PRELIMINARY_INVESTIGATION', order: 2, name: 'Preliminary Investigation', sla: 30 },
      { code: 'DRAFT_NOTIFICATION', order: 3, name: 'Draft Notification', sla: 14 },
      { code: 'PUBLIC_OBJECTION', order: 4, name: 'Public Objection Window', sla: 60 },
      { code: 'FINAL_DECLARATION', order: 5, name: 'Final Declaration', sla: 15 },
      { code: 'SURVEY_DEMARCATION', order: 6, name: 'Survey and Demarcation', sla: 30 },
      { code: 'AWARD_DECLARATION', order: 7, name: 'Award Declaration', sla: 15 },
      { code: 'COMPENSATION', order: 8, name: 'Compensation', sla: 30 },
      { code: 'POSSESSION', order: 9, name: 'Possession', sla: 15 },
      { code: 'R_AND_R', order: 10, name: 'R&R', sla: 60 },
      { code: 'CLOSURE', order: 11, name: 'Closure', sla: 0, isTerminal: true },
    ];

    for (const stage of defaultStages) {
      await this.prisma.workflow_stage_definitions.upsert({
        where: { stage_code: stage.code },
        update: {
          display_name: stage.name,
          default_sla_days: stage.sla,
          is_terminal: stage.isTerminal || false,
        },
        create: {
          stage_code: stage.code,
          stage_order: stage.order,
          display_name: stage.name,
          default_sla_days: stage.sla,
          is_terminal: stage.isTerminal || false,
        }
      });
    }

    console.log('✅ Default Workflow Stages seeded successfully');
  }
}
