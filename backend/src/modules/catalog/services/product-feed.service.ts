import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';

@Injectable()
export class ProductFeedService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  async generateGoogleShoppingXml(slug: string, baseUrl: string = 'http://localhost:3000'): Promise<string> {
    const store = await this.storeRepository.findOne({ where: { slug } });
    if (!store) {
      throw new NotFoundException(`Store with slug "${slug}" not found.`);
    }

    const products = await this.productRepository.find({
      where: { tenantId: store.tenantId, isPublished: true },
      relations: ['images', 'category'],
    });

    const storeUrl = `${baseUrl}/store/${store.slug}`;

    const itemsXml = products
      .map((p) => {
        const primaryImage = p.images && p.images.length > 0 ? p.images[0].url : '';
        const productLink = `${storeUrl}?productId=${p.id}`;

        return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.title}]]></g:title>
      <g:description><![CDATA[${p.description || p.title}]]></g:description>
      <g:link>${productLink}</g:link>
      <g:image_link>${primaryImage}</g:image_link>
      <g:price>${p.basePrice} ${store.currency || 'BDT'}</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand><![CDATA[${store.name}]]></g:brand>
      ${p.category ? `<g:product_type><![CDATA[${p.category.name}]]></g:product_type>` : ''}
    </item>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title><![CDATA[${store.name} Google Shopping Catalog]]></title>
    <link>${storeUrl}</link>
    <description><![CDATA[Product Feed for ${store.name}]]></description>
    ${itemsXml}
  </channel>
</rss>`;
  }

  async generateFacebookCatalogCsv(slug: string, baseUrl: string = 'http://localhost:3000'): Promise<string> {
    const store = await this.storeRepository.findOne({ where: { slug } });
    if (!store) {
      throw new NotFoundException(`Store with slug "${slug}" not found.`);
    }

    const products = await this.productRepository.find({
      where: { tenantId: store.tenantId, isPublished: true },
      relations: ['images', 'category'],
    });

    const storeUrl = `${baseUrl}/store/${store.slug}`;

    const header = 'id,title,description,availability,condition,price,link,image_link,brand\n';

    const rows = products
      .map((p) => {
        const primaryImage = p.images && p.images.length > 0 ? p.images[0].url : '';
        const productLink = `${storeUrl}?productId=${p.id}`;
        const escapedTitle = `"${p.title.replace(/"/g, '""')}"`;
        const escapedDesc = `"${(p.description || p.title).replace(/"/g, '""')}"`;
        const priceStr = `"${p.basePrice} ${store.currency || 'BDT'}"`;

        return `${p.id},${escapedTitle},${escapedDesc},in stock,new,${priceStr},${productLink},${primaryImage},"${store.name}"`;
      })
      .join('\n');

    return header + rows;
  }
}
