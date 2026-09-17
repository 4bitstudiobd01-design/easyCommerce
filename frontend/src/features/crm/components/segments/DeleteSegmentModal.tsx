'use client';

import React from 'react';
import { AlertTriangle, X, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerSegment } from '../../types/crm.types';
import { useDeleteCrmSegmentMutation } from '../../api/crmApi';

interface DeleteSegmentModalProps {
  segment: CustomerSegment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteSegmentModal: React.FC<DeleteSegmentModalProps> = ({
  segment,
  isOpen,
  onClose,
}) => {
  const [deleteSegment, { isLoading }] = useDeleteCrmSegmentMutation();

  if (!isOpen || !segment) return null;

  const handleDelete = async () => {
    try {
      await deleteSegment(segment.id).unwrap();
      toast.success(`Segment "${segment.name}" deleted.`);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete segment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Delete Segment</h2>
              <p className="text-xs text-slate-500">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-600">
          Are you sure you want to delete{' '}
          <span className="font-bold text-slate-900">&ldquo;{segment.name}&rdquo;</span>? Customers will no
          longer be grouped under this segment.
        </div>

        <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-red-600/25 transition-all flex items-center gap-1.5"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>Delete Segment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
