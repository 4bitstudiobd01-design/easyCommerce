export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TicketStatus = 'Open' | 'In Progress' | 'Pending Merchant' | 'Resolved' | 'Closed';

export type TicketCategory =
  | 'Billing & Payments'
  | 'Account & Access'
  | 'Technical Issues'
  | 'Store Management'
  | 'Feature Requests'
  | 'Domain & SSL'
  | 'Product Management'
  | 'Refund & Payout'
  | 'Plan & Billing'
  | 'Other';

export type TicketChannel = 'Web' | 'Email' | 'Chat' | 'Phone' | 'API';

export interface TicketMessage {
  id: string;
  authorName: string;
  authorRole: 'Admin' | 'Merchant' | 'System' | 'Agent';
  authorSubtitle?: string; // e.g. "urbanstyle.easyco.com" or "EasyCommerce Support"
  authorAvatar?: string;
  authorInitials?: string;
  content: string;
  timestamp: string;
  isInternal?: boolean;
  isCurrentUser?: boolean;
  attachments?: { name: string; size: string; url?: string }[];
}

export interface TicketAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
}

export interface TicketActivityLog {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
}

export interface RelatedTicket {
  id: string;
  codeId: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
}

export interface TicketRecord {
  id: string;
  codeId: string; // e.g. TKT-2026-001248
  createdAt: string; // e.g. Aug 14, 2026
  createdTime?: string; // e.g. 10:32 AM
  subject: string;
  category: TicketCategory;
  categoryDetail?: string; // e.g. "Plan & Billing"
  subCategory?: string; // e.g. "Plan Upgrade Issue"
  sourceIP?: string; // e.g. "103.86.XXX.XXX"
  merchant: {
    id: string;
    merchantCode?: string; // e.g. "MRC-2026-000112"
    name: string;
    email: string;
    storeName: string;
    subdomain: string;
    plan: string;
    avatar?: string;
    initials?: string;
    phone?: string;
    location?: string; // e.g. "Dhaka, Bangladesh"
  };
  priority: TicketPriority;
  status: TicketStatus;
  lastUpdateDate: string; // e.g. Aug 14, 2026
  lastUpdateTime: string; // e.g. 10:32 AM
  channel: TicketChannel;
  assignedAgent?: {
    name: string;
    role?: string; // e.g. "Support Agent"
    email: string;
    avatar?: string;
    initials?: string;
  };
  sla?: {
    responseTime: string; // e.g. "Within 2h"
    firstResponse: string; // e.g. "32m (Met)"
    resolutionTime: string; // e.g. "Within 24h"
    timeRemaining: string; // e.g. "18h 42m"
    isMet: boolean;
  };
  description?: string;
  messages: TicketMessage[];
  internalNotes?: TicketMessage[];
  attachments?: TicketAttachment[];
  activityLogs?: TicketActivityLog[];
  relatedTickets?: RelatedTicket[];
}

export interface SupportKpiMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  periodText: string;
  type: 'total' | 'open' | 'in_progress' | 'pending' | 'resolved';
}

export interface SupportFilterState {
  search: string;
  status: string;
  priority: string;
  category: string;
  channel: string;
}

export interface CategorySummary {
  id: string;
  name: TicketCategory;
  count: number;
  iconName: string;
  color: string;
  bgColor: string;
}

export interface SlaMetric {
  title: string;
  value: string;
  subtitle: string;
}
