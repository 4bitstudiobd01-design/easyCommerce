import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { StoreSeoMetadata } from '../interfaces/seo-metadata.interface';

@Injectable()
export class GetStoreSeoService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  async execute(storeSlug: string): Promise<StoreSeoMetadata> {
    const store = await this.storeRepository.findOne({
      where: { slug: storeSlug, isActive: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found for SEO metadata.');
    }

    const canonicalUrl = `https://${store.slug}.easycommerce.app`;
    const metaTitle = store.metaTitle || `${store.name} | Official Online Storefront`;
    const metaDescription =
      store.metaDescription ||
      `Shop authentic products, pricing, and fast delivery from ${store.name} on EasyCommerce.`;

    const jsonLdSchema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'OnlineStore',
      name: store.name,
      url: canonicalUrl,
      logo: store.logo,
      description: metaDescription,
      telephone: store.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: store.address || 'Dhaka, Bangladesh',
        addressCountry: 'BD',
      },
    };

    const openGraphTags = {
      title: metaTitle,
      description: metaDescription,
      image: store.logo || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      url: canonicalUrl,
      type: 'website',
    };

    return {
      storeId: store.id,
      storeName: store.name,
      storeSlug: store.slug,
      metaTitle,
      metaDescription,
      logoUrl: store.logo,
      faviconUrl: store.favicon,
      primaryColor: store.primaryColor || '#2563eb',
      canonicalUrl,
      jsonLdSchema,
      openGraphTags,
    };
  }
}
