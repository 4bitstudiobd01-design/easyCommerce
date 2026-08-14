/**
 * Canonical payment method (the instrument the customer actually paid with).
 *
 * Distinct from PaymentGatewayEnum — e.g. gateway SSLCOMMERZ + method BKASH.
 */
export enum PaymentMethodTypeEnum {
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  ROCKET = 'ROCKET',
  UPAY = 'UPAY',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  COD = 'COD',
}

/** Human-facing method label used by the merchant dashboard. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethodTypeEnum, string> = {
  [PaymentMethodTypeEnum.BKASH]: 'bKash',
  [PaymentMethodTypeEnum.NAGAD]: 'Nagad',
  [PaymentMethodTypeEnum.ROCKET]: 'Rocket',
  [PaymentMethodTypeEnum.UPAY]: 'Upay',
  [PaymentMethodTypeEnum.CARD]: 'Card',
  [PaymentMethodTypeEnum.BANK_TRANSFER]: 'Bank Transfer',
  [PaymentMethodTypeEnum.COD]: 'Cash on Delivery',
};

/**
 * Maps a raw SSLCommerz `card_type` value onto a canonical method.
 * SSLCommerz reports e.g. "BKASH-BKash", "VISA-Visa Card", "DBBLMOBILEBANKING".
 */
export function resolvePaymentMethodFromCardType(
  cardType?: string | null,
): PaymentMethodTypeEnum {
  const value = (cardType || '').toUpperCase();
  if (!value) return PaymentMethodTypeEnum.CARD;
  if (value.includes('BKASH')) return PaymentMethodTypeEnum.BKASH;
  if (value.includes('NAGAD')) return PaymentMethodTypeEnum.NAGAD;
  if (value.includes('ROCKET') || value.includes('DBBLMOBILE')) return PaymentMethodTypeEnum.ROCKET;
  if (value.includes('UPAY')) return PaymentMethodTypeEnum.UPAY;
  if (value.includes('BANK')) return PaymentMethodTypeEnum.BANK_TRANSFER;
  return PaymentMethodTypeEnum.CARD;
}
