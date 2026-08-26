'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Megaphone, Pin } from 'lucide-react';
import { Notice, NoticePriority, useCreateNoticeMutation, useUpdateNoticeMutation } from '../api/hrmApi';

interface NoticeFormModalProps {
  isOpen: boolean;
  notice: Notice | null;
  onClose: () => void;
}

const PRIORITIES: NoticePriority[] = ['NORMAL', 'IMPORTANT', 'URGENT'];

export function NoticeFormModal({ isOpen, notice, onClose }: NoticeFormModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<NoticePriority>('NORMAL');
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  const [createNotice, { isLoading: isCreating }] = useCreateNoticeMutation();
  const [updateNotice, { isLoading: isUpdating }] = useUpdateNoticeMutation();
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (isOpen) {
      setTitle(notice?.title ?? '');
      setBody(notice?.body ?? '');
      setPriority(notice?.priority ?? 'NORMAL');
      setIsPinned(notice?.isPinned ?? false);
      setExpiresAt(notice?.expiresAt?.slice(0, 10) ?? '');
    }
  }, [isOpen, notice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are both required.');
      return;
    }

    try {
      if (notice) {
        await updateNotice({ id: notice.id, title, body, priority, isPinned, expiresAt: expiresAt || null }).unwrap();
        toast.success('Notice updated.');
      } else {
        await createNotice({ title, body, priority, isPinned, expiresAt: expiresAt || undefined }).unwrap();
        toast.success('Notice posted.');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save notice.');
    }
  };

  const fieldClass =
    'w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={notice ? 'Edit Notice' : 'Post a Notice'}
      icon={<Megaphone className="w-5 h-5" />}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="notice-form"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : notice ? 'Save Changes' : 'Post Notice'}
          </button>
        </>
      }
    >
      <form id="notice-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Office closed for Eid holidays"
            className={`${fieldClass} placeholder-slate-400`}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Message</label>
          <textarea
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the full announcement here..."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Priority</label>
            <select className={fieldClass} value={priority} onChange={(e) => setPriority(e.target.value as NoticePriority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Expires On (optional)</label>
            <input type="date" className={fieldClass} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
              <Pin className="w-3.5 h-3.5" /> Pin to top
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
