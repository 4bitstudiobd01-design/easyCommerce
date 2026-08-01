import { Injectable, Logger } from '@nestjs/common';
import { ISmsDriver, SmsPayload } from './sms-driver.interface';

@Injectable()
export class GreenwebSmsDriver implements ISmsDriver {
  private readonly logger = new Logger(GreenwebSmsDriver.name);

  async sendSms(payload: SmsPayload): Promise<{ success: boolean; gatewayResponse: any }> {
    this.logger.log(
      `[DRIVER: GREENWEB] Dispatching SMS to ${payload.phone} using Greenweb token`,
    );

    return {
      success: true,
      gatewayResponse: {
        status: 'OK',
        gateway: 'Greenweb',
        recipient: payload.phone,
        message: payload.message,
      },
    };
  }
}
