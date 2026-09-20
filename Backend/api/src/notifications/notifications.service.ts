import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { notification_severity, notification_channel } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async sendNotification(data: {
    userId?: string;
    caseId?: string;
    projectId?: string;
    type: string;
    severity?: notification_severity;
    title: string;
    message: string;
    actionUrl?: string;
    channel?: notification_channel;
  }) {
    const notification = await this.prisma.notifications.create({
      data: {
        notification_id: uuidv4(),
        user_id: data.userId,
        case_id: data.caseId,
        project_id: data.projectId,
        notification_type: data.type,
        severity: data.severity || 'INFO',
        title: data.title,
        message: data.message,
        action_url: data.actionUrl,
        channel: data.channel || 'IN_APP',
        delivery_status: 'PENDING'
      }
    });

    // MOCK: Dispatch to external provider if channel is EMAIL/SMS
    if (data.channel === 'EMAIL' || data.channel === 'SMS') {
      console.log(`[MOCK DISPATCH] Sending ${data.channel} to User ${data.userId}: ${data.title}`);
      
      await this.prisma.notifications.update({
        where: { notification_id: notification.notification_id },
        data: {
          delivery_status: 'SENT',
          sent_at: new Date()
        }
      });
    }

    return notification;
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50
    });
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notifications.update({
      where: { notification_id: notificationId },
      data: {
        delivery_status: 'READ',
        read_at: new Date()
      }
    });
  }
}
