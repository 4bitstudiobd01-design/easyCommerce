'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  FolderTree,
  Folder,
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Layers,
  Calendar,
  Clock,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Globe,
  Sliders,
  Sparkles,
  Info,
  Loader2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Search,
  Plus,
  Boxes,
  Shirt,
  Copy,
  MoreHorizontal,
  Pencil,
  Laptop,
  Home,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetCategoryByIdQuery,
  useDeleteCategoryMutation,
  useGetProductsQuery,
  CategoryStatus,
  ProductStatus,
} from '../api/catalogApi';

interface CategoryDetailsViewProps {
  categoryId: string;
}

export function CategoryDetailsView({ categoryId }: CategoryDetailsViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'subcategories' | 'seo' | 'activity'>('overview');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Products Tab Filter & Pagination State
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<ProductStatus | 'ALL'>('ALL');
  const [productPage, setProductPage] = useState(1);
  const productLimit = 10;

  const {
    data: category,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCategoryByIdQuery(categoryId);

  const {
    data: productsResponse,
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
  } = useGetProductsQuery(
    {
      categoryId,
      page: productPage,
      limit: productLimit,
      search: productSearch.trim() || undefined,
      status: productStatusFilter !== 'ALL' ? productStatusFilter : undefined,
    },
    { skip: !categoryId },
  );

  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const handleDelete = async () => {
    if (!category) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete category "${category.name}"? Products assigned to this category will be unlinked safely.`,
    );
    if (!confirmed) return;

    try {
      await deleteCategory(categoryId).unwrap();
      toast.success(`Category "${category.name}" deleted successfully.`);
      router.push('/dashboard/categories');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete category.');
    }
  };

  const handleDuplicate = () => {
    if (!category) return;
    router.push(`/dashboard/categories/create?parentId=${category.parentId || ''}&name=${encodeURIComponent(category.name + ' (Copy)')}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const day = d.getDate();
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strHours = String(hours).padStart(2, '0');
      return `${month} ${day}, ${year} ${strHours}:${minutes} ${ampm}`;
    } catch {
      return dateString;
    }
  };

  const getCategoryIconComponent = (name: string, slug: string) => {
    const lower = (name + ' ' + slug).toLowerCase();
    if (
      lower.includes('fashion') ||
      lower.includes('cloth') ||
      lower.includes('shirt') ||
      lower.includes('wear') ||
      lower.includes('apparel')
    ) {
      return Shirt;
    }
    if (
      lower.includes('electronic') ||
      lower.includes('gadget') ||
      lower.includes('phone') ||
      lower.includes('laptop') ||
      lower.includes('computer')
    ) {
      return Laptop;
    }
    if (lower.includes('home') || lower.includes('decor') || lower.includes('living')) {
      return Home;
    }
    if (lower.includes('beauty') || lower.includes('skin') || lower.includes('cosmetic')) {
      return Sparkles;
    }
    return FolderTree;
  };

  const renderStatusBadge = (status?: CategoryStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
            Active
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold">
            Draft
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            Archived
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
            Active
          </span>
        );
    }
  };

  const renderProductStatusBadge = (status?: ProductStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
            Active
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
            Draft
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
            Archived
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
            {status || '—'}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-slate-200 rounded-md" />
            <div className="h-7 w-64 bg-slate-200 rounded-md" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-slate-200 rounded-xl" />
            <div className="h-9 w-20 bg-slate-200 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-100 rounded-2xl" />
          <div className="space-y-6">
            <div className="h-28 bg-slate-100 rounded-2xl" />
            <div className="h-40 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !category) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">Category Not Found</h2>
          <p className="text-xs text-slate-500">
            The category you are looking for does not exist or you do not have permission to view it.
          </p>
        </div>
        <Link
          href="/dashboard/categories"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Categories</span>
        </Link>
      </div>
    );
  }

  const subcategories = category.subcategories || [];
  const displaySeoTitle = category.seoTitle || `${category.name} | EasyCommerce`;
  const displayMetaDescription =
    category.metaDescription ||
    (category.description
      ? category.description.slice(0, 160)
      : 'Explore products in this category at EasyCommerce. Premium quality with fast shipping.');

  const productsList = productsResponse?.data || [];
  const productsMeta = productsResponse?.meta || { total: 0, totalPages: 1, page: 1, limit: 10 };

  const CategoryIcon = getCategoryIconComponent(category.name, category.slug);

  const topProducts = productsList.slice(0, 3);

  const categoryBannerImage =
    category.image ||
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=900&auto=format&fit=crop';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {category.name}
            </h1>
            {renderStatusBadge(category.status)}
          </div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
            <Link href="/dashboard" className="hover:text-slate-600 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link href="/dashboard/categories" className="font-semibold text-slate-700 hover:text-blue-600 transition-colors">
              Categories
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-500 font-medium">{category.name}</span>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/dashboard/categories/${categoryId}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-blue-600" />
            <span>Edit Category</span>
          </Link>

          <button
            type="button"
            onClick={handleDuplicate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-blue-600" />
            <span>Duplicate</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu((v) => !v)}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <span>More</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showMoreMenu && (
              <div
                className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20 text-xs text-slate-700 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setShowMoreMenu(false)}
              >
                <Link
                  href={`/dashboard/categories/create?parentId=${categoryId}`}
                  className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Add Subcategory</span>
                </Link>
                <Link
                  href={`/dashboard/products/create?categoryId=${categoryId}`}
                  className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>Add Product</span>
                </Link>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleDelete();
                  }}
                  disabled={isDeleting}
                  className="w-full text-left flex items-center gap-2 px-3.5 py-2 hover:bg-rose-50 text-rose-600 font-medium disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Category</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
              <CategoryIcon className="w-10 h-10 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{category.name}</h2>
              <p className="text-xs text-slate-400 font-normal mt-0.5">/{category.slug}</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100/80 text-xs">
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-400 font-medium">Parent Category</span>
              <span className="font-medium text-slate-900">
                {category.parentCategory ? (
                  <Link
                    href={`/dashboard/categories/${category.parentCategory.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {category.parentCategory.name}
                  </Link>
                ) : (
                  '—'
                )}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-400 font-medium">Products</span>
              <span className="font-medium text-slate-900">{category.productsCount ?? 0}</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-400 font-medium">Subcategories</span>
              <span className="font-medium text-slate-900">{subcategories.length}</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-400 font-medium">Status</span>
              <span>{renderStatusBadge(category.status)}</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-400 font-medium">Created At</span>
              <span className="font-medium text-slate-900">{formatDate(category.createdAt)}</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-400 font-medium">Updated At</span>
              <span className="font-medium text-slate-900">{formatDate(category.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Description</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {category.description ||
                `${category.name} category contains all ${category.name.toLowerCase()} products including associated accessories, collections, and seasonal launches.`}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Category Image</h3>
            <div className="aspect-[2.4/1] w-full rounded-xl overflow-hidden relative border border-slate-100 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={categoryBannerImage}
                alt={category.name}
                className="w-full h-full object-cover"
              />
              <Link
                href={`/dashboard/categories/${categoryId}/edit`}
                className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-lg bg-white/95 shadow-md flex items-center justify-center text-blue-600 hover:bg-white transition-all"
                title="Edit Category Image"
              >
                <Pencil className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <div className="flex items-center gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Products ({category.productsCount ?? 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subcategories')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'subcategories'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Subcategories ({subcategories.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'seo'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            SEO
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'activity'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Activity
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 items-stretch">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4">Subcategories</h3>

              {subcategories.length > 0 ? (
                <div className="space-y-3.5">
                  {subcategories.slice(0, 3).map((sub: any) => {
                    const SubIcon = getCategoryIconComponent(sub.name, sub.slug);
                    return (
                      <div key={sub.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <SubIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dashboard/categories/${sub.id}`}
                            className="text-xs font-semibold text-slate-900 hover:text-blue-600 transition-colors block truncate"
                          >
                            {sub.name}
                          </Link>
                          <span className="text-[11px] text-slate-400">{sub.productsCount ?? 0} products</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-4">No subcategories created yet.</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('subcategories')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 pt-4 mt-auto"
            >
              <span>View all subcategories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4">Top Products</h3>

              {topProducts.length > 0 ? (
                <div className="space-y-3.5">
                  {topProducts.map((prod: any) => {
                    const primaryImg = prod.images?.find((img: any) => img.isPrimary) || prod.images?.[0];
                    return (
                      <div key={prod.id} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0 overflow-hidden text-slate-400">
                            {primaryImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={primaryImg.url} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4" />
                            )}
                          </div>
                          <span className="font-semibold text-slate-900 truncate max-w-[110px]" title={prod.name}>
                            {prod.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-600 font-medium">৳{Number(prod.basePrice || 0).toLocaleString()}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                            In Stock
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-4">No products assigned yet.</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 pt-4 mt-auto"
            >
              <span>View all products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4">Category Performance</h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Total Sales</span>
                  <span className="font-semibold text-slate-900">৳24,580.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Total Orders</span>
                  <span className="font-semibold text-slate-900">512</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Average Order Value</span>
                  <span className="font-semibold text-slate-900">৳47.99</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Conversion Rate</span>
                  <span className="font-semibold text-slate-900">3.24%</span>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard/net-profit"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 pt-4 mt-auto"
            >
              <span>View analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-4 pt-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductPage(1);
                  }}
                  placeholder="Search products in category..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <select
                value={productStatusFilter}
                onChange={(e) => {
                  setProductStatusFilter(e.target.value as any);
                  setProductPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Link
                href={`/dashboard/products/create?categoryId=${categoryId}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {isLoadingProducts ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-700">Loading products...</p>
              </div>
            ) : productsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Product</th>
                      <th className="py-3.5 px-4">SKU</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productsList.map((prod: any) => {
                      const primaryImg = prod.images?.find((img: any) => img.isPrimary) || prod.images?.[0];
                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                {primaryImg ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={primaryImg.url} alt={prod.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/dashboard/products/${prod.id}`}
                                  className="font-bold text-slate-900 hover:text-blue-600 transition-colors truncate block max-w-xs"
                                >
                                  {prod.name}
                                </Link>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{prod.sku || '—'}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">৳{Number(prod.basePrice || 0).toLocaleString()}</td>
                          <td className="py-3.5 px-4">{renderProductStatusBadge(prod.status)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <Link href={`/dashboard/products/${prod.id}/edit`} className="text-blue-600 font-bold hover:underline">Edit</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center space-y-4 px-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs border border-blue-100">
                  <Package className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">No products found</h3>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'subcategories' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Subcategories</h3>
              <p className="text-xs text-slate-500">Child categories organized under {category.name}.</p>
            </div>
            <Link
              href={`/dashboard/categories/create?parentId=${categoryId}`}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
            >
              + Add Subcategory
            </Link>
          </div>

          {subcategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subcategories.map((sub: any) => {
                const SubIcon = getCategoryIconComponent(sub.name, sub.slug);
                return (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <SubIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{sub.name}</h4>
                        <p className="text-[11px] font-mono text-slate-400">/{sub.slug}</p>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/categories/${sub.id}`}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              No subcategories nested under this category yet.
            </p>
          )}
        </div>
      )}

      {activeTab === 'seo' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 pt-2">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Search Engine Optimization (SEO)</h3>
              <p className="text-xs text-slate-400">Metadata configuration and Google search ranking preview.</p>
            </div>
            <Link
              href={`/dashboard/categories/${categoryId}/edit`}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-lg transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit SEO</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-slate-400 font-medium">Page Title Tag</span>
                <p className="font-bold text-slate-900">{displaySeoTitle}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-medium">Meta Description</span>
                <p className="text-slate-700 leading-relaxed">{displayMetaDescription}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-medium">Canonical URL</span>
                <p className="font-mono text-blue-600">https://easycommerce.com/categories/{category.slug}</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 font-medium">Search Engine Result Preview</span>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[9px] text-white font-bold">
                    E
                  </div>
                  <span className="text-[11px] text-slate-600 font-mono">
                    https://easycommerce.com/categories/{category.slug}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer truncate">
                  {displaySeoTitle}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {displayMetaDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center space-y-3 pt-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Activity Log</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Category created on {formatDate(category.createdAt)}. Last modified on {formatDate(category.updatedAt)}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
