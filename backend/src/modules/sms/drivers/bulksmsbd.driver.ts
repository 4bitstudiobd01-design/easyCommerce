import { Injectable, Logger } from '@nestjs/common';
import { ISmsDriver, SmsPayload } from './sms-driver.interface';

@Injectable()
export class BulkSmsBdDriver implements ISmsDriver {
  private readonly logger = new Logger(BulkSmsBdDriver.name);

  async sendSms(payload: SmsPayload): Promise<{ success: boolean; gatewayResponse: any }> {
    this.logger.log(
      `[DRIVER: BULKSMSBD] Dispatching SMS to ${payload.phone} using API Key: ${payload.apiKey ? 'PRESENT' : 'DEFAULT'}`,
    );

    // Simulated API call to BulkSMSBD API endpoint
    return {
      success: true,
      gatewayResponse: {
        status: 'OK',
        gateway: 'BulkSMSBD',
        recipient: payload.phone,
        message: payload.message,
      },
    };
  }
}
