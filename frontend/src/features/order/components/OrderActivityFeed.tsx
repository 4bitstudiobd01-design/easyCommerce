import React, { useState, useEffect, useRef } from 'react';
import {
  useGetOrderTimelineQuery,
  useCreateOrderNoteMutation,
  TimelineEvent,
} from '../api/orderApi';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  User,
  Send,
  Loader2,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

interface OrderActivityFeedProps {
  orderId: string;
}

export function OrderActivityFeed({ orderId }: OrderActivityFeedProps) {
  const [noteContent, setNoteContent] = useState('');
  const [isCustomerVisible, setIsCustomerVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isFetching } = useGetOrderTimelineQuery({ orderId, page, limit: PAGE_SIZE });
  const [createNote, { isLoading: isCreatingNote }] = useCreateOrderNoteMutation();

  // Reset pagination whenever the order changes (navigating between orders reuses this component).
  useEffect(() => {
    setPage(1);
    setEvents([]);
  }, [orderId]);

  // Each page's events are appended to the running list rather than replacing it,
  // so scrolling further down keeps everything already loaded in view.
  useEffect(() => {
    if (!data) return;
    setEvents((prev) => (data.page === 1 ? data.events : [...prev, ...data.events]));
  }, [data]);

  const hasMore = data?.hasMore ?? false;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching) {
          setPage((p) => p + 1);
        }
      },
      { root, rootMargin: '100px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isFetching]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    try {
      await createNote({
        orderId,
        content: noteContent.trim(),
        isCustomerVisible,
      }).unwrap();

      toast.success(isCustomerVisible ? 'Customer message added' : 'Internal note added');
      setNoteContent('');
      setIsCustomerVisible(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to add note');
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'INTERNAL_NOTE':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'CUSTOMER_COMMUNICATION':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'STATUS_CHANGE':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'ORDER_EDITED':
        return <Pencil className="w-4 h-4 text-violet-600" />;
      case 'SHIPMENT':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'RETURN':
        return <RotateCcw className="w-4 h-4 text-rose-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'INTERNAL_NOTE':
        return <span className="bg-blue-50 text-blue-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-blue-100">Internal Note</span>;
      case 'CUSTOMER_COMMUNICATION':
        return <span className="bg-blue-50 text-blue-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-blue-100">Customer Msg</span>;
      case 'STATUS_CHANGE':
        return <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-100">Status</span>;
      case 'ORDER_EDITED':
        return <span className="bg-violet-50 text-violet-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-violet-100">Edited</span>;
      case 'SHIPMENT':
        return <span className="bg-amber-50 text-amber-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-100">Logistics</span>;
      case 'RETURN':
        return <span className="bg-rose-50 text-rose-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-rose-100">Return</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-base font-bold text-slate-900">Activity & Communication</h3>
        <p className="text-xs text-slate-500 mt-0.5">Audit log, internal team notes, and customer touchpoints.</p>
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-3">
        <textarea
          rows={2}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Write an internal staff note or customer update..."
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isCustomerVisible}
              onChange={(e) => setIsCustomerVisible(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
            />
            <span>Visible to Customer</span>
          </label>

          <button
            type="submit"
            disabled={isCreatingNote || !noteContent.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isCreatingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Post Note</span>
          </button>
        </div>
      </form>

      {/* Timeline Stream */}
      {isLoading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading timeline activity...</div>
      ) : events.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">No activity recorded yet.</div>
      ) : (
        <div ref={scrollContainerRef} className="max-h-[560px] overflow-y-auto pr-1">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {events.map((event) => (
              <div key={event.id} className="relative flex items-start gap-4 group">
                {/* Icon Marker */}
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                  {getEventIcon(event.type)}
                </div>

                {/* Content */}
                <div className="flex-1 bg-white rounded-xl border border-slate-100 p-3.5 shadow-2xs hover:border-slate-200 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{event.title}</span>
                      {getEventBadge(event.type)}
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>By: {event.actor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div ref={sentinelRef} className="py-4 flex items-center justify-center">
              {isFetching && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
