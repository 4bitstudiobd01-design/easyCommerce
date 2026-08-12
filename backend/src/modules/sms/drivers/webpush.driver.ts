import { Injectable, Logger } from '@nestjs/common';

export interface PushNotificationPayload {
  tenantId: string;
  title: string;
  message: string;
  icon?: string;
}

/**
 * Browser web-push delivery is not implemented — there is no VAPID key
 * configuration or push-subscription registry in the schema yet. This driver
 * intentionally reports failure rather than a fabricated success so callers
 * (and the merchant dashboard notification log) don't believe a push was
 * delivered when nothing was actually sent to a browser. In-app notifications
 * still work via PushNotificationEntity, which is written independently of
 * this driver.
 */
@Injectable()
export class WebPushDriver {
  private readonly logger = new Logger(WebPushDriver.name);

  async sendPushNotification(payload: PushNotificationPayload): Promise<{ success: boolean; reason?: string }> {
    this.logger.warn(
      `[DRIVER: WEB PUSH] Browser push delivery is not configured — "${payload.title}" was recorded in-app only, not pushed to a browser.`,
    );

    return { success: false, reason: 'Browser web-push delivery is not configured.' };
  }
}
