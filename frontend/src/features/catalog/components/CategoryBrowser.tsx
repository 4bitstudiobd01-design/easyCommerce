'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  ChevronRight,
  Package,
  Eye,
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  Home,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CategoryStatus,
  CategoryListItem,
  useDeleteCategoryMutation,
  useReorderCategoryMutation,
  useUpdateCategoryMutation,
} from '../api/catalogApi';
import { getCategoryIcon } from '../utils/categoryIcons';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface BreadcrumbEntry {
  id: string | null;
  name: string;
}

interface CategoryBrowserProps {
  categories: CategoryListItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  breadcrumbs: BreadcrumbEntry[];
  onNavigate: (categoryId: string, categoryName: string) => void;
  onNavigateBreadcrumb: (index: number) => void;
  selectedIds: Set<string>;
  onSelectRow: (id: string) => void;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Reordering (drag handle + up/down) only makes sense on the unfiltered, sortOrder-sorted view. */
  canReorder: boolean;
}

export function CategoryBrowser({
  categories,
  isLoading,
  isError,
  onRetry,
  breadcrumbs,
  onNavigate,
  onNavigateBreadcrumb,
  selectedIds,
  onSelectRow,
  onSelectAll,
  canReorder,
}: CategoryBrowserProps) {
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<CategoryListItem | null>(null);
  const [reorderCategory, { isLoading: isReordering }] = useReorderCategoryMutation();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [updateCategory] = useUpdateCategoryMutation();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (cat: CategoryListItem, status: CategoryStatus) => {
    if (status === cat.status) return;
    setUpdatingId(cat.id);
    try {
      await updateCategory({ id: cat.id, data: { status } }).unwrap();
      toast.success(`"${cat.name}" is now ${status.toLowerCase()}.`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update category status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStorefront = async (cat: CategoryListItem) => {
    setUpdatingId(cat.id);
    try {
      await updateCategory({ id: cat.id, data: { showInStorefront: !cat.showInStorefront } }).unwrap();
      toast.success(cat.showInStorefront ? 'Hidden from storefront' : 'Now visible on storefront');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update storefront visibility.');
    } finally {
      setUpdatingId(null);
    }
  };

  const currentParentId = breadcrumbs[breadcrumbs.length - 1].id;

  const handleConfirmDelete = async () => {
    if (!categoryPendingDelete) return;
    try {
      await deleteCategory(categoryPendingDelete.id).unwrap();
      toast.success(`Category "${categoryPendingDelete.name}" deleted successfully.`);
      setCategoryPendingDelete(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete category.');
    }
  };

  const moveSibling = async (cat: CategoryListItem, direction: 'up' | 'down') => {
    const index = categories.findIndex((c) => c.id === cat.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= categories.length) return;

    try {
      await reorderCategory({
        categoryId: cat.id,
        newParentId: currentParentId,
        newSortOrder: swapIndex,
      }).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to reorder category.');
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!canReorder || isReordering) {
      e.preventDefault();
      return;
    }
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    if (!canReorder || !draggedId || draggedId === targetId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetId(targetId);
  };

  const handleDragLeave = () => setDropTargetId(null);

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedId;
    setDraggedId(null);
    setDropTargetId(null);
    if (!sourceId || sourceId === targetId) return;

    const targetIndex = categories.findIndex((c) => c.id === targetId);
    if (targetIndex < 0) return;

    try {
      await reorderCategory({
        categoryId: sourceId,
        newParentId: currentParentId,
        newSortOrder: targetIndex,
      }).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to reorder category.');
    }
  };

  const STATUS_SELECT_CLASSES: Record<CategoryStatus, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    DRAFT: 'bg-amber-50 text-amber-700 border-amber-200/60',
    ARCHIVED: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const renderStatusDropdown = (cat: CategoryListItem) => (
    <select
      value={cat.status}
      disabled={updatingId === cat.id}
      onChange={(e) => handleStatusChange(cat, e.target.value as CategoryStatus)}
      className={`text-[11px] font-semibold rounded-md border px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${STATUS_SELECT_CLASSES[cat.status]}`}
      aria-label={`Change status for ${cat.name}`}
    >
      <option value="ACTIVE">Active</option>
      <option value="DRAFT">Draft</option>
      <option value="ARCHIVED">Archived</option>
    </select>
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const currentParent = breadcrumbs[breadcrumbs.length - 1];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      {/* Breadcrumb Navigation */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={() => onNavigateBreadcrumb(0)}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-colors ${
            breadcrumbs.length === 1
              ? 'text-slate-900'
              : 'text-slate-500 hover:text-blue-600 hover:bg-white'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Categories</span>
        </button>

        {breadcrumbs.slice(1).map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 2;
          return (
            <React.Fragment key={crumb.id ?? 'root'}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <button
                type="button"
                onClick={() => onNavigateBreadcrumb(idx + 1)}
                disabled={isLast}
                className={`px-2 py-1 rounded-lg font-bold transition-colors truncate max-w-[220px] ${
                  isLast ? 'text-slate-900 cursor-default' : 'text-slate-500 hover:text-blue-600 hover:bg-white'
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={categories.length > 0 && categories.every((c) => selectedIds.has(c.id))}
                  onChange={onSelectAll}
                  aria-label="Select all categories"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              {canReorder && <th className="w-8 px-2 py-3" />}
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-center">Subcategories</th>
              <th className="px-4 py-3 text-center">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Storefront</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-3.5 text-center">
                    <div className="w-4 h-4 bg-slate-200 rounded mx-auto" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-36 bg-slate-200 rounded" />
                        <div className="h-2.5 w-24 bg-slate-100 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="h-5 w-10 bg-slate-200 rounded-full mx-auto" />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="h-5 w-10 bg-slate-200 rounded-full mx-auto" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-5 w-16 bg-slate-200 rounded-md" />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="h-5 w-9 bg-slate-200 rounded-full mx-auto" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-3.5 w-20 bg-slate-200 rounded" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="h-7 w-7 bg-slate-200 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={canReorder ? 9 : 8} className="px-6 py-12 text-center text-slate-500 space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-900">Failed to load categories</p>
                  <p className="text-xs text-slate-400">Please check your store connection and try again.</p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={canReorder ? 9 : 8} className="px-6 py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <FolderTree className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      {currentParent?.id ? 'No subcategories here yet' : 'No categories yet'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {currentParent?.id
                        ? `"${currentParent.name}" has no subcategories yet.`
                        : 'Start organizing your catalog by creating your first product category.'}
                    </p>
                    <Link
                      href={
                        currentParent?.id
                          ? `/dashboard/categories/create?parentId=${currentParent.id}`
                          : '/dashboard/categories/create'
                      }
                      className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Category</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              categories.map((cat, index) => {
                const isSelected = selectedIds.has(cat.id);
                const hasChildren = cat.subcategoriesCount > 0;
                const isDropTarget = canReorder && dropTargetId === cat.id && draggedId !== cat.id;

                return (
                  <tr
                    key={cat.id}
                    onDragOver={(e) => handleDragOver(e, cat.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, cat.id)}
                    className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''} ${
                      draggedId === cat.id ? 'opacity-40' : ''
                    } ${isDropTarget ? 'bg-blue-100/60 ring-2 ring-blue-500 ring-inset' : ''}`}
                  >
                    {canReorder && (
                      <td className="px-2 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <div
                            draggable={!isReordering}
                            onDragStart={(e) => handleDragStart(e, cat.id)}
                            className="p-0.5 text-slate-300 hover:text-slate-600 rounded cursor-grab active:cursor-grabbing hover:bg-slate-100 transition-colors"
                            title="Drag to reorder"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveSibling(cat, 'up')}
                              disabled={index === 0 || isReordering}
                              className="p-0.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:hover:text-slate-300 disabled:hover:bg-transparent transition-colors"
                              title="Move up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSibling(cat, 'down')}
                              disabled={index === categories.length - 1 || isReordering}
                              className="p-0.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:hover:text-slate-300 disabled:hover:bg-transparent transition-colors"
                              title="Move down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectRow(cat.id)}
                        aria-label={`Select ${cat.name}`}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* Category Name — click to drill in */}
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => onNavigate(cat.id, cat.name)}
                        className="flex items-center gap-3 text-left group"
                      >
                        {(() => {
                          if (cat.image) {
                            return (
                              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={cat.image} alt="" className="w-full h-full object-cover" />
                              </div>
                            );
                          }
                          const IconComp = getCategoryIcon(cat.icon);
                          return (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                              <IconComp className="w-4 h-4" />
                            </div>
                          );
                        })()}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">
                              {cat.name}
                            </span>
                            {cat.isFeatured && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-bold">
                                Featured
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-slate-400">/{cat.slug}</span>
                        </div>
                      </button>
                    </td>

                    {/* Subcategories count — click also drills in */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => hasChildren && onNavigate(cat.id, cat.name)}
                        disabled={!hasChildren}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                          hasChildren
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 hover:bg-indigo-100 cursor-pointer'
                            : 'bg-slate-100 text-slate-400 cursor-default'
                        }`}
                        title={hasChildren ? 'View subcategories' : 'No subcategories'}
                      >
                        <span>{cat.subcategoriesCount}</span>
                        {hasChildren && <ChevronRight className="w-3 h-3" />}
                      </button>
                    </td>

                    {/* Products Count */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          cat.productsCount > 0
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Package className="w-3 h-3 text-slate-400" />
                        <span>{cat.productsCount}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">{renderStatusDropdown(cat)}</td>

                    {/* Storefront visibility toggle */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!cat.showInStorefront}
                        aria-label={`${cat.showInStorefront ? 'Hide' : 'Show'} ${cat.name} on storefront`}
                        disabled={updatingId === cat.id}
                        onClick={() => handleToggleStorefront(cat)}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          cat.showInStorefront ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                            cat.showInStorefront ? 'translate-x-[18px]' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Updated */}
                    <td className="px-4 py-3.5 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                      {formatDate(cat.updatedAt || cat.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/dashboard/categories/${cat.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Category Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/categories/${cat.id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Category"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setCategoryPendingDelete(cat)}
                          disabled={isDeleting}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={categoryPendingDelete !== null}
        onClose={() => setCategoryPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message={
          <>
            Are you sure you want to delete <strong>&quot;{categoryPendingDelete?.name}&quot;</strong>?
            This only works if it has no products or subcategories.
          </>
        }
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
