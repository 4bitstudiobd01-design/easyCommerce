import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { FindStoreBySlugService } from '../../tenant/services/find-store-by-slug.service';
import { StoreEntity } from '../../tenant/entities/store.entity';

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
      relations: ['category', 'images', 'variants'],
      order: { createdAt: 'DESC' },
    });

    return {
      store,
      products,
    };
  }
}
