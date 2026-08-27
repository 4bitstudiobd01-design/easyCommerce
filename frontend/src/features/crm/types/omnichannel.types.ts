export type SocialPlatform =
  | 'telegram'
  | 'whatsapp'
  | 'facebook'
  | 'instagram'
  | 'x'
  | 'slack'
  | 'custom';

export type CredentialStatus =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'pending';

export type AiProviderType = 'gemini' | 'openai';
export type AiTriggerMode = 'NO_HUMAN_ACTIVE' | 'ALWAYS' | 'OUTSIDE_HOURS';

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
  aiMetadata?: {
    provider?: string;
    model?: string;
    tokensUsed?: number;
    latencyMs?: number;
    [key: string]: any;
  };
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

export interface OmnichannelAiConfig {
  id?: string;
  tenantId: string;
  storeId?: string;
  isEnabled: boolean;
  provider: AiProviderType;
  model: string;
  apiKeyMasked: string;
  hasApiKey: boolean;
  systemPrompt: string;
  triggerMode: AiTriggerMode;
  temperature: number;
  maxTokens: number;
  businessContext: Record<string, any>;
  updatedAt?: string;
}

export interface SaveAiConfigRequest {
  isEnabled?: boolean;
  provider?: AiProviderType;
  model?: string;
  apiKey?: string;
  systemPrompt?: string;
  triggerMode?: AiTriggerMode;
  temperature?: number;
  maxTokens?: number;
  businessContext?: Record<string, any>;
}

export interface TestAiConnectionRequest {
  provider?: AiProviderType;
  model?: string;
  apiKey?: string;
}

export interface TestAiConnectionResponse {
  success: boolean;
  message: string;
  latencyMs: number;
  model: string;
}

export interface OmnichannelAiLog {
  id: string;
  tenantId: string;
  conversationId: string;
  platform: SocialPlatform;
  provider: AiProviderType;
  model: string;
  userQuery: string;
  aiResponse?: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED_PAUSED' | 'SKIPPED_AGENT_ACTIVE' | 'SKIPPED_DISABLED';
  tokensUsed: number;
  latencyMs: number;
  errorMessage?: string;
  createdAt: string;
}

export interface ConversationAiState {
  id?: string;
  tenantId: string;
  conversationId: string;
  isAiPaused: boolean;
  pausedReason: string;
  pausedByUserId?: string;
  aiPausedAt?: string;
  lastHumanAgentMessageAt?: string;
  lastAiMessageAt?: string;
  totalAiRepliesCount: number;
}
