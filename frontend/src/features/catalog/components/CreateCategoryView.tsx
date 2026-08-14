'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  FolderTree,
  Folder,
  ArrowLeft,
  Save,
  Globe,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Eye,
  EyeOff,
  UploadCloud,
  Tag,
  Shirt,
  ShoppingBag,
  Briefcase,
  Watch,
  Ticket,
  Footprints,
  Gift,
  Camera,
  Home,
  Laptop,
  SlidersHorizontal,
  Table,
  Code,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateCategoryMutation,
  useGetCategoriesQuery,
  CategoryStatus,
} from '../api/catalogApi';

type SectionTab = 'general' | 'seo' | 'display' | 'options';

const CATEGORY_ICONS = [
  { id: 'folder', name: 'Folder', icon: Folder },
  { id: 'tag', name: 'Tag', icon: Tag },
  { id: 'shirt', name: 'Shirt', icon: Shirt },
  { id: 'shopping-bag', name: 'Jacket', icon: ShoppingBag },
  { id: 'briefcase', name: 'Briefcase', icon: Briefcase },
  { id: 'watch', name: 'Watch', icon: Watch },
  { id: 'ticket', name: 'Ticket', icon: Ticket },
  { id: 'sparkles', name: 'Sparkles', icon: Sparkles },
  { id: 'footprints', name: 'Shoes', icon: Footprints },
  { id: 'gift', name: 'Gift', icon: Gift },
  { id: 'home', name: 'Home', icon: Home },
  { id: 'camera', name: 'Camera', icon: Camera },
];

export function CreateCategoryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParentId = searchParams.get('parentId') || '';
  const initialName = searchParams.get('name') || '';

  const [createCategory, { isLoading: isSubmitting }] = useCreateCategoryMutation();
  const { data: existingCategories = [] } = useGetCategoriesQuery();

  // Navigation Tab State
  const [activeSection, setActiveSection] = useState<SectionTab>('general');

  // General Form State
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [parentId, setParentId] = useState<string>(initialParentId);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<CategoryStatus>('ACTIVE');
  const [selectedIcon, setSelectedIcon] = useState('folder');

  // Media State
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // SEO State
  const [seoTitle, setSeoTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Display Settings State
  const [isVisible, setIsVisible] = useState(true);
  const [showInStorefront, setShowInStorefront] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(0);

  // Validation State
  const [errors, setErrors] = useState<{ name?: string; slug?: string; general?: string }>({});
  const [isDirty, setIsDirty] = useState(false);

  // Slug auto-generation helper
  const slugify = (text: string) => {
    if (!text || !text.trim()) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  useEffect(() => {
    if (!isSlugManual) {
      setSlug(slugify(name));
    }
  }, [name, isSlugManual]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setIsDirty(true);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setIsSlugManual(true);
    setIsDirty(true);
    if (errors.slug) {
      setErrors((prev) => ({ ...prev, slug: undefined }));
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImage(dataUrl);
      setImagePreview(dataUrl);
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors: { name?: string; slug?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Category name is required';
    }
    if (!slug.trim()) {
      newErrors.slug = 'Category URL slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      newErrors.slug = 'Slug must only contain lowercase letters, numbers, and hyphens (e.g. mens-fashion)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve validation errors before saving.');
      setActiveSection('general');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        parentId: parentId || null,
        description: description.trim() || undefined,
        status,
        icon: selectedIcon || undefined,
        image: image || undefined,
        seoTitle: seoTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        isVisible,
        showInStorefront,
        isFeatured,
        sortOrder: Number(sortOrder) || 0,
      };

      const result = await createCategory(payload).unwrap();
      toast.success(`Category "${result.name}" created successfully!`);
      setIsDirty(false);
      router.push('/dashboard/categories');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to create category';
      if (err?.status === 409 || message.toLowerCase().includes('already exists')) {
        setErrors({ slug: 'This URL slug is already taken. Please choose another one.' });
        setActiveSection('general');
      } else {
        setErrors({ general: message });
      }
      toast.error(message);
    }
  };

  const displaySeoTitle = seoTitle.trim() || (name.trim() ? `${name.trim()} | EasyCommerce` : 'Category Title | EasyCommerce');
  const displaySeoSlug = slug.trim() || slugify(name) || 'category-slug';
  const displayMetaDescription =
    metaDescription.trim() ||
    (description.trim()
      ? description.trim().slice(0, 160)
      : 'Explore products in this category at EasyCommerce. Premium quality with fast shipping.');

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Create Category
          </h1>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
            <Link href="/dashboard" className="hover:text-slate-600 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link href="/dashboard/categories" className="hover:text-slate-600 transition-colors">
              Categories
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-700 font-semibold">Create Category</span>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (!isDirty || confirm('Are you sure you want to discard unsaved changes?')) {
                router.push('/dashboard/categories');
              }
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-xs"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Category</span>
            )}
          </button>
        </div>
      </div>

      {/* Global Error Alert */}
      {errors.general && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* 2. MAIN LAYOUT: SIDEBAR TABS (LEFT) + WHITE FORM CONTAINER (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT VERTICAL NAVIGATION TABS */}
        <div className="lg:col-span-3 space-y-2">
          <button
            type="button"
            onClick={() => setActiveSection('general')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all text-left ${
              activeSection === 'general'
                ? 'bg-blue-50 text-blue-600 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                activeSection === 'general' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Folder className="w-4 h-4" />
            </div>
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('seo')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all text-left ${
              activeSection === 'seo'
                ? 'bg-blue-50 text-blue-600 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                activeSection === 'seo' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Globe className="w-4 h-4" />
            </div>
            <span>SEO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('display')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all text-left ${
              activeSection === 'display'
                ? 'bg-blue-50 text-blue-600 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                activeSection === 'display' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Sliders className="w-4 h-4" />
            </div>
            <span>Display</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('options')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all text-left ${
              activeSection === 'options'
                ? 'bg-blue-50 text-blue-600 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                activeSection === 'options' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <span>More Options</span>
          </button>
        </div>

        {/* RIGHT MAIN WHITE CARD FORM CONTAINER */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          {/* GENERAL TAB CONTENT */}
          {activeSection === 'general' && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-slate-900">General Information</h2>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Inputs Column */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Category Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Category Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={handleNameChange}
                      placeholder="e.g. Men's Fashion"
                      className={`w-full px-3.5 py-2 bg-white border ${
                        errors.name ? 'border-rose-400 ring-1 ring-rose-200' : 'border-slate-200'
                      } rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                    />
                    {errors.name && <p className="text-[11px] font-medium text-rose-600">{errors.name}</p>}
                  </div>

                  {/* Parent Category */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Parent Category</label>
                    <select
                      value={parentId}
                      onChange={(e) => {
                        setParentId(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">-- None (Root Level Category) --</option>
                      {existingCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.parentId ? `— ${c.name}` : c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Slug */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Slug <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={handleSlugChange}
                      placeholder="mens-fashion"
                      className={`w-full px-3.5 py-2 bg-white border ${
                        errors.slug ? 'border-rose-400 ring-1 ring-rose-200' : 'border-slate-200'
                      } rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                    />
                    <p className="text-[11px] text-slate-400 font-mono">
                      https://mystore.com/category/{slug || 'category-slug'}
                    </p>
                    {errors.slug && <p className="text-[11px] font-medium text-rose-600">{errors.slug}</p>}
                  </div>

                  {/* Description with formatting toolbar */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Description</label>
                    <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                      {/* Rich Editor Toolbar */}
                      <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center gap-2 text-slate-600 flex-wrap">
                        <button type="button" className="p-1 hover:bg-slate-200/70 rounded text-slate-700" title="Bold">
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" className="p-1 hover:bg-slate-200/70 rounded text-slate-700" title="Italic">
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" className="p-1 hover:bg-slate-200/70 rounded text-slate-700" title="Underline">
                          <Underline className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-px h-4 bg-slate-300" />
                        <button type="button" className="p-1 hover:bg-slate-200/70 rounded text-slate-700" title="Link">
                          <Link2 className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" className="p-1 hover:bg-slate-200/70 rounded text-slate-700" title="Bullet List">
                          <List className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" className="p-1 hover:bg-slate-200/70 rounded text-slate-700" title="Numbered List">
                          <ListOrdered className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" className="p-1 hover:bg-slate-200/70 rounded text-slate-700" title="Table">
                          <Table className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" className="p-1 hover:bg-slate-200/70 rounded text-slate-700" title="Code">
                          <Code className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Men's fashion includes all types of clothing, shoes, accessories and essentials for men."
                        className="w-full p-3 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none resize-y"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Status</label>
                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value as CategoryStatus);
                        setIsDirty(true);
                      }}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Right Image & Icon Picker Column */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Category Image Upload Dropzone */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Category Image</label>

                    {imagePreview ? (
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="Category" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setImage(null);
                            setImagePreview(null);
                            setIsDirty(true);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-all shadow-md"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-xl transition-all cursor-pointer text-center">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 mt-2.5">Upload category image</span>
                        <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG or WebP</span>
                        <span className="text-[11px] text-slate-400">Recommended 800x800px</span>
                        <input type="file" accept="image/*" onChange={handleImageFileSelect} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* 4x3 Icon Picker Grid */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Category Icon</label>
                    <div className="grid grid-cols-4 gap-2.5 p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                      {CATEGORY_ICONS.map((item) => {
                        const IconComponent = item.icon;
                        const isSelected = selectedIcon === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedIcon(item.id);
                              setIsDirty(true);
                            }}
                            className={`aspect-square rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs scale-105'
                                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                            }`}
                            title={item.name}
                          >
                            <IconComponent className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEO TAB CONTENT */}
          {activeSection === 'seo' && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-slate-900">Search Engine Optimization (SEO)</h2>

              <div className="space-y-4 max-w-2xl">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">Page Title Tag</label>
                    <span className="text-[11px] text-slate-400">{seoTitle.length}/70</span>
                  </div>
                  <input
                    type="text"
                    maxLength={70}
                    value={seoTitle}
                    onChange={(e) => {
                      setSeoTitle(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder={`${name || 'Category'} | EasyCommerce`}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">Meta Description</label>
                    <span className="text-[11px] text-slate-400">{metaDescription.length}/160</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={160}
                    value={metaDescription}
                    onChange={(e) => {
                      setMetaDescription(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Provide a concise description for search engine ranking..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
                  />
                </div>

                {/* Google Search Result Preview */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-700">Google Search Result Preview</span>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[9px] text-white font-bold">
                        E
                      </div>
                      <span className="text-[11px] text-slate-600 font-mono">
                        https://easycommerce.com/categories/{displaySeoSlug}
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

          {/* DISPLAY TAB CONTENT */}
          {activeSection === 'display' && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-slate-900">Display & Storefront Visibility</h2>

              <div className="space-y-4 max-w-2xl text-xs">
                {/* Storefront Visibility Toggle */}
                <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">Storefront Visibility</h4>
                    <p className="text-slate-500 text-[11px]">Make this category accessible in customer browsing.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => {
                      setIsVisible(e.target.checked);
                      setIsDirty(true);
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Featured Category Toggle */}
                <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">Featured Category</h4>
                    <p className="text-slate-500 text-[11px]">Highlight this category on homepage banners and collections.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => {
                      setIsFeatured(e.target.checked);
                      setIsDirty(true);
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Show in Navigation Toggle */}
                <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">Show in Header Navigation</h4>
                    <p className="text-slate-500 text-[11px]">Include in top category navbar menu.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showInStorefront}
                    onChange={(e) => {
                      setShowInStorefront(e.target.checked);
                      setIsDirty(true);
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Sort Order */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-semibold text-slate-700">Sort Order Priority</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(Number(e.target.value));
                      setIsDirty(true);
                    }}
                    placeholder="0"
                    className="w-32 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-400">Lower numbers appear first among sibling categories.</p>
                </div>
              </div>
            </div>
          )}

          {/* MORE OPTIONS TAB CONTENT */}
          {activeSection === 'options' && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-slate-900">Advanced Options</h2>
              <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                <SlidersHorizontal className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Additional Settings</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Custom category tags, attributes, and automation rules can be configured here once activated.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
