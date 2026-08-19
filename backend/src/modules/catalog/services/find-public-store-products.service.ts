import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
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
    private readonly findStoreBySlugService: FindStoreBySlugService,
  ) {}

  async execute(slug: string): Promise<PublicStoreProductsResponse> {
    const store = await this.findStoreBySlugService.execute(slug);

    const products = await this.productRepository.find({
      where: { tenantId: store.tenantId, isPublished: true },
      relations: ['category', 'brand', 'collections', 'images', 'variants'],
      order: { createdAt: 'DESC' },
    });

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
}
