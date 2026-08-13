import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandEntity } from '../entities/brand.entity';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class DeleteBrandService {
  constructor(
    @InjectRepository(BrandEntity)
    private readonly brandRepository: Repository<BrandEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async execute(brandId: string, tenantId: string): Promise<{ message: string }> {
    const brand = await this.brandRepository.findOne({
      where: { id: brandId, tenantId },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // Safety: set brandId to null on associated products before deletion (do not delete products!)
    await this.productRepository.update(
      { brandId, tenantId },
      { brandId: undefined },
    );

    await this.brandRepository.remove(brand);

    return { message: 'Brand deleted successfully' };
  }
}
