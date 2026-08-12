import React, { useState } from 'react';
import { 
  useGetOrderTimelineQuery, 
  useCreateOrderNoteMutation 
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
  ShieldAlert, 
  Filter 
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderActivityFeedProps {
  orderId: string;
}

export function OrderActivityFeed({ orderId }: OrderActivityFeedProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'NOTES' | 'STATUS' | 'LOGISTICS'>('ALL');
  const [noteContent, setNoteContent] = useState('');
  const [isCustomerVisible, setIsCustomerVisible] = useState(false);

  const { data: timeline = [], isLoading, isFetching } = useGetOrderTimelineQuery(orderId);
  const [createNote, { isLoading: isCreatingNote }] = useCreateOrderNoteMutation();

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

  const filteredTimeline = timeline.filter((event) => {
    if (activeTab === 'NOTES') {
      return event.type === 'INTERNAL_NOTE' || event.type === 'CUSTOMER_COMMUNICATION';
    }
    if (activeTab === 'STATUS') {
      return event.type === 'STATUS_CHANGE';
    }
    if (activeTab === 'LOGISTICS') {
      return event.type === 'SHIPMENT' || event.type === 'RETURN';
    }
    return true;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'INTERNAL_NOTE':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'CUSTOMER_COMMUNICATION':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'STATUS_CHANGE':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
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
        return <span className="bg-purple-50 text-purple-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-purple-100">Internal Note</span>;
      case 'CUSTOMER_COMMUNICATION':
        return <span className="bg-blue-50 text-blue-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-blue-100">Customer Msg</span>;
      case 'STATUS_CHANGE':
        return <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-100">Status</span>;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Activity & Communication</h3>
          <p className="text-xs text-slate-500 mt-0.5">Audit log, internal team notes, and customer touchpoints.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('NOTES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'NOTES' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab('STATUS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'STATUS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Status
          </button>
          <button
            onClick={() => setActiveTab('LOGISTICS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'LOGISTICS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Logistics
          </button>
        </div>
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-3">
        <textarea
          rows={2}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Write an internal staff note or customer update..."
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all resize-none"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isCustomerVisible}
              onChange={(e) => setIsCustomerVisible(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600 cursor-pointer"
            />
            <span>Visible to Customer</span>
          </label>

          <button
            type="submit"
            disabled={isCreatingNote || !noteContent.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isCreatingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Post Note</span>
          </button>
        </div>
      </form>

      {/* Timeline Stream */}
      {isLoading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading timeline activity...</div>
      ) : filteredTimeline.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">No activity recorded for this filter.</div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          {filteredTimeline.map((event) => (
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
      )}
    </div>
  );
}
