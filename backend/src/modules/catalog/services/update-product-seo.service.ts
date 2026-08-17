import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ProductSlugService } from './product-slug.service';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateProductSeoDto {
  @ApiProperty({ example: "Men's Organic Polo Shirt | BitCommerce", description: 'SEO Title tag', required: false })
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiProperty({ example: 'Buy premium 100% organic cotton polo shirts with fast delivery.', description: 'Meta description', required: false })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiProperty({ example: 'mens-organic-polo-shirt', description: 'Product URL slug', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'https://bitcommerce.io/products/mens-organic-polo-shirt', description: 'Canonical URL override', required: false })
  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @ApiProperty({ example: true, description: 'Whether search engines should index this product page', required: false })
  @IsOptional()
  @IsBoolean()
  isSearchEngineIndexed?: boolean;
}

@Injectable()
export class UpdateProductSeoService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly productSlugService: ProductSlugService,
  ) {}

  async execute(productId: string, tenantId: string, dto: UpdateProductSeoDto): Promise<ProductEntity> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.slug && dto.slug.trim() !== product.slug) {
      product.slug = await this.productSlugService.generateSlug(dto.slug.trim(), tenantId, productId);
    }

    if (dto.seoTitle !== undefined) {
      product.seoTitle = dto.seoTitle ? dto.seoTitle.trim() : undefined;
    }

    if (dto.metaDescription !== undefined) {
      product.metaDescription = dto.metaDescription ? dto.metaDescription.trim() : undefined;
    }

    if (dto.canonicalUrl !== undefined) {
      product.canonicalUrl = dto.canonicalUrl ? dto.canonicalUrl.trim() : undefined;
    }

    if (dto.isSearchEngineIndexed !== undefined) {
      product.isSearchEngineIndexed = Boolean(dto.isSearchEngineIndexed);
    }

    return this.productRepository.save(product);
  }
}
