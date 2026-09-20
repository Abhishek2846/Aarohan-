import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GrievancesService {
  constructor(private readonly prisma: PrismaService) {}

  async submitGrievance(data: {
    caseId?: string;
    parcelId?: string;
    citizenName: string;
    citizenPhone: string;
    category: string;
    details: string;
  }) {
    return this.prisma.grievances.create({
      data: {
        grievance_id: uuidv4(),
        grievance_reference: `GRV-${Date.now()}`,
        case_id: data.caseId,
        parcel_id: data.parcelId,
        citizen_name_masked: data.citizenName,
        citizen_phone_masked: data.citizenPhone,
        category: data.category,
        details: data.details,
        grievance_status: 'LOGGED',
        // Set a default SLA of 30 days
        sla_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
  }

  async assignGrievance(grievanceId: string, officerId: string) {
    return this.prisma.grievances.update({
      where: { grievance_id: grievanceId },
      data: { assigned_to: officerId }
    });
  }

  async resolveGrievance(grievanceId: string, resolutionNotes: string) {
    return this.prisma.grievances.update({
      where: { grievance_id: grievanceId },
      data: {
        grievance_status: 'RESOLVED',
        resolution_notes: resolutionNotes,
        resolved_at: new Date()
      }
    });
  }

  async scheduleHearing(grievanceId: string, data: { date: Date; venue: string; officerId: string }) {
    const grievance = await this.prisma.grievances.findUnique({ where: { grievance_id: grievanceId } });
    if (!grievance) throw new NotFoundException('Grievance not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: { grievance_status: 'HEARING_SCHEDULED' }
      });

      return tx.grievance_hearings.create({
        data: {
          hearing_id: uuidv4(),
          grievance_id: grievanceId,
          scheduled_at: data.date,
          venue: data.venue,
          presiding_officer_user_id: data.officerId,
          hearing_status: 'SCHEDULED'
        }
      });
    });
  }
}
