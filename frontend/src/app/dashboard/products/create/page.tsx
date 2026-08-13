'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetProductByIdQuery,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useCreateBrandMutation,
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useGetCategoryAttributesQuery,
  useSetProductAttributesMutation,
  ProductType,
  ProductStatus,
  TaxCategory,
  ProductDiscountType,
  WeightUnit,
  DimensionUnit,
  DigitalDeliveryType,
  ServiceDeliveryType,
  ServiceDurationUnit,
} from '@/features/catalog/api/catalogApi';
import { ProductMediaGallery } from '@/features/catalog/components/ProductMediaGallery';
import { DynamicAttributeField } from '@/features/catalog/components/DynamicAttributeField';
import { ProductVariantMatrix } from '@/features/catalog/components/ProductVariantMatrix';
import { ProductFulfillmentConfig } from '@/features/catalog/components/ProductFulfillmentConfig';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { Package, Save, Globe, Layers, AlertCircle, Loader2, FolderTree, Plus, Sliders, DollarSign, Percent, TrendingUp, Boxes, Barcode, ChevronRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: store } = useGetMyStoreQuery();
  const storeCurrency = store?.currency || 'BDT';
  const currencySymbol = storeCurrency === 'BDT' ? '৳' : storeCurrency === 'USD' ? '$' : '€';

  // One form serves three modes. Editing updates the product in place; duplicating
  // preloads the same fields but saves a brand new product, so the source is untouched.
  const editId = searchParams.get('edit') || '';
  const duplicateId = searchParams.get('duplicate') || '';
  const sourceId = editId || duplicateId;
  const isEditMode = Boolean(editId);
  const isDuplicateMode = Boolean(duplicateId);

  const { data: sourceProduct, isLoading: isLoadingSource } = useGetProductByIdQuery(sourceId, {
    skip: !sourceId,
  });

  const [createProduct, { isLoading }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [setProductAttributes] = useSetProductAttributesMutation();

  // Organization queries
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brands = [] } = useGetBrandsQuery();
  const { data: collections = [] } = useGetCollectionsQuery();

  const [createBrand, { isLoading: isCreatingBrand }] = useCreateBrandMutation();
  const [createCollection, { isLoading: isCreatingCollection }] = useCreateCollectionMutation();

  // Basic & Status Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState<ProductType>('PHYSICAL');
  const [status, setStatus] = useState<ProductStatus>('DRAFT');
  const [customSlug, setCustomSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [localImages, setLocalImages] = useState<{ url: string; altText?: string; isPrimary?: boolean }[]>([]);

  // Inventory & Stock State (Chunk 8 Integration)
  const [hasVariants, setHasVariants] = useState<boolean>(false);
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [trackInventory, setTrackInventory] = useState<boolean>(true);
  const [allowBackorder, setAllowBackorder] = useState<boolean>(false);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [initialStock, setInitialStock] = useState<number | ''>('');

  // Pricing, Tax & Discount State (Chunk 7 Integration)
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [compareAtPrice, setCompareAtPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [taxRate, setTaxRate] = useState<number>(15);
  const [isTaxInclusive, setIsTaxInclusive] = useState<boolean>(false);
  const [taxCategory, setTaxCategory] = useState<TaxCategory>('STANDARD_VAT');

  const [discountType, setDiscountType] = useState<ProductDiscountType>('NONE');
  const [discountValue, setDiscountValue] = useState<number | ''>('');
  const [discountStartsAt, setDiscountStartsAt] = useState('');
  const [discountEndsAt, setDiscountEndsAt] = useState('');
  // Shipping & Fulfillment State (Chunk 10 Integration)
  const [shippingRequired, setShippingRequired] = useState<boolean>(true);
  const [weight, setWeight] = useState<number | ''>('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('KG');
  const [length, setLength] = useState<number | ''>('');
  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>('CM');
  const [shippingProfileId, setShippingProfileId] = useState<string>('');
  const [isFragile, setIsFragile] = useState<boolean>(false);

  const [digitalDeliveryType, setDigitalDeliveryType] = useState<DigitalDeliveryType>('DOWNLOAD');
  const [digitalAssetUrl, setDigitalAssetUrl] = useState<string>('');
  const [downloadLimit, setDownloadLimit] = useState<number | ''>('');
  const [downloadExpiryDays, setDownloadExpiryDays] = useState<number | ''>('');

  const [serviceDeliveryType, setServiceDeliveryType] = useState<ServiceDeliveryType>('ONLINE');
  const [serviceDuration, setServiceDuration] = useState<number | ''>('');
  const [serviceDurationUnit, setServiceDurationUnit] = useState<ServiceDurationUnit>('MINUTES');

  // Category Attribute query
  const { data: categoryAttributes = [] } = useGetCategoryAttributesQuery(categoryId, {
    skip: !categoryId,
  });

  // Attribute values state map: attributeId -> value
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({});

  // Inline Creation Form States
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const isBusy = isLoading || isUpdating;

  // Left-hand section navigation. Sections stay on one scrolling page (rather than
  // becoming steps) so nothing is hidden behind a wizard and the merchant can jump
  // straight to the part they came to change — important in edit mode.
  const [activeSection, setActiveSection] = useState('general');

  const formSections = [
    { id: 'general', label: 'General' },
    { id: 'media', label: 'Media' },
    { id: 'organization', label: 'Organization' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'variants', label: 'Variants' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'more', label: 'More Options' },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Highlight whichever section is currently in view while scrolling.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id.replace('section-', ''));
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 },
    );

    formSections.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productType, trackInventory, hasVariants]);

  // Prefill from the source product exactly once. Re-running on every cache update
  // would overwrite whatever the merchant is currently typing.
  useEffect(() => {
    if (!sourceProduct || hasPrefilled) return;

    setName(isDuplicateMode ? `${sourceProduct.name || sourceProduct.title || ''} (Copy)` : sourceProduct.name || sourceProduct.title || '');
    setDescription(sourceProduct.description || '');
    setProductType(sourceProduct.productType || 'PHYSICAL');
    // A duplicate always starts as a draft so a half-finished copy cannot go live.
    setStatus(isDuplicateMode ? 'DRAFT' : sourceProduct.status || 'DRAFT');
    // Slug and SKU are unique per tenant, so a copy must not reuse the originals.
    setCustomSlug(isDuplicateMode ? '' : sourceProduct.slug || '');
    setSku(isDuplicateMode ? '' : sourceProduct.sku || '');
    setBarcode(isDuplicateMode ? '' : sourceProduct.barcode || '');

    setCategoryId(sourceProduct.categoryId || '');
    setBrandId(sourceProduct.brandId || '');
    setSelectedCollectionIds((sourceProduct.collections || []).map((c) => c.id));
    setLocalImages(
      (sourceProduct.images || []).map((img) => ({
        url: img.url,
        altText: img.altText,
        isPrimary: img.isPrimary,
      })),
    );

    setHasVariants(Boolean(sourceProduct.hasVariants));
    setTrackInventory(sourceProduct.trackInventory ?? true);
    setAllowBackorder(Boolean(sourceProduct.allowBackorder));
    setLowStockThreshold(sourceProduct.lowStockThreshold ?? 10);

    setBasePrice(sourceProduct.basePrice ?? '');
    setCompareAtPrice(sourceProduct.compareAtPrice ?? '');
    setCostPrice(sourceProduct.costPrice ?? '');
    setTaxRate(sourceProduct.taxRate ?? 15);
    setIsTaxInclusive(Boolean(sourceProduct.isTaxInclusive));
    setTaxCategory(sourceProduct.taxCategory || 'STANDARD_VAT');

    setDiscountType(sourceProduct.discountType || 'NONE');
    setDiscountValue(sourceProduct.discountValue ?? '');
    setDiscountStartsAt(sourceProduct.discountStartsAt?.slice(0, 10) || '');
    setDiscountEndsAt(sourceProduct.discountEndsAt?.slice(0, 10) || '');

    setShippingRequired(sourceProduct.shippingRequired ?? true);
    setWeight(sourceProduct.weight ?? '');
    setWeightUnit(sourceProduct.weightUnit || 'KG');
    setLength(sourceProduct.length ?? '');
    setWidth(sourceProduct.width ?? '');
    setHeight(sourceProduct.height ?? '');
    setDimensionUnit(sourceProduct.dimensionUnit || 'CM');
    setShippingProfileId(sourceProduct.shippingProfileId || '');
    setIsFragile(Boolean(sourceProduct.isFragile));

    setDigitalDeliveryType(sourceProduct.digitalDeliveryType || 'DOWNLOAD');
    setDigitalAssetUrl(sourceProduct.digitalAssetUrl || '');
    setDownloadLimit(sourceProduct.downloadLimit ?? '');
    setDownloadExpiryDays(sourceProduct.downloadExpiryDays ?? '');

    setServiceDeliveryType(sourceProduct.serviceDeliveryType || 'ONLINE');
    setServiceDuration(sourceProduct.serviceDuration ?? '');
    setServiceDurationUnit(sourceProduct.serviceDurationUnit || 'MINUTES');

    const existingAttributes: Record<string, any> = {};
    (sourceProduct.attributeValues || []).forEach((av) => {
      existingAttributes[av.attributeId] = av.value;
    });
    setAttributeValues(existingAttributes);

    setHasPrefilled(true);
  }, [sourceProduct, hasPrefilled, isDuplicateMode]);

  // Live Pricing Calculations
  const numericBasePrice = Number(basePrice) || 0;
  const numericCompareAt = Number(compareAtPrice) || 0;
  const numericCostPrice = Number(costPrice) || 0;
  const numericDiscountVal = Number(discountValue) || 0;

  let effectivePrice = numericBasePrice;
  if (discountType === 'PERCENTAGE' && numericDiscountVal > 0) {
    effectivePrice = Math.max(0, numericBasePrice * (1 - numericDiscountVal / 100));
  } else if (discountType === 'FIXED' && numericDiscountVal > 0) {
    effectivePrice = Math.max(0, numericBasePrice - numericDiscountVal);
  }
  effectivePrice = Math.round((effectivePrice + Number.EPSILON) * 100) / 100;

  const profitAmount = numericCostPrice > 0 ? Math.round((effectivePrice - numericCostPrice) * 100) / 100 : 0;
  const marginPercent = effectivePrice > 0 && numericCostPrice > 0
    ? Math.round(((effectivePrice - numericCostPrice) / effectivePrice) * 10000) / 100
    : 0;

  // Auto-derived slug preview
  const slugPreview = customSlug
    ? customSlug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product-slug';

  const handleAddBrandInline = async () => {
    if (!newBrandName.trim()) return;
    try {
      const created = await createBrand({ name: newBrandName.trim() }).unwrap();
      setBrandId(created.id);
      setNewBrandName('');
      setShowAddBrand(false);
      toast.success(`Brand "${created.name}" created`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create brand');
    }
  };

  const handleAddCollectionInline = async () => {
    if (!newCollectionName.trim()) return;
    try {
      const created = await createCollection({ name: newCollectionName.trim() }).unwrap();
      setSelectedCollectionIds((prev) => [...prev, created.id]);
      setNewCollectionName('');
      setShowAddCollection(false);
      toast.success(`Collection "${created.name}" created`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create collection');
    }
  };

  const toggleCollectionSelect = (id: string) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleAttributeChange = (attributeId: string, value: any) => {
    setAttributeValues((prev) => ({
      ...prev,
      [attributeId]: value,
    }));
  };

  const handleFormSubmit = async (targetStatus: ProductStatus) => {
    setErrorMsg('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Product Name is required.');
      return;
    }

    if (discountStartsAt && discountEndsAt && new Date(discountEndsAt) <= new Date(discountStartsAt)) {
      setErrorMsg('Discount schedule end date must be after start date.');
      return;
    }

    try {
      const payload = {
        name: trimmedName,
        description: description.trim() || undefined,
        productType,
        status: targetStatus,
        slug: customSlug.trim() || undefined,
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        trackInventory,
        allowBackorder,
        lowStockThreshold,
        initialStock: initialStock !== '' ? Number(initialStock) : undefined,
        basePrice: numericBasePrice,
        compareAtPrice: numericCompareAt > 0 ? numericCompareAt : undefined,
        costPrice: numericCostPrice > 0 ? numericCostPrice : undefined,
        taxRate,
        isTaxInclusive,
        taxCategory,
        discountType,
        discountValue: numericDiscountVal,
        discountStartsAt: discountStartsAt || undefined,
        discountEndsAt: discountEndsAt || undefined,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
        collectionIds: selectedCollectionIds.length > 0 ? selectedCollectionIds : undefined,
        images: localImages.length > 0 ? localImages : undefined,
        // Fulfillment Fields (Chunk 10)
        shippingRequired,
        weight: weight !== '' ? Number(weight) : undefined,
        weightUnit,
        length: length !== '' ? Number(length) : undefined,
        width: width !== '' ? Number(width) : undefined,
        height: height !== '' ? Number(height) : undefined,
        dimensionUnit,
        shippingProfileId: shippingProfileId || undefined,
        isFragile,
        digitalDeliveryType,
        digitalAssetUrl: digitalAssetUrl.trim() || undefined,
        downloadLimit: downloadLimit !== '' ? Number(downloadLimit) : undefined,
        downloadExpiryDays: downloadExpiryDays !== '' ? Number(downloadExpiryDays) : undefined,
        serviceDeliveryType,
        serviceDuration: serviceDuration !== '' ? Number(serviceDuration) : undefined,
        serviceDurationUnit,
      };

      // Editing updates in place; creating and duplicating both produce a new product.
      const savedProduct = isEditMode
        ? await updateProduct({ id: editId, ...payload }).unwrap()
        : await createProduct(payload).unwrap();

      // Save custom attribute values if provided
      const attributeEntries = Object.entries(attributeValues).filter(
        ([_, val]) => val !== undefined && val !== null && val !== '',
      );

      if (attributeEntries.length > 0) {
        await setProductAttributes({
          productId: savedProduct.id,
          attributes: attributeEntries.map(([attributeId, value]) => ({ attributeId, value })),
        }).unwrap();
      }

      if (isEditMode) {
        toast.success('Product updated successfully!');
      } else if (targetStatus === 'ACTIVE') {
        toast.success('Product published successfully!');
      } else {
        toast.success('Product saved as draft.');
      }

      // After an edit, return to the product being viewed rather than the list.
      router.push(isEditMode ? `/dashboard/products/${editId}` : '/dashboard/products');
    } catch (err: any) {
      const fallback = isEditMode
        ? 'Failed to update product. Please review your input and try again.'
        : 'Failed to create product. Please review your input and try again.';
      setErrorMsg(err?.data?.message || fallback);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 pb-16">
      {/* Top Header & Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isEditMode ? 'Edit Product' : isDuplicateMode ? 'Duplicate Product' : 'Create Product'}
          </h1>
          <nav aria-label="Breadcrumb" className="mt-1">
            <ol className="flex items-center gap-1 text-xs text-slate-500">
              <li>
                <Link href="/dashboard" className="hover:text-slate-700 font-medium transition-colors">
                  Dashboard
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </li>
              <li>
                <Link href="/dashboard/products" className="hover:text-slate-700 font-medium transition-colors">
                  Products
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </li>
              <li className="font-semibold text-slate-700" aria-current="page">
                {isEditMode ? 'Edit Product' : isDuplicateMode ? 'Duplicate Product' : 'Create Product'}
              </li>
            </ol>
          </nav>
          {isDuplicateMode && (
            <p className="text-xs text-slate-500 mt-1.5">
              Saved as a new draft product — give the copy its own SKU and slug before publishing.
            </p>
          )}
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isEditMode ? (
            <>
              <Link
                href={`/dashboard/products/${editId}`}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <span>Cancel</span>
              </Link>

              <button
                type="button"
                onClick={() => handleFormSubmit(status)}
                disabled={isBusy}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/dashboard/products"
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <span>Cancel</span>
              </Link>

              <button
                type="button"
                onClick={() => handleFormSubmit('DRAFT')}
                disabled={isBusy}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Save className="w-4 h-4 text-slate-500" />}
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormSubmit('ACTIVE')}
                disabled={isBusy}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Globe className="w-4 h-4" />}
                <span>Publish Product</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading the source product for edit/duplicate */}
      {sourceId && isLoadingSource && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-800 text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Loading product details…</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs font-medium shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Validation Error: </span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* 4-Column Responsive Layout: nav · form · summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Section navigation */}
        <nav
          aria-label="Product form sections"
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-2 lg:sticky lg:top-4"
        >
          <ul className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-none">
            {formSections.map((s) => (
              <li key={s.id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  aria-current={activeSection === s.id}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    activeSection === s.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main form column */}
        <div className="lg:col-span-7 space-y-5">
          {/* Basic Information Card */}
          <div id="section-general" className="scroll-mt-24 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Basic Information</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Essential product identity and details</p>
            </div>

            {/* Product Name */}
            <div>
              <label htmlFor="product-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="product-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Premium Cotton Shirt"
                maxLength={255}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">A clear, descriptive name used across storefront catalog and invoices.</p>
            </div>

            {/* Product Description */}
            <div>
              <label htmlFor="product-description" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Description
              </label>
              <textarea
                id="product-description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write detailed information about the product features, usage, specs, or highlights..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">Provide detailed specifications or features for customer guidance.</p>
            </div>
          </div>

          {/* Inventory & Stock Management Card (Chunk 8 Integration) */}
          <div id="section-inventory" className="scroll-mt-24 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-blue-600" />
                  <span>Inventory, SKU & Stock Management</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage stock tracking, SKU, barcode, and initial stock quantities</p>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={trackInventory}
                  onChange={(e) => setTrackInventory(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-800">Track Inventory</span>
              </label>
            </div>

            {/* SKU & Barcode Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. TS-BLK-001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Store-unique identifier code</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5 text-slate-400" />
                  <span>Barcode (UPC / EAN / GTIN)</span>
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g. 8940001234567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Optional product barcode number</p>
              </div>
            </div>

            {/* Stock Quantities Row (If Track Inventory Enabled) */}
            {trackInventory && (
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Initial Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="100"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Initial physical stock count on creation</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Triggers Low Stock status when stock &le; threshold</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowBackorder}
                      onChange={(e) => setAllowBackorder(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Allow customers to purchase when out of stock (Allow Backorders)
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Pricing, Tax & Discount Configuration Card (Chunk 7 Integration) */}
          <div id="section-pricing" className="scroll-mt-24 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span>Pricing, Tax & Discount Configuration</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Set price points, tax classification, and scheduled product discounts</p>
              </div>

              <span className="px-2.5 py-1 bg-slate-100 border text-slate-700 rounded-lg text-xs font-mono font-bold">
                {storeCurrency} ({currencySymbol})
              </span>
            </div>

            {/* 3 Price Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Base Price */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Selling Price ({currencySymbol}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value !== '' ? Number(e.target.value) : '')}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Customer base selling price</p>
              </div>

              {/* Compare-at Price */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Compare-at ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Original strike-through price</p>
              </div>

              {/* Cost Price */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Cost Price ({currencySymbol})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Internal</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Merchant cost per unit</p>
              </div>
            </div>

            {/* Profit & Margin Live Preview */}
            {numericCostPrice > 0 && numericBasePrice > 0 && (
              <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Estimated Merchant Profit:</span>
                  <span className="font-extrabold">{currencySymbol}{profitAmount.toLocaleString()}</span>
                </div>
                <div className="font-bold bg-blue-100 px-2.5 py-1 rounded-lg text-blue-800 text-[11px]">
                  {marginPercent}% Margin
                </div>
              </div>
            )}

            {/* Tax Settings */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tax Classification
                </label>
                <select
                  value={taxCategory}
                  onChange={(e) => setTaxCategory(e.target.value as TaxCategory)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="STANDARD_VAT">Standard VAT (15%)</option>
                  <option value="REDUCED">Reduced Rate (5%)</option>
                  <option value="ZERO_RATED">Zero Rated (0%)</option>
                  <option value="EXEMPT">Tax Exempt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTaxInclusive}
                    onChange={(e) => setIsTaxInclusive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Selling Price already includes tax (Tax Inclusive)
                  </span>
                </label>
              </div>
            </div>

            {/* Discount Configuration */}
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-blue-600" />
                <span>Product Sale / Discount Configuration</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as ProductDiscountType)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="NONE">No Discount</option>
                    <option value="PERCENTAGE">Percentage (%) Off</option>
                    <option value="FIXED">Fixed Amount ({currencySymbol}) Off</option>
                  </select>
                </div>

                {discountType !== 'NONE' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Discount Value {discountType === 'PERCENTAGE' ? '(%)' : `(${currencySymbol})`}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value !== '' ? Number(e.target.value) : '')}
                      placeholder={discountType === 'PERCENTAGE' ? '10' : '200'}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {discountType !== 'NONE' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Schedule Start Datetime (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={discountStartsAt}
                      onChange={(e) => setDiscountStartsAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Schedule End Datetime (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={discountEndsAt}
                      onChange={(e) => setDiscountEndsAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Media & Gallery Card (Chunk 4 Integration) */}
          <div id="section-media" className="scroll-mt-24">
            <ProductMediaGallery
              localImages={localImages}
              onLocalImagesChange={setLocalImages}
            />
          </div>

          {/* Product Attributes & Custom Fields Card (Chunk 6 Integration) */}
          <div id="section-more" className="scroll-mt-24 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Product Attributes & Custom Fields</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {categoryId
                    ? 'Configure category-specific attributes and custom specifications'
                    : 'Select a Category in the sidebar to configure category-scoped attributes'}
                </p>
              </div>

              <Link
                href="/dashboard/products/attributes"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Manage Attributes</span>
              </Link>
            </div>

            {!categoryId ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                Select a category under <strong>Product Organization</strong> to configure category-scoped custom fields (e.g. RAM, Storage, Color, Size, Material).
              </div>
            ) : categoryAttributes.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                No attributes configured for this category yet.{' '}
                <Link href="/dashboard/products/attributes" className="text-blue-600 font-bold hover:underline">
                  Create attributes now
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categoryAttributes.map((attr) => (
                  <DynamicAttributeField
                    key={attr.id}
                    attribute={attr}
                    value={attributeValues[attr.id]}
                    onChange={(val) => handleAttributeChange(attr.id, val)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Variants Card (Chunk 9 Integration) */}
          <div id="section-variants" className="scroll-mt-24">
          <ProductVariantMatrix
            hasVariants={hasVariants}
            onHasVariantsChange={setHasVariants}
            basePrice={numericBasePrice}
            currencySymbol={currencySymbol}
          />
          </div>

          {/* Shipping & Fulfillment Configuration Card (Chunk 10 Integration) */}
          <div id="section-shipping" className="scroll-mt-24">
          <ProductFulfillmentConfig
            productType={productType}
            shippingRequired={shippingRequired}
            onShippingRequiredChange={setShippingRequired}
            weight={weight}
            onWeightChange={setWeight}
            weightUnit={weightUnit}
            onWeightUnitChange={setWeightUnit}
            length={length}
            onLengthChange={setLength}
            width={width}
            onWidthChange={setWidth}
            height={height}
            onHeightChange={setHeight}
            dimensionUnit={dimensionUnit}
            onDimensionUnitChange={setDimensionUnit}
            shippingProfileId={shippingProfileId}
            onShippingProfileIdChange={setShippingProfileId}
            isFragile={isFragile}
            onIsFragileChange={setIsFragile}
            digitalDeliveryType={digitalDeliveryType}
            onDigitalDeliveryTypeChange={setDigitalDeliveryType}
            digitalAssetUrl={digitalAssetUrl}
            onDigitalAssetUrlChange={setDigitalAssetUrl}
            downloadLimit={downloadLimit}
            onDownloadLimitChange={setDownloadLimit}
            downloadExpiryDays={downloadExpiryDays}
            onDownloadExpiryDaysChange={setDownloadExpiryDays}
            serviceDeliveryType={serviceDeliveryType}
            onServiceDeliveryTypeChange={setServiceDeliveryType}
            serviceDuration={serviceDuration}
            onServiceDurationChange={setServiceDuration}
            serviceDurationUnit={serviceDurationUnit}
            onServiceDurationUnitChange={setServiceDurationUnit}
          />
          </div>
        </div>

        {/* Sidebar Column: summary, organization and help */}
        <div className="lg:col-span-3 space-y-5">
          {/* Live Product Summary — reflects the form as it is filled in */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3">Product Summary</h2>
            <div className="space-y-0.5">
              {[
                {
                  label: 'Product Type',
                  value:
                    productType === 'PHYSICAL'
                      ? 'Physical Product'
                      : productType === 'DIGITAL'
                      ? 'Digital Product'
                      : 'Service',
                },
                { label: 'Status', value: status.charAt(0) + status.slice(1).toLowerCase() },
                { label: 'Images', value: localImages.length },
                {
                  label: 'Price',
                  value: numericBasePrice > 0 ? `${currencySymbol}${numericBasePrice.toLocaleString()}` : '—',
                },
                {
                  label: 'Stock',
                  value: !trackInventory ? 'Not tracked' : initialStock !== '' ? initialStock : '—',
                },
                {
                  label: 'Category',
                  value: categories.find((c) => c.id === categoryId)?.name || '—',
                },
                { label: 'Brand', value: brands.find((b) => b.id === brandId)?.name || '—' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0"
                >
                  <span className="text-xs text-slate-500">{row.label}</span>
                  <span className="text-xs font-bold text-slate-900 text-right truncate max-w-[55%]">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Organization Card (Chunk 5 Integration) */}
          <div id="section-organization" className="scroll-mt-24 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-blue-600" />
                <span>Product Organization</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Categorize and organize your product</p>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parentId ? `└─ ${cat.name}` : cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Select + Inline Add */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Brand
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddBrand(!showAddBrand)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Brand</span>
                </button>
              </div>

              {showAddBrand && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50 border rounded-xl">
                  <input
                    type="text"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="Brand name..."
                    className="flex-1 px-3 py-1.5 bg-white border rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddBrandInline}
                    disabled={isCreatingBrand}
                    className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              )}

              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">No Brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Collections Multi-Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Collections
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCollection(!showAddCollection)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Collection</span>
                </button>
              </div>

              {showAddCollection && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50 border rounded-xl">
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Collection name..."
                    className="flex-1 px-3 py-1.5 bg-white border rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCollectionInline}
                    disabled={isCreatingCollection}
                    className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              )}

              {collections.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No collections created yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {collections.map((col) => {
                    const isChecked = selectedCollectionIds.includes(col.id);
                    return (
                      <label
                        key={col.id}
                        className={`flex items-center gap-2 p-2 border rounded-xl cursor-pointer text-xs transition-all ${
                          isChecked ? 'bg-blue-50/60 border-blue-300 font-bold text-blue-900' : 'bg-slate-50/50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCollectionSelect(col.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{col.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Product Type Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Product Type</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Select how this product will be fulfilled</p>
            </div>

            <div className="space-y-2.5">
              {/* PHYSICAL */}
              <label
                className={`p-3.5 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                  productType === 'PHYSICAL'
                    ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/10'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="productType"
                  value="PHYSICAL"
                  checked={productType === 'PHYSICAL'}
                  onChange={() => setProductType('PHYSICAL')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Physical Product</span>
                  <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">
                    Physical inventory item requiring courier shipping or store pick-up.
                  </span>
                </div>
              </label>

              {/* DIGITAL */}
              <label
                className={`p-3.5 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                  productType === 'DIGITAL'
                    ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/10'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="productType"
                  value="DIGITAL"
                  checked={productType === 'DIGITAL'}
                  onChange={() => setProductType('DIGITAL')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Digital Product</span>
                  <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">
                    Electronically delivered asset, license key, or downloadable file.
                  </span>
                </div>
              </label>

              {/* SERVICE */}
              <label
                className={`p-3.5 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                  productType === 'SERVICE'
                    ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/10'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="productType"
                  value="SERVICE"
                  checked={productType === 'SERVICE'}
                  onChange={() => setProductType('SERVICE')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Service</span>
                  <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">
                    Professional service, consultation, booking, or task assignment.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Status & Slug Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900">Publishing Status</h2>
              <p className="text-xs text-slate-500 mt-0.5">Visibility on storefront catalog</p>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="DRAFT">Draft (Hidden)</option>
                <option value="ACTIVE">Active (Published)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {status === 'DRAFT'
                  ? 'Draft products are saved to your merchant catalog but hidden from public customers.'
                  : 'Active products are publicly visible on your store catalog.'}
              </p>
            </div>

            {/* Custom URL Slug */}
            <div className="pt-2 border-t border-slate-100">
              <label htmlFor="custom-slug" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                URL Slug
              </label>
              <input
                id="custom-slug"
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                placeholder={slugPreview}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] font-mono text-slate-500 break-all">
                <span className="text-slate-400">Preview: </span>
                /store/{store?.slug || 'my-store'}/{slugPreview}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3">Tips</h2>
            <ul className="space-y-2">
              {[
                'Add high quality images',
                'Write a clear description',
                'Set a competitive price',
                'Keep inventory accurate',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-600">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Submit Action Buttons (mobile-friendly duplicate of the header actions) */}
          <div className="space-y-2 pt-1 lg:hidden">
            {isEditMode ? (
              <button
                type="button"
                onClick={() => handleFormSubmit(status)}
                disabled={isBusy}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleFormSubmit('ACTIVE')}
                  disabled={isBusy}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  <span>Publish Product</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFormSubmit('DRAFT')}
                  disabled={isBusy}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBusy ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Save className="w-4 h-4 text-slate-500" />}
                  <span>Save as Draft</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
