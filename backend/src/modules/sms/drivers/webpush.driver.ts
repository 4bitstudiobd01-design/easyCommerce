import { Injectable, Logger } from '@nestjs/common';

export interface PushNotificationPayload {
  tenantId: string;
  title: string;
  message: string;
  icon?: string;
}

@Injectable()
export class WebPushDriver {
  private readonly logger = new Logger(WebPushDriver.name);

  async sendPushNotification(payload: PushNotificationPayload): Promise<{ success: boolean }> {
    this.logger.log(
      `[DRIVER: WEB PUSH] Dispatching Browser Alert: "${payload.title}" -> "${payload.message}"`,
    );

    return { success: true };
  }
}
