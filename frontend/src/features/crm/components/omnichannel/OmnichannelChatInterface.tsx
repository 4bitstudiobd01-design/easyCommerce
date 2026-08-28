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
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const QUICK_REPLIES = [
  'Hello! How can I help you today?',
  'Thanks for reaching out! What is your order number?',
  'We have received your payment. Delivery is in progress.',
  'Let me check our stock and get back to you in 5 minutes.',
  'Your order has been shipped and is with the courier.',
];

const PLATFORM_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Channels' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
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
  const [aiApiKeyInput, setAiApiKeyInput] = useState('');
  const [aiSystemPromptInput, setAiSystemPromptInput] = useState('');
  const [aiTriggerMode, setAiTriggerMode] = useState<'ALWAYS' | 'NO_HUMAN_ACTIVE'>('ALWAYS');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [aiEnabledPlatforms, setAiEnabledPlatforms] = useState<Record<string, boolean>>({
    telegram: true,
    whatsapp: true,
    instagram: true,
    facebook: true,
    x: false,
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

  // Populate AI config state
  useEffect(() => {
    if (aiConfig) {
      setAiSystemPromptInput(
        aiConfig.systemPrompt ||
          'You are an intelligent, friendly and professional customer support AI assistant for our store. Assist customers with inquiries, product info, pricing, delivery times, and order details promptly and politely in Bengali or English based on the customer language.',
      );
      setAiTriggerMode(aiConfig.triggerMode === 'ALWAYS' ? 'ALWAYS' : 'NO_HUMAN_ACTIVE');
      setAiModel(aiConfig.model || 'gemini-1.5-flash');
      if (aiConfig.enabledPlatforms) {
        setAiEnabledPlatforms({
          telegram: aiConfig.enabledPlatforms.telegram !== false,
          whatsapp: aiConfig.enabledPlatforms.whatsapp !== false,
          instagram: aiConfig.enabledPlatforms.instagram !== false,
          facebook: aiConfig.enabledPlatforms.facebook !== false,
          x: aiConfig.enabledPlatforms.x === true,
        });
      }
    }
  }, [aiConfig]);

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

  // Check if AI is currently generating a reply for this thread
  const isAiGeneratingReply = useMemo(() => {
    if (!activeConversation || threadMessages.length === 0) return false;
    const isGlobalActive = Boolean(aiConfig?.isEnabled);
    const isConvPlatformAiOn = isGlobalActive && (aiEnabledPlatforms[activeConversation.platform] !== false);
    if (!isConvPlatformAiOn || activeConversation.isAiPaused) return false;

    const lastMsg = threadMessages[threadMessages.length - 1];
    // If the latest message in thread was received from the customer and not yet replied
    return lastMsg.sender === 'customer' || lastMsg.senderType === 'customer';
  }, [activeConversation, threadMessages, aiConfig, aiEnabledPlatforms]);

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
        provider: 'gemini',
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
    try {
      const res = await testAiConnection({
        provider: 'gemini',
        model: aiModel,
        apiKey: aiApiKeyInput.trim() || undefined,
      }).unwrap();

      setTestResult(res);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      const msg = err?.data?.message || 'Failed to test Gemini API connection.';
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
          <div className="p-3 border-b border-slate-200/80 bg-white shrink-0">
            <div className="relative">
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
                  Messages received via Telegram bot, WhatsApp, or Instagram will appear here live.
                </p>
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
                          <span>Gemini AI is analyzing & drafting reply</span>
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

              {/* Quick Replies Bar */}
              <div className="px-4 py-2 bg-white/90 border-t border-slate-200/70 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                  Quick Replies:
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
              <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2.5 shrink-0">
                <div className="flex-1 relative min-w-0">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Reply to ${activeConversation.customerName} via ${activeConversation.platform}...`}
                    className="w-full py-2.5 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>

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
                  {activeConversation.isAiPaused ? 'Paused' : isGlobalAiActive ? 'Active' : 'Off'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {activeConversation.isAiPaused
                  ? 'Human agent has taken over. Click resume in chat header to re-enable AI.'
                  : isGlobalAiActive
                  ? 'Gemini AI will automatically reply when customer messages arrive.'
                  : 'AI is globally disabled in settings.'}
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
                  {/* Telegram */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform="telegram" size={20} />
                      <div>
                        <span className="font-bold text-slate-900 block">Telegram Bot</span>
                        <span className="text-[10px] text-slate-400">
                          {telegramInfo?.bot?.username ? `@${telegramInfo.bot.username}` : '@forsbit_bot'}
                        </span>
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

                  {/* Instagram */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform="instagram" size={20} />
                      <div>
                        <span className="font-bold text-slate-900 block">Instagram Direct</span>
                        <span className="text-[10px] text-slate-400">@rahat.661</span>
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

                  {/* Facebook */}
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform="facebook" size={20} />
                      <div>
                        <span className="font-bold text-slate-900 block">Facebook Messenger</span>
                        <span className="text-[10px] text-slate-400">Meta Page Messaging</span>
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

              {/* 4. Gemini API Key & Connection Test */}
              <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    Google Gemini API Key
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {aiConfig?.hasApiKey ? '✓ Stored Encrypted' : 'Key Required'}
                  </span>
                </div>
                <input
                  type="password"
                  value={aiApiKeyInput}
                  onChange={(e) => setAiApiKeyInput(e.target.value)}
                  placeholder={aiConfig?.apiKeyMasked || 'Enter Gemini API Key (e.g. AIzaSy...)'}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                />

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span>Model:</span>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1"
                    >
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra Fast)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep reasoning)</option>
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestAiConnection}
                    disabled={isTestingAi}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {isTestingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-blue-600" />}
                    <span>Test Connection</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-2.5 rounded-xl text-[11px] font-bold border ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}
              </div>

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
