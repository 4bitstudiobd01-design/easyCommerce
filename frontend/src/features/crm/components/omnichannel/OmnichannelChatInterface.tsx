'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ConversationThread,
  ThreadMessage,
  SocialPlatform,
} from '../../types/omnichannel.types';
import { PlatformIcon } from './PlatformIcon';
import {
  useGetConversationsQuery,
  useGetConversationMessagesQuery,
  useSendChannelMessageMutation,
  useGetTelegramBotInfoQuery,
  useGetAiConfigQuery,
  useSaveAiConfigMutation,
  useTestAiConnectionMutation,
  useToggleConversationAiMutation,
  useGenerateAiDraftMutation,
  useGetAiDocumentsQuery,
  useUploadAiDocumentMutation,
  useDeleteAiDocumentMutation,
  useSyncChannelConversationsMutation,
} from '../../api/omnichannelApi';
import {
  Search,
  Send,
  MessageSquare,
  User,
  Clock,
  Phone,
  Tag,
  Plus,
  CheckCheck,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  Loader2,
  Smile,
  Paperclip,
  X,
  AlertCircle,
  Building,
  Bot,
  Sparkles,
  Zap,
  Power,
  Play,
  Pause,
  Settings,
  CheckCircle2,
  Sliders,
  KeyRound,
  EyeOff,
  Eye,
  BookOpen,
  UploadCloud,
  FileText,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { AI_PROVIDERS } from './ChannelCredentialsManager';

const QUICK_REPLIES = [
  'Hello! How can I help you today?',
  'Thanks for reaching out! What is your order number?',
  'We have received your payment. Delivery is in progress.',
  'Let me check our stock and get back to you in 5 minutes.',
  'Your order has been shipped and is with the courier.',
];

const PLATFORM_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Channels' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'messenger', label: 'Messenger' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
];

export const OmnichannelChatInterface: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [customerNotes, setCustomerNotes] = useState<Record<string, string[]>>({});
  const [newNoteInput, setNewNoteInput] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Direct Telegram Send Modal State
  const [isDirectTelegramOpen, setIsDirectTelegramOpen] = useState(false);
  const [directChatId, setDirectChatId] = useState('');
  const [directText, setDirectText] = useState('');

  // AI Auto-Reply Modal State
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'claude' | 'deepseek' | 'groq'>('gemini');
  const [aiApiKeyInput, setAiApiKeyInput] = useState('');
  const [showAiApiKey, setShowAiApiKey] = useState(false);
  const [aiSystemPromptInput, setAiSystemPromptInput] = useState('');
  const [aiTriggerMode, setAiTriggerMode] = useState<'ALWAYS' | 'NO_HUMAN_ACTIVE'>('ALWAYS');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [aiEnabledPlatforms, setAiEnabledPlatforms] = useState<Record<string, boolean>>({
    facebook: true,
    messenger: true,
    instagram: true,
    tiktok: true,
    whatsapp: true,
    telegram: true,
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Polling conversations every 6 seconds
  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
    isFetching: isFetchingConversations,
    refetch: refetchConversations,
  } = useGetConversationsQuery(
    {
      platform: selectedPlatform !== 'all' ? selectedPlatform : undefined,
      search: search || undefined,
    },
    { pollingInterval: 6000 },
  );

  // Active conversation thread messages with 4 second polling
  const {
    data: threadMessages = [],
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useGetConversationMessagesQuery(activeConversationId || '', {
    skip: !activeConversationId,
    pollingInterval: 4000,
  });

  const [sendMessageMutation, { isLoading: isSending }] = useSendChannelMessageMutation();
  const { data: telegramInfo } = useGetTelegramBotInfoQuery();
  const { data: aiConfig, isLoading: isLoadingAiConfig, refetch: refetchAiConfig } = useGetAiConfigQuery();
  const [saveAiConfig, { isLoading: isSavingAiConfig }] = useSaveAiConfigMutation();
  const [testAiConnection, { isLoading: isTestingAi }] = useTestAiConnectionMutation();
  const [toggleConversationAi, { isLoading: isTogglingAi }] = useToggleConversationAiMutation();
  const [generateAiDraftMutation, { isLoading: isDraftingAi }] = useGenerateAiDraftMutation();

  // AI Smart Draft Suggestion State
  const [aiSuggestedDraft, setAiSuggestedDraft] = useState<string | null>(null);
  const [aiDraftMetadata, setAiDraftMetadata] = useState<{ model?: string; provider?: string; latencyMs?: number } | null>(null);
  // RAG Document Knowledge Base State
  const { data: aiDocuments = [], isLoading: isLoadingDocs, refetch: refetchDocs } = useGetAiDocumentsQuery();
  const [uploadAiDocument, { isLoading: isUploadingDoc }] = useUploadAiDocumentMutation();
  const [deleteAiDocument, { isLoading: isDeletingDoc }] = useDeleteAiDocumentMutation();
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const [syncChannelConversations, { isLoading: isSyncingConversations }] = useSyncChannelConversationsMutation();

  const handleSyncFacebookChats = async () => {
    const toastId = toast.loading('Syncing historical Facebook Messenger chats from Meta Graph API...');
    try {
      const res = await syncChannelConversations('facebook').unwrap();
      refetchConversations();
      if (activeConversationId) refetchMessages();
      toast.success(res?.message || 'Facebook conversations synced successfully!', { id: toastId });
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to sync Facebook conversations.', { id: toastId });
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    const toastId = toast.loading(`Indexing "${file.name}" into Store RAG Knowledge Base...`);

    try {
      await uploadAiDocument(formData).unwrap();
      refetchDocs();
      toast.success(`✨ "${file.name}" indexed successfully!`, { id: toastId });
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        (Array.isArray(err?.data?.errorSources) && err.data.errorSources[0]?.details) ||
        err?.error ||
        err?.message ||
        'Failed to upload document.';
      toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg), { id: toastId });
    } finally {
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

  const [isSavingKey, setIsSavingKey] = useState(false);
  const [providerStatuses, setProviderStatuses] = useState<
    Record<string, { success: boolean; message: string; latencyMs?: number } | null>
  >({});
  const [activeGenerationProvider, setActiveGenerationProvider] = useState<string>('openai');

  // Auto-detect active generation provider based on saved keys
  useEffect(() => {
    if (aiConfig?.providerKeys) {
      // If current selected provider has a key, keep it
      if (aiConfig.providerKeys[activeGenerationProvider]?.hasApiKey) return;

      // Otherwise pick first provider with a saved key
      const firstWithKey = Object.keys(aiConfig.providerKeys).find(
        (k) => aiConfig.providerKeys[k]?.hasApiKey,
      );
      if (firstWithKey) {
        setActiveGenerationProvider(firstWithKey);
      } else if (aiConfig.provider) {
        setActiveGenerationProvider(aiConfig.provider);
      }
    }
  }, [aiConfig, activeGenerationProvider]);

  // Populate AI config state
  useEffect(() => {
    if (aiConfig) {
      if (aiConfig.provider) {
        setAiProvider(aiConfig.provider as any);
      }
      setAiSystemPromptInput(
        aiConfig.systemPrompt ||
          'You are an intelligent, friendly and professional customer support AI assistant for our store. Assist customers with inquiries, product info, pricing, delivery times, and order details promptly and politely in Bengali or English based on the customer language.',
      );
      setAiTriggerMode(aiConfig.triggerMode === 'ALWAYS' ? 'ALWAYS' : 'NO_HUMAN_ACTIVE');
      setAiModel(aiConfig.model || 'gemini-1.5-flash');
      if (aiConfig.enabledPlatforms) {
        setAiEnabledPlatforms({
          facebook: aiConfig.enabledPlatforms.facebook !== false,
          messenger: aiConfig.enabledPlatforms.messenger !== false,
          instagram: aiConfig.enabledPlatforms.instagram !== false,
          tiktok: aiConfig.enabledPlatforms.tiktok !== false,
          whatsapp: aiConfig.enabledPlatforms.whatsapp !== false,
          telegram: aiConfig.enabledPlatforms.telegram !== false,
        });
      }
      setAiApiKeyInput('');
    }
  }, [aiConfig]);

  const handleSelectAiProvider = (provId: 'gemini' | 'openai' | 'claude' | 'deepseek' | 'groq') => {
    setAiProvider(provId);
    setAiApiKeyInput('');
    setTestResult(null);
    const prov = AI_PROVIDERS.find((p) => p.id === provId);
    if (prov && prov.models.length > 0) {
      setAiModel(prov.models[0].id);
    }
  };

  const handleSaveKeyAndTest = async () => {
    const rawKey = aiApiKeyInput.trim();
    if (!rawKey || rawKey.includes('•') || rawKey.includes('*')) {
      toast.error('Please enter a valid API key.');
      return;
    }
    setIsSavingKey(true);
    setProviderStatuses((prev) => ({ ...prev, [aiProvider]: null }));
    try {
      await saveAiConfig({
        provider: aiProvider,
        model: aiModel,
        apiKey: rawKey,
        isEnabled: aiConfig?.isEnabled ?? false,
        triggerMode: aiTriggerMode,
        systemPrompt: aiSystemPromptInput.trim() || undefined,
        enabledPlatforms: aiEnabledPlatforms,
      }).unwrap();

      const testRes = await testAiConnection({
        provider: aiProvider,
        model: aiModel,
        apiKey: rawKey,
      }).unwrap();

      const result = (testRes as any)?.data ?? testRes;
      setProviderStatuses((prev) => ({ ...prev, [aiProvider]: result }));
      setTestResult(result);

      if (result?.success) {
        toast.success(`✅ ${aiProvider.toUpperCase()} key saved & verified!`);
      } else {
        toast.warning(`Key saved, but test failed: ${result?.message || 'Unknown error'}`);
      }

      setAiApiKeyInput('');
      refetchAiConfig();
    } catch (err: any) {
      const msg =
        err?.data?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Failed to save or test key.';
      const res = { success: false, message: msg };
      setProviderStatuses((prev) => ({ ...prev, [aiProvider]: res }));
      setTestResult(res);
      toast.error(msg);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleRetestProvider = async (provId: string) => {
    setProviderStatuses((prev) => ({ ...prev, [provId]: null }));
    try {
      const testRes = await testAiConnection({
        provider: provId,
        model: AI_PROVIDERS.find((p) => p.id === provId)?.models[0]?.id || aiModel,
      }).unwrap();
      const result = (testRes as any)?.data ?? testRes;
      setProviderStatuses((prev) => ({ ...prev, [provId]: result }));
      setTestResult(result);
      if (result?.success) {
        toast.success(`${provId.toUpperCase()} connection verified!`);
      } else {
        toast.error(result?.message || 'Test failed.');
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Test failed.';
      const res = { success: false, message: msg };
      setProviderStatuses((prev) => ({ ...prev, [provId]: res }));
      setTestResult(res);
      toast.error(msg);
    }
  };


  // Set default active conversation if none selected
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId);
  }, [conversations, activeConversationId]);

  // Check if AI is actively generating a reply for this thread (only when drafting is triggered)
  const isAiGeneratingReply = isDraftingAi;

  // Reset draft on active conversation change
  useEffect(() => {
    setAiSuggestedDraft(null);
    setAiDraftMetadata(null);
  }, [activeConversationId]);

  const handleGenerateAiDraft = async (customPrompt?: string) => {
    if (!activeConversationId) {
      toast.error('Please select a conversation first.');
      return;
    }

    try {
      const res = await generateAiDraftMutation({
        conversationId: activeConversationId,
        promptOverride: customPrompt,
        provider: activeGenerationProvider,
        model: aiModel,
      }).unwrap();

      if (res.reply) {
        setAiSuggestedDraft(res.reply);
        setAiDraftMetadata({
          model: res.model,
          provider: res.provider || activeGenerationProvider,
          latencyMs: res.latencyMs,
        });
        const provName = AI_PROVIDERS.find((p) => p.id === (res.provider || activeGenerationProvider))?.name || (res.provider || activeGenerationProvider).toUpperCase();
        toast.success(`✨ AI Reply Draft generated via ${provName}!`);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to generate AI draft reply.');
    }
  };

  const handleInsertDraftToComposer = () => {
    if (aiSuggestedDraft) {
      setInputMessage(aiSuggestedDraft);
      setAiSuggestedDraft(null);
      toast.info('Draft added to chat input! You can modify it and hit Send.');
    }
  };

  const handleSendDraftDirectly = async () => {
    if (!aiSuggestedDraft || !activeConversation) return;
    const textToSend = aiSuggestedDraft;
    setAiSuggestedDraft(null);

    try {
      await sendMessageMutation({
        platform: activeConversation.platform,
        recipientId: activeConversation.recipientId,
        text: textToSend,
        conversationId: activeConversation.id,
      }).unwrap();

      refetchMessages();
      refetchConversations();
      toast.success('AI reply sent successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send message.');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !activeConversation) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');

    try {
      await sendMessageMutation({
        platform: activeConversation.platform,
        recipientId: activeConversation.recipientId,
        text: textToSend,
        conversationId: activeConversation.id,
      }).unwrap();

      refetchMessages();
      refetchConversations();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send message.');
    }
  };

  const handleSendDirectTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directChatId || !directText) return;

    try {
      await sendMessageMutation({
        platform: 'telegram',
        recipientId: directChatId.trim(),
        text: directText.trim(),
      }).unwrap();

      setIsDirectTelegramOpen(false);
      setDirectChatId('');
      setDirectText('');
      refetchConversations();
      toast.success('Telegram message dispatched successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send Telegram message.');
    }
  };

  const handleTogglePlatformAi = (platform: string) => {
    setAiEnabledPlatforms((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  const handleSaveAiSettings = async (enableMaster?: boolean) => {
    try {
      const isEnabled = enableMaster !== undefined ? enableMaster : (aiConfig?.isEnabled ?? true);
      const payload: any = {
        isEnabled,
        provider: aiProvider,
        model: aiModel,
        triggerMode: aiTriggerMode,
        systemPrompt: aiSystemPromptInput.trim(),
        enabledPlatforms: aiEnabledPlatforms,
      };

      if (aiApiKeyInput.trim()) {
        payload.apiKey = aiApiKeyInput.trim();
      }

      await saveAiConfig(payload).unwrap();
      refetchAiConfig();
      toast.success(
        isEnabled
          ? 'AI Auto-Reply settings saved and activated!'
          : 'AI Auto-Reply has been paused.',
      );
      if (enableMaster === undefined) {
        setIsAiSettingsOpen(false);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save AI configuration.');
    }
  };

  const handleTestAiConnection = async () => {
    setTestResult(null);
    // Pass raw key only if user typed something new (not empty, not masked dots)
    const rawKey = aiApiKeyInput.trim();
    const keyPayload = rawKey && !rawKey.includes('•') && !rawKey.includes('*') ? rawKey : undefined;

    try {
      const res = await testAiConnection({
        provider: aiProvider,
        model: aiModel,
        apiKey: keyPayload,
      }).unwrap();

      // RTK Query unwrap may return nested {data: {...}} from some interceptors
      const result = (res as any)?.data ?? res;

      setTestResult(result);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      // Extract the most useful error message from various formats
      const msg =
        err?.data?.data?.message ||
        err?.data?.message ||
        err?.message ||
        `Failed to test ${aiProvider.toUpperCase()} API connection.`;
      setTestResult({ success: false, message: msg });
      toast.error(msg);
    }
  };


  const handleToggleConversationState = async (isPaused: boolean) => {
    if (!activeConversationId) return;
    try {
      await toggleConversationAi({
        conversationId: activeConversationId,
        isPaused,
      }).unwrap();
      refetchConversations();
      toast.success(
        isPaused
          ? 'AI Auto-Reply paused for this conversation (Human Takeover).'
          : 'AI Auto-Reply resumed for this conversation.',
      );
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to toggle AI for this conversation.');
    }
  };

  const handleAddNote = () => {
    if (!newNoteInput.trim() || !activeConversationId) return;
    setCustomerNotes((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), newNoteInput.trim()],
    }));
    setNewNoteInput('');
    setIsAddingNote(false);
  };

  const currentNotes = activeConversationId ? customerNotes[activeConversationId] || [] : [];
  const isGlobalAiActive = Boolean(aiConfig?.isEnabled);

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-210px)] min-h-[640px] max-h-[880px]">
      {/* ─── Top Filter & Channel Switcher Bar ────────────────────────────── */}
      <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Channel Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none min-w-0">
          {PLATFORM_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedPlatform(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                selectedPlatform === f.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Action Buttons & AI Automation Control */}
        <div className="flex items-center gap-2 shrink-0">
          {/* AI Auto-Reply Master Button */}
          <button
            onClick={() => setIsAiSettingsOpen(true)}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer shadow-xs ${
              isGlobalAiActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 ring-2 ring-emerald-500/20'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
            title="Configure AI Auto-Reply for all platforms"
          >
            <span className="relative flex h-2.5 w-2.5">
              {isGlobalAiActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isGlobalAiActive ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              ></span>
            </span>
            <Bot className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {isGlobalAiActive ? 'AI Auto-Reply: Active' : 'AI Auto-Reply: Off'}
            </span>
            <Settings className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {/* Sync Facebook Conversations */}
          <button
            onClick={handleSyncFacebookChats}
            disabled={isSyncingConversations}
            title="Import historical customer conversations from Facebook Page"
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 shadow-2xs flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncingConversations ? 'animate-spin' : ''}`} />
            <span>{isSyncingConversations ? 'Syncing...' : 'Sync Facebook'}</span>
          </button>

          <button
            onClick={() => setIsDirectTelegramOpen(true)}
            className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Direct Telegram</span>
          </button>

          <button
            onClick={() => {
              refetchConversations();
              if (activeConversationId) refetchMessages();
            }}
            title="Refresh conversations"
            className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingConversations ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Main 3-Panel Layout ─────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ── Panel 1: Conversation List (Left) ───────────────────────────── */}
        <div className="w-[300px] md:w-[320px] lg:w-[340px] shrink-0 border-r border-slate-200 flex flex-col bg-slate-50/40 overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b border-slate-200/80 bg-white shrink-0 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              />
            </div>
          </div>

          {/* Conversation Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80">
            {isLoadingConversations ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <p className="font-bold">Loading live threads...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700">No active conversations</p>
                <p className="text-[11px] leading-relaxed">
                  Messages received via Telegram bot, WhatsApp, or Facebook Messenger will appear here live.
                </p>
                <button
                  onClick={handleSyncFacebookChats}
                  disabled={isSyncingConversations}
                  className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingConversations ? 'animate-spin' : ''}`} />
                  <span>Sync Facebook Chats</span>
                </button>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === activeConversationId;
                const isConvPlatformAiOn = isGlobalAiActive && (aiEnabledPlatforms[conv.platform] !== false);

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full text-left p-3 flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/90 border-l-4 border-blue-600 shadow-2xs'
                        : 'hover:bg-slate-100/70 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Customer Avatar with Platform Badge */}
                    <div className="relative shrink-0">
                      <img
                        src={conv.avatarUrl}
                        alt={conv.customerName}
                        className="w-10 h-10 rounded-2xl object-cover border border-slate-200 bg-white shrink-0"
                      />
                      <div className="absolute -bottom-1 -right-1">
                        <PlatformIcon platform={conv.platform} size={16} />
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {conv.customerName}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {conv.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 truncate leading-relaxed">
                        {conv.lastMessage}
                      </p>

                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-mono font-medium truncate max-w-[110px]">
                            {conv.recipientId}
                          </span>
                          {isConvPlatformAiOn && !conv.isAiPaused && (
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black flex items-center gap-0.5">
                              <Bot className="w-2.5 h-2.5" /> AI
                            </span>
                          )}
                          {conv.isAiPaused && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                              Paused
                            </span>
                          )}
                        </div>

                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-black">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Panel 2: Active Chat Feed (Center) ──────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col bg-slate-100/40 overflow-hidden">
          {activeConversation ? (
            <>
              {/* Chat Thread Header */}
              <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={activeConversation.avatarUrl}
                      alt={activeConversation.customerName}
                      className="w-9 h-9 rounded-2xl object-cover border border-slate-200"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <PlatformIcon platform={activeConversation.platform} size={14} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-slate-900 truncate">
                        {activeConversation.customerName}
                      </h3>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold shrink-0 capitalize">
                        {activeConversation.platform}
                      </span>
                    </div>
                    {isAiGeneratingReply ? (
                      <span className="text-[11px] text-indigo-600 font-bold flex items-center gap-1 animate-pulse">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>AI Assistant is writing a reply...</span>
                      </span>
                    ) : inputMessage.trim().length > 0 ? (
                      <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                        <span>Staff typing response...</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium truncate block">
                        {activeConversation.platformDetail}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Conversation Level AI Auto-Reply Toggle */}
                  {isGlobalAiActive && (
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                      <Bot className={`w-3.5 h-3.5 ${activeConversation.isAiPaused ? 'text-slate-400' : 'text-emerald-600'}`} />
                      <span className="text-[11px] font-bold text-slate-700 hidden sm:inline">
                        {activeConversation.isAiPaused ? 'AI Paused' : 'AI Auto-Reply'}
                      </span>
                      <button
                        onClick={() => handleToggleConversationState(!activeConversation.isAiPaused)}
                        disabled={isTogglingAi}
                        className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                          activeConversation.isAiPaused
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {activeConversation.isAiPaused ? 'Resume' : 'Pause'}
                      </button>
                    </div>
                  )}

                  {activeConversation.customerId && (
                    <Link
                      href={`/dashboard/crm/customers/${activeConversation.customerId}`}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Customer 360</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Chat Messages Feed */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3.5 overflow-x-hidden">
                {isLoadingMessages ? (
                  <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <p className="font-bold">Loading conversation thread...</p>
                  </div>
                ) : threadMessages.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-700">No messages in this thread yet</p>
                    <p className="text-[11px]">Send a reply below to initiate conversation.</p>
                  </div>
                ) : (
                  threadMessages.map((msg) => {
                    const isOutbound = msg.sender === 'agent' || msg.senderType === 'ai';
                    const isAi = msg.senderType === 'ai' || msg.isAiGenerated;

                    return (
                      <div
                        key={msg.id}
                        className={`flex w-full ${isOutbound ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex items-end gap-2 max-w-[80%] sm:max-w-md">
                          {!isOutbound && (
                            <img
                              src={msg.senderAvatar || activeConversation.avatarUrl}
                              alt={msg.senderName}
                              className="w-7 h-7 rounded-xl object-cover border border-slate-200 shrink-0 mb-1"
                            />
                          )}

                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words space-y-1 ${
                              isAi
                                ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-br-xs shadow-md border border-indigo-700/50'
                                : isOutbound
                                ? 'bg-blue-600 text-white rounded-br-xs shadow-xs shadow-blue-500/20'
                                : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-2xs'
                            }`}
                          >
                            {/* AI Generated Badge */}
                            {isAi && (
                              <div className="flex items-center gap-1.5 pb-1 border-b border-indigo-700/60 text-[10px] font-extrabold text-indigo-300">
                                <Sparkles className="w-3 h-3 text-indigo-400" />
                                <span>Gemini AI Auto-Reply</span>
                                {msg.aiMetadata?.latencyMs && (
                                  <span className="text-[9px] font-mono text-indigo-300 font-normal">
                                    • {msg.aiMetadata.latencyMs}ms
                                  </span>
                                )}
                              </div>
                            )}

                            <p className="whitespace-pre-wrap">{msg.text}</p>

                            <div
                              className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                isAi ? 'text-indigo-300' : isOutbound ? 'text-blue-200' : 'text-slate-400'
                              }`}
                            >
                              <span>{msg.timestamp}</span>
                              {isOutbound && (
                                <CheckCheck className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* ─── AI Response Drafting Wave Indicator ─── */}
                {isAiGeneratingReply && (
                  <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-end gap-2 max-w-[80%] sm:max-w-md">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shrink-0 mb-1 shadow-sm ring-2 ring-indigo-500/20">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      </div>

                      <div className="p-3.5 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/90 border border-indigo-200/80 rounded-2xl rounded-bl-xs shadow-xs space-y-1.5 backdrop-blur-xs">
                        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-900">
                          <Bot className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                          <span>
                            {activeGenerationProvider === 'gemini'
                              ? 'Gemini AI'
                              : activeGenerationProvider === 'openai'
                              ? 'OpenAI (ChatGPT)'
                              : `${activeGenerationProvider.toUpperCase()} AI`}{' '}
                            is analyzing & drafting reply
                          </span>
                        </div>

                        {/* Animated Wave Dots */}
                        <div className="flex items-center gap-1.5 py-0.5 px-0.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" />
                          <span className="text-[10px] text-indigo-500/80 font-medium ml-1.5 italic animate-pulse">
                            generating instant response...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Outbound Staff Sending Message Wave Indicator ─── */}
                {isSending && (
                  <div className="flex w-full justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-end gap-2 max-w-[80%] sm:max-w-md">
                      <div className="p-3 bg-blue-600 text-white rounded-2xl rounded-br-xs shadow-md shadow-blue-500/20 flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-100">Sending</span>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ─── AI Smart Reply Suggestion Box ─── */}
              {aiSuggestedDraft && (
                <div className="mx-4 my-2 p-3.5 bg-gradient-to-r from-indigo-50/95 via-purple-50/90 to-blue-50/95 border border-indigo-200/90 rounded-2xl shadow-sm space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-indigo-950">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                      <span>
                        {AI_PROVIDERS.find((p) => p.id === (aiDraftMetadata?.provider || activeGenerationProvider))?.name || 'AI'} Suggested Reply
                      </span>
                      {aiDraftMetadata?.model && (
                        <span className="text-[9px] font-mono text-indigo-700 bg-indigo-100/90 px-1.5 py-0.5 rounded font-bold">
                          {aiDraftMetadata.model}
                        </span>
                      )}
                      {aiDraftMetadata?.latencyMs && (
                        <span className="text-[9px] font-mono text-slate-500 bg-white/80 px-1.5 py-0.5 rounded font-medium border border-indigo-100">
                          {aiDraftMetadata.latencyMs}ms
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiSuggestedDraft(null)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors cursor-pointer"
                      title="Dismiss suggestion"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap bg-white/90 p-3 rounded-xl border border-indigo-100/90 font-medium select-text">
                    {aiSuggestedDraft}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleInsertDraftToComposer}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Add to Chat Input & Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSendDraftDirectly}
                        disabled={isSending}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Instantly</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGenerateAiDraft()}
                      disabled={isDraftingAi}
                      className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-indigo-100/60"
                    >
                      <RefreshCw className={`w-3 h-3 ${isDraftingAi ? 'animate-spin' : ''}`} />
                      <span>{isDraftingAi ? 'Drafting...' : 'Regenerate'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Replies Bar with AI Engine Selector */}
              <div className="px-4 py-2 bg-white/90 border-t border-slate-200/70 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 min-w-0">
                {/* AI Engine Selector Pill */}
                <div className="flex items-center gap-1 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/90 rounded-xl px-2 py-1 shrink-0">
                  <Bot className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="text-[10px] font-black text-indigo-900 uppercase tracking-tight shrink-0">
                    Engine:
                  </span>
                  <select
                    value={activeGenerationProvider}
                    onChange={(e) => setActiveGenerationProvider(e.target.value)}
                    className="bg-transparent text-[11px] font-extrabold text-indigo-950 focus:outline-none cursor-pointer pr-1"
                  >
                    {AI_PROVIDERS.map((p) => {
                      const hasKey = Boolean(aiConfig?.providerKeys?.[p.id]?.hasApiKey);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} {hasKey ? '✓ (Active)' : '(No Key)'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Dedicated AI Generate Reply Button */}
                <button
                  type="button"
                  onClick={() => handleGenerateAiDraft()}
                  disabled={isDraftingAi}
                  className="px-3 py-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 disabled:opacity-50 text-white text-[11px] font-extrabold rounded-xl flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  {isDraftingAi ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-pink-200" />
                      <span>Generate Reply ({AI_PROVIDERS.find((p) => p.id === activeGenerationProvider)?.name || 'AI'})</span>
                    </>
                  )}
                </button>

                <div className="h-4 w-px bg-slate-200 shrink-0 mx-0.5" />

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                  Quick:
                </span>
                {QUICK_REPLIES.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputMessage(reply)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg whitespace-nowrap transition-colors shrink-0 font-medium cursor-pointer"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Message Composer Input */}
              <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                <div className="flex-1 relative min-w-0">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Reply to ${activeConversation.customerName} via ${activeConversation.platform}...`}
                    className="w-full py-2.5 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>

                {/* AI Draft Quick Button */}
                <button
                  type="button"
                  onClick={() => handleGenerateAiDraft()}
                  disabled={isDraftingAi}
                  title={`Ask ${AI_PROVIDERS.find((p) => p.id === activeGenerationProvider)?.name || 'AI'} to draft a reply`}
                  className="px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  {isDraftingAi ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                  <span className="hidden md:inline">
                    Draft ({AI_PROVIDERS.find((p) => p.id === activeGenerationProvider)?.name || 'AI'})
                  </span>
                </button>

                <button
                  type="submit"
                  disabled={isSending || !inputMessage.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-extrabold text-sm text-slate-700">No conversation selected</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Select a customer conversation thread from the left panel to start messaging.
              </p>
            </div>
          )}
        </div>

        {/* ── Panel 3: Customer Context & Notes (Right) ───────────────────── */}
        {activeConversation && (
          <div className="hidden xl:flex w-[280px] shrink-0 border-l border-slate-200 flex-col bg-white overflow-y-auto p-4 space-y-5">
            {/* Customer Profile Card */}
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <img
                src={activeConversation.avatarUrl}
                alt={activeConversation.customerName}
                className="w-16 h-16 rounded-3xl object-cover border-2 border-slate-200 mx-auto shadow-sm"
              />
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {activeConversation.customerName}
                </h4>
                <p className="text-[11px] text-slate-500">{activeConversation.platformDetail}</p>
              </div>
            </div>

            {/* AI Status for this customer */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5 text-blue-600" />
                  <span>AI Automation Status</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  activeConversation.isAiPaused
                    ? 'bg-amber-100 text-amber-800'
                    : isGlobalAiActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {activeConversation.isAiPaused ? 'Paused (Manual Draft Ready)' : isGlobalAiActive ? 'Auto-Reply Active' : 'Auto-Reply Off (Manual Draft Ready)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {activeConversation.isAiPaused
                  ? 'Auto-reply is paused for this customer. You can still generate and edit AI draft replies anytime.'
                  : isGlobalAiActive
                  ? 'AI will automatically reply when new customer messages arrive.'
                  : 'Auto-reply is turned off. You can still generate, edit, and send AI draft replies on demand.'}
              </p>
            </div>

            {/* Conversation Notes */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Internal Notes
                </span>
                {!isAddingNote && (
                  <button
                    onClick={() => setIsAddingNote(true)}
                    className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              {isAddingNote && (
                <div className="space-y-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <textarea
                    rows={2}
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    placeholder="Add private staff note..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-800 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNote}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {currentNotes.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No notes recorded yet.</p>
                ) : (
                  currentNotes.map((n, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-700 leading-relaxed"
                    >
                      {n}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── AI Auto-Reply Settings & Platform Control Modal ───────────────── */}
      {isAiSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black flex items-center gap-2">
                    <span>AI Auto-Reply Automation</span>
                    <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-md text-[10px] font-mono">
                      Gemini Powered
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Auto-respond to customer inquiries across Telegram, WhatsApp, and Instagram.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiSettingsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* 1. Global Master Switch */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Power className={`w-4 h-4 ${isGlobalAiActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Master AI Automation Switch</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Turn AI Auto-Reply ON or OFF for all platforms globally.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveAiSettings(!isGlobalAiActive)}
                  disabled={isSavingAiConfig}
                  className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer shadow-xs ${
                    isGlobalAiActive
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-300 hover:bg-slate-400 text-slate-800'
                  }`}
                >
                  {isGlobalAiActive ? 'Active (ON)' : 'Disabled (OFF)'}
                </button>
              </div>

              {/* 2. Per-Channel Activation Toggles */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Platform-Specific AI Activation (চ্যানেলভিত্তিক অটোমেশন)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Select which connected platforms should automatically trigger Gemini AI replies:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Facebook */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform="facebook" size={20} />
                      <div>
                        <span className="font-bold text-slate-900 block">Facebook Page</span>
                        <span className="text-[10px] text-slate-400">Posts & Comments</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePlatformAi('facebook')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        aiEnabledPlatforms.facebook !== false
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {aiEnabledPlatforms.facebook !== false ? 'AI Active' : 'Off'}
                    </button>
                  </div>

                  {/* Messenger */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform="messenger" size={20} />
                      <div>
                        <span className="font-bold text-slate-900 block">Facebook Messenger</span>
                        <span className="text-[10px] text-slate-400">Direct Chat</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePlatformAi('messenger')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        aiEnabledPlatforms.messenger !== false
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {aiEnabledPlatforms.messenger !== false ? 'AI Active' : 'Off'}
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
                      onClick={() => handleTogglePlatformAi('instagram')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        aiEnabledPlatforms.instagram !== false
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {aiEnabledPlatforms.instagram !== false ? 'AI Active' : 'Off'}
                    </button>
                  </div>

                  {/* TikTok */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform="tiktok" size={20} />
                      <div>
                        <span className="font-bold text-slate-900 block">TikTok Business</span>
                        <span className="text-[10px] text-slate-400">Direct Messages & Shop</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePlatformAi('tiktok')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        aiEnabledPlatforms.tiktok !== false
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {aiEnabledPlatforms.tiktok !== false ? 'AI Active' : 'Off'}
                    </button>
                  </div>

                  {/* WhatsApp */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform="whatsapp" size={20} />
                      <div>
                        <span className="font-bold text-slate-900 block">WhatsApp Business</span>
                        <span className="text-[10px] text-slate-400">Cloud API Integration</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePlatformAi('whatsapp')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        aiEnabledPlatforms.whatsapp !== false
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {aiEnabledPlatforms.whatsapp !== false ? 'AI Active' : 'Off'}
                    </button>
                  </div>

                  {/* Telegram */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform="telegram" size={20} />
                      <div>
                        <span className="font-bold text-slate-900 block">Telegram Bot</span>
                        <span className="text-[10px] text-slate-400">Live Chat</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePlatformAi('telegram')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                        aiEnabledPlatforms.telegram !== false
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {aiEnabledPlatforms.telegram !== false ? 'AI Active' : 'Off'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Trigger Mode */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">
                  AI Trigger Condition (অটো-রিপ্লাই মোড)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiTriggerMode('ALWAYS')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      aiTriggerMode === 'ALWAYS'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-1 ring-blue-600'
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
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-1 ring-blue-600'
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

              {/* 4. AI Provider Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 block">
                    Select AI Engine / Provider (এআই প্রোভাইডার)
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Each provider key saved independently
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {AI_PROVIDERS.map((prov) => {
                    const isSelected = aiProvider === prov.id;
                    const hasKey = Boolean(aiConfig?.providerKeys?.[prov.id]?.hasApiKey);
                    const currentStatus = providerStatuses[prov.id];

                    return (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => handleSelectAiProvider(prov.id)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[90px] ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-600/30'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-black text-xs block truncate">{prov.name}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />}
                          </div>
                          <span className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                            {prov.badge}
                          </span>
                        </div>
                        <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[9px]">
                          {currentStatus?.success ? (
                            <span className="font-black text-emerald-700 flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : hasKey ? (
                            <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              Saved
                            </span>
                          ) : (
                            <span className="text-slate-400">No Key</span>
                          )}
                          {aiConfig?.provider === prov.id && (
                            <span className="font-black text-[8px] px-1 bg-indigo-100 text-indigo-800 rounded">
                              Main
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. API Key & Dynamic Model Selector */}
              {(() => {
                const currentProv =
                  AI_PROVIDERS.find((p) => p.id === aiProvider) || AI_PROVIDERS[0];
                const hasSavedKey = Boolean(aiConfig?.providerKeys?.[aiProvider]?.hasApiKey);
                const currentStatus = providerStatuses[aiProvider] || testResult;

                return (
                  <div className="space-y-2.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{currentProv.keyLabel}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <a
                          href={currentProv.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                        >
                          <span>Get Key</span>
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
                              : `Paste ${currentProv.name} Key (${currentProv.keyPrefix})`
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
                        className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-40 shrink-0"
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
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 flex-1">
                        <span className="font-bold shrink-0">Model:</span>
                        <select
                          value={aiModel}
                          onChange={(e) => setAiModel(e.target.value)}
                          className="font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 w-full max-w-sm text-xs"
                        >
                          {currentProv.models.map((m) => (
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
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs disabled:opacity-50 shrink-0"
                        >
                          {isTestingAi ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Zap className="w-3 h-3 text-indigo-600" />
                          )}
                          <span>Re-Test {currentProv.name}</span>
                        </button>
                      )}
                    </div>

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
                              Latency: <span className="font-mono font-bold text-slate-700">{currentStatus.latencyMs}ms</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 5. System Prompt / Store Personality */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  AI Instructions & Persona (স্টোরের নির্দেশিকা)
                </label>
                <textarea
                  rows={3}
                  value={aiSystemPromptInput}
                  onChange={(e) => setAiSystemPromptInput(e.target.value)}
                  placeholder="Describe how the AI should talk to your customers in Bengali/English..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 leading-relaxed"
                />
              </div>

              {/* Store Knowledge Base & Documents (RAG) */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-indigo-50/70 to-purple-50/50 border border-indigo-200/90 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Store Knowledge Base & Policies (RAG - পিডিএফ ও ডকুমেন্টস)</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Upload store PDF policy, warranty, delivery guides, or FAQs. AI will use them strictly for this store.
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
                            {doc.status === 'INDEXED' ? '✓ Indexed' : doc.status}
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
                onClick={() => setIsAiSettingsOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleSaveAiSettings()}
                disabled={isSavingAiConfig}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingAiConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save AI Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Direct Telegram Send Modal ───────────────────────────────────── */}
      {isDirectTelegramOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <PlatformIcon platform="telegram" size={24} />
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Send Direct Telegram Message
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Deliver via Bot: {telegramInfo?.bot?.username ? `@${telegramInfo.bot.username}` : '@forsbit_bot'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDirectTelegramOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendDirectTelegram} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Telegram Chat ID / User ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1506338823"
                  value={directChatId}
                  onChange={(e) => setDirectChatId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  User must have sent at least 1 message or /start to your bot.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Message Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Type your message..."
                  value={directText}
                  onChange={(e) => setDirectText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDirectTelegramOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || !directChatId || !directText}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
