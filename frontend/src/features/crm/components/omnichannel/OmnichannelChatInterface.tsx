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
  useGetConversationAiStateQuery,
  useToggleConversationAiMutation,
} from '../../api/omnichannelApi';
import { AiAutoReplySettingsModal } from './AiAutoReplySettingsModal';
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
  Sparkles,
  Bot,
  PauseCircle,
  PlayCircle,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

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

  // Modals State
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isDirectTelegramOpen, setIsDirectTelegramOpen] = useState(false);
  const [directChatId, setDirectChatId] = useState('');
  const [directText, setDirectText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Polling conversations every 4 seconds — reload immediately on mount
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
    { pollingInterval: 4000, refetchOnMountOrArgChange: true },
  );

  // Active conversation thread messages with 3 second polling
  const {
    data: threadMessages = [],
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useGetConversationMessagesQuery(activeConversationId || '', {
    skip: !activeConversationId,
    pollingInterval: 3000,
    refetchOnMountOrArgChange: true,
  });

  // AI Configuration & State Queries
  const { data: aiConfig } = useGetAiConfigQuery();
  const { data: convAiState, refetch: refetchAiState } = useGetConversationAiStateQuery(
    activeConversationId || '',
    {
      skip: !activeConversationId,
      pollingInterval: 5000,
    },
  );

  const [toggleAiMutation, { isLoading: isTogglingAi }] = useToggleConversationAiMutation();
  const [sendMessageMutation, { isLoading: isSending }] = useSendChannelMessageMutation();
  const { data: telegramInfo } = useGetTelegramBotInfoQuery();

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
      refetchAiState();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to send message.');
    }
  };

  const handleToggleAi = async (pause: boolean) => {
    if (!activeConversationId) return;
    try {
      await toggleAiMutation({
        conversationId: activeConversationId,
        isPaused: pause,
      }).unwrap();
      refetchAiState();
      refetchConversations();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to toggle AI state.');
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
      alert('Telegram message dispatched successfully!');
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to send Telegram message.');
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
  const isAiPaused = convAiState?.isAiPaused ?? activeConversation?.isAiPaused ?? false;

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-210px)] min-h-[640px] max-h-[880px]">
      {/* ─── Top Filter & Action Bar ───────────────────────────────────────── */}
      <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Channel Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none min-w-0">
          {PLATFORM_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedPlatform(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                selectedPlatform === f.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* AI Auto-Reply Settings Launcher Button */}
          <button
            type="button"
            onClick={() => setIsAiSettingsOpen(true)}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs border ${
              aiConfig?.isEnabled
                ? 'bg-teal-50 text-teal-700 border-teal-300 hover:bg-teal-100'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiConfig?.isEnabled ? 'text-teal-600' : 'text-slate-400'}`} />
            <span>AI Auto-Reply: {aiConfig?.isEnabled ? 'ON' : 'OFF'}</span>
            <Settings className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={() => setIsDirectTelegramOpen(true)}
            className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Direct Telegram</span>
          </button>

          <button
            onClick={() => {
              refetchConversations();
              if (activeConversationId) {
                refetchMessages();
                refetchAiState();
              }
            }}
            title="Refresh conversations"
            className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
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
                placeholder="Search conversations & phone..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              />
            </div>
          </div>

          {/* Conversation Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoadingConversations ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <p>Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700">No conversations found</p>
                <p className="text-[11px]">Connect your channels in Settings to start receiving live inquiries.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${
                      isActive
                        ? 'bg-blue-50/80 border-l-4 border-blue-600'
                        : 'hover:bg-slate-100/70 bg-white'
                    }`}
                  >
                    {/* User Avatar with Platform Badge */}
                    <div className="relative shrink-0 mt-0.5">
                      <img
                        src={conv.avatarUrl}
                        alt={conv.customerName}
                        className="w-10 h-10 rounded-2xl object-cover border border-slate-200"
                      />
                      <div className="absolute -bottom-1 -right-1">
                        <PlatformIcon platform={conv.platform} size={14} />
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {conv.customerName}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {conv.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate font-medium">
                        {conv.lastMessage}
                      </p>

                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold truncate capitalize">
                            {conv.platform}
                          </span>
                          {conv.isAiPaused && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md text-[9px] font-bold">
                              AI Paused
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
              <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
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
                    <span className="text-[11px] text-slate-500 font-medium truncate block">
                      {activeConversation.platformDetail}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* AI Status Control Pill */}
                  {aiConfig?.isEnabled && (
                    <div className="flex items-center gap-1.5">
                      {isAiPaused ? (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
                          <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span className="hidden sm:inline">AI Paused (Agent Takeover)</span>
                          <span className="sm:hidden">Paused</span>
                          <button
                            type="button"
                            onClick={() => handleToggleAi(false)}
                            disabled={isTogglingAi}
                            className="ml-1 text-[11px] font-bold text-amber-900 underline hover:text-amber-950"
                          >
                            Resume AI
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-semibold">
                          <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                          <span className="hidden sm:inline">AI Auto-Reply Active</span>
                          <span className="sm:hidden">AI Active</span>
                          <button
                            type="button"
                            onClick={() => handleToggleAi(true)}
                            disabled={isTogglingAi}
                            className="ml-1 text-[11px] font-bold text-teal-900 underline hover:text-teal-950"
                          >
                            Pause
                          </button>
                        </div>
                      )}
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
                    const isOutbound = msg.sender === 'agent';
                    const isAi = msg.isAiGenerated || msg.senderType === 'ai';

                    return (
                      <div
                        key={msg.id}
                        className={`flex w-full ${isOutbound ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex items-end gap-2 max-w-[75%] sm:max-w-md">
                          {!isOutbound && (
                            <img
                              src={msg.senderAvatar || activeConversation.avatarUrl}
                              alt={msg.senderName}
                              className="w-7 h-7 rounded-xl object-cover border border-slate-200 shrink-0 mb-1"
                            />
                          )}

                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words relative ${
                              isOutbound
                                ? isAi
                                  ? 'bg-gradient-to-br from-teal-700 to-emerald-700 text-white rounded-br-xs shadow-xs border border-teal-500/30'
                                  : 'bg-blue-600 text-white rounded-br-xs shadow-xs shadow-blue-500/20'
                                : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-2xs'
                            }`}
                          >
                            {/* Internal AI Generated Badge (Agent visible only) */}
                            {isAi && (
                              <div className="flex items-center gap-1 mb-1.5 px-2 py-0.5 bg-teal-900/60 rounded-md text-[10px] font-extrabold tracking-wide uppercase text-teal-200 w-fit">
                                <Sparkles className="w-2.5 h-2.5 text-teal-300" />
                                <span>AI Generated</span>
                                {msg.aiMetadata?.model && (
                                  <span className="opacity-75 font-normal">({msg.aiMetadata.model})</span>
                                )}
                              </div>
                            )}

                            <p className="whitespace-pre-wrap">{msg.text}</p>

                            <div
                              className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                isOutbound
                                  ? isAi
                                    ? 'text-teal-200'
                                    : 'text-blue-200'
                                  : 'text-slate-400'
                              }`}
                            >
                              <span>{msg.timestamp}</span>
                              {isOutbound && (
                                <CheckCheck className="w-3 h-3 text-teal-200" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
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
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-lg whitespace-nowrap transition-colors shrink-0 font-medium"
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
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 text-xs font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs p-8 space-y-2">
              <MessageSquare className="w-12 h-12 text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">Select a conversation to start chatting</p>
            </div>
          )}
        </div>

        {/* ── Panel 3: Customer Context & Notes (Right) ───────────────────── */}
        {activeConversation && (
          <div className="w-[280px] xl:w-[300px] shrink-0 border-l border-slate-200 bg-white p-5 flex flex-col space-y-4 overflow-y-auto hidden lg:flex">
            {/* Header Profile */}
            <div className="text-center space-y-2 pb-4 border-b border-slate-100">
              <img
                src={activeConversation.avatarUrl}
                alt={activeConversation.customerName}
                className="w-16 h-16 rounded-3xl mx-auto object-cover border-2 border-slate-100 shadow-xs"
              />
              <div>
                <h4 className="font-black text-sm text-slate-900">
                  {activeConversation.customerName}
                </h4>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <PlatformIcon platform={activeConversation.platform} size={14} />
                  <span className="text-[11px] text-slate-500 font-semibold capitalize">
                    {activeConversation.platform} Channel
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center justify-center gap-1 pt-1">
                {(Array.isArray(activeConversation.tags) ? activeConversation.tags : [activeConversation.tags])
                  .filter(Boolean)
                  .map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold"
                    >
                      {t}
                    </span>
                  ))}
              </div>
            </div>

            {/* AI Auto-Reply Control Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50/60 to-emerald-50/60 border border-teal-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-teal-700" />
                  <span className="font-bold text-teal-950">AI Auto-Reply</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiSettingsOpen(true)}
                  className="text-[10px] text-teal-700 hover:underline font-bold"
                >
                  Configure
                </button>
              </div>

              <div className="space-y-1 text-slate-600 text-[11px]">
                <div className="flex items-center justify-between">
                  <span>Conversation Status:</span>
                  <span
                    className={`font-bold ${
                      isAiPaused ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {isAiPaused ? 'Paused' : 'Active'}
                  </span>
                </div>
                {convAiState?.pausedReason && convAiState.pausedReason !== 'NONE' && (
                  <p className="text-[10px] text-amber-800 bg-amber-100/60 px-2 py-1 rounded-lg">
                    Reason: {convAiState.pausedReason.replace(/_/g, ' ')}
                  </p>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span>Total AI Replies:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {convAiState?.totalAiRepliesCount || 0}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleAi(!isAiPaused)}
                disabled={isTogglingAi}
                className={`w-full py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  isAiPaused
                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {isAiPaused ? (
                  <>
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Resume AI Auto-Reply</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>Pause AI for this Thread</span>
                  </>
                )}
              </button>
            </div>

            {/* Contact Details */}
            <div className="space-y-2.5 text-xs">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Channel Information
              </h5>
              <div className="space-y-2 text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium truncate">{activeConversation.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium truncate">ID: {activeConversation.recipientId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last active: {activeConversation.timestamp}</span>
                </div>
              </div>
            </div>

            {/* Staff Internal Notes */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Staff Notes
                </h5>
                <button
                  onClick={() => setIsAddingNote(true)}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>

              {isAddingNote && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <textarea
                    rows={2}
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    placeholder="Write a note about this customer..."
                    className="w-full p-2 bg-white border border-amber-200 rounded-xl text-xs focus:outline-none"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setIsAddingNote(false)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNote}
                      className="px-3 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold"
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

      {/* ─── AI Auto-Reply Settings Modal ─────────────────────────────────── */}
      <AiAutoReplySettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
      />

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
                    Deliver via Bot: {telegramInfo?.bot?.username ? `@${telegramInfo.bot.username}` : 'Configured Bot'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDirectTelegramOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendDirectTelegram} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Telegram Chat ID
                </label>
                <input
                  type="text"
                  required
                  value={directChatId}
                  onChange={(e) => setDirectChatId(e.target.value)}
                  placeholder="e.g. 5239102938"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Message Content
                </label>
                <textarea
                  required
                  rows={3}
                  value={directText}
                  onChange={(e) => setDirectText(e.target.value)}
                  placeholder="Write message to send directly to customer Telegram..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDirectTelegramOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
