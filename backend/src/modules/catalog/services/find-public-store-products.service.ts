import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Raw, Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
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
}
