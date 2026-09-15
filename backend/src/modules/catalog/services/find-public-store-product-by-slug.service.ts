import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { FindStoreBySlugService } from '../../tenant/services/find-store-by-slug.service';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { sanitizePublicStore } from '../../tenant/utils/sanitize-public-store.util';

export interface PublicStoreProductResponse {
  store: StoreEntity;
  product: ProductEntity;
}

/**
 * Single-product counterpart to FindPublicStoreProductsService — needed for
 * direct PDP URL loads/SEO rather than depending on the bulk list already
 * being in the RTK Query cache. Mirrors that service's tenant-scoping,
 * visibility gate, and costPrice-stripping, but resolves by slug (SEO-safe),
 * not raw UUID, matching FindStoreBySlugService's own convention.
 */
@Injectable()
export class FindPublicStoreProductBySlugService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly inventoryStockRepository: Repository<InventoryStockEntity>,
    private readonly findStoreBySlugService: FindStoreBySlugService,
  ) {}

  async execute(storeSlug: string, productSlug: string): Promise<PublicStoreProductResponse> {
    const store = await this.findStoreBySlugService.execute(storeSlug);

    const product = await this.productRepository.findOne({
      where: { tenantId: store.tenantId, slug: productSlug, isPublished: true, isVisible: true },
      relations: ['category', 'brand', 'collections', 'images', 'variants'],
    });

    if (!product) {
      throw new NotFoundException(`Product "${productSlug}" not found.`);
    }

    const stockRecords = await this.inventoryStockRepository.find({
      where: { productId: product.id, tenantId: store.tenantId },
    });
    const available = stockRecords.reduce(
      (sum, st) => sum + (Number(st.quantityOnHand) || 0) - (Number(st.quantityReserved) || 0),
      0,
    );
    (product as any).inStock = !product.trackInventory || product.allowBackorder || available > 0;

    delete (product as any).costPrice;
    product.variants?.forEach((v) => delete (v as any).costPrice);

    return {
      store: sanitizePublicStore(store),
      product,
    };
  }
}
