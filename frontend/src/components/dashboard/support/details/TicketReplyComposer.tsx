'use client';

import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Smile,
  Paperclip,
  Image as ImageIcon,
  Send,
  ChevronDown,
  Lock,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { TicketStatus } from '../types';

interface TicketReplyComposerProps {
  onSendReply: (text: string, isInternal: boolean, newStatus?: TicketStatus) => void;
}

export function TicketReplyComposer({ onSendReply }: TicketReplyComposerProps) {
  const [replyMode, setReplyMode] = useState<'public' | 'internal'>('public');
  const [replyText, setReplyText] = useState('');
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSend = (newStatus?: TicketStatus) => {
    if (!replyText.trim()) {
      toast.error('Please write a message before sending');
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      onSendReply(replyText.trim(), replyMode === 'internal', newStatus);
      setReplyText('');
      setIsSending(false);
      setIsActionDropdownOpen(false);
    }, 250);
  };

  const handleFormat = (type: string) => {
    switch (type) {
      case 'bold':
        setReplyText((prev) => `${prev} **bold text** `);
        break;
      case 'italic':
        setReplyText((prev) => `${prev} *italic text* `);
        break;
      case 'underline':
        setReplyText((prev) => `${prev} __underlined text__ `);
        break;
      case 'bullet':
        setReplyText((prev) => `${prev}\n• `);
        break;
      case 'number':
        setReplyText((prev) => `${prev}\n1. `);
        break;
      case 'link':
        setReplyText((prev) => `${prev} [Link Text](https://example.com) `);
        break;
      case 'emoji':
        setReplyText((prev) => `${prev} 👍 `);
        break;
      case 'attachment':
        toast.info('Attach files dialog');
        break;
      case 'image':
        toast.info('Insert image dialog');
        break;
      default:
        break;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* 1. Mode Tabs (Public Reply vs Internal Note) */}
      <div className="flex items-center gap-6 px-5 pt-3 border-b border-slate-100 bg-slate-50/40">
        <button
          type="button"
          onClick={() => setReplyMode('public')}
          className={`flex items-center gap-1.5 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 ${
            replyMode === 'public'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Public Reply</span>
        </button>

        <button
          type="button"
          onClick={() => setReplyMode('internal')}
          className={`flex items-center gap-1.5 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 ${
            replyMode === 'internal'
              ? 'border-amber-500 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-600" />
          <span>Internal Note</span>
        </button>
      </div>

      {/* 2. Textarea Input Area */}
      <div className="p-4 sm:p-5 space-y-4">
        <textarea
          rows={4}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={
            replyMode === 'public'
              ? 'Type your reply here...'
              : 'Type private internal note (visible only to support agents)...'
          }
          className={`w-full text-xs sm:text-[13px] border-0 focus:outline-hidden focus:ring-0 resize-none font-normal leading-relaxed ${
            replyMode === 'internal'
              ? 'text-amber-950 placeholder-amber-400'
              : 'text-slate-800 placeholder-slate-400'
          }`}
        />

        {/* 3. Toolbar & Submit Actions Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Formatting Buttons Toolbar */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap text-slate-500">
            <button
              type="button"
              onClick={() => handleFormat('bold')}
              className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat('italic')}
              className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat('underline')}
              className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat('strike')}
              className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <button
              type="button"
              onClick={() => handleFormat('bullet')}
              className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat('number')}
              className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <button
              type="button"
              onClick={() => handleFormat('link')}
              className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Insert Link"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat('emoji')}
              className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Emoji"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat('attachment')}
              className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Attach File"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat('image')}
              className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Insert Image"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Send Reply Split Button */}
          <div className="relative flex items-center justify-end">
            <div className="inline-flex rounded-xl shadow-xs shadow-emerald-600/20 overflow-hidden">
              <button
                type="button"
                disabled={isSending || !replyText.trim()}
                onClick={() => handleSend()}
                className={`flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                  replyMode === 'internal'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{replyMode === 'internal' ? 'Add Note' : 'Send Reply'}</span>
              </button>

              {replyMode === 'public' && (
                <button
                  type="button"
                  disabled={isSending}
                  onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)}
                  className="px-2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white border-l border-emerald-500/40 cursor-pointer disabled:opacity-50"
                  title="More send options"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown for Split Send Actions */}
            {isActionDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsActionDropdownOpen(false)}
                />
                <div className="absolute right-0 bottom-12 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => handleSend('In Progress')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                  >
                    Send & Keep In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend('Pending Merchant')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-purple-700 font-medium cursor-pointer"
                  >
                    Send & Mark Pending Merchant
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend('Resolved')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-emerald-700 font-bold cursor-pointer"
                  >
                    Send & Mark Resolved
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend('Closed')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-600 cursor-pointer"
                  >
                    Send & Close Ticket
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
