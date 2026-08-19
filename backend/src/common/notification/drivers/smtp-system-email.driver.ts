import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { NotificationDriver } from '../notification.interface';

/**
 * SmtpSystemEmailDriver — production-ready SMTP email driver.
 *
 * Used when MAIL_DRIVER=smtp.
 * Supports any SMTP provider: Gmail, Mailgun, SendGrid, SES, etc.
 *
 * Credentials are read from environment variables:
 *   MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD
 *   MAIL_FROM_NAME, MAIL_FROM_ADDRESS
 */
export class SmtpSystemEmailDriver implements NotificationDriver {
  private readonly logger = new Logger(SmtpSystemEmailDriver.name);

  private readonly transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: process.env.MAIL_PORT === '465',
    auth:
      process.env.MAIL_USERNAME
        ? {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
          }
        : undefined,
  });

  async send(
    to: string,
    subject: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const fromName = process.env.MAIL_FROM_NAME || 'BitCommerce';
    const fromAddress = process.env.MAIL_FROM_ADDRESS || 'no-reply@bitcommerce.com';

    const validTo = to.includes('@')
      ? to
      : `${to.replace(/[^a-zA-Z0-9]/g, '')}@test.bitcommerce.com`;

    const isHtml = body.trim().startsWith('<') && body.includes('</');

    try {
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: validTo,
        subject,
        ...(isHtml ? { html: body } : { text: body }),
      });

      this.logger.log(
        `[SMTP] Email sent → ${validTo} | Subject: "${subject}" | MessageId: ${info.messageId}`,
      );
    } catch (err: any) {
      this.logger.error(`[SMTP] Failed to send email to ${validTo}: ${err?.message}`);
      throw err;
    }
  }
}
