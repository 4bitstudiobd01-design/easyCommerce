import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface SendNotificationOptions {
  /** Email channel (default: true if MAIL_DRIVER is set) */
  email?: boolean;
  /** SMS channel */
  sms?: boolean;
  /** Notification type for categorization */
  type?: string;
  /** Rich HTML body (overrides plain `body` for email) */
  htmlBody?: string;
  /** Store/tenant context */
  tenantId?: string;
  /** Extra data passed to the processor */
  data?: Record<string, any>;
  /** Whether to save to in-app notification history */
  saveHistory?: boolean;
}

@Injectable()
export class NotificationProducer {
  private readonly logger = new Logger(NotificationProducer.name);

  constructor(
    @InjectQueue('notification') private readonly notificationQueue: Queue,
  ) {}

  /**
   * Enqueue a single notification job.
   * The processor will determine which channel(s) to use based on env + options.
   */
  async sendNotification(
    to: string,
    subject: string,
    body: string,
    options?: SendNotificationOptions,
  ): Promise<void> {
    const jobId = await this.notificationQueue.add(
      'send',
      {
        to,
        subject,
        body,
        htmlBody: options?.htmlBody,
        email: options?.email,
        sms: options?.sms,
        type: options?.type,
        tenantId: options?.tenantId,
        data: options?.data,
        saveHistory: options?.saveHistory,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,  // keep last 100 completed jobs
        removeOnFail: 200,      // keep last 200 failed jobs
      },
    );

    this.logger.log(
      `[PRODUCER] Queued notification job → to: ${to} | subject: "${subject}" | jobId: ${jobId.id}`,
    );
  }

  /**
   * Enqueue notifications in bulk for a list of recipients.
   * Use for batch notifications (e.g. order updates for multiple customers).
   */
  async sendBulkNotification(
    recipients: Array<{ to: string; subject: string; body: string; htmlBody?: string }>,
    options?: Pick<SendNotificationOptions, 'type' | 'tenantId' | 'email' | 'sms'>,
  ): Promise<void> {
    if (!recipients.length) return;

    const jobs = recipients.map((r) => ({
      name: 'send',
      data: {
        to: r.to,
        subject: r.subject,
        body: r.body,
        htmlBody: r.htmlBody,
        email: options?.email,
        sms: options?.sms,
        type: options?.type,
        tenantId: options?.tenantId,
      },
      opts: {
        attempts: 3,
        backoff: { type: 'exponential' as const, delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    }));

    await this.notificationQueue.addBulk(jobs);
    this.logger.log(
      `[PRODUCER] Bulk queued ${jobs.length} notification job(s) — type: ${options?.type || 'GENERAL'}`,
    );
  }
}
