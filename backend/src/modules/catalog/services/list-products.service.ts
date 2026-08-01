import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class ListProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async execute(tenantId: string): Promise<ProductEntity[]> {
    return this.productRepository.find({
      where: { tenantId },
      relations: ['category', 'images', 'variants'],
      order: { createdAt: 'DESC' },
    });
  }
}
