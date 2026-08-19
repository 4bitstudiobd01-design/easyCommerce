import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  NOTIFICATION_DRIVER,
  NotificationDriver,
  NotificationChannel,
} from './notification.interface';

export interface NotificationJobData {
  to: string;
  subject: string;
  body: string;
  /** Optional HTML body — used instead of `body` for email channel */
  htmlBody?: string;
  /** Force email channel on/off */
  email?: boolean;
  /** Force SMS channel on/off */
  sms?: boolean;
  /** Notification type (ORDER_PLACED, OTP, etc.) */
  type?: string;
  /** Tenant context */
  tenantId?: string;
  /** Extra data */
  data?: Record<string, any>;
  /** Whether to save to in-app history (not yet implemented — placeholder) */
  saveHistory?: boolean;
}

@Processor('notification')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @Inject(NOTIFICATION_DRIVER)
    private readonly notificationDriver: NotificationDriver,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const {
      to,
      subject,
      body,
      htmlBody,
      email,
      sms,
      type,
      tenantId,
    } = job.data;

    this.logger.log(
      `[PROCESSOR] Job #${job.id} → to: ${to} | type: ${type || 'GENERAL'} | subject: "${subject}"`,
    );

    const driver = process.env.NOTIFICATION_DRIVER || NotificationChannel.EMAIL;

    // Determine which channels to activate
    const shouldSendEmail =
      email !== false && (driver === NotificationChannel.EMAIL || email === true);
    const shouldSendSms =
      sms === true || driver === NotificationChannel.SMS;

    const tasks: Array<Promise<void>> = [];
    const channels: string[] = [];

    if (shouldSendEmail) {
      // Use htmlBody if provided (e.g., from a template), else plain body
      const emailContent = htmlBody || body;
      tasks.push(this.notificationDriver.send(to, subject, emailContent));
      channels.push('EMAIL');
    }

    // SMS uses plain text body only (htmlBody is ignored)
    if (shouldSendSms) {
      tasks.push(this.notificationDriver.send(to, subject, body));
      channels.push('SMS');
    }

    if (tasks.length === 0) {
      this.logger.warn(
        `[PROCESSOR] Job #${job.id} — no channels active. ` +
        `NOTIFICATION_DRIVER=${driver}, email=${email}, sms=${sms}`,
      );
      return;
    }

    this.logger.log(
      `[PROCESSOR] Job #${job.id} dispatching via [${channels.join(', ')}]`,
    );

    const results = await Promise.allSettled(tasks);

    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `[PROCESSOR] Job #${job.id} ${channels[idx]} channel FAILED: ${result.reason?.message}`,
          result.reason?.stack,
        );
        // Re-throw so BullMQ can retry the job
        throw result.reason;
      }
    });

    this.logger.log(`[PROCESSOR] Job #${job.id} completed successfully`);
  }
}
