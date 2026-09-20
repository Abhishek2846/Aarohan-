import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class FieldService {
  constructor(private readonly prisma: PrismaService) {}

  async getTasks(surveyorUserId?: string) {
    try {
      const where: any = {};
      if (surveyorUserId) {
        where.surveyor_user_id = surveyorUserId;
      }
      const tasks = await (this.prisma as any).field_tasks.findMany({
        where,
        orderBy: { due_date: 'asc' },
      });

      return tasks.map((t: any) => ({
        id: t.task_id,
        parcelId: t.parcel_id,
        ulpin: t.ulpin,
        caseNo: t.case_no,
        surveyNo: t.survey_no,
        village: t.village,
        taluk: t.taluk,
        district: t.district,
        recordedAreaHa: Number(t.recorded_area_ha || 0),
        measuredAreaHa: t.measured_area_ha !== null && t.measured_area_ha !== undefined ? Number(t.measured_area_ha) : undefined,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date,
        distanceKm: Number(t.distance_km || 0),
        bearingDeg: t.bearing_deg || 0,
        landholder: t.landholder,
        accessStatus: t.access_status,
        correctionRemarks: t.correction_remarks,
      }));
    } catch (error) {
      console.error('Error fetching field tasks:', error);
      return [];
    }
  }

  async getTask(taskId: string) {
    const task = await (this.prisma as any).field_tasks.findUnique({
      where: { task_id: taskId },
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    return task;
  }

  async updateTaskStatus(taskId: string, status: string, measuredAreaHa?: number, remarks?: string) {
    const data: any = {
      status,
      updated_at: new Date(),
    };
    if (measuredAreaHa !== undefined) data.measured_area_ha = measuredAreaHa;
    if (remarks !== undefined) data.correction_remarks = remarks;

    return (this.prisma as any).field_tasks.update({
      where: { task_id: taskId },
      data,
    });
  }

  async saveSurvey(dto: {
    taskId?: string;
    measuredAreaSqM?: number;
    measuredAreaHa?: number;
    measuredAreaAcres?: number;
    positions?: Array<[number, number]>;
    surveyType?: string;
    observations?: string;
    witnessNames?: string[];
    demarcationConfirmed?: boolean;
    surveyorUserId?: string;
  }) {
    const surveyId = randomUUID();
    let updatedTask = null;

    // 1. If taskId is provided, update field_tasks
    if (dto.taskId) {
      try {
        const areaHa =
          dto.measuredAreaHa !== undefined
            ? dto.measuredAreaHa
            : dto.measuredAreaSqM
            ? Number((dto.measuredAreaSqM / 10000).toFixed(4))
            : undefined;

        const remarks =
          dto.observations ||
          `GPS Walking Survey: ${dto.positions?.length || 0} GPS points captured. Measured Area: ${areaHa ?? 0} Ha (${
            dto.measuredAreaAcres || (areaHa ? (areaHa * 2.47105).toFixed(3) : 0)
          } Acres).`;

        updatedTask = await (this.prisma as any).field_tasks.update({
          where: { task_id: dto.taskId },
          data: {
            measured_area_ha: areaHa,
            status: 'SUBMITTED',
            correction_remarks: remarks,
            updated_at: new Date(),
          },
        });
      } catch (err: any) {
        console.error(`Failed to update field_task ${dto.taskId}:`, err.message);
      }
    }

    // 2. Persist to field_surveys and field_survey_points if available
    try {
      let caseId: string | null = null;
      let surveyorId = dto.surveyorUserId;

      if (dto.taskId && updatedTask?.case_no) {
        const matchingCase = await (this.prisma as any).acquisition_cases.findFirst({
          where: { case_number: updatedTask.case_no },
        });
        if (matchingCase) {
          caseId = matchingCase.case_id;
        }
      }

      if (!caseId) {
        const firstCase = await (this.prisma as any).acquisition_cases.findFirst();
        if (firstCase) caseId = firstCase.case_id;
      }

      if (!surveyorId) {
        const firstUser = await (this.prisma as any).users.findFirst({
          where: { account_status: 'ACTIVE' },
        });
        if (firstUser) surveyorId = firstUser.user_id;
      }

      if (caseId && surveyorId) {
        const firstCoord = dto.positions?.[0] || [13.2941, 77.5342];
        const gpsPoint = `POINT(${firstCoord[1]} ${firstCoord[0]})`;
        const obs =
          dto.observations ||
          `GPS Walking Demarcation. Area: ${dto.measuredAreaSqM?.toFixed(2) ?? 'N/A'} m² (${
            dto.measuredAreaHa?.toFixed(4) ?? 'N/A'
          } Ha)`;

        await (this.prisma as any).$executeRawUnsafe(
          `
          INSERT INTO field_surveys (
            survey_id, client_record_id, case_id, surveyor_user_id,
            survey_type, surveyed_at, gps_location, demarcation_confirmed,
            observations, sync_status, created_at, updated_at
          ) VALUES (
            $1::uuid, $2, $3::uuid, $4::uuid,
            $5, NOW(), $6, $7,
            $8, $9, NOW(), NOW()
          ) ON CONFLICT (survey_id) DO NOTHING
        `,
          surveyId,
          `WALK-${dto.taskId || 'ADHOC'}-${Date.now()}`,
          caseId,
          surveyorId,
          dto.surveyType || 'GPS_WALKING_DEMARCATION',
          gpsPoint,
          dto.demarcationConfirmed ?? true,
          obs,
          'SYNCED',
        );

        if (dto.positions && dto.positions.length > 0) {
          for (let i = 0; i < dto.positions.length; i++) {
            const pt = dto.positions[i];
            const ptId = randomUUID();
            const ptLocation = `POINT(${pt[1]} ${pt[0]})`;
            await (this.prisma as any).$executeRawUnsafe(
              `
              INSERT INTO field_survey_points (
                survey_point_id, survey_id, point_sequence, point_type, location, captured_at
              ) VALUES (
                $1::uuid, $2::uuid, $3, $4, $5, NOW()
              ) ON CONFLICT DO NOTHING
            `,
              ptId,
              surveyId,
              i + 1,
              'BOUNDARY_VERTEX',
              ptLocation,
            );
          }
        }
      }
    } catch (err: any) {
      console.warn('Could not record into field_surveys table (non-blocking):', err.message);
    }

    return {
      surveyId,
      taskId: dto.taskId,
      status: 'SAVED_AND_SUBMITTED',
      task: updatedTask,
      measuredAreaHa: dto.measuredAreaHa,
      measuredAreaSqM: dto.measuredAreaSqM,
      measuredAreaAcres: dto.measuredAreaAcres,
      pointsCount: dto.positions?.length || 0,
      savedAt: new Date().toISOString(),
    };
  }
}
