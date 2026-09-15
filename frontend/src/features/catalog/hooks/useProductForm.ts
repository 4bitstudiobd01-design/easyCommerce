'use client';

import { useState, useEffect } from 'react';
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
  HomepageSection,
} from '@/features/catalog/api/catalogApi';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { toast } from 'sonner';

/**
 * Owns every field of the product create/edit/duplicate form plus the submit
 * flow, so the eight tab pages (General, Media, Organization, Pricing,
 * Inventory, Variants, Shipping, More Options) can each render a slice of the
 * same in-progress product without re-deriving state or losing it when the
 * merchant switches tabs via the ?tab= query param.
 */
export function useProductForm() {
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
  // Independent of `status` — lets a merchant pause storefront visibility without
  // changing the product's lifecycle status. Defaults to visible for new products.
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [customSlug, setCustomSlug] = useState('');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [brandId, setBrandId] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
  const [localImages, setLocalImages] = useState<{ url: string; altText?: string; isPrimary?: boolean }[]>([]);

  // Inventory & Stock State
  const [hasVariants, setHasVariants] = useState<boolean>(false);
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [trackInventory, setTrackInventory] = useState<boolean>(true);
  const [allowBackorder, setAllowBackorder] = useState<boolean>(false);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [initialStock, setInitialStock] = useState<number | ''>('');

  // Pricing, Tax & Discount State
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

  // Shipping & Fulfillment State
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

  // Prefill from the source product exactly once. Re-running on every cache update
  // would overwrite whatever the merchant is currently typing.
  useEffect(() => {
    if (!sourceProduct || hasPrefilled) return;

    setName(isDuplicateMode ? `${sourceProduct.name || sourceProduct.title || ''} (Copy)` : sourceProduct.name || sourceProduct.title || '');
    setDescription(sourceProduct.description || '');
    setProductType(sourceProduct.productType || 'PHYSICAL');
    // A duplicate always starts as a draft so a half-finished copy cannot go live.
    setStatus(isDuplicateMode ? 'DRAFT' : sourceProduct.status || 'DRAFT');
    setIsVisible(sourceProduct.isVisible ?? true);
    // Slug and SKU are unique per tenant, so a copy must not reuse the originals.
    setCustomSlug(isDuplicateMode ? '' : sourceProduct.slug || '');
    setSku(isDuplicateMode ? '' : sourceProduct.sku || '');
    setBarcode(isDuplicateMode ? '' : sourceProduct.barcode || '');

    setCategoryId(sourceProduct.categoryId || '');
    setBrandId(sourceProduct.brandId || '');
    setSelectedCollectionIds((sourceProduct.collections || []).map((c) => c.id));
    setHomepageSections(sourceProduct.homepageSections || []);
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

  const toggleHomepageSection = (section: HomepageSection) => {
    setHomepageSections((prev) =>
      prev.includes(section) ? prev.filter((item) => item !== section) : [...prev, section],
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
        isVisible,
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
        homepageSections: homepageSections.length > 0 ? homepageSections : undefined,
        images: localImages.length > 0 ? localImages : undefined,
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

  const ensureProductSaved = async (): Promise<string | null> => {
    if (!name.trim()) {
      toast.error('Please enter a Product Name in the General section above.');
      const nameInput = document.getElementById('product-name');
      if (nameInput) {
        nameInput.focus();
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return null;
    }

    if (editId) {
      return editId;
    }

    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        slug: customSlug.trim() || undefined,
        productType,
        status: 'DRAFT',
        hasVariants: true,
        trackInventory,
        allowBackorder,
        sku: sku.trim() || undefined,
        price: numericBasePrice > 0 ? numericBasePrice : undefined,
        compareAtPrice: numericCompareAt > 0 ? numericCompareAt : undefined,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
      };

      const saved = await createProduct(payload).unwrap();
      toast.success('Product draft created.');
      router.replace(`/dashboard/products/create?edit=${saved.id}`);
      return saved.id;
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to initialize product.');
      return null;
    }
  };

  return {
    // mode
    editId,
    duplicateId,
    sourceId,
    sourceProduct,
    isEditMode,
    isDuplicateMode,
    isLoadingSource,
    isBusy,
    errorMsg,

    // store/currency
    store,
    storeCurrency,
    currencySymbol,

    // basic
    name, setName,
    description, setDescription,
    productType, setProductType,
    status, setStatus,
    isVisible, setIsVisible,
    customSlug, setCustomSlug,
    slugPreview,

    // media
    localImages, setLocalImages,

    // organization
    categoryId, setCategoryId,
    brandId, setBrandId,
    selectedCollectionIds, setSelectedCollectionIds,
    toggleCollectionSelect,
    homepageSections, setHomepageSections,
    toggleHomepageSection,
    categories,
    brands,
    collections,
    showAddBrand, setShowAddBrand,
    newBrandName, setNewBrandName,
    handleAddBrandInline,
    isCreatingBrand,
    showAddCollection, setShowAddCollection,
    newCollectionName, setNewCollectionName,
    handleAddCollectionInline,
    isCreatingCollection,

    // inventory
    hasVariants, setHasVariants,
    sku, setSku,
    barcode, setBarcode,
    trackInventory, setTrackInventory,
    allowBackorder, setAllowBackorder,
    lowStockThreshold, setLowStockThreshold,
    initialStock, setInitialStock,

    // pricing
    basePrice, setBasePrice,
    compareAtPrice, setCompareAtPrice,
    costPrice, setCostPrice,
    taxRate, setTaxRate,
    isTaxInclusive, setIsTaxInclusive,
    taxCategory, setTaxCategory,
    discountType, setDiscountType,
    discountValue, setDiscountValue,
    discountStartsAt, setDiscountStartsAt,
    discountEndsAt, setDiscountEndsAt,
    numericBasePrice,
    numericCostPrice,
    profitAmount,
    marginPercent,

    // shipping / fulfillment
    shippingRequired, setShippingRequired,
    weight, setWeight,
    weightUnit, setWeightUnit,
    length, setLength,
    width, setWidth,
    height, setHeight,
    dimensionUnit, setDimensionUnit,
    shippingProfileId, setShippingProfileId,
    isFragile, setIsFragile,
    digitalDeliveryType, setDigitalDeliveryType,
    digitalAssetUrl, setDigitalAssetUrl,
    downloadLimit, setDownloadLimit,
    downloadExpiryDays, setDownloadExpiryDays,
    serviceDeliveryType, setServiceDeliveryType,
    serviceDuration, setServiceDuration,
    serviceDurationUnit, setServiceDurationUnit,

    // attributes
    categoryAttributes,
    attributeValues,
    handleAttributeChange,

    // submit
    handleFormSubmit,
    ensureProductSaved,
  };
}

export type ProductFormState = ReturnType<typeof useProductForm>;
