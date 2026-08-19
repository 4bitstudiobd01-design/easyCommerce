import { Logger } from '@nestjs/common';
import axios from 'axios';
import { NotificationDriver } from '../notification.interface';

/**
 * SmsSystemDriver — BulkSmsBD API gateway for system-level SMS notifications.
 *
 * Used when NOTIFICATION_DRIVER=sms.
 * Wraps the BulkSmsBD HTTP API (also compatible with most BD SMS gateways).
 *
 * Environment variables:
 *   SMS_API_KEY      — BulkSmsBD API key
 *   SMS_SENDER_ID    — Registered sender ID (e.g. "BitCommerce")
 *   SMS_API_URL      — API endpoint (default: http://bulksmsbd.net/api/smsapi)
 */
export class SmsSystemDriver implements NotificationDriver {
  private readonly logger = new Logger(SmsSystemDriver.name);

  async send(
    to: string,
    subject: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const apiKey = process.env.SMS_API_KEY;
    const senderId = process.env.SMS_SENDER_ID || 'BitCommerce';
    const apiUrl = process.env.SMS_API_URL || 'http://bulksmsbd.net/api/smsapi';
    const isSandbox = process.env.SMS_IS_SANDBOX === 'true';

    if (isSandbox) {
      this.logger.log(`[SMS SANDBOX] → ${to}: "${body}"`);
      return;
    }

    if (!apiKey) {
      this.logger.warn(`[SMS] SMS_API_KEY not set — SMS to ${to} skipped.`);
      return;
    }

    try {
      const response = await axios.get(apiUrl, {
        params: {
          api_key: apiKey,
          senderid: senderId,
          number: to,
          message: body,
        },
      });
      this.logger.log(`[SMS] Sent to ${to}: ${JSON.stringify(response.data)}`);
    } catch (err: any) {
      this.logger.error(`[SMS] Failed to send to ${to}: ${err?.message}`);
      throw err;
    }
  }
}
