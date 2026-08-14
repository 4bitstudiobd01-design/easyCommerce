/**
 * Canonical payment gateway (the processor that moves the money).
 *
 * A gateway is NOT a payment method: SSLCommerz is a gateway that can process
 * a bKash, Rocket, Upay, or card payment. Keep the two axes separate.
 */
export enum PaymentGatewayEnum {
  SSLCOMMERZ = 'SSLCOMMERZ',
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  COD = 'COD',
  MANUAL = 'MANUAL',
}

/** Human-facing gateway label used by the merchant dashboard. */
export const PAYMENT_GATEWAY_LABELS: Record<PaymentGatewayEnum, string> = {
  [PaymentGatewayEnum.SSLCOMMERZ]: 'SSLCommerz',
  [PaymentGatewayEnum.BKASH]: 'bKash',
  [PaymentGatewayEnum.NAGAD]: 'Nagad',
  [PaymentGatewayEnum.STRIPE]: 'Stripe',
  [PaymentGatewayEnum.PAYPAL]: 'PayPal',
  [PaymentGatewayEnum.COD]: 'COD',
  [PaymentGatewayEnum.MANUAL]: 'Manual',
};

/** Category shown under the gateway name in the dashboard gateway panel. */
export const PAYMENT_GATEWAY_KINDS: Record<PaymentGatewayEnum, string> = {
  [PaymentGatewayEnum.SSLCOMMERZ]: 'Payment Gateway',
  [PaymentGatewayEnum.BKASH]: 'Mobile Payment',
  [PaymentGatewayEnum.NAGAD]: 'Mobile Payment',
  [PaymentGatewayEnum.STRIPE]: 'Card Payment',
  [PaymentGatewayEnum.PAYPAL]: 'Card Payment',
  [PaymentGatewayEnum.COD]: 'Offline Payment',
  [PaymentGatewayEnum.MANUAL]: 'Offline Payment',
};
