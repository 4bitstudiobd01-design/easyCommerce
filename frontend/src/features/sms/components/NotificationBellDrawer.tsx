'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetPushNotificationsQuery,
  useMarkNotificationsReadMutation,
  useMarkNotificationReadMutation,
  PushNotification,
} from '../api/smsApi';
import { Bell, CheckCheck, ShoppingBag } from 'lucide-react';

/** Where a notification deep-links, based on its reference. null = not clickable. */
function notificationHref(item: PushNotification): string | null {
  if (item.referenceType === 'ORDER' && item.referenceId) {
    return `/dashboard/orders/${item.referenceId}`;
  }
  return null;
}

export function NotificationBellDrawer() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: notifications = [] } = useGetPushNotificationsQuery(undefined, {
    pollingInterval: 10000, // Real-time poll every 10 seconds
  });
  const [markAllRead] = useMarkNotificationsReadMutation();
  const [markOneRead] = useMarkNotificationReadMutation();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (item: PushNotification) => {
    const href = notificationHref(item);
    if (!item.isRead) {
      markOneRead(item.id);
    }
    if (href) {
      setIsOpen(false);
      router.push(href);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
        title="Real-Time Order Notifications"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 z-50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-slate-900">Real-Time Alerts</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-white bg-red-500 rounded-full px-1.5 py-0.5">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto space-y-1 pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No notifications yet. New customer orders will chime here in real-time!
              </div>
            ) : (
              notifications.map((item) => {
                const href = notificationHref(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    className={`w-full text-left py-3 px-2 rounded-2xl transition-colors ${
                      item.isRead
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-blue-50 hover:bg-blue-100'
                    } ${href ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Unread dot / spacer keeps text aligned in both states */}
                      <span className="w-2 h-2 mt-1.5 shrink-0 flex items-center justify-center">
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                      </span>

                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          item.isRead
                            ? 'bg-slate-200 text-slate-500'
                            : 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-xs block truncate ${
                            item.isRead
                              ? 'font-semibold text-slate-600'
                              : 'font-extrabold text-slate-900'
                          }`}
                        >
                          {item.title}
                        </span>
                        <p
                          className={`text-[11px] leading-snug mt-0.5 ${
                            item.isRead ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          {item.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                          <span>
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {href && (
                            <span className="font-bold text-blue-600">· View order</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
