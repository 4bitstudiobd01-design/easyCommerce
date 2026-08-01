import { Injectable, Logger } from '@nestjs/common';
import { IEmailDriver, EmailPayload } from './sms-driver.interface';

@Injectable()
export class SmtpEmailDriver implements IEmailDriver {
  private readonly logger = new Logger(SmtpEmailDriver.name);

  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; gatewayResponse: any }> {
    this.logger.log(
      `[DRIVER: SMTP EMAIL] Dispatching Email to ${payload.toEmail} via host: ${payload.smtpHost || 'localhost'}`,
    );

    return {
      success: true,
      gatewayResponse: {
        status: 'DELIVERED',
        gateway: 'SMTP',
        recipient: payload.toEmail,
        subject: payload.subject,
      },
    };
  }
}
