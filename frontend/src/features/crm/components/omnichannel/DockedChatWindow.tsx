'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ConversationThread,
  ThreadMessage,
} from '../../types/omnichannel.types';
import {
  useGetConversationMessagesQuery,
  useSendChannelMessageMutation,
} from '../../api/omnichannelApi';
import { PlatformIcon } from './PlatformIcon';
import {
  X,
  Minus,
  Maximize2,
  Phone,
  Video,
  Send,
  Image as ImageIcon,
  Smile,
  Check,
  CheckCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface DockedChatWindowProps {
  conversation: ConversationThread;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
}

export const DockedChatWindow: React.FC<DockedChatWindowProps> = ({
  conversation,
  isMinimized,
  onToggleMinimize,
  onClose,
}) => {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Poll conversation messages every 3.5 seconds
  const { data: messages = [], isLoading } = useGetConversationMessagesQuery(
    conversation.id,
    { pollingInterval: 3500 }
  );

  const [sendMessage, { isLoading: isSending }] = useSendChannelMessageMutation();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Focus input when restored from minimized
  useEffect(() => {
    if (!isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isMinimized]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = (textOverride || inputText).trim();
    if (!textToSend || isSending) return;

    setInputText('');
    try {
      await sendMessage({
        platform: conversation.platform,
        recipientId: conversation.recipientId,
        text: textToSend,
        conversationId: conversation.id,
      }).unwrap();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to send message';
      toast.error(msg);
      setInputText(textToSend); // restore on error
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGoToFullChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/crm/chat?conversationId=${conversation.id}`);
  };

  return (
    <div
      className={`w-[328px] bg-white rounded-t-2xl shadow-2xl border border-slate-200/90 flex flex-col transition-all duration-300 pointer-events-auto overflow-hidden ${
        isMinimized ? 'h-[48px]' : 'h-[455px]'
      }`}
      style={{
        boxShadow: '0 12px 28px 0 rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* ─── Messenger Header ────────────────────────────────────────── */}
      <div
        onClick={onToggleMinimize}
        className="h-[48px] px-3 bg-white border-b border-slate-100 flex items-center justify-between cursor-pointer select-none shrink-0 hover:bg-slate-50/80 transition-colors"
      >
        {/* Left: Avatar + Details */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <div className="relative shrink-0">
            <img
              src={
                conversation.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  conversation.customerName || 'Customer'
                )}&background=0084FF&color=fff&bold=true&size=100`
              }
              alt={conversation.customerName}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
            />
            {/* Green Online Dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h4 className="font-bold text-xs text-slate-900 truncate leading-tight">
                {conversation.customerName}
              </h4>
              <PlatformIcon
                platform={conversation.platform}
                size={13}
                className="shrink-0"
              />
            </div>
            <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">
              {conversation.unreadCount > 0
                ? `${conversation.unreadCount} unread message${conversation.unreadCount > 1 ? 's' : ''}`
                : 'Active now'}
            </p>
          </div>
        </div>

        {/* Right: Header Action Controls */}
        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Phone (Decorative Messenger Style) */}
          <button
            type="button"
            title="Audio Call (Messenger)"
            onClick={() => toast.info('Voice call requires direct mobile phone integration.')}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>

          {/* Video (Decorative Messenger Style) */}
          <button
            type="button"
            title="Video Call (Messenger)"
            onClick={() => toast.info('Video calling is supported on direct Meta Messenger app.')}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
          </button>

          {/* Expand to Full Chat Page */}
          <button
            type="button"
            title="Open in Full Chat Page"
            onClick={handleGoToFullChat}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Minimize / Expand Toggle */}
          <button
            type="button"
            title={isMinimized ? 'Expand' : 'Minimize'}
            onClick={onToggleMinimize}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Close Window */}
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Scrollable Message Thread ─────────────────────────────────── */}
      {!isMinimized && (
        <>
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-white text-xs">
            {isLoading && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-[11px]">Loading chat...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <PlatformIcon platform={conversation.platform} size={24} />
                </div>
                <p className="font-bold text-slate-700 text-xs">
                  Say hello to {conversation.customerName}!
                </p>
                <p className="text-[10px] text-slate-400 max-w-[200px]">
                  Messages sent here are delivered directly to their {conversation.platform} inbox.
                </p>
              </div>
            ) : (
              messages.map((msg: ThreadMessage) => {
                const isCustomer = msg.sender === 'customer' || msg.senderType === 'customer';
                const isAi = msg.isAiGenerated || msg.senderType === 'ai';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-1.5 ${isCustomer ? 'justify-start' : 'justify-end'}`}
                  >
                    {/* Customer Avatar for Inbound */}
                    {isCustomer && (
                      <img
                        src={
                          msg.senderAvatar ||
                          conversation.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            conversation.customerName
                          )}&background=0084FF&color=fff`
                        }
                        alt=""
                        className="w-6 h-6 rounded-full object-cover shrink-0 mb-0.5 ring-1 ring-slate-200"
                      />
                    )}

                    <div className="max-w-[78%] flex flex-col">
                      <div
                        className={`px-3 py-2 rounded-2xl text-[12px] leading-relaxed break-words ${
                          isCustomer
                            ? 'bg-[#F0F2F5] text-slate-900 rounded-bl-xs'
                            : 'bg-[#0084FF] text-white rounded-br-xs font-normal'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* Micro info line */}
                      <div
                        className={`flex items-center gap-1 mt-0.5 px-1 text-[9px] text-slate-400 ${
                          isCustomer ? 'justify-start' : 'justify-end'
                        }`}
                      >
                        {isAi && (
                          <span className="inline-flex items-center gap-0.5 text-indigo-500 font-bold">
                            <Sparkles className="w-2.5 h-2.5" /> AI
                          </span>
                        )}
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {!isCustomer && (
                          <span>
                            {msg.status === 'read' ? (
                              <CheckCheck className="w-2.5 h-2.5 text-blue-500" />
                            ) : (
                              <Check className="w-2.5 h-2.5 text-slate-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ─── Messenger Footer Input ───────────────────────────────────── */}
          <div className="p-2 bg-white border-t border-slate-100 flex items-center gap-1 shrink-0">
            {/* Quick Media / Sticker Icons */}
            <div className="flex items-center text-blue-600 shrink-0">
              <button
                type="button"
                title="Send Photo"
                onClick={() => toast.info('Photo upload available in full chat page.')}
                className="p-1.5 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Send Emoji"
                onClick={() => setInputText((prev) => `${prev} 😊`)}
                className="p-1.5 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            {/* Input Box with "Aa" placeholder (Classic Messenger!) */}
            <div className="flex-1 relative min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Aa"
                disabled={isSending}
                className="w-full py-1.5 px-3 bg-[#F0F2F5] hover:bg-[#E4E6EB] focus:bg-white text-slate-900 rounded-full text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
              />
            </div>

            {/* Right Button: Thumbs Up 👍 when empty, Send Arrow ✈️ when text present */}
            {inputText.trim().length === 0 ? (
              <button
                type="button"
                title="Send Thumbs Up"
                onClick={() => handleSend('👍')}
                disabled={isSending}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-all active:scale-125 cursor-pointer shrink-0"
              >
                <span className="text-base leading-none select-none">👍</span>
              </button>
            ) : (
              <button
                type="button"
                title="Send Message (Enter)"
                onClick={() => handleSend()}
                disabled={isSending}
                className="p-1.5 bg-[#0084FF] hover:bg-blue-600 text-white rounded-full transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
              >
                {isSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
