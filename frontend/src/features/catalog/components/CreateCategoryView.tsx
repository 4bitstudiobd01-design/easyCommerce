'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Table,
  Code,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateCategoryMutation,
  useGetCategoriesQuery,
  CategoryStatus,
} from '../api/catalogApi';
import { CATEGORY_ICON_OPTIONS } from '../utils/categoryIcons';
import { FileUpload } from '@/components/ui/FileUpload';

type SectionTab = 'general' | 'seo' | 'display';

export function CreateCategoryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParentId = searchParams.get('parentId') || '';
  const initialName = searchParams.get('name') || '';

  const [createCategory, { isLoading: isSubmitting }] = useCreateCategoryMutation();
  const { data: existingCategories = [] } = useGetCategoriesQuery();

  // Active section is derived from scroll position (for sidebar highlight),
  // sidebar clicks scroll the page to the matching section instead of switching tabs.
  const [activeSection, setActiveSection] = useState<SectionTab>('general');
  const sectionRefs = {
    general: useRef<HTMLDivElement>(null),
    seo: useRef<HTMLDivElement>(null),
    display: useRef<HTMLDivElement>(null),
  };

  const scrollToSection = (section: SectionTab) => {
    setActiveSection(section);
    sectionRefs[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Keep the sidebar highlight in sync when the user scrolls the page manually,
  // not just when they click a sidebar item.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) {
          const section = (Object.keys(sectionRefs) as SectionTab[]).find(
            (key) => sectionRefs[key].current === visible.target,
          );
          if (section) setActiveSection(section);
        }
      },
      { rootMargin: '-100px 0px -70% 0px', threshold: 0 },
    );

    (Object.keys(sectionRefs) as SectionTab[]).forEach((key) => {
      const el = sectionRefs[key].current;
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // General Form State
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [parentId, setParentId] = useState<string>(initialParentId);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<CategoryStatus>('ACTIVE');
  const [selectedIcon, setSelectedIcon] = useState('folder');

  // Media State — holds the hosted image URL returned by the upload endpoint, never
  // a base64 string (that overflows the request-size limit on category create).
  const [image, setImage] = useState<string | null>(null);

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
      scrollToSection('general');
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
        scrollToSection('general');
      } else {
        setErrors({ general: message });
      }
      toast.error(message);
    }
  };

  const displaySeoTitle = seoTitle.trim() || (name.trim() ? `${name.trim()} | BitCommerce` : 'Category Title | BitCommerce');
  const displaySeoSlug = slug.trim() || slugify(name) || 'category-slug';
  const displayMetaDescription =
    metaDescription.trim() ||
    (description.trim()
      ? description.trim().slice(0, 160)
      : 'Explore products in this category at BitCommerce. Premium quality with fast shipping.');

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full pb-16">
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
        {/* LEFT VERTICAL NAVIGATION TABS — sticky so it stays visible while the form scrolls */}
        <div className="lg:col-span-2 space-y-2 lg:sticky lg:top-24 self-start">
          <button
            type="button"
            onClick={() => scrollToSection('general')}
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
            onClick={() => scrollToSection('seo')}
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
            onClick={() => scrollToSection('display')}
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
        </div>

        {/* RIGHT MAIN WHITE CARD FORM CONTAINER — all sections stacked, scrollable in one page */}
        <div className="lg:col-span-10 bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
          {/* GENERAL SECTION */}
          <div ref={sectionRefs.general} className="space-y-6 p-6 sm:p-8 scroll-mt-24">
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
                  {/* Category Image Upload */}
                  <FileUpload
                    label="Category Image"
                    description="PNG, JPG or WebP — recommended 800x800px"
                    value={image}
                    onChange={(url) => {
                      setImage(url);
                      setIsDirty(true);
                    }}
                    fileableType="CATEGORY"
                    previewShape="square"
                  />

                  {/* 4x3 Icon Picker Grid */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Category Icon</label>
                    <div className="grid grid-cols-4 gap-2.5 p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                      {CATEGORY_ICON_OPTIONS.map((item) => {
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

          {/* SEO SECTION */}
          <div ref={sectionRefs.seo} className="space-y-6 p-6 sm:p-8 scroll-mt-24">
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
                    placeholder={`${name || 'Category'} | BitCommerce`}
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
                        https://bitcommerce.com/categories/{displaySeoSlug}
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

          {/* DISPLAY SECTION */}
          <div ref={sectionRefs.display} className="space-y-6 p-6 sm:p-8 scroll-mt-24">
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
        </div>
      </div>
    </form>
  );
}
