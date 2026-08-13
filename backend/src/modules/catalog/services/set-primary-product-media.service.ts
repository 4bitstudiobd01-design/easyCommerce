import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImageEntity } from '../entities/product-image.entity';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class SetPrimaryProductMediaService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductImageEntity)
    private readonly imageRepository: Repository<ProductImageEntity>,
  ) {}

  async execute(productId: string, mediaId: string, tenantId: string): Promise<ProductImageEntity> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const targetMedia = await this.imageRepository.findOne({
      where: { id: mediaId, productId, tenantId },
    });

    if (!targetMedia) {
      throw new NotFoundException('Media image not found for this product');
    }

    // Clear primary flag on all sibling images of this product
    await this.imageRepository.update(
      { productId, tenantId },
      { isPrimary: false },
    );

    // Set target image as primary
    targetMedia.isPrimary = true;
    return this.imageRepository.save(targetMedia);
  }
}
