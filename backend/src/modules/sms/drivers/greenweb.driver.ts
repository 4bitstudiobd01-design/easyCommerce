import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ISmsDriver, SmsPayload } from './sms-driver.interface';

@Injectable()
export class GreenwebSmsDriver implements ISmsDriver {
  private readonly logger = new Logger(GreenwebSmsDriver.name);

  async sendSms(payload: SmsPayload): Promise<{ success: boolean; gatewayResponse: any }> {
    if (!payload.apiKey) {
      this.logger.warn(
        `[DRIVER: GREENWEB] No API token configured for this store — SMS to ${payload.phone} was not sent.`,
      );
      return {
        success: false,
        gatewayResponse: {
          status: 'NOT_CONFIGURED',
          gateway: 'Greenweb',
          recipient: payload.phone,
          reason: 'Store has no Greenweb API token configured.',
        },
      };
    }

    try {
      const response = await axios.get('https://api.greenweb.com.bd/api.php', {
        params: {
          token: payload.apiKey,
          to: payload.phone,
          message: payload.message,
        },
      });

      const isSuccess = String(response.data?.status || '').toLowerCase() === 'success';

      if (!isSuccess) {
        this.logger.error(`[DRIVER: GREENWEB] Send failed for ${payload.phone}: ${JSON.stringify(response.data)}`);
      }

      return {
        success: isSuccess,
        gatewayResponse: {
          status: isSuccess ? 'OK' : 'FAILED',
          gateway: 'Greenweb',
          recipient: payload.phone,
          raw: response.data,
        },
      };
    } catch (err: any) {
      this.logger.error(`[DRIVER: GREENWEB] Request failed for ${payload.phone}: ${err?.message}`);
      return {
        success: false,
        gatewayResponse: {
          status: 'FAILED',
          gateway: 'Greenweb',
          recipient: payload.phone,
          error: err?.message,
        },
      };
    }
  }
}
