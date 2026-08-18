'use client';

import React, { useState } from 'react';
import { useGetPushNotificationsQuery, useMarkNotificationsReadMutation } from '../api/smsApi';
import { Bell, CheckCheck, ShoppingBag, Clock } from 'lucide-react';

export function NotificationBellDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications = [], refetch } = useGetPushNotificationsQuery(undefined, {
    pollingInterval: 10000, // Real-time poll every 10 seconds
  });
  const [markRead] = useMarkNotificationsReadMutation();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      await markRead();
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={handleOpen}
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
            </div>

            <button
              onClick={() => markRead()}
              className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto space-y-1 pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No notifications yet. New customer orders will chime here in real-time!
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`py-3 px-2 rounded-2xl transition-colors ${
                    item.isRead ? 'opacity-70 hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50 font-semibold'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-blue-600/20">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-extrabold text-xs text-slate-900 block truncate">
                        {item.title}
                      </span>
                      <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
