'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

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
      },
      {
        key: 'accessToken',
        label: 'Meta Graph Access Token',
        type: 'password',
        placeholder: 'EAABsb...',
        required: true,
        helperText: 'Requires instagram_basic and instagram_manage_messages permissions',
      },
    ],
  },
  x: {
    platform: 'x',
    name: 'X (Twitter)',
    description: 'Official X Developer API integration for Direct Messages and Mention tracking.',
    color: '#000000',
    docsUrl: 'https://developer.x.com/en/docs',
    webhookPath: '/api/v1/webhooks/x',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key (Consumer Key)',
        type: 'text',
        placeholder: 'Consumer API Key',
        required: true,
      },
      {
        key: 'apiSecret',
        label: 'API Key Secret',
        type: 'password',
        placeholder: 'Consumer Secret Key',
        required: true,
      },
      {
        key: 'accessToken',
        label: 'Access Token',
        type: 'text',
        placeholder: 'OAuth 1.0a / 2.0 User Access Token',
        required: true,
      },
      {
        key: 'accessTokenSecret',
        label: 'Access Token Secret',
        type: 'password',
        placeholder: 'Token Secret',
        required: true,
      },
    ],
  },
  slack: {
    platform: 'slack',
    name: 'Slack Bot Workspace',
    description: 'Forward customer inquiries into internal Slack support channels.',
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
        helperText: 'Bot token starting with xoxb-',
      },
      {
        key: 'channelId',
        label: 'Default Support Channel ID',
        type: 'text',
        placeholder: 'e.g. C0123456789',
        required: false,
      },
    ],
  },
  shopify: {
    platform: 'shopify',
    name: 'Shopify Store Connect',
    description: 'Sync customer order context directly into live chat conversations.',
    color: '#95BF47',
    docsUrl: 'https://shopify.dev/docs/apps/auth/admin-app-access-tokens',
    webhookPath: '/api/v1/webhooks/shopify',
    fields: [
      {
        key: 'shopDomain',
        label: 'Shop Domain',
        type: 'text',
        placeholder: 'yourstore.myshopify.com',
        required: true,
      },
      {
        key: 'adminAccessToken',
        label: 'Admin API Access Token',
        type: 'password',
        placeholder: 'shpat_...',
        required: true,
      },
    ],
  },
  linkedin: {
    platform: 'linkedin',
    name: 'LinkedIn Company Page',
    description: 'Sync company page lead messages and conversation inquiries.',
    color: '#0A66C2',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/',
    webhookPath: '/api/v1/webhooks/linkedin',
    fields: [
      {
        key: 'clientId',
        label: 'Client ID',
        type: 'text',
        placeholder: 'LinkedIn Client ID',
        required: true,
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'Client Secret',
        required: true,
      },
      {
        key: 'accessToken',
        label: 'OAuth 2.0 Access Token',
        type: 'password',
        placeholder: 'AQV...',
        required: true,
      },
    ],
  },
  hubspot: {
    platform: 'hubspot',
    name: 'HubSpot CRM Sync',
    description: 'Bi-directional sync of contacts and tickets with HubSpot.',
    color: '#FF7A59',
    docsUrl: 'https://developers.hubspot.com/docs/api/overview',
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
    description: 'Generic REST API endpoint for custom CRM integrations.',
    color: '#0D9488',
    docsUrl: 'https://docs.bitcommerce.app/api/webhooks',
    webhookPath: '/api/v1/webhooks/custom',
    fields: [
      {
        key: 'secretKey',
        label: 'Webhook Secret Key',
        type: 'password',
        placeholder: 'Custom authentication token',
        required: true,
      },
    ],
  },
};

export const ChannelCredentialsManager: React.FC = () => {
  const { data: credentials = [], isLoading, refetch } = useGetChannelCredentialsQuery();
  const [saveCredentials, { isLoading: isSaving }] = useSaveChannelCredentialsMutation();
  const [testConnection] = useTestChannelConnectionMutation();
  const [toggleActive] = useToggleChannelActiveMutation();
  const [deleteCredentials] = useDeleteChannelCredentialsMutation();

  const [activeModalPlatform, setActiveModalPlatform] = useState<SocialPlatform | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string; data?: any }>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const getCredentialForPlatform = (platform: SocialPlatform): ChannelCredential | undefined => {
    return credentials.find((c) => c.platform === platform);
  };

  const getPlatformIdSummary = (
    platform: SocialPlatform,
    cred?: ChannelCredential,
  ): Array<{ label: string; value: string; isHighlight?: boolean }> => {
    if (!cred?.credentials) return [];
    const c = cred.credentials;
    const m = cred.metadata || {};

    switch (platform) {
      case 'telegram': {
        const botId =
          m.bot?.id ||
          (c.botToken && String(c.botToken).includes(':')
            ? String(c.botToken).split(':')[0]
            : null);
        const username = m.bot?.username
          ? `@${m.bot.username}`
          : cred.accountHandle;
        const firstName = m.bot?.first_name;

        return [
          {
            label: 'Bot Handle',
            value: username || 'Verified Bot',
            isHighlight: true,
          },
          { label: 'Bot ID', value: botId ? String(botId) : null },
          { label: 'Bot Name', value: firstName || null },
          { label: 'Chat ID', value: c.chatId || null },
          { label: 'Sync Engine', value: '4s Polling Engine' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } =>
          Boolean(x.value),
        );
      }

      case 'whatsapp': {
        return [
          { label: 'Phone ID', value: c.phoneNumberId, isHighlight: true },
          { label: 'WABA ID', value: c.wabaId },
          { label: 'Verify Token', value: c.verifyToken },
          {
            label: 'Display Name',
            value:
              cred.accountHandle &&
              cred.accountHandle !== `Phone ID: ${c.phoneNumberId}`
                ? cred.accountHandle
                : null,
          },
          { label: 'Sync Engine', value: 'Meta Graph Webhook' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } =>
          Boolean(x.value),
        );
      }

      case 'facebook':
      case 'instagram': {
        return [
          {
            label: 'Page Name',
            value: cred.accountHandle || m.name || 'Connected Page',
            isHighlight: true,
          },
          { label: 'Page ID', value: c.pageId },
          { label: 'App ID', value: c.appId },
          { label: 'Sync Engine', value: 'Messenger Webhook' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } =>
          Boolean(x.value),
        );
      }

      case 'slack': {
        return [
          {
            label: 'Channel',
            value: c.defaultChannel ? `#${c.defaultChannel}` : null,
            isHighlight: true,
          },
          { label: 'Bot User ID', value: m.user_id || null },
          { label: 'Sync Engine', value: 'Slack Events API' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } =>
          Boolean(x.value),
        );
      }

      case 'shopify': {
        return [
          { label: 'Shop Domain', value: c.shopDomain, isHighlight: true },
          { label: 'Sync Engine', value: 'Admin REST API' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } =>
          Boolean(x.value),
        );
      }

      case 'x': {
        return [
          {
            label: 'Account Handle',
            value: cred.accountHandle || 'Connected X Account',
            isHighlight: true,
          },
          { label: 'API Key', value: c.apiKey },
          { label: 'Sync Engine', value: 'X / Twitter API' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } =>
          Boolean(x.value),
        );
      }

      case 'linkedin': {
        return [
          { label: 'Client ID', value: c.clientId, isHighlight: true },
          { label: 'Sync Engine', value: 'LinkedIn Lead API' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } =>
          Boolean(x.value),
        );
      }

      case 'hubspot': {
        return [
          {
            label: 'Auth Type',
            value: 'Private App Access Token',
            isHighlight: true,
          },
          { label: 'Sync Engine', value: 'HubSpot REST' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } =>
          Boolean(x.value),
        );
      }

      default: {
        return [
          {
            label: 'Inbound Endpoint',
            value: PLATFORM_CONFIGS[platform].webhookPath,
            isHighlight: true,
          },
          { label: 'Sync Engine', value: 'Inbound REST Webhook' },
        ].filter((x): x is { label: string; value: string; isHighlight?: boolean } =>
          Boolean(x.value),
        );
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
        name: PLATFORM_CONFIGS[activeModalPlatform].name,
        credentials: formData,
      }).unwrap();

      // Automatically test connection upon save
      handleTestConnection(activeModalPlatform, formData);
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to save credentials.');
    }
  };

  const handleTestConnection = async (
    platform: SocialPlatform,
    credsOverride?: Record<string, any>,
  ) => {
    setTestingPlatform(platform);
    try {
      const res = await testConnection({
        platform,
        credentials: credsOverride || formData,
      }).unwrap();

      setTestResult((prev) => ({ ...prev, [platform]: res }));
      refetch();
    } catch (err: any) {
      setTestResult((prev) => ({
        ...prev,
        [platform]: {
          success: false,
          message: err?.data?.message || 'Connection test failed. Check token or network.',
        },
      }));
    } finally {
      setTestingPlatform(null);
    }
  };

  const handleToggle = async (platform: SocialPlatform, currentActive: boolean) => {
    try {
      await toggleActive({ platform, isActive: !currentActive }).unwrap();
    } catch (err: any) {
      alert('Failed to toggle status.');
    }
  };

  const handleDelete = async (platform: SocialPlatform) => {
    if (!confirm(`Are you sure you want to remove credentials for ${PLATFORM_CONFIGS[platform].name}?`)) {
      return;
    }
    try {
      await deleteCredentials(platform).unwrap();
    } catch (err: any) {
      alert('Failed to delete credentials.');
    }
  };

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
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Status</span>
          </button>
        </div>
      </div>

      {/* Grid of Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(Object.keys(PLATFORM_CONFIGS) as SocialPlatform[]).map((platform) => {
          const config = PLATFORM_CONFIGS[platform];
          const cred = getCredentialForPlatform(platform);
          const isConnected = cred?.status === 'connected';
          const isConfigured = Boolean(cred);
          const isActive = cred?.isActive ?? false;
          const currentTest = testResult[platform];
          const isTesting = testingPlatform === platform;

          // Compute platform-specific parameter IDs
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
                    <PlatformIcon platform={platform} size={30} />
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-slate-900 truncate">
                        {config.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {cred?.accountHandle ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[170px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span className="truncate">{cred.accountHandle}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {isConfigured ? 'Configured' : 'Not Connected'}
                          </span>
                        )}
                      </div>
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
                        className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5 focus:outline-none ${
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

                {/* Inline Live Test Result Banner */}
                {currentTest && (
                  <div
                    className={`p-2.5 rounded-2xl text-xs font-semibold flex items-start gap-2 border animate-in fade-in ${
                      currentTest.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
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

                {/* Webhook snippet preview if configured */}
                {isConfigured && (
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>WEBHOOK CALLBACK</span>
                      <button
                        onClick={() =>
                          handleCopy(
                            `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001'}${config.webhookPath}`,
                            platform
                          )
                        }
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {copiedKey === platform ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-slate-600 truncate">
                      {config.webhookPath}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openConfigModal(platform)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>{isConfigured ? 'Configure' : 'Setup API'}</span>
                  </button>

                  {isConfigured && (
                    <button
                      onClick={() => handleTestConnection(platform)}
                      disabled={isTesting}
                      title="Test live connection to API"
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Zap className={`w-3.5 h-3.5 text-blue-600 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                  )}
                </div>

                {isConfigured && (
                  <button
                    onClick={() => handleDelete(platform)}
                    title="Remove credentials"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
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
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
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
                      className="ml-2 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold text-[11px] flex items-center gap-1 shrink-0 transition-colors"
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
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 text-blue-600 ${testingPlatform === activeModalPlatform ? 'animate-spin' : ''}`} />
                  <span>{testingPlatform === activeModalPlatform ? 'Testing API...' : 'Test Connection'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeConfigModal}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
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
