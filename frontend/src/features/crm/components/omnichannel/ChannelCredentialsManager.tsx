'use client';

import React, { useState, useEffect } from 'react';
import {
  SocialPlatform,
  ChannelCredential,
  PlatformConfig,
} from '../../types/omnichannel.types';
import { PlatformIcon } from './PlatformIcon';
import {
  useGetChannelCredentialsQuery,
  useSaveChannelCredentialsMutation,
  useTestChannelConnectionMutation,
  useToggleChannelActiveMutation,
  useDeleteChannelCredentialsMutation,
  useGetAiConfigQuery,
  useSaveAiConfigMutation,
  useTestAiConnectionMutation,
  useGetAiDocumentsQuery,
  useUploadAiDocumentMutation,
  useDeleteAiDocumentMutation,
} from '../../api/omnichannelApi';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  Shield,
  Trash2,
  RefreshCw,
  Plus,
  Loader2,
  X,
  Settings,
  Bot,
  Sparkles,
  Power,
  Sliders,
  FileText,
  UploadCloud,
  FileCheck,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

export const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  whatsapp: {
    platform: 'whatsapp',
    name: 'WhatsApp Cloud API',
    description: 'Direct Meta WhatsApp Business API for automated customer conversations and broadcasts.',
    color: '#25D366',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
    webhookPath: '/api/v1/webhooks/whatsapp',
    fields: [
      {
        key: 'phoneNumberId',
        label: 'Phone Number ID',
        type: 'text',
        placeholder: 'e.g. 109283746591029',
        required: true,
        helperText: 'Found in Meta App Dashboard > WhatsApp > API Setup',
      },
      {
        key: 'wabaId',
        label: 'WhatsApp Business Account (WABA) ID',
        type: 'text',
        placeholder: 'e.g. 987654321012345',
        required: false,
      },
      {
        key: 'accessToken',
        label: 'System User Permanent Access Token',
        type: 'password',
        placeholder: 'EAABsb...',
        required: true,
        helperText: 'Permanent access token with whatsapp_business_messaging permission',
      },
      {
        key: 'verifyToken',
        label: 'Webhook Verify Token',
        type: 'text',
        placeholder: 'omnichannel_verify_token',
        required: false,
        helperText: 'Custom string matching your Meta App Webhook configuration',
      },
    ],
  },
  telegram: {
    platform: 'telegram',
    name: 'Telegram Bot',
    description: 'Instant 2-way messaging via your official Telegram Bot token.',
    color: '#229ED9',
    docsUrl: 'https://core.telegram.org/bots/tutorial',
    webhookPath: '/api/v1/webhooks/telegram',
    fields: [
      {
        key: 'botToken',
        label: 'Bot Token',
        type: 'password',
        placeholder: '1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ',
        required: true,
        helperText: 'Obtained from @BotFather on Telegram',
      },
      {
        key: 'botUsername',
        label: 'Bot Username (optional)',
        type: 'text',
        placeholder: '@my_store_bot',
        required: false,
      },
    ],
  },
  facebook: {
    platform: 'facebook',
    name: 'Facebook Messenger',
    description: 'Meta Page messaging integration for customer inquiries and page comments.',
    color: '#1877F2',
    docsUrl: 'https://developers.facebook.com/docs/messenger-platform',
    webhookPath: '/api/v1/webhooks/facebook',
    fields: [
      {
        key: 'pageId',
        label: 'Facebook Page ID',
        type: 'text',
        placeholder: 'e.g. 102938475610293',
        required: true,
        helperText: 'Found on your Facebook Page > About section',
      },
      {
        key: 'pageAccessToken',
        label: 'Page Access Token (Permanent)',
        type: 'password',
        placeholder: 'EAABsb...',
        required: true,
        helperText: 'Requires pages_messaging and pages_show_list permissions',
      },
      {
        key: 'verifyToken',
        label: 'Webhook Verify Token',
        type: 'text',
        placeholder: 'omnichannel_verify_token',
        required: false,
      },
    ],
  },
  instagram: {
    platform: 'instagram',
    name: 'Instagram Direct',
    description: 'Direct Messages & Story Mentions via Meta Graph API.',
    color: '#E1306C',
    docsUrl: 'https://developers.facebook.com/docs/messenger-platform/instagram',
    webhookPath: '/api/v1/webhooks/facebook',
    fields: [
      {
        key: 'instagramAccountId',
        label: 'Instagram Business Account ID',
        type: 'text',
        placeholder: 'e.g. 17841400000000000',
        required: true,
        helperText: 'Linked Professional Account ID from Meta Business Suite',
      },
      {
        key: 'pageAccessToken',
        label: 'Page Access Token (with instagram permissions)',
        type: 'password',
        placeholder: 'EAABsb...',
        required: true,
        helperText: 'Requires instagram_basic, instagram_manage_messages permissions',
      },
      {
        key: 'verifyToken',
        label: 'Webhook Verify Token',
        type: 'text',
        placeholder: 'omnichannel_verify_token',
        required: false,
      },
    ],
  },
  x: {
    platform: 'x',
    name: 'X (Twitter)',
    description: 'Direct Messages and brand mention tracking via Twitter Developer API.',
    color: '#000000',
    docsUrl: 'https://developer.twitter.com/en/docs/twitter-api',
    webhookPath: '/api/v1/webhooks/x',
    fields: [
      {
        key: 'apiKey',
        label: 'Consumer API Key',
        type: 'text',
        placeholder: 'x-api-key',
        required: true,
      },
      {
        key: 'apiSecretKey',
        label: 'Consumer API Secret',
        type: 'password',
        placeholder: 'x-api-secret',
        required: true,
      },
      {
        key: 'bearerToken',
        label: 'App Bearer Token',
        type: 'password',
        placeholder: 'AAAA...',
        required: true,
      },
    ],
  },
  slack: {
    platform: 'slack',
    name: 'Slack Bot Workspace',
    description: 'Internal team notifications & staff dispatch chat bridge.',
    color: '#4A154B',
    docsUrl: 'https://api.slack.com/bot-users',
    webhookPath: '/api/v1/webhooks/slack',
    fields: [
      {
        key: 'botToken',
        label: 'Bot User OAuth Token',
        type: 'password',
        placeholder: 'xoxb-...',
        required: true,
        helperText: 'Bot token starting with xoxb- with chat:write permissions',
      },
      {
        key: 'signingSecret',
        label: 'Signing Secret',
        type: 'password',
        placeholder: 'slack-signing-secret',
        required: true,
      },
      {
        key: 'defaultChannel',
        label: 'Default Channel ID or Name',
        type: 'text',
        placeholder: 'e.g. C0123456789 or general',
        required: false,
      },
    ],
  },
  shopify: {
    platform: 'shopify',
    name: 'Shopify Storefront Chat',
    description: 'Integrate live web-chat & customer order lookup on your Shopify storefront.',
    color: '#96BF48',
    docsUrl: 'https://shopify.dev/docs/apps',
    webhookPath: '/api/v1/webhooks/shopify',
    fields: [
      {
        key: 'shopDomain',
        label: 'Shop Domain (myshopify.com)',
        type: 'text',
        placeholder: 'your-store.myshopify.com',
        required: true,
      },
      {
        key: 'accessToken',
        label: 'Storefront Access Token',
        type: 'password',
        placeholder: 'shpat_...',
        required: true,
      },
    ],
  },
  linkedin: {
    platform: 'linkedin',
    name: 'LinkedIn Lead Messaging',
    description: 'B2B Lead gen & InMail automated message capture.',
    color: '#0A66C2',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/',
    webhookPath: '/api/v1/webhooks/linkedin',
    fields: [
      {
        key: 'clientId',
        label: 'Client ID',
        type: 'text',
        placeholder: 'linkedin-client-id',
        required: true,
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'linkedin-client-secret',
        required: true,
      },
    ],
  },
  hubspot: {
    platform: 'hubspot',
    name: 'HubSpot CRM Bridge',
    description: 'Bidirectional sync of contacts and chat tickets to HubSpot CRM.',
    color: '#FF7A59',
    docsUrl: 'https://developers.hubspot.com/',
    webhookPath: '/api/v1/webhooks/hubspot',
    fields: [
      {
        key: 'accessToken',
        label: 'Private App Access Token',
        type: 'password',
        placeholder: 'pat-na1-...',
        required: true,
      },
    ],
  },
  custom: {
    platform: 'custom',
    name: 'Custom Inbound Webhook',
    description: 'Receive messages from custom ERP, Mobile Apps, or external websites.',
    color: '#6366F1',
    docsUrl: '#',
    webhookPath: '/api/v1/webhooks/custom',
    fields: [
      {
        key: 'secretKey',
        label: 'Signature Secret Key',
        type: 'password',
        placeholder: 'hmac-sha256-secret',
        required: true,
      },
      {
        key: 'endpointName',
        label: 'Custom Endpoint Identifier',
        type: 'text',
        placeholder: 'my-custom-app',
        required: true,
      },
    ],
  },
};

export const AI_PROVIDERS = [
  {
    id: 'gemini' as const,
    name: 'Google Gemini',
    badge: 'Ultra Fast & Multilingual',
    keyPrefix: 'AIzaSy...',
    keyLabel: 'Google AI Studio API Key',
    color: 'from-blue-600 to-indigo-600',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      { id: 'gemini-flash-latest', name: 'Gemini Flash Latest (Ultra Fast & Recommended)' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Next-Gen High Performance)' },
      { id: 'gemini-pro-latest', name: 'Gemini Pro Latest (Deep Reasoning)' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Advanced Reasoning)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Legacy Balanced)' },
    ],
  },
  {
    id: 'openai' as const,
    name: 'OpenAI (ChatGPT)',
    badge: 'GPT-4o & GPT-4o Mini',
    keyPrefix: 'sk-proj-...',
    keyLabel: 'OpenAI API Secret Key',
    color: 'from-emerald-600 to-teal-700',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni Flagship - Most Intelligent)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Affordable & Ultra Fast)' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (High Quality)' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Legacy Fast)' },
    ],
  },
  {
    id: 'claude' as const,
    name: 'Anthropic Claude',
    badge: 'Claude 3.5 Sonnet',
    keyPrefix: 'sk-ant-...',
    keyLabel: 'Anthropic API Key',
    color: 'from-amber-600 to-orange-700',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (State of the Art)' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (High Speed & Precise)' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Complex Analysis)' },
    ],
  },
  {
    id: 'deepseek' as const,
    name: 'DeepSeek AI',
    badge: 'Cost-Effective & Powerful',
    keyPrefix: 'sk-...',
    keyLabel: 'DeepSeek API Key',
    color: 'from-sky-600 to-blue-800',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat (V3 DeepSeek)' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1 Reasoning Model)' },
    ],
  },
  {
    id: 'groq' as const,
    name: 'Groq (Ultra-Fast LPU)',
    badge: 'Sub-second Latency',
    keyPrefix: 'gsk_...',
    keyLabel: 'Groq Cloud API Key',
    color: 'from-rose-600 to-orange-600',
    docsUrl: 'https://console.groq.com/keys',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Meta)' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra Fast)' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (Mistral AI)' },
    ],
  },
];

export const ChannelCredentialsManager: React.FC = () => {
  const { data: credentials = [], isLoading, refetch } = useGetChannelCredentialsQuery();
  const [saveCredentials, { isLoading: isSaving }] = useSaveChannelCredentialsMutation();
  const [testConnection] = useTestChannelConnectionMutation();
  const [toggleActive] = useToggleChannelActiveMutation();
  const [deleteCredentials] = useDeleteChannelCredentialsMutation();

  // AI Configuration Hooks & State
  const { data: aiConfig, isLoading: isLoadingAi, refetch: refetchAi } = useGetAiConfigQuery();
  const [saveAiConfig, { isLoading: isSavingAi }] = useSaveAiConfigMutation();
  const [testAiConnection, { isLoading: isTestingAi }] = useTestAiConnectionMutation();

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'claude' | 'deepseek' | 'groq'>('gemini');
  const [aiApiKeyInput, setAiApiKeyInput] = useState('');
  const [showAiApiKey, setShowAiApiKey] = useState(false);
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [aiTriggerMode, setAiTriggerMode] = useState<'ALWAYS' | 'NO_HUMAN_ACTIVE'>('ALWAYS');
  const [aiSystemPrompt, setAiSystemPrompt] = useState('');
  const [aiEnabledPlatforms, setAiEnabledPlatforms] = useState<Record<string, boolean>>({
    telegram: true,
    whatsapp: true,
    instagram: true,
    facebook: true,
    x: false,
  });
  // Per-provider test status cache: { openai: { success, message, latencyMs }, gemini: {...}, ... }
  const [providerStatuses, setProviderStatuses] = useState<
    Record<string, { success: boolean; message: string; latencyMs?: number } | null>
  >({});
  const [isSavingKey, setIsSavingKey] = useState(false);

  // RAG Document Knowledge Base State
  const { data: aiDocuments = [], isLoading: isLoadingDocs, refetch: refetchDocs } = useGetAiDocumentsQuery();
  const [uploadAiDocument, { isLoading: isUploadingDoc }] = useUploadAiDocumentMutation();
  const [deleteAiDocument, { isLoading: isDeletingDoc }] = useDeleteAiDocumentMutation();
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading(`Uploading & indexing "${file.name}" into store vector database...`);

    try {
      await uploadAiDocument(formData).unwrap();
      refetchDocs();
      toast.success(`✨ "${file.name}" indexed successfully into Store Knowledge Base!`, { id: toastId });
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        (Array.isArray(err?.data?.errorSources) && err.data.errorSources[0]?.details) ||
        err?.error ||
        err?.message ||
        'Failed to upload document.';
      toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg), { id: toastId });
    } finally {
      // Reset input
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    setDeletingDocId(docId);
    try {
      await deleteAiDocument(docId).unwrap();
      refetchDocs();
      toast.success(`"${docName}" removed from knowledge base.`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete document.');
    } finally {
      setDeletingDocId(null);
    }
  };

  // Sync AI state from DB on load
  useEffect(() => {
    if (!aiConfig) return;
    if (aiConfig.provider) setAiProvider(aiConfig.provider as any);
    setAiModel(aiConfig.model || 'gemini-1.5-flash');
    setAiTriggerMode(aiConfig.triggerMode === 'ALWAYS' ? 'ALWAYS' : 'NO_HUMAN_ACTIVE');
    setAiSystemPrompt(
      aiConfig.systemPrompt ||
        'You are an intelligent, friendly and professional customer support AI assistant for our store. Assist customers with inquiries, product info, pricing, delivery times, and order details promptly and politely in Bengali or English based on the customer language.',
    );
    if (aiConfig.enabledPlatforms) {
      setAiEnabledPlatforms({
        telegram: aiConfig.enabledPlatforms.telegram !== false,
        whatsapp: aiConfig.enabledPlatforms.whatsapp !== false,
        instagram: aiConfig.enabledPlatforms.instagram !== false,
        facebook: aiConfig.enabledPlatforms.facebook !== false,
        x: aiConfig.enabledPlatforms.x === true,
      });
    }
    // Clear key input (always load fresh — never pre-fill for security)
    setAiApiKeyInput('');
  }, [aiConfig]);

  const handleSelectAiProvider = (provId: 'gemini' | 'openai' | 'claude' | 'deepseek' | 'groq') => {
    setAiProvider(provId);
    setAiApiKeyInput('');
    const prov = AI_PROVIDERS.find((p) => p.id === provId);
    if (prov?.models.length) setAiModel(prov.models[0].id);
  };

  /**
   * Save key for the selected provider immediately, then auto-test.
   * Called when user clicks "Add Key" button next to the input.
   */
  const handleSaveKeyAndTest = async () => {
    const rawKey = aiApiKeyInput.trim();
    if (!rawKey || rawKey.includes('•') || rawKey.includes('*')) {
      toast.error('Please enter a valid API key.');
      return;
    }
    setIsSavingKey(true);
    setProviderStatuses((prev) => ({ ...prev, [aiProvider]: null }));
    try {
      // 1. Save key + provider + model to backend
      await saveAiConfig({
        provider: aiProvider,
        model: aiModel,
        apiKey: rawKey,
        isEnabled: aiConfig?.isEnabled ?? false,
        triggerMode: aiTriggerMode,
        systemPrompt: aiSystemPrompt.trim() || undefined,
        enabledPlatforms: aiEnabledPlatforms,
      }).unwrap();

      // 2. Auto-test with the fresh key
      const testRes = await testAiConnection({
        provider: aiProvider,
        model: aiModel,
        apiKey: rawKey,
      }).unwrap();

      const result = (testRes as any)?.data ?? testRes;
      setProviderStatuses((prev) => ({ ...prev, [aiProvider]: result }));

      if (result?.success) {
        toast.success(`✅ ${aiProvider.toUpperCase()} key saved & verified!`);
      } else {
        toast.warning(`Key saved, but test failed: ${result?.message || 'Unknown error'}`);
      }

      // 3. Clear input (key is now stored encrypted) and refresh config
      setAiApiKeyInput('');
      refetchAi();
    } catch (err: any) {
      const msg =
        err?.data?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Failed to save or test key.';
      setProviderStatuses((prev) => ({ ...prev, [aiProvider]: { success: false, message: msg } }));
      toast.error(msg);
    } finally {
      setIsSavingKey(false);
    }
  };

  /** Re-test an already saved key for any provider */
  const handleRetestProvider = async (provId: string) => {
    setProviderStatuses((prev) => ({ ...prev, [provId]: null }));
    try {
      const testRes = await testAiConnection({
        provider: provId,
        model: AI_PROVIDERS.find((p) => p.id === provId)?.models[0]?.id || aiModel,
      }).unwrap();
      const result = (testRes as any)?.data ?? testRes;
      setProviderStatuses((prev) => ({ ...prev, [provId]: result }));
      if (result?.success) {
        toast.success(`${provId.toUpperCase()} connection verified!`);
      } else {
        toast.error(result?.message || 'Test failed.');
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Test failed.';
      setProviderStatuses((prev) => ({ ...prev, [provId]: { success: false, message: msg } }));
      toast.error(msg);
    }
  };



  const [activeModalPlatform, setActiveModalPlatform] = useState<SocialPlatform | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [testingPlatform, setTestingPlatform] = useState<SocialPlatform | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const getCredentialForPlatform = (platform: SocialPlatform): ChannelCredential | undefined =>
    credentials.find((c) => c.platform === platform);

  const getPlatformIdSummary = (
    platform: SocialPlatform,
    cred?: ChannelCredential,
  ): Array<{ label: string; value: string; isHighlight?: boolean }> => {
    if (!cred) return [];
    const c = cred.credentials || {};
    const m = cred.metadata || {};
    switch (platform) {
      case 'telegram': {
        const botId = m.bot_id || m.id;
        const firstName = m.first_name || m.first_name_bot || m.title;
        return [
          { label: 'Bot Handle', value: cred.accountHandle || (m.username ? `@${m.username}` : '@forsbit_bot'), isHighlight: true },
          { label: 'Bot ID', value: botId ? String(botId) : '8916374089' },
          { label: 'Bot Name', value: firstName || 'bitChan_bot' },
          { label: 'Sync Engine', value: '4s Polling Engine' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } => Boolean(x.value));
      }
      case 'whatsapp': {
        return [
          { label: 'Phone ID', value: c.phoneNumberId, isHighlight: true },
          { label: 'WABA ID', value: c.wabaId },
          { label: 'Verify Token', value: c.verifyToken },
          { label: 'Display Name', value: cred.accountHandle && cred.accountHandle !== `Phone ID: ${c.phoneNumberId}` ? cred.accountHandle : null },
          { label: 'Sync Engine', value: 'Meta Graph Webhook' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } => Boolean(x.value));
      }
      case 'facebook':
      case 'instagram': {
        return [
          { label: 'Page Name', value: cred.accountHandle || m.name || (platform === 'instagram' ? '@rahat.661' : 'Connected Page'), isHighlight: true },
          { label: 'Account ID', value: c.instagramAccountId || c.pageId },
          { label: 'Sync Engine', value: 'Meta Graph Webhook' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } => Boolean(x.value));
      }
      case 'slack': {
        return [
          { label: 'Channel', value: c.defaultChannel ? `#${c.defaultChannel}` : null, isHighlight: true },
          { label: 'Bot User ID', value: m.user_id || null },
          { label: 'Sync Engine', value: 'Slack Events API' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } => Boolean(x.value));
      }
      case 'shopify': {
        return [
          { label: 'Shop Domain', value: c.shopDomain, isHighlight: true },
          { label: 'Sync Engine', value: 'Shopify Storefront Webhook' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } => Boolean(x.value));
      }
      case 'x': {
        return [
          { label: 'Account Handle', value: cred.accountHandle || 'Connected X Account', isHighlight: true },
          { label: 'API Key', value: c.apiKey },
          { label: 'Sync Engine', value: 'X / Twitter API' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } => Boolean(x.value));
      }
      case 'linkedin': {
        return [
          { label: 'Client ID', value: c.clientId, isHighlight: true },
          { label: 'Sync Engine', value: 'LinkedIn Lead API' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } => Boolean(x.value));
      }
      case 'hubspot': {
        return [
          { label: 'Auth Type', value: 'Private App Access Token', isHighlight: true },
          { label: 'Sync Engine', value: 'HubSpot REST' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } => Boolean(x.value));
      }
      default: {
        return [
          { label: 'Inbound Endpoint', value: PLATFORM_CONFIGS[platform]?.webhookPath || '', isHighlight: true },
          { label: 'Sync Engine', value: 'Inbound REST Webhook' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } => Boolean(x.value));
      }
    }
  };

  const openConfigModal = (platform: SocialPlatform) => {
    const cred = getCredentialForPlatform(platform);
    setActiveModalPlatform(platform);
    setFormData(cred?.credentials || {});
    setTestResult((prev) => ({ ...prev, [platform]: undefined as any }));
  };

  const closeConfigModal = () => {
    setActiveModalPlatform(null);
    setFormData({});
    setShowTokens({});
  };

  const handleInputChange = (fieldKey: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const toggleTokenVisibility = (key: string) => {
    setShowTokens((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalPlatform) return;
    try {
      await saveCredentials({
        platform: activeModalPlatform,
        name: PLATFORM_CONFIGS[activeModalPlatform]?.name || activeModalPlatform,
        credentials: formData,
      }).unwrap();
      toast.success(`${PLATFORM_CONFIGS[activeModalPlatform]?.name} credentials saved!`);
      handleTestConnection(activeModalPlatform, formData);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save credentials.');
    }
  };

  const handleTestConnection = async (platform: SocialPlatform, credsOverride?: Record<string, any>) => {
    setTestingPlatform(platform);
    try {
      const res: any = await testConnection({ platform, credentials: credsOverride || formData }).unwrap();
      const isSuccess = res?.success !== false && (res?.success === true || !res?.error);
      const message =
        res?.message ||
        (isSuccess
          ? `${PLATFORM_CONFIGS[platform]?.name} connection verified successfully!`
          : 'Connection test failed.');

      setTestResult((prev) => ({
        ...prev,
        [platform]: { success: isSuccess, message },
      }));

      if (isSuccess) {
        toast.success(`✅ ${message}`);
      } else {
        toast.error(`❌ ${message}`);
      }
      refetch();
    } catch (err: any) {
      const errMsg =
        err?.data?.message ||
        err?.message ||
        'Connection test failed. Check token or network.';
      setTestResult((prev) => ({
        ...prev,
        [platform]: { success: false, message: errMsg },
      }));
      toast.error(errMsg);
    } finally {
      setTestingPlatform(null);
    }
  };

  const handleToggle = async (platform: SocialPlatform, currentActive: boolean) => {
    try {
      await toggleActive({ platform, isActive: !currentActive }).unwrap();
      toast.success(`${PLATFORM_CONFIGS[platform]?.name} status updated.`);
    } catch {
      toast.error('Failed to toggle status.');
    }
  };

  const handleDelete = async (platform: SocialPlatform) => {
    if (!confirm(`Are you sure you want to remove credentials for ${PLATFORM_CONFIGS[platform]?.name}?`)) return;
    try {
      await deleteCredentials(platform).unwrap();
      toast.success('Credentials removed.');
    } catch {
      toast.error('Failed to delete credentials.');
    }
  };

  /** Save general AI settings (trigger mode, system prompt, enabled platforms, active toggle) */
  const handleSaveSettings = async (enableOverride?: boolean) => {
    try {
      const isEnabled = enableOverride !== undefined ? enableOverride : (aiConfig?.isEnabled ?? false);
      await saveAiConfig({
        isEnabled,
        provider: aiProvider,
        model: aiModel,
        triggerMode: aiTriggerMode,
        systemPrompt: aiSystemPrompt.trim() || undefined,
        enabledPlatforms: aiEnabledPlatforms,
      }).unwrap();
      refetchAi();
      if (enableOverride === undefined) {
        toast.success('AI settings saved!');
        setIsAiModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save AI settings.');
    }
  };

  const isAiActive = Boolean(aiConfig?.isEnabled);





  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl space-y-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg font-black tracking-tight">Channel API Integrations & Security</h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Connect official Meta (WhatsApp & Facebook), Telegram, and Twitter APIs. Inbound messages automatically sync with Customer 360 profiles and trigger instant notifications.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border border-indigo-400/40 rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>Configure AI Credentials</span>
            </button>

            <button
              onClick={() => {
                refetch();
                refetchAi();
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isLoadingAi ? 'animate-spin' : ''}`} />
              <span>Sync Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Platforms + AI Automation Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* ─── FEATURED AI CREDENTIALS & AUTOMATION CARD ────────────────── */}
        {(() => {
          const currentProv =
            AI_PROVIDERS.find((p) => p.id === (aiConfig?.provider || 'gemini')) || AI_PROVIDERS[0];
          return (
            <div
              className={`bg-white rounded-3xl border transition-all p-5 flex flex-col justify-between space-y-4 hover:shadow-md ${
                isAiActive
                  ? 'border-indigo-300 ring-2 ring-indigo-500/15 shadow-sm'
                  : 'border-slate-200/90'
              }`}
            >
              <div className="space-y-3.5">
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${currentProv.color} flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0`}
                    >
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-slate-900 truncate flex items-center gap-1.5">
                        <span>{currentProv.name}</span>
                        <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[9px] font-bold">
                          Auto-Reply
                        </span>
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[170px]">
                          <Bot className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span className="truncate">{aiConfig?.model || currentProv.models[0].id}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isAiActive ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-2xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Live
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                        Disabled
                      </span>
                    )}

                    {/* Quick Toggle Switch */}
                    <button
                      onClick={() => handleSaveSettings(!isAiActive)}
                      disabled={isSavingAi}
                      title={isAiActive ? 'Disable AI Auto-Reply' : 'Enable AI Auto-Reply'}
                      className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5 focus:outline-none cursor-pointer ${
                        isAiActive ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 bg-white rounded-full shadow-md transform transition-transform ${
                          isAiActive ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>


                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {currentProv.name} LLM for automated customer support, instant product inquiries, and 24/7 chat assistance.
                </p>

                {/* AI Identity & Parameter Details */}
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-indigo-600" />
                      AI Provider & Security
                    </span>
                    <span className={`text-[9px] font-bold ${aiConfig?.providerKeys?.[aiConfig?.provider || 'gemini']?.hasApiKey ? 'text-emerald-700' : 'text-amber-600'}`}>
                      {aiConfig?.providerKeys?.[aiConfig?.provider || 'gemini']?.hasApiKey ? '✓ API Key Encrypted & Saved' : 'Key Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-1.5 rounded-xl bg-white border border-indigo-100/60 flex flex-col justify-center min-w-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        PROVIDER / ENGINE
                      </span>
                      <span className="font-bold text-slate-800 truncate text-[10px] mt-0.5">
                        {currentProv.name}
                      </span>
                    </div>

                    <div className="p-1.5 rounded-xl bg-white border border-indigo-100/60 flex flex-col justify-center min-w-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        TRIGGER MODE
                      </span>
                      <span className="font-extrabold text-slate-800 truncate text-[10px] mt-0.5">
                        {aiConfig?.triggerMode === 'ALWAYS' ? 'Instant 24/7' : 'Human First'}
                      </span>
                    </div>

                    {/* Enabled Platforms Pills */}
                    <div className="col-span-2 p-1.5 rounded-xl bg-white border border-indigo-100/60 flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        AUTO-REPLY CHANNELS:
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {['telegram', 'whatsapp', 'instagram', 'facebook'].map((p) => {
                          const isOn = aiConfig?.enabledPlatforms?.[p] !== false;
                          return (
                            <span
                              key={p}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold capitalize ${
                                isOn
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-400 line-through'
                              }`}
                            >
                              {p}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Result Feedback */}
                {providerStatuses[aiConfig?.provider || 'gemini'] && (
                  <div
                    className={`p-2.5 rounded-2xl text-xs font-semibold flex items-start gap-2 border animate-in fade-in ${
                      providerStatuses[aiConfig?.provider || 'gemini']?.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    {providerStatuses[aiConfig?.provider || 'gemini']?.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-tight text-[11px]">{providerStatuses[aiConfig?.provider || 'gemini']?.message}</span>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAiModalOpen(true)}
                    className="px-3.5 py-2 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Configure AI</span>
                  </button>

                  <button
                    onClick={() => handleRetestProvider(aiConfig?.provider || 'gemini')}
                    disabled={isTestingAi}
                    title="Test live connection to AI API"
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className={`w-3.5 h-3.5 text-indigo-600 ${isTestingAi ? 'animate-spin' : ''}`} />
                    <span>{isTestingAi ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ─── Communication Channel Cards ─────────────────────────────────── */}
        {(Object.keys(PLATFORM_CONFIGS) as SocialPlatform[]).map((platform) => {
          const config = PLATFORM_CONFIGS[platform];
          const cred = getCredentialForPlatform(platform);
          const isConnected = cred?.status === 'connected';
          const isConfigured = Boolean(cred);
          const isActive = cred?.isActive ?? false;
          const currentTest = testResult[platform];
          const isTesting = testingPlatform === platform;

          const idSummary = getPlatformIdSummary(platform, cred);

          return (
            <div
              key={platform}
              className={`bg-white rounded-3xl border transition-all p-5 flex flex-col justify-between space-y-4 hover:shadow-md ${
                isConnected && isActive
                  ? 'border-emerald-300 shadow-xs ring-1 ring-emerald-500/10'
                  : isConfigured
                  ? 'border-amber-200/90'
                  : 'border-slate-200/80'
              }`}
            >
              {/* Header & Status */}
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlatformIcon platform={platform} size={40} />
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-slate-900 truncate">
                        {config.name}
                      </h3>
                      {cred?.accountHandle && (
                        <p className="text-[11px] font-bold text-blue-600 truncate mt-0.5">
                          {cred.accountHandle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Badges & Toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isConnected && isActive ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-2xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Live
                      </span>
                    ) : isConnected && !isActive ? (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                        Paused
                      </span>
                    ) : isConfigured ? (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        Pending
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">
                        Not Setup
                      </span>
                    )}

                    {/* Quick Active Switch */}
                    {isConfigured && (
                      <button
                        onClick={() => handleToggle(platform, isActive)}
                        title={isActive ? 'Pause channel sync' : 'Activate channel sync'}
                        className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5 focus:outline-none cursor-pointer ${
                          isActive ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 bg-white rounded-full shadow-md transform transition-transform ${
                            isActive ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {config.description}
                </p>

                {/* Live Verified Connection & Identity Details */}
                {isConfigured && idSummary.length > 0 && (
                  <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-blue-600" />
                        Connection Identity & IDs
                      </span>
                      {cred?.lastSyncedAt && (
                        <span className="text-[9px] text-slate-400 font-normal">
                          Synced {new Date(cred.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {idSummary.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-1.5 rounded-xl bg-white border border-slate-100 flex flex-col justify-center min-w-0 ${
                            item.isHighlight ? 'col-span-2 bg-blue-50/40 border-blue-100/60' : ''
                          }`}
                        >
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">
                            {item.label}
                          </span>
                          <span className="font-extrabold text-slate-800 truncate text-[11px] mt-0.5">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Test Feedback */}
                {currentTest && currentTest.message && (
                  <div
                    className={`p-2.5 rounded-2xl text-xs font-semibold flex items-start gap-2 border animate-in fade-in ${
                      currentTest.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    {currentTest.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-tight text-[11px]">{currentTest.message}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openConfigModal(platform)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isConfigured ? 'Configure' : 'Setup Channel'}</span>
                  </button>

                  {isConfigured && (
                    <button
                      onClick={() => handleTestConnection(platform)}
                      disabled={isTesting}
                      title="Test live API credentials against channel servers"
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Zap className={`w-3.5 h-3.5 text-blue-600 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Testing...' : 'Test'}</span>
                    </button>
                  )}
                </div>

                {isConfigured && (
                  <button
                    onClick={() => handleDelete(platform)}
                    title="Remove credentials"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── AI Auto-Reply Settings & Multi-Provider API Key Modal ─────────── */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 my-auto">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                    <span>AI Engine & Credentials Manager</span>
                    <span className="px-2 py-0.5 bg-indigo-500/30 border border-indigo-400/40 rounded-full text-[10px] font-bold text-indigo-200">
                      5 AI Providers
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200/70 mt-0.5">
                    Add keys for OpenAI, Gemini, Claude, DeepSeek, or Groq. Keys save instantly and are verified automatically.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* 1. Global Master Switch */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Power className={`w-4 h-4 ${isAiActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Global AI Auto-Reply Switch</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Enable or disable AI Auto-Reply globally across all omnichannel communication channels.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveSettings(!isAiActive)}
                  disabled={isSavingAi}
                  className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer shadow-xs ${
                    isAiActive
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-300 hover:bg-slate-400 text-slate-800'
                  }`}
                >
                  {isAiActive ? 'Active (ON)' : 'Disabled (OFF)'}
                </button>
              </div>

              {/* 2. Choose AI Provider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>1. Select AI Engine / Provider (এআই প্রোভাইডার সিলেক্ট করুন)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Each provider key is saved independently
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {AI_PROVIDERS.map((prov) => {
                    const isSelected = aiProvider === prov.id;
                    const hasKey = Boolean(aiConfig?.providerKeys?.[prov.id]?.hasApiKey);
                    const currentStatus = providerStatuses[prov.id];

                    return (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => handleSelectAiProvider(prov.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[105px] ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-600/30 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-black text-xs block truncate">{prov.name}</span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 line-clamp-2 leading-tight">
                            {prov.badge}
                          </span>
                        </div>

                        <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                          {currentStatus?.success ? (
                            <span className="text-[9px] font-black text-emerald-700 flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Verified
                            </span>
                          ) : hasKey ? (
                            <span className="text-[9px] font-black text-emerald-700 flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              Key Saved
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400">
                              No Key
                            </span>
                          )}
                          {aiConfig?.provider === prov.id && (
                            <span className="text-[8px] font-black uppercase px-1 py-0.2 bg-indigo-100 text-indigo-800 rounded">
                              Active
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. API Key & Model Configuration for Selected Provider */}
              {(() => {
                const selectedProv =
                  AI_PROVIDERS.find((p) => p.id === aiProvider) || AI_PROVIDERS[0];
                const hasSavedKey = Boolean(aiConfig?.providerKeys?.[aiProvider]?.hasApiKey);
                const currentStatus = providerStatuses[aiProvider];

                return (
                  <div className="space-y-3.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                        <span>2. {selectedProv.keyLabel}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <a
                          href={selectedProv.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                        >
                          <span>Get {selectedProv.name} Key</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasSavedKey ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {hasSavedKey ? `✓ Saved: ${aiConfig?.providerKeys?.[aiProvider]?.apiKeyMasked}` : 'Key Required'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showAiApiKey ? 'text' : 'password'}
                          value={aiApiKeyInput}
                          onChange={(e) => setAiApiKeyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && aiApiKeyInput.trim()) {
                              e.preventDefault();
                              handleSaveKeyAndTest();
                            }
                          }}
                          placeholder={
                            hasSavedKey
                              ? `Saved: ${aiConfig?.providerKeys?.[aiProvider]?.apiKeyMasked} (Enter new key to replace)`
                              : `Paste ${selectedProv.name} API Key (${selectedProv.keyPrefix})`
                          }
                          className="w-full p-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAiApiKey((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          {showAiApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Instant Save & Test Key Button */}
                      <button
                        type="button"
                        onClick={handleSaveKeyAndTest}
                        disabled={isSavingKey || isTestingAi || !aiApiKeyInput.trim()}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-40 shrink-0"
                      >
                        {isSavingKey ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>{isSavingKey ? 'Saving & Testing...' : 'Save & Verify Key'}</span>
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 flex-1">
                        <span className="font-bold shrink-0">Model:</span>
                        <select
                          value={aiModel}
                          onChange={(e) => setAiModel(e.target.value)}
                          className="font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-indigo-600/30 text-xs"
                        >
                          {selectedProv.models.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {hasSavedKey && (
                        <button
                          type="button"
                          onClick={() => handleRetestProvider(aiProvider)}
                          disabled={isTestingAi}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 shrink-0"
                        >
                          {isTestingAi ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Zap className="w-3 h-3 text-indigo-600" />
                          )}
                          <span>Re-Test {selectedProv.name}</span>
                        </button>
                      )}
                    </div>

                    {/* Test Result Feedback Box */}
                    {currentStatus && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 border animate-in fade-in ${
                          currentStatus.success
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-rose-50 text-rose-900 border-rose-200'
                        }`}
                      >
                        {currentStatus.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5">
                          <p className="font-bold text-xs">{currentStatus.message}</p>
                          {currentStatus.latencyMs !== undefined && currentStatus.latencyMs > 0 && (
                            <p className="text-[10px] text-slate-500">
                              Response Latency: <span className="font-mono font-bold text-slate-700">{currentStatus.latencyMs}ms</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 4. Per-Channel Activation Toggles */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. Channel-Specific Automation (প্ল্যাটফর্মভিত্তিক অ্যাক্টিভেশন)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Turn AI Auto-Reply ON or OFF for each connected channel individually:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Telegram */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform="telegram" size={20} />
                      <div>
                        <span className="font-bold text-slate-900 block">Telegram Bot</span>
                        <span className="text-[10px] text-slate-400">@forsbit_bot</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAiEnabledPlatforms((prev) => ({ ...prev, telegram: !prev.telegram }))
                      }
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        aiEnabledPlatforms.telegram !== false
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {aiEnabledPlatforms.telegram !== false ? 'AI Active' : 'Off'}
                    </button>
                  </div>

                  {/* WhatsApp */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform="whatsapp" size={20} />
                      <div>
                        <span className="font-bold text-slate-900 block">WhatsApp Business</span>
                        <span className="text-[10px] text-slate-400">Cloud API</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAiEnabledPlatforms((prev) => ({ ...prev, whatsapp: !prev.whatsapp }))
                      }
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        aiEnabledPlatforms.whatsapp !== false
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {aiEnabledPlatforms.whatsapp !== false ? 'AI Active' : 'Off'}
                    </button>
                  </div>

                  {/* Instagram */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform="instagram" size={20} />
                      <div>
                        <span className="font-bold text-slate-900 block">Instagram Direct</span>
                        <span className="text-[10px] text-slate-400">Direct Messages</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAiEnabledPlatforms((prev) => ({ ...prev, instagram: !prev.instagram }))
                      }
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        aiEnabledPlatforms.instagram !== false
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {aiEnabledPlatforms.instagram !== false ? 'AI Active' : 'Off'}
                    </button>
                  </div>

                  {/* Facebook */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform="facebook" size={20} />
                      <div>
                        <span className="font-bold text-slate-900 block">Facebook Messenger</span>
                        <span className="text-[10px] text-slate-400">Page Messaging</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAiEnabledPlatforms((prev) => ({ ...prev, facebook: !prev.facebook }))
                      }
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        aiEnabledPlatforms.facebook !== false
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {aiEnabledPlatforms.facebook !== false ? 'AI Active' : 'Off'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Trigger Mode */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">
                  4. AI Trigger Condition (অটো-রিপ্লাই মোড)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiTriggerMode('ALWAYS')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      aiTriggerMode === 'ALWAYS'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold block text-xs">⚡ Instant 24/7 Auto-Reply</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Every incoming customer message receives an immediate AI response.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiTriggerMode('NO_HUMAN_ACTIVE')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      aiTriggerMode === 'NO_HUMAN_ACTIVE'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold block text-xs">👤 Human Support First</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Auto-replies only when no human staff member has replied in 30 minutes.
                    </span>
                  </button>
                </div>
              </div>

              {/* 6. System Prompt / Store Personality */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  5. AI Instructions & Persona (স্টোরের নির্দেশিকা)
                </label>
                <textarea
                  rows={3}
                  value={aiSystemPrompt}
                  onChange={(e) => setAiSystemPrompt(e.target.value)}
                  placeholder="Describe how the AI should talk to your customers in Bengali or English..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/30 leading-relaxed"
                />
              </div>

              {/* 7. Store Knowledge Base & Documents (RAG) */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border border-indigo-200/80 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>6. Store Knowledge Base & Policies (RAG - পিডিএফ ও ডকুমেন্টস)</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Upload your store return policy, delivery guides, FAQs, or warranty PDFs. AI will use these exclusively for this store.
                    </p>
                  </div>

                  {/* Upload PDF Button */}
                  <label className={`px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0 ${isUploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isUploadingDoc ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingDoc ? 'Indexing...' : 'Upload PDF/Doc'}</span>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md,.doc,.docx"
                      onChange={handleUploadDocument}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Uploaded Documents List */}
                {isLoadingDocs ? (
                  <div className="p-4 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-xs">Loading store knowledge base...</span>
                  </div>
                ) : aiDocuments.length === 0 ? (
                  <div className="p-4 bg-white/80 border border-dashed border-indigo-200 rounded-xl text-center space-y-1">
                    <FileText className="w-6 h-6 text-indigo-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">No documents uploaded yet</p>
                    <p className="text-[10px] text-slate-400">
                      Upload a PDF file (e.g. Return_Policy.pdf) to train AI with your store rules.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {aiDocuments.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between shadow-2xs gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100/70 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-slate-900 truncate">
                              {doc.fileName}
                            </h5>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                              <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                              <span>•</span>
                              <span className="text-indigo-600 font-bold">{doc.chunkCount || 0} Vector Chunks</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                              doc.status === 'INDEXED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : doc.status === 'PROCESSING'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {doc.status === 'INDEXED' ? '✓ Indexed & Active' : doc.status}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                            disabled={deletingDocId === doc.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete document"
                          >
                            {deletingDocId === doc.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Multi-Tenant Privacy Callout */}
                <div className="p-2.5 bg-indigo-100/50 border border-indigo-200/60 rounded-xl flex items-center gap-2 text-[10px] text-indigo-900 font-medium">
                  <Shield className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                  <span>
                    <strong>100% Store Isolated:</strong> Documents uploaded here are indexed specifically for your store. Other merchants cannot access your data.
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                disabled={isSavingAi}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save AI Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Communication Channel Modal ─────────────────────────────────── */}
      {activeModalPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <PlatformIcon platform={activeModalPlatform} size={28} />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {PLATFORM_CONFIGS[activeModalPlatform].name}
                  </h3>
                  <a
                    href={PLATFORM_CONFIGS[activeModalPlatform].docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Official Developer Documentation</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
              <button
                onClick={closeConfigModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Form Fields */}
                {PLATFORM_CONFIGS[activeModalPlatform].fields.map((field) => {
                  const isPass = field.type === 'password';
                  const isVisible = showTokens[field.key];
                  const value = formData[field.key] || '';

                  return (
                    <div key={field.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <span>{field.label}</span>
                          {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.helperText && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {field.helperText}
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type={isPass && !isVisible ? 'password' : 'text'}
                          value={value}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          required={field.required}
                          className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                        />

                        {isPass && (
                          <button
                            type="button"
                            onClick={() => toggleTokenVisibility(field.key)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Webhook Endpoint Box */}
                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Generated Webhook Callback URL
                  </label>
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-700 truncate text-[11px]">
                      {typeof window !== 'undefined'
                        ? `${window.location.origin}${PLATFORM_CONFIGS[activeModalPlatform].webhookPath}`
                        : `http://localhost:5001${PLATFORM_CONFIGS[activeModalPlatform].webhookPath}`}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001'}${PLATFORM_CONFIGS[activeModalPlatform].webhookPath}`,
                          'modal-webhook'
                        )
                      }
                      className="ml-2 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold text-[11px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'modal-webhook' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Paste this callback URL into your Meta App or Telegram BotFather webhook settings.
                  </p>
                </div>

                {/* Test Connection Result Feedback */}
                {testResult[activeModalPlatform] && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                      testResult[activeModalPlatform]?.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    {testResult[activeModalPlatform]?.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold">
                        {testResult[activeModalPlatform]?.success ? 'Connection Validated' : 'Connection Failed'}
                      </div>
                      <div className="text-[11px] text-slate-700">
                        {testResult[activeModalPlatform]?.message}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleTestConnection(activeModalPlatform, formData)}
                  disabled={testingPlatform === activeModalPlatform}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Zap className={`w-3.5 h-3.5 text-blue-600 ${testingPlatform === activeModalPlatform ? 'animate-spin' : ''}`} />
                  <span>{testingPlatform === activeModalPlatform ? 'Testing API...' : 'Test Connection'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeConfigModal}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save & Connect'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
