'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Megaphone, Plus, RefreshCw, Pin, Edit2, Trash2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Notice, NoticePriority, useGetNoticesQuery, useDeleteNoticeMutation } from '../api/hrmApi';
import { NoticeFormModal } from './NoticeFormModal';

const PRIORITY_META: Record<NoticePriority, { border: string; badge: string; icon: React.ElementType }> = {
  URGENT: { border: 'border-l-rose-500', badge: 'bg-rose-100 text-rose-800', icon: AlertTriangle },
  IMPORTANT: { border: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-800', icon: AlertCircle },
  NORMAL: { border: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-800', icon: Info },
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NoticeBoardView() {
  const [showExpired, setShowExpired] = useState(false);
  const { data: notices = [], isLoading, isFetching, refetch } = useGetNoticesQuery({ includeExpired: showExpired });
  const [deleteNotice, { isLoading: isDeleting }] = useDeleteNoticeMutation();

  const [formState, setFormState] = useState<{ open: boolean; notice: Notice | null }>({ open: false, notice: null });
  const [deletingNotice, setDeletingNotice] = useState<Notice | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deletingNotice) return;
    try {
      await deleteNotice(deletingNotice.id).unwrap();
      toast.success('Notice deleted.');
      setDeletingNotice(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete notice.');
    }
  };

  const now = Date.now();

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-fuchsia-600 to-pink-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Notice Board
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-full border border-blue-200">
                {notices.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Company-wide announcements, visible to every dashboard user</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={showExpired} onChange={(e) => setShowExpired(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
            Show expired
          </label>
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setFormState({ open: true, notice: null })}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Post Notice
          </button>
        </div>
      </div>

      {/* Board */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm px-6 py-16 text-center text-slate-400">
          <Megaphone className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-slate-700">No notices posted yet.</p>
          <p className="text-xs text-slate-500 mt-1">Click "Post Notice" to announce something to the team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notices.map((notice) => {
            const meta = PRIORITY_META[notice.priority];
            const Icon = meta.icon;
            const isExpired = notice.expiresAt ? new Date(notice.expiresAt).getTime() < now : false;
            return (
              <div
                key={notice.id}
                className={`group relative bg-white rounded-2xl border border-slate-200 border-l-4 ${meta.border} shadow-sm p-5 flex flex-col gap-3 ${
                  isExpired ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {notice.isPinned && <Pin className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.badge}`}>
                      <Icon className="w-3 h-3" /> {notice.priority}
                    </span>
                    {isExpired && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                        EXPIRED
                      </span>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setFormState({ open: true, notice })}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingNotice(notice)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 leading-snug">{notice.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-5">{notice.body}</p>
                <div className="mt-auto pt-2 text-[10.5px] text-slate-400 border-t border-slate-100">
                  {timeAgo(notice.createdAt)}
                  {notice.expiresAt && ` · Expires ${new Date(notice.expiresAt).toLocaleDateString()}`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NoticeFormModal isOpen={formState.open} notice={formState.notice} onClose={() => setFormState({ open: false, notice: null })} />

      <Modal
        isOpen={!!deletingNotice}
        onClose={() => setDeletingNotice(null)}
        title="Delete Notice?"
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeletingNotice(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </>
        }
      >
        <div className="p-6 text-sm text-slate-600">
          Are you sure you want to delete <strong>{deletingNotice?.title}</strong>?
        </div>
      </Modal>
    </div>
  );
}
