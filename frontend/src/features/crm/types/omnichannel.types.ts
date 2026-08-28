export type SocialPlatform =
  | 'telegram'
  | 'whatsapp'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'x'
  | 'shopify'
  | 'slack'
  | 'hubspot'
  | 'custom';

export type CredentialStatus =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'pending';

export interface ChannelCredential {
  id: string;
  platform: SocialPlatform;
  name: string;
  accountHandle?: string;
  credentials: Record<string, any>;
  metadata: Record<string, any>;
  status: CredentialStatus;
  isActive: boolean;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationThread {
  id: string;
  customerName: string;
  avatarUrl: string;
  platform: SocialPlatform;
  platformDetail: string;
  recipientId: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  status: 'all' | 'unread' | 'resolved';
  customerId?: string;
  isAiPaused?: boolean;
  pausedReason?: string;
}

export interface ThreadMessage {
  id: string;
  sender: 'agent' | 'customer';
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  platform: SocialPlatform;
  status: 'sent' | 'delivered' | 'read' | 'received';
  type?: string;
  senderType?: 'customer' | 'agent' | 'ai' | 'system';
  isAiGenerated?: boolean;
  aiMetadata?: Record<string, any>;
}

export interface PlatformField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
  required: boolean;
  helperText?: string;
}

export interface PlatformConfig {
  platform: SocialPlatform;
  name: string;
  description: string;
  color: string;
  docsUrl: string;
  webhookPath: string;
  fields: PlatformField[];
}
