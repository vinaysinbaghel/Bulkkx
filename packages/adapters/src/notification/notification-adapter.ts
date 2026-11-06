import { NotificationRecord } from '@bulkkx/shared';

export interface SendWhatsAppParams {
  toPhone: string;
  templateName: string;
  params: Record<string, string>;
  deepLinkPath: string;
}

export interface INotificationAdapter {
  sendWhatsApp(params: SendWhatsAppParams): Promise<NotificationRecord>;
  sendSms(toPhone: string, message: string, dltTemplateId?: string): Promise<NotificationRecord>;
}

export class SimulatedNotificationAdapter implements INotificationAdapter {
  private sentNotifications: NotificationRecord[] = [];
  private baseUrl: string;

  constructor(baseUrl = 'https://portal.bulkkx.internal') {
    this.baseUrl = baseUrl;
  }

  async sendWhatsApp(params: SendWhatsAppParams): Promise<NotificationRecord> {
    const fullLink = `${this.baseUrl}${params.deepLinkPath.startsWith('/') ? '' : '/'}${params.deepLinkPath}`;
    const record: NotificationRecord = {
      id: `ntf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId: params.toPhone,
      recipientPhone: params.toPhone,
      channel: 'whatsapp',
      templateName: params.templateName,
      params: params.params,
      deepLink: fullLink,
      status: 'sent',
      sentAt: new Date().toISOString(),
    };
    this.sentNotifications.push(record);
    return record;
  }

  async sendSms(toPhone: string, message: string, dltTemplateId?: string): Promise<NotificationRecord> {
    const record: NotificationRecord = {
      id: `sms-${Date.now()}`,
      recipientId: toPhone,
      recipientPhone: toPhone,
      channel: 'sms',
      templateName: dltTemplateId || 'GENERIC_SMS',
      params: { message },
      deepLink: this.baseUrl,
      status: 'sent',
      sentAt: new Date().toISOString(),
    };
    this.sentNotifications.push(record);
    return record;
  }

  getRecentNotifications(): NotificationRecord[] {
    return [...this.sentNotifications].reverse();
  }
}
