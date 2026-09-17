'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useGetConversationsQuery } from '../../api/omnichannelApi';
import { ConversationThread } from '../../types/omnichannel.types';
import { DockedChatWindow } from './DockedChatWindow';
import { PlatformIcon } from './PlatformIcon';
import {
  MessageCircle,
  ExternalLink,
  ChevronUp,
  X,
  Search,
  Sparkles,
  Inbox,
  Volume2,
  VolumeX,
} from 'lucide-react';

const MAX_DOCKED_CHATS = 3;

export const DockedChatManager: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  // Do not render floating docked boxes when user is on the dedicated chat page
  const isOnChatPage = pathname?.startsWith('/dashboard/crm/chat');

  // Poll conversations every 5 seconds
  const { data: conversations = [], isLoading } = useGetConversationsQuery(undefined, {
    pollingInterval: 5000,
    skip: isOnChatPage,
  });

  // Open docked conversation IDs (ordered from left to right, max 3)
  const [openIds, setOpenIds] = useState<string[]>([]);
  // Minimized state per conversation ID
  const [minimizedMap, setMinimizedMap] = useState<Record<string, boolean>>({});
  // Quick launcher popover
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [launcherSearch, setLauncherSearch] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Track previous unread counts to trigger auto-popup on new incoming messages
  const prevUnreadRef = useRef<Record<string, number>>({});
  const isInitialLoadRef = useRef(true);

  // Play subtle notification chime
  const playChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // Audio context might be restricted before first user interaction
    }
  };

  // Detect new inbound messages and auto-popup chat window if under MAX_DOCKED_CHATS
  useEffect(() => {
    if (isLoading || isOnChatPage || !conversations.length) return;

    if (isInitialLoadRef.current) {
      // Populate baseline unread map on first load
      const initialMap: Record<string, number> = {};
      conversations.forEach((c) => {
        initialMap[c.id] = c.unreadCount || 0;
      });
      prevUnreadRef.current = initialMap;
      isInitialLoadRef.current = false;
      return;
    }

    let hasNewIncoming = false;
    const newUnreadMap: Record<string, number> = {};

    conversations.forEach((c) => {
      const prevCount = prevUnreadRef.current[c.id] ?? 0;
      const currentCount = c.unreadCount || 0;
      newUnreadMap[c.id] = currentCount;

      if (currentCount > prevCount) {
        hasNewIncoming = true;
        // Auto-open this conversation if not already open and slot available
        setOpenIds((prev) => {
          if (prev.includes(c.id)) {
            // Already open, ensure it's not minimized
            setMinimizedMap((m) => ({ ...m, [c.id]: false }));
            return prev;
          }
          if (prev.length < MAX_DOCKED_CHATS) {
            return [...prev, c.id];
          }
          return prev;
        });
      }
    });

    if (hasNewIncoming) {
      playChime();
    }

    prevUnreadRef.current = newUnreadMap;
  }, [conversations, isLoading, isOnChatPage]);

  // Total unread count across all omnichannel conversations
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  // Active conversations currently mapped to open IDs
  const activeDockedConversations = useMemo(() => {
    return openIds
      .map((id) => conversations.find((c) => c.id === id))
      .filter((c): c is ConversationThread => Boolean(c));
  }, [openIds, conversations]);

  // Conversations with unread messages that are NOT currently open in the 3 slots
  const overflowUnreadConversations = useMemo(() => {
    return conversations.filter(
      (c) => (c.unreadCount || 0) > 0 && !openIds.includes(c.id)
    );
  }, [conversations, openIds]);

  const handleOpenConversation = (id: string) => {
    setOpenIds((prev) => {
      if (prev.includes(id)) {
        // Expand if minimized
        setMinimizedMap((m) => ({ ...m, [id]: false }));
        return prev;
      }
      if (prev.length < MAX_DOCKED_CHATS) {
        return [...prev, id];
      }
      // If already at 3, replace the oldest one (first in array)
      const next = [...prev.slice(1), id];
      return next;
    });
    setMinimizedMap((m) => ({ ...m, [id]: false }));
    setIsLauncherOpen(false);
  };

  const handleCloseConversation = (id: string) => {
    setOpenIds((prev) => prev.filter((openId) => openId !== id));
    setMinimizedMap((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
  };

  const handleToggleMinimize = (id: string) => {
    setMinimizedMap((m) => ({ ...m, [id]: !m[id] }));
  };

  const handleGoToChatPage = () => {
    setIsLauncherOpen(false);
    router.push('/dashboard/crm/chat');
  };

  // If on full chat page, hide dock
  if (isOnChatPage) {
    return null;
  }

  // Filtered list for the launcher popover
  const filteredLauncherList = conversations.filter((c) => {
    if (!launcherSearch.trim()) return true;
    const q = launcherSearch.toLowerCase();
    return (
      c.customerName?.toLowerCase().includes(q) ||
      c.platform?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* ─── FIXED DOCKED CHAT WINDOWS (BOTTOM RIGHT) ────────────────────── */}
      <div className="fixed bottom-0 right-20 z-50 flex items-end gap-3 pointer-events-none">
        {/* Overflow Indicator Pill (Shown when more active/unread chats exist beyond the 3 slots) */}
        {overflowUnreadConversations.length > 0 && (
          <div className="pointer-events-auto mb-2 animate-in slide-in-from-bottom-3 duration-300">
            <button
              onClick={handleGoToChatPage}
              className="px-3.5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-blue-400/40"
            >
              <span className="w-5 h-5 rounded-full bg-white text-blue-600 font-extrabold text-[11px] flex items-center justify-center">
                +{overflowUnreadConversations.length}
              </span>
              <span>More Chats • Open Inbox</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Up to 3 Docked Windows */}
        {activeDockedConversations.map((conv) => (
          <div
            key={conv.id}
            className="animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto"
          >
            <DockedChatWindow
              conversation={conv}
              isMinimized={Boolean(minimizedMap[conv.id])}
              onToggleMinimize={() => handleToggleMinimize(conv.id)}
              onClose={() => handleCloseConversation(conv.id)}
            />
          </div>
        ))}
      </div>

      {/* ─── FLOATING MESSENGER LAUNCHER BUBBLE (BOTTOM-RIGHT CORNER) ────── */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        {/* Launcher Quick Conversations Popover */}
        {isLauncherOpen && (
          <div
            className="mb-3 w-[320px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 zoom-in-95 duration-200"
            style={{
              boxShadow: '0 16px 36px 0 rgba(0, 0, 0, 0.22), 0 4px 12px 0 rgba(0, 0, 0, 0.1)',
              maxHeight: '460px',
            }}
          >
            {/* Popover Header */}
            <div className="p-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#0084FF] to-[#A033FF] flex items-center justify-center text-white shadow-xs">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs">Customer Messages</h3>
                  <p className="text-[10px] text-slate-300">Omnichannel Live Chats</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsLauncherOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={launcherSearch}
                  onChange={(e) => setLauncherSearch(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto max-h-[300px] divide-y divide-slate-100">
              {isLoading && conversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading chats...</div>
              ) : filteredLauncherList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <Inbox className="w-7 h-7 mx-auto text-slate-300" />
                  <p className="font-bold text-xs text-slate-600">No active conversations</p>
                  <p className="text-[11px]">Incoming customer messages will appear here.</p>
                </div>
              ) : (
                filteredLauncherList.map((conv) => {
                  const isAlreadyOpen = openIds.includes(conv.id);

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => handleOpenConversation(conv.id)}
                      className={`w-full p-2.5 flex items-center gap-2.5 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                        isAlreadyOpen ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={
                            conv.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              conv.customerName || 'Customer'
                            )}&background=0084FF&color=fff`
                          }
                          alt=""
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div className="absolute -bottom-1 -right-1">
                          <PlatformIcon platform={conv.platform} size={15} />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {conv.customerName}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(conv.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                          {conv.lastMessage || 'Connected'}
                        </p>
                      </div>

                      {conv.unreadCount > 0 && (
                        <span className="w-4.5 h-4.5 rounded-full bg-blue-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Popover Footer: Open Full Inbox Page */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">
                Max 3 docked chats
              </span>
              <button
                type="button"
                onClick={handleGoToChatPage}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Chat Inbox</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ─── Circular Floating Trigger Button (Messenger Style) ──────── */}
        <button
          type="button"
          onClick={() => setIsLauncherOpen((prev) => !prev)}
          title="Customer Messages (Messenger)"
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#0084FF] via-[#006AFF] to-[#A033FF] shadow-2xl flex items-center justify-center text-white cursor-pointer hover:scale-108 active:scale-95 transition-all duration-200 relative group"
          style={{
            boxShadow: '0 8px 24px 0 rgba(0, 132, 255, 0.45)',
          }}
        >
          {isLauncherOpen ? (
            <X className="w-6 h-6 transition-transform duration-200" />
          ) : (
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform group-hover:scale-105"
            >
              <path
                d="M12 3C6.5 3 2 7.03 2 12c0 2.85 1.46 5.4 3.75 7.07V22l2.84-1.56C9.53 20.76 10.74 21 12 21c5.5 0 10-4.03 10-9s-4.5-9-10-9zm1 12.25l-2.55-2.73-5 2.73 5.5-5.85 2.55 2.73 5-2.73-5.5 5.85z"
                fill="#FFFFFF"
              />
            </svg>
          )}

          {/* Unread Counter Badge */}
          {totalUnreadCount > 0 && !isLauncherOpen && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white font-black text-[11px] rounded-full border-2 border-white flex items-center justify-center shadow-md animate-pulse">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
};
