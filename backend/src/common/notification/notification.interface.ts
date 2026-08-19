export const NOTIFICATION_DRIVER = 'NOTIFICATION_DRIVER';

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
}

export interface NotificationDriver {
  send(
    to: string,
    subject: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void>;
}
