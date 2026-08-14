import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { ProductEntity } from '../entities/product.entity';
import { BulkDeleteCategoriesDto } from '../dto/bulk-delete-categories.dto';

export interface BulkDeleteCategoriesResult {
  successCount: number;
  message: string;
}

@Injectable()
export class BulkDeleteCategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(tenantId: string, dto: BulkDeleteCategoriesDto): Promise<BulkDeleteCategoriesResult> {
    if (!dto.categoryIds || dto.categoryIds.length === 0) {
      throw new BadRequestException('No categories selected for deletion');
    }

    const uniqueIds = Array.from(new Set(dto.categoryIds));

    // Verify categories belong to tenant
    const categories = await this.categoryRepository.find({
      where: { id: In(uniqueIds), tenantId },
    });

    if (categories.length === 0) {
      throw new BadRequestException('None of the selected categories belong to your store');
    }

    const validIds = categories.map((c) => c.id);

    // Execute in transaction
    await this.dataSource.transaction(async (manager) => {
      // 1. Unlink child categories so they become root categories safely
      await manager
        .createQueryBuilder()
        .update(CategoryEntity)
        .set({ parentId: null, updatedAt: new Date() })
        .where('parentId IN (:...ids) AND tenantId = :tenantId', { ids: validIds, tenantId })
        .execute();

      // 2. Unlink products so they become uncategorized safely (SET NULL)
      await manager
        .createQueryBuilder()
        .update(ProductEntity)
        .set({ categoryId: null, updatedAt: new Date() })
        .where('categoryId IN (:...ids) AND tenantId = :tenantId', { ids: validIds, tenantId })
        .execute();

      // 3. Delete categories
      await manager
        .createQueryBuilder()
        .delete()
        .from(CategoryEntity)
        .where('id IN (:...ids) AND tenantId = :tenantId', { ids: validIds, tenantId })
        .execute();
    });

    return {
      successCount: validIds.length,
      message: `Successfully deleted ${validIds.length} categories. Associated products have been unlinked safely.`,
    };
  }
}
