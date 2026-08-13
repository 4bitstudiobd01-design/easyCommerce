import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImageEntity } from '../entities/product-image.entity';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class DeleteProductMediaService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductImageEntity)
    private readonly imageRepository: Repository<ProductImageEntity>,
  ) {}

  async execute(productId: string, mediaId: string, tenantId: string): Promise<{ message: string }> {
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

    const wasPrimary = targetMedia.isPrimary;

    await this.imageRepository.remove(targetMedia);

    // If the deleted image was primary, automatically promote the first remaining image
    if (wasPrimary) {
      const remainingImages = await this.imageRepository.find({
        where: { productId, tenantId },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });

      if (remainingImages.length > 0) {
        const nextPrimary = remainingImages[0];
        nextPrimary.isPrimary = true;
        await this.imageRepository.save(nextPrimary);
      }
    }

    return { message: 'Media deleted successfully' };
  }
}
