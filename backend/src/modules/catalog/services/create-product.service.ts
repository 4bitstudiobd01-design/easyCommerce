import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { ProductImageEntity } from '../entities/product-image.entity';
import { CreateProductDto } from '../dto/create-product.dto';

@Injectable()
export class CreateProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(ProductImageEntity)
    private readonly imageRepository: Repository<ProductImageEntity>,
  ) {}

  async execute(tenantId: string, dto: CreateProductDto): Promise<ProductEntity> {
    const slug = dto.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-4);

    const product = this.productRepository.create({
      title: dto.title,
      slug,
      description: dto.description,
      basePrice: dto.basePrice,
      compareAtPrice: dto.compareAtPrice,
      categoryId: dto.categoryId,
      isPublished: true,
      tenantId,
    });

    const savedProduct = await this.productRepository.save(product);

    // Create default SKU variant
    const defaultVariant = this.variantRepository.create({
      sku: dto.sku || `SKU-${Date.now().toString().slice(-6)}`,
      price: dto.basePrice,
      compareAtPrice: dto.compareAtPrice,
      productId: savedProduct.id,
      tenantId,
    });
    await this.variantRepository.save(defaultVariant);

    // Create primary image if provided
    if (dto.imageUrl) {
      const productImage = this.imageRepository.create({
        url: dto.imageUrl,
        altText: dto.title,
        isPrimary: true,
        productId: savedProduct.id,
        tenantId,
      });
      await this.imageRepository.save(productImage);
    }

    return this.productRepository.findOne({
      where: { id: savedProduct.id },
      relations: ['category', 'variants', 'images'],
    }) as Promise<ProductEntity>;
  }
}
