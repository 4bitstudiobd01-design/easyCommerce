import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IEmailDriver, EmailPayload } from './sms-driver.interface';

@Injectable()
export class SmtpEmailDriver implements IEmailDriver {
  private readonly logger = new Logger(SmtpEmailDriver.name);

  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; gatewayResponse: any }> {
    if (!payload.smtpHost || !payload.smtpUser || !payload.smtpPass) {
      this.logger.warn(
        `[DRIVER: SMTP EMAIL] No SMTP credentials configured for this store — email to ${payload.toEmail} was not sent.`,
      );
      return {
        success: false,
        gatewayResponse: {
          status: 'NOT_CONFIGURED',
          gateway: 'SMTP',
          recipient: payload.toEmail,
          reason: 'Store has no SMTP host/user/password configured.',
        },
      };
    }

    const transporter = nodemailer.createTransport({
      host: payload.smtpHost,
      port: payload.smtpPort || 587,
      secure: payload.smtpPort === 465,
      auth: {
        user: payload.smtpUser,
        pass: payload.smtpPass,
      },
    });

    try {
      const info = await transporter.sendMail({
        from: payload.fromEmail || payload.smtpUser,
        to: payload.toEmail,
        subject: payload.subject,
        html: payload.htmlBody,
      });

      this.logger.log(`[DRIVER: SMTP EMAIL] Sent to ${payload.toEmail} (messageId: ${info.messageId})`);

      return {
        success: true,
        gatewayResponse: {
          status: 'DELIVERED',
          gateway: 'SMTP',
          recipient: payload.toEmail,
          subject: payload.subject,
          messageId: info.messageId,
        },
      };
    } catch (err: any) {
      this.logger.error(`[DRIVER: SMTP EMAIL] Failed to send to ${payload.toEmail}: ${err?.message}`);
      return {
        success: false,
        gatewayResponse: {
          status: 'FAILED',
          gateway: 'SMTP',
          recipient: payload.toEmail,
          error: err?.message,
        },
      };
    }
  }
}
