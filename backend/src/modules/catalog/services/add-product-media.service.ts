import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImageEntity } from '../entities/product-image.entity';
import { ProductEntity } from '../entities/product.entity';
import { AddProductMediaDto } from '../dto/add-product-media.dto';

@Injectable()
export class AddProductMediaService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductImageEntity)
    private readonly imageRepository: Repository<ProductImageEntity>,
  ) {}

  async execute(productId: string, tenantId: string, dto: AddProductMediaDto): Promise<ProductImageEntity> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingImages = await this.imageRepository.find({
      where: { productId, tenantId },
      order: { sortOrder: 'ASC' },
    });

    // If this is the first image, force it to be primary and sortOrder 0
    const isFirstImage = existingImages.length === 0;
    const shouldBePrimary = isFirstImage || Boolean(dto.isPrimary);

    if (shouldBePrimary && !isFirstImage) {
      // Clear primary flag on existing siblings
      await this.imageRepository.update(
        { productId, tenantId },
        { isPrimary: false },
      );
    }

    const sortOrder = dto.sortOrder !== undefined ? dto.sortOrder : existingImages.length;

    const newMedia = this.imageRepository.create({
      url: dto.url.trim(),
      altText: dto.altText ? dto.altText.trim() : product.name,
      isPrimary: shouldBePrimary,
      sortOrder,
      productId,
      tenantId,
    });

    return this.imageRepository.save(newMedia);
  }
}
