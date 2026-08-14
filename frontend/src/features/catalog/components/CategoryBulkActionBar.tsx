'use client';

import React, { useState } from 'react';
import {
  CategoryStatus,
  CategoryListItem,
  useBulkUpdateCategoryStatusMutation,
  useBulkMoveCategoriesMutation,
  useBulkDeleteCategoriesMutation,
  useGetCategoryTreeQuery,
} from '../api/catalogApi';
import { formatHierarchicalCategoryOptions } from '../utils/categoryTreeHelper';
import {
  Globe,
  FileEdit,
  Archive,
  FolderInput,
  Trash2,
  Download,
  X,
  Loader2,
  AlertTriangle,
  ChevronRight,
  FolderTree,
} from 'lucide-react';
import { toast } from 'sonner';

interface CategoryBulkActionBarProps {
  selectedCategoryIds: string[];
  onClearSelection: () => void;
  onExportSelected: () => void;
  categories: CategoryListItem[];
}

export function CategoryBulkActionBar({
  selectedCategoryIds,
  onClearSelection,
  onExportSelected,
  categories,
}: CategoryBulkActionBarProps) {
  const [bulkUpdateStatus, { isLoading: isUpdatingStatus }] = useBulkUpdateCategoryStatusMutation();
  const [bulkMove, { isLoading: isMoving }] = useBulkMoveCategoriesMutation();
  const [bulkDelete, { isLoading: isDeleting }] = useBulkDeleteCategoriesMutation();

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>('ROOT');

  const { data: treeData } = useGetCategoryTreeQuery();

  if (selectedCategoryIds.length === 0) return null;

  const handleBulkStatus = async (status: CategoryStatus) => {
    try {
      const res = await bulkUpdateStatus({
        categoryIds: selectedCategoryIds,
        status,
      }).unwrap();

      toast.success(res.message || `Successfully updated ${selectedCategoryIds.length} categories to ${status}`);
      onClearSelection();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Bulk status update failed');
    }
  };

  const handleBulkMove = async () => {
    try {
      const newParentId = selectedParentId === 'ROOT' ? null : selectedParentId;
      const res = await bulkMove({
        categoryIds: selectedCategoryIds,
        newParentId,
      }).unwrap();

      toast.success(res.message || `Successfully moved ${selectedCategoryIds.length} categories`);
      setShowMoveModal(false);
      onClearSelection();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Bulk move failed');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const res = await bulkDelete({
        categoryIds: selectedCategoryIds,
      }).unwrap();

      toast.success(res.message || `Successfully deleted ${selectedCategoryIds.length} categories`);
      setShowDeleteModal(false);
      onClearSelection();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Bulk deletion failed');
    }
  };

  // Build list of valid destination options excluding selected categories and their descendants
  const hierarchicalOptions = formatHierarchicalCategoryOptions(categories || []);
  const validDestinationOptions = hierarchicalOptions.filter(
    (opt) => !selectedCategoryIds.includes(opt.id),
  );

  return (
    <>
      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-2.5 px-4 sm:px-5 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-5 max-w-[95vw]">
        <div className="flex items-center gap-2 border-r border-slate-700 pr-3 shrink-0">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            {selectedCategoryIds.length}
          </span>
          <span className="text-xs font-bold text-slate-200">Selected</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Status Changer Buttons */}
          <button
            type="button"
            disabled={isUpdatingStatus}
            onClick={() => handleBulkStatus('ACTIVE')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            title="Set Status to Active"
          >
            {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Active</span>
          </button>

          <button
            type="button"
            disabled={isUpdatingStatus}
            onClick={() => handleBulkStatus('DRAFT')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            title="Set Status to Draft"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Draft</span>
          </button>

          <button
            type="button"
            disabled={isUpdatingStatus}
            onClick={() => handleBulkStatus('ARCHIVED')}
            className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            title="Set Status to Archived"
          >
            <Archive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Archive</span>
          </button>

          {/* Bulk Move Button */}
          <button
            type="button"
            onClick={() => setShowMoveModal(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Move categories in hierarchy"
          >
            <FolderInput className="w-3.5 h-3.5" />
            <span>Move</span>
          </button>

          {/* Export Selected Button */}
          <button
            type="button"
            onClick={onExportSelected}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Export selected categories to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Delete selected categories"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>

        {/* Clear Selection */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white text-xs flex items-center gap-1 border-l border-slate-700 pl-3 ml-auto"
          title="Deselect All"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Bulk Move Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <FolderTree className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900">Move {selectedCategoryIds.length} Categories</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMoveModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select a new destination parent category. All {selectedCategoryIds.length} selected categories will be organized under this target.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Target Parent Category
              </label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ROOT">Root Level (Top Level Category)</option>
                {validDestinationOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMoving}
                onClick={handleBulkMove}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isMoving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Move</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Destructive Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delete {selectedCategoryIds.length} Categories?
                </h3>
                <p className="text-xs text-rose-600 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p className="font-semibold text-slate-900">Safety Precautions Applied:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>Associated products will not be deleted; they will be safely uncategorized.</li>
                <li>Child subcategories under these categories will be reparented to Root level.</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete {selectedCategoryIds.length} Categories</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
