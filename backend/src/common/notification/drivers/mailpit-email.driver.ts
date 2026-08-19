import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { NotificationDriver } from '../notification.interface';

/**
 * MailpitEmailDriver — local development only.
 *
 * Mailpit is an SMTP catcher that listens on port 1025 and exposes a
 * beautiful web UI at http://localhost:8025. It captures ALL outgoing mail
 * without actually delivering them to real recipients — perfect for local testing.
 *
 * Docker: `docker run -p 1025:1025 -p 8025:8025 axllent/mailpit`
 * Or via docker-compose (see docker-compose.yml)
 */
export class MailpitEmailDriver implements NotificationDriver {
  private readonly logger = new Logger(MailpitEmailDriver.name);

  private readonly transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'localhost',
    port: parseInt(process.env.MAIL_PORT || '1025', 10),
    secure: false,    // Mailpit never uses TLS
    auth: undefined,  // Mailpit needs no authentication
    ignoreTLS: true,
  });

  async send(
    to: string,
    subject: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const fromName = process.env.MAIL_FROM_NAME || 'BitCommerce';
    const fromAddress = process.env.MAIL_FROM_ADDRESS || 'no-reply@bitcommerce.dev';

    // Ensure `to` is a valid email address (phone numbers get a dummy domain)
    const validTo = to.includes('@')
      ? to
      : `${to.replace(/[^a-zA-Z0-9]/g, '')}@test.bitcommerce.dev`;

    // Detect if body is HTML (contains '<' and '>')
    const isHtml = body.trim().startsWith('<') && body.includes('</');

    try {
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: validTo,
        subject,
        ...(isHtml ? { html: body } : { text: body }),
      });

      this.logger.log(
        `[MAILPIT] Email sent → ${validTo} | Subject: "${subject}" | MessageId: ${info.messageId}`,
      );
      this.logger.log(`[MAILPIT] View at http://localhost:8025`);
    } catch (err: any) {
      this.logger.error(
        `[MAILPIT] Failed to send email to ${validTo}: ${err?.message}`,
      );
      // Don't re-throw — let the queue processor log & retry
      throw err;
    }
  }
}
