export interface ProductSeoMetadata {
  productId: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  title: string;
  description: string;
  price: number;
  costPrice?: number;
  currency: string;
  sku?: string;
  images: string[];
  mainImage: string;
  inStock: boolean;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
  canonicalUrl: string;
  jsonLdSchema: Record<string, any>;
  openGraphTags: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
    priceAmount: number;
    priceCurrency: string;
  };
}

export interface StoreSeoMetadata {
  storeId: string;
  storeName: string;
  storeSlug: string;
  metaTitle: string;
  metaDescription: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  canonicalUrl: string;
  jsonLdSchema: Record<string, any>;
  openGraphTags: {
    title: string;
    description: string;
    image?: string;
    url: string;
    type: string;
  };
}
