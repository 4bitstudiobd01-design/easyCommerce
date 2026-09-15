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

  // Direct Telegram Send Modal State
  const [isDirectTelegramOpen, setIsDirectTelegramOpen] = useState(false);
  const [directChatId, setDirectChatId] = useState('');
  const [directText, setDirectText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Polling conversations every 10 seconds
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
    { pollingInterval: 10000 },
  );

  // Active conversation thread messages with 5 second polling
  const {
    data: threadMessages = [],
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useGetConversationMessagesQuery(activeConversationId || '', {
    skip: !activeConversationId,
    pollingInterval: 5000,
  });

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
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to send message.');
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
          <button
            onClick={() => setIsDirectTelegramOpen(true)}
            className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
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
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === activeConversationId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
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

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-black text-xs text-slate-900 truncate">
                          {conv.customerName}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                          {conv.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate font-medium">
                        {conv.lastMessage}
                      </p>

                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[10px] text-slate-400 font-semibold truncate capitalize">
                          {conv.platform}
                        </span>

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
                    <span className="text-[11px] text-slate-500 font-medium truncate block">
                      {activeConversation.platformDetail}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
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
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words ${
                              isOutbound
                                ? 'bg-blue-600 text-white rounded-br-xs shadow-xs shadow-blue-500/20'
                                : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-2xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.text}</p>

                            <div
                              className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                isOutbound ? 'text-blue-200' : 'text-slate-400'
                              }`}
                            >
                              <span>{msg.timestamp}</span>
                              {isOutbound && (
                                <CheckCheck className="w-3 h-3 text-blue-200" />
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
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Telegram Chat ID / User ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123456789"
                  value={directChatId}
                  onChange={(e) => setDirectChatId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  User must have started or sent at least 1 message to your bot.
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
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || !directChatId || !directText}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 flex items-center gap-1.5 disabled:opacity-50"
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
