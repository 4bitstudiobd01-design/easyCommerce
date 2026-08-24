/**
 * Checkout doesn't lock a customer into one payment method the way "Online
 * Payment" vs "COD" implies — bKash, Nagad, and card/SSLCommerz are all
 * distinct methods (PaymentMethodEnum on the backend), so collapsing all
 * non-COD methods into a single "Online Payment" label hides which one the
 * customer actually chose.
 */
export function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'COD':
      return 'Cash on Delivery';
    case 'BKASH':
      return 'bKash';
    case 'NAGAD':
      return 'Nagad';
    case 'SSLCOMMERZ':
      return 'Card / Online Payment';
    default:
      return method;
  }
}

/**
 * Every PaymentStatusEnum value from the backend, given a consistent label —
 * COD is called out specially only for UNPAID+COD (an order that hasn't had
 * its cash collected yet reads as "COD", not "Unpaid").
 */
export function getPaymentStatusLabel(status: string, paymentMethod?: string): string {
  if (status === 'UNPAID' && paymentMethod === 'COD') return 'COD';
  switch (status) {
    case 'UNPAID':
      return 'Unpaid';
    case 'PARTIALLY_PAID':
      return 'Partially Paid';
    case 'PAID':
      return 'Paid';
    case 'PARTIALLY_REFUNDED':
      return 'Partially Refunded';
    case 'REFUNDED':
      return 'Refunded';
    case 'COD_PENDING':
      return 'COD Pending';
    case 'COD_COLLECTED':
      return 'COD Collected';
    case 'FAILED':
      return 'Failed';
    default:
      return status;
  }
}

export function getPaymentStatusColorClasses(status: string): string {
  switch (status) {
    case 'PAID':
    case 'COD_COLLECTED':
      return 'bg-emerald-50 text-emerald-700';
    case 'PARTIALLY_PAID':
    case 'PARTIALLY_REFUNDED':
      return 'bg-blue-50 text-blue-700';
    case 'REFUNDED':
      return 'bg-slate-100 text-slate-600';
    case 'COD_PENDING':
      return 'bg-amber-50 text-amber-700';
    case 'FAILED':
    case 'UNPAID':
    default:
      return 'bg-rose-50 text-rose-700';
  }
}
