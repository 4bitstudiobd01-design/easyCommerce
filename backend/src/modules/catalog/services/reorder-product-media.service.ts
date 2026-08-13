import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImageEntity } from '../entities/product-image.entity';
import { ProductEntity } from '../entities/product.entity';
import { ReorderProductMediaDto } from '../dto/reorder-product-media.dto';

@Injectable()
export class ReorderProductMediaService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductImageEntity)
    private readonly imageRepository: Repository<ProductImageEntity>,
  ) {}

  async execute(productId: string, tenantId: string, dto: ReorderProductMediaDto): Promise<ProductImageEntity[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingImages = await this.imageRepository.find({
      where: { productId, tenantId },
    });

    const existingMap = new Map(existingImages.map((img) => [img.id, img]));

    // Verify all mediaIds belong to this product and tenant
    for (const id of dto.mediaIds) {
      if (!existingMap.has(id)) {
        throw new BadRequestException(`Media item ${id} does not belong to this product or tenant`);
      }
    }

    // Update sortOrder for each item
    for (let index = 0; index < dto.mediaIds.length; index++) {
      const mediaId = dto.mediaIds[index];
      const mediaItem = existingMap.get(mediaId);
      if (mediaItem) {
        mediaItem.sortOrder = index;
        await this.imageRepository.save(mediaItem);
      }
    }

    return this.imageRepository.find({
      where: { productId, tenantId },
      order: { isPrimary: 'DESC', sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }
}
