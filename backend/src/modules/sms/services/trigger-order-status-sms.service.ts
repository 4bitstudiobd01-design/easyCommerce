import { Injectable } from '@nestjs/common';
import { NotificationDispatcherService } from './notification-dispatcher.service';

export interface TriggerOrderSmsPayload {
  orderNumber: string;
  customerPhone: string;
  customerName: string;
  customerEmail?: string;
  storeName: string;
  grandTotal: number;
  orderStatus: string;
  tenantId: string;
  courierProvider?: string;
  trackingCode?: string;
}

@Injectable()
export class TriggerOrderStatusSmsService {
  constructor(private readonly notificationDispatcherService: NotificationDispatcherService) {}

  async execute(payload: TriggerOrderSmsPayload): Promise<void> {
    let smsMessage = '';
    let emailSubject = '';
    let emailBody = '';

    switch (payload.orderStatus) {
      case 'PENDING':
        smsMessage = `Thank you for ordering at ${payload.storeName}! Your order #${payload.orderNumber} for BDT ${payload.grandTotal.toLocaleString()} has been received.`;
        emailSubject = `Order #${payload.orderNumber} Placed at ${payload.storeName}`;
        emailBody = `<h1>Thank you for your order, ${payload.customerName}!</h1><p>Your order #${payload.orderNumber} for BDT ${payload.grandTotal.toLocaleString()} has been successfully received.</p>`;
        break;

      case 'CONFIRMED':
        smsMessage = `Your order #${payload.orderNumber} at ${payload.storeName} has been CONFIRMED and is being prepared for dispatch.`;
        emailSubject = `Order #${payload.orderNumber} Confirmed`;
        emailBody = `<h1>Order Confirmed!</h1><p>Your order #${payload.orderNumber} has been confirmed by ${payload.storeName}.</p>`;
        break;

      case 'SHIPPED':
        const courierText = payload.courierProvider ? ` via ${payload.courierProvider}` : '';
        const trackingText = payload.trackingCode ? ` Waybill Code: ${payload.trackingCode}` : '';
        smsMessage = `Your parcel for order #${payload.orderNumber} from ${payload.storeName} has been SHIPPED${courierText}!${trackingText}`;
        emailSubject = `Parcel Shipped - Order #${payload.orderNumber}`;
        emailBody = `<h1>Your Parcel is on the way!</h1><p>Order #${payload.orderNumber} has been shipped${courierText}. Waybill Code: ${payload.trackingCode || 'N/A'}</p>`;
        break;

      case 'DELIVERED':
        smsMessage = `Your order #${payload.orderNumber} from ${payload.storeName} has been successfully DELIVERED. Thank you for shopping with us!`;
        emailSubject = `Order #${payload.orderNumber} Delivered`;
        emailBody = `<h1>Order Delivered!</h1><p>Your order #${payload.orderNumber} has been delivered. Thank you for shopping with ${payload.storeName}!</p>`;
        break;

      default:
        smsMessage = `Update regarding your order #${payload.orderNumber} at ${payload.storeName}: Status is now ${payload.orderStatus}.`;
        emailSubject = `Order #${payload.orderNumber} Update`;
        emailBody = `<p>Order #${payload.orderNumber} status changed to ${payload.orderStatus}.</p>`;
        break;
    }

    await this.notificationDispatcherService.dispatch({
      tenantId: payload.tenantId,
      recipientPhone: payload.customerPhone,
      recipientEmail: payload.customerEmail,
      smsMessage,
      emailSubject,
      emailBody,
    });
  }
}
