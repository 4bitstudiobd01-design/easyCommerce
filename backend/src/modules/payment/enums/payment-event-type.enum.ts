/**
 * Payment lifecycle events recorded for the payment timeline.
 * Every entry is written by a real domain operation — the timeline never
 * synthesises events it did not observe.
 */
export enum PaymentEventTypeEnum {
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  GATEWAY_PROCESSING = 'GATEWAY_PROCESSING',
  WEBHOOK_RECEIVED = 'WEBHOOK_RECEIVED',
  PAYMENT_VERIFIED = 'PAYMENT_VERIFIED',
  PAYMENT_SUCCEEDED = 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  REFUND_INITIATED = 'REFUND_INITIATED',
  REFUND_COMPLETED = 'REFUND_COMPLETED',
  REFUND_FAILED = 'REFUND_FAILED',
}

export const PAYMENT_EVENT_LABELS: Record<PaymentEventTypeEnum, string> = {
  [PaymentEventTypeEnum.PAYMENT_INITIATED]: 'Payment initiated',
  [PaymentEventTypeEnum.GATEWAY_PROCESSING]: 'Gateway processing',
  [PaymentEventTypeEnum.WEBHOOK_RECEIVED]: 'Webhook received',
  [PaymentEventTypeEnum.PAYMENT_VERIFIED]: 'Payment verified',
  [PaymentEventTypeEnum.PAYMENT_SUCCEEDED]: 'Payment successful',
  [PaymentEventTypeEnum.PAYMENT_FAILED]: 'Payment failed',
  [PaymentEventTypeEnum.PAYMENT_CANCELLED]: 'Payment cancelled',
  [PaymentEventTypeEnum.ORDER_UPDATED]: 'Order updated',
  [PaymentEventTypeEnum.REFUND_INITIATED]: 'Refund initiated',
  [PaymentEventTypeEnum.REFUND_COMPLETED]: 'Refund completed',
  [PaymentEventTypeEnum.REFUND_FAILED]: 'Refund failed',
};
