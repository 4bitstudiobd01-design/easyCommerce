export type TransactionStatus = 'Success' | 'Refunded' | 'Failed' | 'Pending';

export type TransactionType =
  | 'Subscription Payment'
  | 'Plan Upgrade'
  | 'Payout'
  | 'Refund'
  | 'One-time Charge'
  | 'Add-on Purchase';

export type PaymentGateway =
  | 'stripe'
  | 'sslcommerz'
  | 'bkash'
  | 'nagad'
  | 'bank_transfer';

export interface TransactionTimelineEvent {
  id: string;
  title: string;
  time: string;
  completed: boolean;
}

export interface TransactionWebhookEvent {
  id: string;
  event: string;
  status: 'Delivered' | 'Failed' | 'Retrying';
  statusCode: number;
  timestamp: string;
  payloadPreview: string;
}

export interface TransactionRefundRecord {
  id: string;
  amount: string;
  reason: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Rejected';
  refundedBy: string;
}

export interface TransactionNote {
  id: string;
  author: string;
  role: string;
  text: string;
  createdAt: string;
}

export interface TransactionRecord {
  id: string;
  reference: string;
  merchant: {
    name: string;
    domain: string;
    storeId?: string;
    email?: string;
  };
  type: TransactionType;
  gateway: PaymentGateway;
  gatewayDisplayName: string;
  amount: string;
  currencyLabel?: string;
  secondaryAmount?: string;
  isNegative?: boolean;
  status: TransactionStatus;
  createdAt: {
    date: string;
    time: string;
  };
  description?: string;
  metadata?: string;
  customer?: {
    name: string;
    email: string;
  };
  relatedOrder?: string;
  subscription?: string;

  // Detailed payment & gateway fields
  billingEmail?: string;
  billingName?: string;
  cardHolder?: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpiry?: string;
  country?: string;
  ipAddress?: string;
  device?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';

  gatewayTransactionId?: string;
  paymentIntentId?: string;
  chargeId?: string;
  customerId?: string;
  capturedAt?: string;
  statementDescriptor?: string;
  responseCode?: string;
  avsCheck?: string;
  threeDS?: string;
  mode?: 'Live' | 'Test';

  // Related subscription/plan info
  planName?: string;
  planAmount?: string;
  billingCycle?: string;
  nextBillingDate?: string;
  tags?: string[];

  // Financial breakdown
  subtotal?: string;
  platformFee?: string;
  gatewayFee?: string;
  tax?: string;
  netAmountToPlatform?: string;
  fee?: string;
  netAmount?: string;
  paymentMethod?: string;

  // Timeline & sub-tabs
  timeline?: TransactionTimelineEvent[];
  webhooks?: TransactionWebhookEvent[];
  refundsList?: TransactionRefundRecord[];
  notesList?: TransactionNote[];
}

export interface TransactionKpiItem {
  id: string;
  title: string;
  value: string;
  trend: string;
  trendType: 'up' | 'down' | 'neutral';
  subtext: string;
  iconType: 'total' | 'amount' | 'success' | 'refund' | 'failed';
}

export interface TransactionOverviewDonutItem {
  name: string;
  value: number;
  percentage: string;
  color: string;
}

export interface GatewayRevenueItem {
  id: string;
  gateway: PaymentGateway;
  name: string;
  amount: string;
  percentage: number;
  color: string;
}

export interface TopMerchantRevenueItem {
  rank: number;
  name: string;
  transactionCount: string;
  amount: string;
  badgeColor: string;
}

export interface TransactionFilterState {
  search: string;
  type: string;
  status: string;
  gateway: string;
  merchant: string;
  dateRange: string;
}
