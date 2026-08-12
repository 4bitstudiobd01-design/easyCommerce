import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ISmsDriver, SmsPayload } from './sms-driver.interface';

@Injectable()
export class BulkSmsBdDriver implements ISmsDriver {
  private readonly logger = new Logger(BulkSmsBdDriver.name);

  async sendSms(payload: SmsPayload): Promise<{ success: boolean; gatewayResponse: any }> {
    if (!payload.apiKey) {
      this.logger.warn(
        `[DRIVER: BULKSMSBD] No API key configured for this store — SMS to ${payload.phone} was not sent.`,
      );
      return {
        success: false,
        gatewayResponse: {
          status: 'NOT_CONFIGURED',
          gateway: 'BulkSMSBD',
          recipient: payload.phone,
          reason: 'Store has no BulkSMSBD API key configured.',
        },
      };
    }

    try {
      const response = await axios.get('http://bulksmsbd.net/api/smsapi', {
        params: {
          api_key: payload.apiKey,
          type: 'text',
          number: payload.phone,
          senderid: payload.senderId,
          message: payload.message,
        },
      });

      const responseCode = response.data?.response_code;
      const isSuccess = responseCode === 202;

      if (!isSuccess) {
        this.logger.error(`[DRIVER: BULKSMSBD] Send failed for ${payload.phone}: ${JSON.stringify(response.data)}`);
      }

      return {
        success: isSuccess,
        gatewayResponse: {
          status: isSuccess ? 'OK' : 'FAILED',
          gateway: 'BulkSMSBD',
          recipient: payload.phone,
          raw: response.data,
        },
      };
    } catch (err: any) {
      this.logger.error(`[DRIVER: BULKSMSBD] Request failed for ${payload.phone}: ${err?.message}`);
      return {
        success: false,
        gatewayResponse: {
          status: 'FAILED',
          gateway: 'BulkSMSBD',
          recipient: payload.phone,
          error: err?.message,
        },
      };
    }
  }
}
