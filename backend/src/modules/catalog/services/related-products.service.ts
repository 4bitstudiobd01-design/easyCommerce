import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductRelationEntity } from '../entities/product-relation.entity';
import { ProductEntity } from '../entities/product.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsArray, ArrayMinSize } from 'class-validator';

export class AddRelatedProductDto {
  @ApiProperty({ example: 'related-prod-uuid', description: 'ID of related product' })
  @IsNotEmpty()
  @IsUUID('4')
  relatedProductId: string;
}

export class ReorderRelatedProductsDto {
  @ApiProperty({ example: ['rel-uuid-1', 'rel-uuid-2'], description: 'Ordered list of related product IDs' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  relatedProductIds: string[];
}

@Injectable()
export class AddRelatedProductService {
  constructor(
    @InjectRepository(ProductRelationEntity)
    private readonly relationRepository: Repository<ProductRelationEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async execute(productId: string, tenantId: string, dto: AddRelatedProductDto): Promise<ProductRelationEntity> {
    if (productId === dto.relatedProductId) {
      throw new BadRequestException('A product cannot be related to itself');
    }

    // Verify parent product ownership
    const parentProduct = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });
    if (!parentProduct) {
      throw new NotFoundException('Parent product not found');
    }

    // Verify related product ownership in tenant
    const targetProduct = await this.productRepository.findOne({
      where: { id: dto.relatedProductId, tenantId },
    });
    if (!targetProduct) {
      throw new NotFoundException('Target related product not found in store');
    }

    // Check duplicate
    const existing = await this.relationRepository.findOne({
      where: { productId, relatedProductId: dto.relatedProductId, tenantId },
    });
    if (existing) {
      throw new BadRequestException('Product relation already exists');
    }

    // Determine max sortOrder
    const currentRelations = await this.relationRepository.find({
      where: { productId, tenantId },
      order: { sortOrder: 'DESC' },
    });

    const nextSortOrder = currentRelations.length > 0 ? currentRelations[0].sortOrder + 1 : 0;

    const relation = this.relationRepository.create({
      productId,
      relatedProductId: dto.relatedProductId,
      sortOrder: nextSortOrder,
      tenantId,
    });

    return this.relationRepository.save(relation);
  }
}

@Injectable()
export class RemoveRelatedProductService {
  constructor(
    @InjectRepository(ProductRelationEntity)
    private readonly relationRepository: Repository<ProductRelationEntity>,
  ) {}

  async execute(productId: string, relatedProductId: string, tenantId: string): Promise<void> {
    const relation = await this.relationRepository.findOne({
      where: { productId, relatedProductId, tenantId },
    });

    if (!relation) {
      throw new NotFoundException('Related product association not found');
    }

    await this.relationRepository.remove(relation);
  }
}

@Injectable()
export class ListRelatedProductsService {
  constructor(
    @InjectRepository(ProductRelationEntity)
    private readonly relationRepository: Repository<ProductRelationEntity>,
  ) {}

  async execute(productId: string, tenantId: string): Promise<ProductRelationEntity[]> {
    return this.relationRepository.find({
      where: { productId, tenantId },
      relations: ['relatedProduct', 'relatedProduct.images', 'relatedProduct.category'],
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }
}

@Injectable()
export class ReorderRelatedProductsService {
  constructor(
    @InjectRepository(ProductRelationEntity)
    private readonly relationRepository: Repository<ProductRelationEntity>,
  ) {}

  async execute(productId: string, tenantId: string, dto: ReorderRelatedProductsDto): Promise<ProductRelationEntity[]> {
    const relations = await this.relationRepository.find({
      where: { productId, tenantId },
    });

    for (let index = 0; index < dto.relatedProductIds.length; index++) {
      const relId = dto.relatedProductIds[index];
      const match = relations.find((r) => r.relatedProductId === relId || r.id === relId);
      if (match) {
        match.sortOrder = index;
        await this.relationRepository.save(match);
      }
    }

    return this.relationRepository.find({
      where: { productId, tenantId },
      relations: ['relatedProduct', 'relatedProduct.images'],
      order: { sortOrder: 'ASC' },
    });
  }
}
