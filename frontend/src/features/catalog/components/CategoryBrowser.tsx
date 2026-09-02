'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  Folder,
  ChevronRight,
  Package,
  Eye,
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  Home,
} from 'lucide-react';
import { toast } from 'sonner';
import { CategoryStatus, CategoryListItem, useDeleteCategoryMutation } from '../api/catalogApi';
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
}: CategoryBrowserProps) {
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<CategoryListItem | null>(null);

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

  const renderStatusBadge = (status: CategoryStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Active
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
            Draft
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
            Archived
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

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
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-center">Subcategories</th>
              <th className="px-4 py-3 text-center">Products</th>
              <th className="px-4 py-3">Status</th>
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
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 space-y-2">
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
                <td colSpan={7} className="px-6 py-16 text-center space-y-3">
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
              categories.map((cat) => {
                const isSelected = selectedIds.has(cat.id);
                const hasChildren = cat.subcategoriesCount > 0;

                return (
                  <tr key={cat.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
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
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                          <Folder className="w-4 h-4" />
                        </div>
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
                    <td className="px-4 py-3.5">{renderStatusBadge(cat.status)}</td>

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
