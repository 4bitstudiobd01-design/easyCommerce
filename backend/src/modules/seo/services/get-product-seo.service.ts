import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ReviewEntity } from '../../catalog/entities/review.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { ProductSeoMetadata } from '../interfaces/seo-metadata.interface';

@Injectable()
export class GetProductSeoService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  async execute(productId: string): Promise<ProductSeoMetadata> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['images', 'variants'],
    });

    if (!product) {
      throw new NotFoundException('Product not found for SEO metadata.');
    }

    const store = await this.storeRepository.findOne({
      where: { tenantId: product.tenantId },
    });

    const reviews = await this.reviewRepository.find({
      where: { productId: product.id, isApproved: true },
    });

    const totalStock = await this.stockRepository
      .createQueryBuilder('stock')
      .where('stock.productId = :productId', { productId: product.id })
      .select('SUM(stock.quantityOnHand - stock.quantityReserved)', 'total')
      .getRawOne();

    const stockQty = Number(totalStock?.total || 0);
    const inStock = stockQty > 0;

    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
        : 5.0;

    const storeName = store?.name || 'BitCommerce Store';
    const storeSlug = store?.slug || 'store';
    const currency = store?.currency || 'BDT';
    const price = Number(product.basePrice || 0);

    const imageUrls =
      product.images && product.images.length > 0
        ? product.images.map((img) => img.url)
        : [
            store?.logo ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
          ];

    const mainImage = imageUrls[0];
    const sku =
      product.variants && product.variants.length > 0 && product.variants[0].sku
        ? product.variants[0].sku
        : product.id.slice(0, 8);

    const canonicalUrl = `https://${storeSlug}.bitcommerce.app/store/${storeSlug}?product=${product.id}`;

    // Standard Google Search schema.org/Product JSON-LD
    const jsonLdSchema: Record<string, any> = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.title,
      image: imageUrls,
      description: product.description || `${product.title} available on ${storeName}`,
      sku,
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: currency,
        price,
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
    };

    if (reviewCount > 0) {
      jsonLdSchema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: averageRating,
        reviewCount: reviewCount,
      };
    }

    const openGraphTags = {
      title: `${product.title} - ৳${price.toLocaleString()} ${currency} | ${storeName}`,
      description:
        product.description ||
        `Buy authentic ${product.title} for ৳${price.toLocaleString()} ${currency} from ${storeName}. Fast delivery across Bangladesh.`,
      image: mainImage,
      url: canonicalUrl,
      type: 'og:product',
      priceAmount: price,
      priceCurrency: currency,
    };

    return {
      productId: product.id,
      storeId: store?.id || '',
      storeSlug,
      storeName,
      title: product.title,
      description: product.description || '',
      price,
      costPrice: product.costPrice ? Number(product.costPrice) : undefined,
      currency,
      sku,
      images: imageUrls,
      mainImage,
      inStock,
      stockQuantity: stockQty,
      averageRating,
      reviewCount,
      canonicalUrl,
      jsonLdSchema,
      openGraphTags,
    };
  }
}
