import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ProductStatus } from '../enums/product-status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsUUID, ArrayMinSize } from 'class-validator';

export class BulkUpdateProductStatusDto {
  @ApiProperty({ example: ['prod-uuid-1', 'prod-uuid-2'], description: 'Product IDs' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one product for status update' })
  @IsUUID('4', { each: true })
  productIds: string[];

  @ApiProperty({ enum: ProductStatus, example: ProductStatus.ACTIVE, description: 'Target Product Status' })
  @IsEnum(ProductStatus)
  status: ProductStatus;
}

export interface BulkStatusFailure {
  productId: string;
  productName?: string;
  reason: string;
}

export interface BulkStatusResult {
  successCount: number;
  failedCount: number;
  failures: BulkStatusFailure[];
}

@Injectable()
export class BulkUpdateProductStatusService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async execute(tenantId: string, dto: BulkUpdateProductStatusDto): Promise<BulkStatusResult> {
    if (!dto.productIds || dto.productIds.length === 0) {
      throw new BadRequestException('No products selected');
    }

    const products = await this.productRepository.find({
      where: { id: In(dto.productIds), tenantId },
    });

    if (products.length === 0) {
      throw new BadRequestException('Selected products not found in tenant');
    }

    const failures: BulkStatusFailure[] = [];
    const successProducts: ProductEntity[] = [];

    for (const product of products) {
      // Transition validation when publishing to ACTIVE
      if (dto.status === ProductStatus.ACTIVE) {
        if (!product.name || !product.name.trim()) {
          failures.push({
            productId: product.id,
            productName: product.name,
            reason: 'Product name is empty or invalid',
          });
          continue;
        }

        if (product.basePrice < 0) {
          failures.push({
            productId: product.id,
            productName: product.name,
            reason: 'Base price cannot be negative',
          });
          continue;
        }
      }

      product.status = dto.status;
      product.isPublished = dto.status === ProductStatus.ACTIVE;

      // Matches UpdateProductService: record the first go-live date only.
      if (dto.status === ProductStatus.ACTIVE && !product.publishedAt) {
        product.publishedAt = new Date();
      }

      successProducts.push(product);
    }

    if (successProducts.length > 0) {
      await this.productRepository.save(successProducts);
    }

    return {
      successCount: successProducts.length,
      failedCount: failures.length,
      failures,
    };
  }
}
