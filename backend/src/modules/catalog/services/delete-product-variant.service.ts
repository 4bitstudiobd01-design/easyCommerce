import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class DeleteProductVariantService {
  constructor(
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async execute(productId: string, variantId: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId, productId, tenantId },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found or access denied');
    }

    await this.variantRepository.remove(variant);

    // Check if remaining variants exist
    const remainingCount = await this.variantRepository.count({
      where: { productId, tenantId },
    });

    if (remainingCount === 0) {
      await this.productRepository.update({ id: productId, tenantId }, { hasVariants: false });
    }

    return { success: true, message: 'Variant deleted successfully' };
  }
}
