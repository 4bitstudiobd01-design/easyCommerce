import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Raw, Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ReviewEntity } from '../entities/review.entity';
import { HomepageSection } from '../enums/homepage-section.enum';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { FindStoreBySlugService } from '../../tenant/services/find-store-by-slug.service';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { sanitizePublicStore } from '../../tenant/utils/sanitize-public-store.util';

export interface PublicStoreProductsResponse {
  store: StoreEntity;
  products: ProductEntity[];
}

@Injectable()
export class FindPublicStoreProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly inventoryStockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    private readonly findStoreBySlugService: FindStoreBySlugService,
  ) {}

  async execute(slug: string, section?: HomepageSection): Promise<PublicStoreProductsResponse> {
    const store = await this.findStoreBySlugService.execute(slug);

    const products = await this.productRepository.find({
      where: {
        tenantId: store.tenantId,
        isPublished: true,
        isVisible: true,
        ...(section
          ? { homepageSections: Raw((alias) => `${alias} @> ARRAY['${section}']::products_homepagesections_enum[]`) }
          : {}),
      },
      relations: ['category', 'brand', 'collections', 'images', 'variants'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });

    await this.attachInStock(store.tenantId, products);
    await this.attachRatings(store.tenantId, products);

    // Security: Strip internal merchant costPrice from public storefront response for products and variants
    products.forEach((p) => {
      delete (p as any).costPrice;
      if (p.variants && Array.isArray(p.variants)) {
        p.variants.forEach((v) => {
          delete (v as any).costPrice;
        });
      }
    });

    return {
      store: sanitizePublicStore(store),
      products,
    };
  }

  /**
   * Adds a public-safe `inStock` boolean (never the raw quantity) so the
   * storefront can show an honest In Stock/Out of Stock badge without
   * exposing merchant-only stock counts. Mirrors list-products.service.ts's
   * per-warehouse-summed availability calculation.
   */
  private async attachInStock(tenantId: string, products: ProductEntity[]): Promise<void> {
    if (products.length === 0) return;

    const productIds = products.map((p) => p.id);
    const stockRecords = await this.inventoryStockRepository.find({
      where: { productId: In(productIds), tenantId },
    });

    const availableMap = new Map<string, number>();
    stockRecords.forEach((st) => {
      const acc = availableMap.get(st.productId) || 0;
      availableMap.set(st.productId, acc + (Number(st.quantityOnHand) || 0) - (Number(st.quantityReserved) || 0));
    });

    products.forEach((product) => {
      const available = availableMap.get(product.id) ?? 0;
      (product as any).inStock = !product.trackInventory || product.allowBackorder || available > 0;
    });
  }

  /**
   * Adds public `avgRating` (0–5, one decimal) and `reviewCount` from approved
   * reviews so the storefront can show rating badges and drive the rating
   * filter. One GROUP BY query — never N+1.
   */
  private async attachRatings(tenantId: string, products: ProductEntity[]): Promise<void> {
    if (products.length === 0) return;

    const productIds = products.map((p) => p.id);
    const rows = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.productId', 'productId')
      .addSelect('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'reviewCount')
      .where('review.tenantId = :tenantId', { tenantId })
      .andWhere('review.productId IN (:...productIds)', { productIds })
      .andWhere('review.isApproved = true')
      .groupBy('review.productId')
      .getRawMany<{ productId: string; avgRating: string; reviewCount: string }>();

    const ratingMap = new Map<string, { avgRating: number; reviewCount: number }>();
    rows.forEach((r) => {
      ratingMap.set(r.productId, {
        avgRating: Math.round(Number(r.avgRating) * 10) / 10,
        reviewCount: Number(r.reviewCount),
      });
    });

    products.forEach((product) => {
      const rating = ratingMap.get(product.id);
      (product as any).avgRating = rating?.avgRating ?? 0;
      (product as any).reviewCount = rating?.reviewCount ?? 0;
    });
  }
}
