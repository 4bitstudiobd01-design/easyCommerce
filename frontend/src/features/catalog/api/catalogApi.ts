import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';

export type ProductType = 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type AttributeType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT' | 'DATE' | 'URL';
export type TaxCategory = 'STANDARD_VAT' | 'REDUCED' | 'ZERO_RATED' | 'EXEMPT';
export type ProductDiscountType = 'NONE' | 'PERCENTAGE' | 'FIXED';
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_TRACKED';

export type WeightUnit = 'KG' | 'G' | 'LB' | 'OZ';
export type DimensionUnit = 'CM' | 'M' | 'IN';
export type DigitalDeliveryType = 'DOWNLOAD' | 'ACCESS_LINK' | 'LICENSE_KEY' | 'EXTERNAL';
export type ServiceDeliveryType = 'ONLINE' | 'ONSITE' | 'LOCATION';
export type ServiceDurationUnit = 'MINUTES' | 'HOURS' | 'DAYS';

export type ImportMode = 'CREATE' | 'UPDATE' | 'UPSERT';

export type DateRangePreset = 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'CUSTOM';

export interface KpiMetric {
  value: number;
  previousValue: number;
  changePercentage: number;
}

export interface ProductAnalyticsSummary {
  productId: string;
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
  revenue: KpiMetric;
  ordersCount: KpiMetric;
  unitsSold: KpiMetric;
  averageOrderValue: KpiMetric;
  hasViewTracking: boolean;
  viewTrackingNotice: string;
}

export interface SalesTrendDataPoint {
  date: string;
  revenue: number;
  orders: number;
  unitsSold: number;
}

export interface VariantAnalyticsBreakdown {
  variantId: string;
  variantTitle: string;
  sku?: string;
  unitsSold: number;
  revenue: number;
  currentStock: number;
}

export interface BulkUpdateStatusRequest {
  productIds: string[];
  status: ProductStatus;
}

export interface BulkStatusFailure {
  productId: string;
  productName?: string;
  reason: string;
}

export interface BulkStatusResult {
  successCount: number;
  failedCount: number;
  failures: BulkStatusFailure[];
}

export interface ImportProductsRequest {
  csvContent: string;
  mode?: ImportMode;
}

export interface ImportRowFailure {
  row: number;
  name?: string;
  sku?: string;
  reason: string;
}

export interface ImportProductsResult {
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  failures: ImportRowFailure[];
}

export interface ShippingProfile {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  tenantId: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  icon?: string;
  image?: string;
  isFeatured?: boolean;
  parentCategory?: Category;
  subcategories?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface AttributeOption {
  id?: string;
  label: string;
  value: string;
  sortOrder?: number;
}

export interface AttributeDefinition {
  id: string;
  name: string;
  slug: string;
  key: string;
  type: AttributeType;
  description?: string;
  isRequired: boolean;
  isFilterable: boolean;
  isVariantOption: boolean;
  sortOrder: number;
  options?: AttributeOption[];
  tenantId: string;
  createdAt: string;
}

export interface ProductAttributeValue {
  id: string;
  productId: string;
  attributeId: string;
  attribute?: AttributeDefinition;
  value: string;
  tenantId: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder?: number;
  productId?: string;
}

export interface VariantOptionMeta {
  attributeId: string;
  attributeName: string;
  optionId: string;
  optionLabel: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  barcode?: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  imageId?: string;
  isEnabled: boolean;
  combinationKey?: string;
  options: VariantOptionMeta[];
  productId?: string;
  tenantId?: string;
}

export interface ProductRelation {
  id: string;
  productId: string;
  relatedProductId: string;
  sortOrder: number;
  relatedProduct?: Product;
  tenantId: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  customerName?: string;
  reviewerName?: string;
  reviewerEmail?: string;
  rating: number;
  comment?: string;
  isApproved: boolean;
  isVerifiedBuyer?: boolean;
  product?: { name: string; title?: string; slug: string };
  createdAt: string;
}

export interface UploadedMedia {
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
}

export interface ProductReviewsSummary {
  reviews: Review[];
  avgRating: number;
  totalCount: number;
}

export interface StockInfo {
  onHand: number;
  reserved: number;
  available: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  lowStockThreshold: number;
  stockStatus: StockStatus;
}

export interface Product {
  id: string;
  name?: string;
  title?: string;
  slug: string;
  description?: string;
  productType?: ProductType;
  status?: ProductStatus;
  hasVariants?: boolean;
  sku?: string;
  barcode?: string;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  lowStockThreshold?: number;
  stockInfo?: StockInfo;
  basePrice?: number;
  compareAtPrice?: number;
  costPrice?: number;
  taxRate?: number;
  isTaxInclusive?: boolean;
  taxCategory?: TaxCategory;
  discountType?: ProductDiscountType;
  discountValue?: number;
  discountStartsAt?: string;
  discountEndsAt?: string;
  shippingRequired?: boolean;
  weight?: number;
  weightUnit?: WeightUnit;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: DimensionUnit;
  shippingProfileId?: string;
  shippingProfile?: ShippingProfile;
  isFragile?: boolean;
  digitalDeliveryType?: DigitalDeliveryType;
  digitalAssetUrl?: string;
  downloadLimit?: number;
  downloadExpiryDays?: number;
  serviceDeliveryType?: ServiceDeliveryType;
  serviceDuration?: number;
  serviceDurationUnit?: ServiceDurationUnit;
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  isSearchEngineIndexed?: boolean;
  isPublished?: boolean;
  publishedAt?: string;
  categoryId?: string;
  category?: Category;
  brandId?: string;
  brand?: Brand;
  collections?: Collection[];
  images?: ProductImage[];
  variants?: ProductVariant[];
  attributeValues?: ProductAttributeValue[];
  tenantId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus | 'ALL';
  productType?: ProductType | 'ALL';
  stockStatus?: StockStatus | 'ALL';
  categoryId?: string;
  brandId?: string;
  collectionId?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProductListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  statusCounts?: {
    ALL: number;
    DRAFT: number;
    ACTIVE: number;
    ARCHIVED: number;
  };
}

export interface ProductListResponse {
  data: Product[];
  meta: ProductListMeta;
}

export interface UpdateProductSeoRequest {
  id: string;
  seoTitle?: string;
  metaDescription?: string;
  slug?: string;
  canonicalUrl?: string;
  isSearchEngineIndexed?: boolean;
}

export interface CreateProductRequest {
  name?: string;
  title?: string;
  description?: string;
  productType?: ProductType;
  status?: ProductStatus;
  slug?: string;
  sku?: string;
  barcode?: string;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  lowStockThreshold?: number;
  initialStock?: number;
  categoryId?: string;
  brandId?: string;
  collectionIds?: string[];
  basePrice?: number;
  compareAtPrice?: number;
  costPrice?: number;
  taxRate?: number;
  isTaxInclusive?: boolean;
  taxCategory?: TaxCategory;
  discountType?: ProductDiscountType;
  discountValue?: number;
  discountStartsAt?: string;
  discountEndsAt?: string;
  imageUrl?: string;
  images?: { url: string; altText?: string; isPrimary?: boolean }[];
  shippingRequired?: boolean;
  weight?: number;
  weightUnit?: WeightUnit;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: DimensionUnit;
  shippingProfileId?: string;
  isFragile?: boolean;
  digitalDeliveryType?: DigitalDeliveryType;
  digitalAssetUrl?: string;
  downloadLimit?: number;
  downloadExpiryDays?: number;
  serviceDeliveryType?: ServiceDeliveryType;
  serviceDuration?: number;
  serviceDurationUnit?: ServiceDurationUnit;
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  isSearchEngineIndexed?: boolean;
}

export interface UpdateProductRequest {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  productType?: ProductType;
  status?: ProductStatus;
  slug?: string;
  hasVariants?: boolean;
  sku?: string;
  barcode?: string;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  lowStockThreshold?: number;
  categoryId?: string;
  brandId?: string;
  collectionIds?: string[];
  basePrice?: number;
  compareAtPrice?: number;
  costPrice?: number;
  taxRate?: number;
  isTaxInclusive?: boolean;
  taxCategory?: TaxCategory;
  discountType?: ProductDiscountType;
  discountValue?: number;
  discountStartsAt?: string;
  discountEndsAt?: string;
  shippingRequired?: boolean;
  weight?: number;
  weightUnit?: WeightUnit;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: DimensionUnit;
  shippingProfileId?: string;
  isFragile?: boolean;
  digitalDeliveryType?: DigitalDeliveryType;
  digitalAssetUrl?: string;
  downloadLimit?: number;
  downloadExpiryDays?: number;
  serviceDeliveryType?: ServiceDeliveryType;
  serviceDuration?: number;
  serviceDurationUnit?: ServiceDurationUnit;
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  isSearchEngineIndexed?: boolean;
}

export interface GenerateVariantsRequest {
  productId: string;
  dimensions: { attributeId: string; optionIds: string[] }[];
}

export interface UpdateVariantRequest {
  productId: string;
  variantId: string;
  sku?: string;
  barcode?: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  imageId?: string;
  isEnabled?: boolean;
  stockQuantity?: number;
}

export interface BulkUpdateVariantsRequest {
  productId: string;
  variantIds: string[];
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  isEnabled?: boolean;
  stockQuantity?: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
  image?: string;
  isFeatured?: boolean;
}

export interface CreateBrandRequest {
  name: string;
  description?: string;
  logoUrl?: string;
  slug?: string;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  slug?: string;
}

export interface CreateAttributeRequest {
  name: string;
  key?: string;
  type: AttributeType;
  description?: string;
  isRequired?: boolean;
  isFilterable?: boolean;
  isVariantOption?: boolean;
  options?: AttributeOption[];
}

export interface SetProductAttributeValuesRequest {
  productId: string;
  attributes: { attributeId: string; value: any }[];
}

export interface AddProductMediaRequest {
  productId: string;
  url: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface CreateReviewRequest {
  productId: string;
  customerName?: string;
  reviewerName?: string;
  reviewerEmail?: string;
  rating: number;
  comment?: string;
}

export interface CreateShippingProfileRequest {
  name: string;
  description?: string;
  isDefault?: boolean;
}

export const catalogApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/catalog',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token || localStorage.getItem('easycommerce_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      const activeStoreId = localStorage.getItem('easycommerce_active_store_id');
      if (activeStoreId) {
        headers.set('x-store-id', activeStoreId);
      }
      return headers;
    },
  }),
  tagTypes: ['Product', 'Category', 'Brand', 'Collection', 'Attribute', 'Review', 'ProductMedia', 'Inventory', 'Variant', 'ShippingProfile', 'RelatedProduct', 'ProductAnalytics'],
  endpoints: (builder) => ({
    getProducts: builder.query<ProductListResponse, ProductListParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set('page', params.page.toString());
        if (params?.limit) queryParams.set('limit', params.limit.toString());
        if (params?.search) queryParams.set('search', params.search);
        if (params?.status && params.status !== 'ALL') queryParams.set('status', params.status);
        if (params?.productType && params.productType !== 'ALL') queryParams.set('productType', params.productType);
        if (params?.stockStatus && params.stockStatus !== 'ALL') queryParams.set('stockStatus', params.stockStatus);
        if (params?.categoryId) queryParams.set('categoryId', params.categoryId);
        if (params?.brandId) queryParams.set('brandId', params.brandId);
        if (params?.collectionId) queryParams.set('collectionId', params.collectionId);
        if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);

        const queryString = queryParams.toString();
        return `/products${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Product', 'Inventory', 'Variant'],
      transformResponse: (response: any) => {
        const payload = response.data !== undefined ? response.data : response;

        if (Array.isArray(payload)) {
          return {
            data: payload,
            meta: {
              page: 1,
              limit: payload.length,
              total: payload.length,
              totalPages: 1,
              statusCounts: { ALL: payload.length, DRAFT: 0, ACTIVE: 0, ARCHIVED: 0 },
            },
          };
        }

        if (payload && Array.isArray(payload.data)) {
          return {
            data: payload.data,
            meta: payload.meta || {
              page: 1,
              limit: payload.data.length,
              total: payload.data.length,
              totalPages: 1,
              statusCounts: { ALL: payload.data.length, DRAFT: 0, ACTIVE: 0, ARCHIVED: 0 },
            },
          };
        }

        return {
          data: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 0, statusCounts: { ALL: 0, DRAFT: 0, ACTIVE: 0, ARCHIVED: 0 } },
        };
      },
    }),
    getProductById: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Product', id }, 'Inventory', 'Variant'],
      transformResponse: (response: { data: Product }) => response.data,
    }),
    getProductReviews: builder.query<ProductReviewsSummary, string>({
      query: (productId) => `/products/${productId}/reviews`,
      providesTags: (_result, _err, productId) => [{ type: 'Review', id: productId }],
      transformResponse: (response: any) => {
        const payload = response?.data ?? response;
        return {
          reviews: payload?.reviews ?? [],
          avgRating: Number(payload?.avgRating ?? 0),
          totalCount: Number(payload?.totalCount ?? 0),
        };
      },
    }),

    // --- PRODUCT ANALYTICS (CHUNK 13) ---
    getProductAnalyticsSummary: builder.query<ProductAnalyticsSummary, { id: string; preset?: DateRangePreset }>({
      query: ({ id, preset }) => `/products/${id}/analytics/summary${preset ? `?preset=${preset}` : ''}`,
      providesTags: (_result, _err, { id }) => [{ type: 'ProductAnalytics', id }],
      transformResponse: (response: { data: ProductAnalyticsSummary }) => response.data,
    }),
    getProductAnalyticsTrend: builder.query<SalesTrendDataPoint[], { id: string; preset?: DateRangePreset }>({
      query: ({ id, preset }) => `/products/${id}/analytics/trend${preset ? `?preset=${preset}` : ''}`,
      providesTags: (_result, _err, { id }) => [{ type: 'ProductAnalytics', id }],
      transformResponse: (response: { data: SalesTrendDataPoint[] }) => response.data || [],
    }),
    getProductAnalyticsVariants: builder.query<VariantAnalyticsBreakdown[], { id: string; preset?: DateRangePreset }>({
      query: ({ id, preset }) => `/products/${id}/analytics/variants${preset ? `?preset=${preset}` : ''}`,
      providesTags: (_result, _err, { id }) => [{ type: 'ProductAnalytics', id }],
      transformResponse: (response: { data: VariantAnalyticsBreakdown[] }) => response.data || [],
    }),

    // --- SEO & RELATED PRODUCTS ---
    updateProductSeo: builder.mutation<Product, UpdateProductSeoRequest>({
      query: ({ id, ...patch }) => ({
        url: `/products/${id}/seo`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Product', id }, 'Product'],
      transformResponse: (response: { data: Product }) => response.data,
    }),
    getRelatedProducts: builder.query<ProductRelation[], string>({
      query: (productId) => `/products/${productId}/related`,
      providesTags: (_result, _err, productId) => [{ type: 'RelatedProduct', id: productId }],
      transformResponse: (response: { data: ProductRelation[] }) => response.data || [],
    }),
    addRelatedProduct: builder.mutation<ProductRelation, { productId: string; relatedProductId: string }>({
      query: ({ productId, relatedProductId }) => ({
        url: `/products/${productId}/related`,
        method: 'POST',
        body: { relatedProductId },
      }),
      invalidatesTags: (_result, _err, { productId }) => [{ type: 'RelatedProduct', id: productId }],
      transformResponse: (response: { data: ProductRelation }) => response.data,
    }),
    removeRelatedProduct: builder.mutation<{ message: string }, { productId: string; relatedProductId: string }>({
      query: ({ productId, relatedProductId }) => ({
        url: `/products/${productId}/related/${relatedProductId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, { productId }) => [{ type: 'RelatedProduct', id: productId }],
    }),
    reorderRelatedProducts: builder.mutation<ProductRelation[], { productId: string; relatedProductIds: string[] }>({
      query: ({ productId, relatedProductIds }) => ({
        url: `/products/${productId}/related/reorder`,
        method: 'PATCH',
        body: { relatedProductIds },
      }),
      invalidatesTags: (_result, _err, { productId }) => [{ type: 'RelatedProduct', id: productId }],
      transformResponse: (response: { data: ProductRelation[] }) => response.data || [],
    }),

    // --- BULK OPERATIONS & IMPORT/EXPORT ---
    bulkUpdateProductStatus: builder.mutation<BulkStatusResult, BulkUpdateStatusRequest>({
      query: (body) => ({
        url: '/products/bulk/status',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Product', 'Inventory', 'Variant'],
      transformResponse: (response: { data: BulkStatusResult }) => response.data,
    }),
    importProducts: builder.mutation<ImportProductsResult, ImportProductsRequest>({
      query: (body) => ({
        url: '/products/import',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product', 'Inventory', 'Variant'],
      transformResponse: (response: { data: ImportProductsResult }) => response.data,
    }),

    // --- SHIPPING PROFILES ---
    getShippingProfiles: builder.query<ShippingProfile[], void>({
      query: () => '/shipping-profiles',
      providesTags: ['ShippingProfile'],
      transformResponse: (response: { data: ShippingProfile[] }) => response.data || [],
    }),
    createShippingProfile: builder.mutation<ShippingProfile, CreateShippingProfileRequest>({
      query: (body) => ({
        url: '/shipping-profiles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ShippingProfile'],
      transformResponse: (response: { data: ShippingProfile }) => response.data,
    }),

    // --- CATEGORIES ---
    getCategories: builder.query<Category[], void>({
      query: () => '/categories',
      providesTags: ['Category'],
      transformResponse: (response: { data: Category[] }) => response.data || [],
    }),
    createCategory: builder.mutation<Category, CreateCategoryRequest>({
      query: (categoryData) => ({
        url: '/categories',
        method: 'POST',
        body: categoryData,
      }),
      invalidatesTags: ['Category'],
      transformResponse: (response: { data: Category }) => response.data,
    }),

    // --- BRANDS ---
    getBrands: builder.query<Brand[], void>({
      query: () => '/brands',
      providesTags: ['Brand'],
      transformResponse: (response: { data: Brand[] }) => response.data || [],
    }),
    createBrand: builder.mutation<Brand, CreateBrandRequest>({
      query: (brandData) => ({
        url: '/brands',
        method: 'POST',
        body: brandData,
      }),
      invalidatesTags: ['Brand'],
      transformResponse: (response: { data: Brand }) => response.data,
    }),

    // --- COLLECTIONS ---
    getCollections: builder.query<Collection[], void>({
      query: () => '/collections',
      providesTags: ['Collection'],
      transformResponse: (response: { data: Collection[] }) => response.data || [],
    }),
    createCollection: builder.mutation<Collection, CreateCollectionRequest>({
      query: (collectionData) => ({
        url: '/collections',
        method: 'POST',
        body: collectionData,
      }),
      invalidatesTags: ['Collection'],
      transformResponse: (response: { data: Collection }) => response.data,
    }),

    // --- ATTRIBUTES ---
    getAttributes: builder.query<AttributeDefinition[], void>({
      query: () => '/attributes',
      providesTags: ['Attribute'],
      transformResponse: (response: { data: AttributeDefinition[] }) => response.data || [],
    }),
    createAttribute: builder.mutation<AttributeDefinition, CreateAttributeRequest>({
      query: (body) => ({
        url: '/attributes',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Attribute'],
      transformResponse: (response: { data: AttributeDefinition }) => response.data,
    }),
    getCategoryAttributes: builder.query<AttributeDefinition[], string>({
      query: (categoryId) => `/categories/${categoryId}/attributes`,
      providesTags: (_result, _err, categoryId) => [{ type: 'Attribute', id: `cat-${categoryId}` }],
      transformResponse: (response: { data: AttributeDefinition[] }) => response.data || [],
    }),
    assignCategoryAttributes: builder.mutation<{ message: string; count: number }, { categoryId: string; attributeIds: string[] }>({
      query: ({ categoryId, attributeIds }) => ({
        url: `/categories/${categoryId}/attributes`,
        method: 'POST',
        body: { attributeIds },
      }),
      invalidatesTags: (_result, _err, { categoryId }) => [{ type: 'Attribute', id: `cat-${categoryId}` }],
    }),
    getProductAttributes: builder.query<ProductAttributeValue[], string>({
      query: (productId) => `/products/${productId}/attributes`,
      providesTags: (_result, _err, productId) => [{ type: 'Product', id: productId }],
      transformResponse: (response: { data: ProductAttributeValue[] }) => response.data || [],
    }),
    setProductAttributes: builder.mutation<ProductAttributeValue[], SetProductAttributeValuesRequest>({
      query: ({ productId, attributes }) => ({
        url: `/products/${productId}/attributes`,
        method: 'POST',
        body: { attributes },
      }),
      invalidatesTags: (_result, _err, { productId }) => [{ type: 'Product', id: productId }],
      transformResponse: (response: { data: ProductAttributeValue[] }) => response.data || [],
    }),

    // --- PRODUCTS ---
    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (productData) => ({
        url: '/products',
        method: 'POST',
        body: {
          ...productData,
          name: productData.name || productData.title,
        },
      }),
      invalidatesTags: ['Product', 'Inventory', 'Variant'],
      transformResponse: (response: { data: Product }) => response.data,
    }),
    updateProduct: builder.mutation<Product, UpdateProductRequest>({
      query: ({ id, ...patch }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Product', id }, 'Product', 'Inventory', 'Variant'],
      transformResponse: (response: { data: Product }) => response.data,
    }),
    deleteProduct: builder.mutation<{ message: string; archived: boolean }, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, id) => [{ type: 'Product', id }, 'Product', 'Inventory', 'Variant'],
      // This endpoint returns the payload flat rather than wrapped in `data`, so the
      // envelope is unwrapped only when it is actually present.
      transformResponse: (response: any) => response?.data ?? response,
    }),

    // --- VARIANTS ENDPOINTS ---
    generateVariants: builder.mutation<ProductVariant[], GenerateVariantsRequest>({
      query: ({ productId, dimensions }) => ({
        url: `/products/${productId}/variants/generate`,
        method: 'POST',
        body: { dimensions },
      }),
      invalidatesTags: (_result, _err, { productId }) => [{ type: 'Product', id: productId }, 'Variant', 'Inventory'],
      transformResponse: (response: { data: ProductVariant[] }) => response.data || [],
    }),
    updateVariant: builder.mutation<ProductVariant, UpdateVariantRequest>({
      query: ({ productId, variantId, ...patch }) => ({
        url: `/products/${productId}/variants/${variantId}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _err, { productId }) => [{ type: 'Product', id: productId }, 'Variant', 'Inventory'],
      transformResponse: (response: { data: ProductVariant }) => response.data,
    }),
    bulkUpdateVariants: builder.mutation<ProductVariant[], BulkUpdateVariantsRequest>({
      query: ({ productId, ...body }) => ({
        url: `/products/${productId}/variants/bulk`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _err, { productId }) => [{ type: 'Product', id: productId }, 'Variant', 'Inventory'],
      transformResponse: (response: { data: ProductVariant[] }) => response.data || [],
    }),

    // --- PRODUCT MEDIA ENDPOINTS ---
    getProductMedia: builder.query<ProductImage[], string>({
      query: (productId) => `/products/${productId}/media`,
      providesTags: (_result, _err, productId) => [{ type: 'ProductMedia', id: productId }],
      transformResponse: (response: { data: ProductImage[] }) => response.data || [],
    }),
    uploadProductMedia: builder.mutation<UploadedMedia[], { files: File[]; productId?: string }>({
      query: ({ files, productId }) => {
        // multipart/form-data — the Content-Type header is deliberately not set so the
        // browser can add the multipart boundary itself.
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        return {
          url: `/media/upload${productId ? `?productId=${productId}` : ''}`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_result, _err, { productId }) =>
        productId
          ? [{ type: 'ProductMedia', id: productId }, { type: 'Product', id: productId }]
          : [],
      transformResponse: (response: any) => response?.data ?? response ?? [],
    }),
    addProductMedia: builder.mutation<ProductImage, AddProductMediaRequest>({
      query: ({ productId, ...body }) => ({
        url: `/products/${productId}/media`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, { productId }) => [{ type: 'ProductMedia', id: productId }, { type: 'Product', id: productId }],
      transformResponse: (response: { data: ProductImage }) => response.data,
    }),
    setPrimaryMedia: builder.mutation<ProductImage, { productId: string; imageId?: string; mediaId?: string }>({
      query: ({ productId, imageId, mediaId }) => ({
        url: `/products/${productId}/media/${imageId || mediaId}/primary`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _err, { productId }) => [{ type: 'ProductMedia', id: productId }, { type: 'Product', id: productId }],
    }),
    reorderProductMedia: builder.mutation<{ message: string }, { productId: string; imageIds?: string[]; mediaIds?: string[] }>({
      query: ({ productId, imageIds, mediaIds }) => ({
        url: `/products/${productId}/media/reorder`,
        method: 'PATCH',
        body: { imageIds: imageIds || mediaIds },
      }),
      invalidatesTags: (_result, _err, { productId }) => [{ type: 'ProductMedia', id: productId }],
    }),
    deleteProductMedia: builder.mutation<{ message: string }, { productId: string; imageId?: string; mediaId?: string }>({
      query: ({ productId, imageId, mediaId }) => ({
        url: `/products/${productId}/media/${imageId || mediaId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, { productId }) => [{ type: 'ProductMedia', id: productId }, { type: 'Product', id: productId }],
    }),

    // --- REVIEWS ENDPOINTS ---
    getApprovedReviews: builder.query<any, string>({
      query: (productId) => `/products/${productId}/reviews`,
      providesTags: (_result, _err, productId) => [{ type: 'Review', id: productId }],
      transformResponse: (response: { data: any }) => response.data || { reviews: [], avgRating: 0, totalCount: 0 },
    }),
    getMerchantReviews: builder.query<Review[], void>({
      query: () => '/reviews/merchant',
      providesTags: ['Review'],
      transformResponse: (response: { data: Review[] }) => response.data || [],
    }),
    createReview: builder.mutation<Review, CreateReviewRequest>({
      query: (body) => ({
        url: '/reviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, { productId }) => [{ type: 'Review', id: productId }],
      transformResponse: (response: { data: Review }) => response.data,
    }),
    toggleReviewApproval: builder.mutation<Review, { reviewId?: string; id?: string; isApproved: boolean }>({
      query: ({ reviewId, id, isApproved }) => ({
        url: `/reviews/${reviewId || id}/approval`,
        method: 'PATCH',
        body: { isApproved },
      }),
      invalidatesTags: ['Review'],
    }),
    deleteReview: builder.mutation<{ message: string }, string>({
      query: (reviewId) => ({
        url: `/reviews/${reviewId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Review'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductReviewsQuery,
  useGetProductAnalyticsSummaryQuery,
  useGetProductAnalyticsTrendQuery,
  useGetProductAnalyticsVariantsQuery,
  useUpdateProductSeoMutation,
  useGetRelatedProductsQuery,
  useAddRelatedProductMutation,
  useRemoveRelatedProductMutation,
  useReorderRelatedProductsMutation,
  useBulkUpdateProductStatusMutation,
  useImportProductsMutation,
  useGetShippingProfilesQuery,
  useCreateShippingProfileMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetBrandsQuery,
  useCreateBrandMutation,
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useGetAttributesQuery,
  useCreateAttributeMutation,
  useGetCategoryAttributesQuery,
  useAssignCategoryAttributesMutation,
  useGetProductAttributesQuery,
  useSetProductAttributesMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGenerateVariantsMutation,
  useUpdateVariantMutation,
  useBulkUpdateVariantsMutation,
  useGetProductMediaQuery,
  useUploadProductMediaMutation,
  useAddProductMediaMutation,
  useSetPrimaryMediaMutation,
  useReorderProductMediaMutation,
  useDeleteProductMediaMutation,
  useGetApprovedReviewsQuery,
  useGetMerchantReviewsQuery,
  useCreateReviewMutation,
  useToggleReviewApprovalMutation,
  useDeleteReviewMutation,
} = catalogApi;
