export type CustomerStatusType = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type CustomerSourceType = 'ONLINE_STORE' | 'MANUAL' | 'POS' | 'IMPORT' | 'WHATSAPP' | 'FACEBOOK' | 'STORE_INQUIRY';

export interface CustomerAddress {
  id: string;
  tenantId: string;
  storeId?: string;
  customerId: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  area?: string;
  thana?: string;
  district?: string;
  division?: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  authorName: string;
  authorRole?: string;
  content: string;
  createdAt: string;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  itemCount: number;
  itemsSummary?: string;
  createdAt: string;
}

export interface Customer360 {
  id: string;
  tenantId: string;
  storeId?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone: string;
  status: CustomerStatusType;
  source: CustomerSourceType;
  tags: string[];
  totalSpent: number;
  ordersCount: number;
  avgOrderValue: number;
  lastOrderAt?: string | null;
  createdAt: string;
  updatedAt: string;
  addresses?: CustomerAddress[];
  notes?: CustomerNote[];
  orders?: CustomerOrderSummary[];
  rfmSegment?: 'VIP' | 'LOYAL' | 'PROMISING' | 'AT_RISK' | 'HIBERNATING' | 'NEW';
  leadScore?: number;
  city?: string;
}

export type LeadStageType = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'WON' | 'LOST';
export type LeadSourceType = 'WEBSITE' | 'WHATSAPP' | 'FACEBOOK' | 'INSTAGRAM' | 'PHONE_CALL' | 'STORE_INQUIRY' | 'MANUAL';

export interface Lead {
  id: string;
  tenantId: string;
  storeId?: string;
  name: string;
  email?: string;
  phone: string;
  companyName?: string;
  source: LeadSourceType;
  stage: LeadStageType;
  estimatedValue: number;
  leadScore: number;
  assignedStaffId?: string;
  assignedStaffName?: string;
  notes?: string;
  tags: string[];
  convertedCustomerId?: string;
  lostReason?: string;
  nextFollowUpAt?: string | null;
  followUpNote?: string;
  followUpStatus?: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  type: 'DYNAMIC' | 'STATIC';
  customerCount: number;
  avgSpend: number;
  criteria?: {
    minOrders?: number;
    maxOrders?: number;
    minSpend?: number;
    maxSpend?: number;
    daysSinceLastOrder?: number;
    tags?: string[];
  };
  color: string;
  createdAt: string;
}

export type ActivityType = 'CALL' | 'WHATSAPP' | 'SMS' | 'NOTE' | 'ORDER' | 'STAGE_CHANGE' | 'STATUS_UPDATE' | 'MEETING';

export interface CrmActivity {
  id: string;
  tenantId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  leadId?: string;
  leadName?: string;
  type: ActivityType;
  title: string;
  description: string;
  authorName: string;
  authorRole?: string;
  outcome?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CrmAnalyticsMetrics {
  totalCustomers: number;
  activeCustomers: number;
  totalLeads: number;
  convertedLeads: number;
  leadConversionRate: number;
  avgCustomerLtv: number;
  repeatPurchaseRate: number;
  churnRate: number;
  pipelineValue: number;
  rfmBreakdown: {
    vip: number;
    loyal: number;
    promising: number;
    atRisk: number;
    dormant: number;
  };
  acquisitionChannels: {
    channel: string;
    customersCount: number;
    revenue: number;
    percentage: number;
  }[];
  topSpenders: {
    id: string;
    name: string;
    phone: string;
    ordersCount: number;
    totalSpent: number;
    lastOrderAt: string;
  }[];
}
