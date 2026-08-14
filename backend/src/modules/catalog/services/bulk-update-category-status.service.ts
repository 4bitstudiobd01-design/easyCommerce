import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { BulkUpdateCategoryStatusDto } from '../dto/bulk-update-category-status.dto';

export interface BulkCategoryStatusResult {
  successCount: number;
  failedCount: number;
  message: string;
}

@Injectable()
export class BulkUpdateCategoryStatusService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(tenantId: string, dto: BulkUpdateCategoryStatusDto): Promise<BulkCategoryStatusResult> {
    if (!dto.categoryIds || dto.categoryIds.length === 0) {
      throw new BadRequestException('No categories selected for status update');
    }

    const uniqueIds = Array.from(new Set(dto.categoryIds));

    // Verify all categories belong to tenant
    const categories = await this.categoryRepository.find({
      where: { id: In(uniqueIds), tenantId },
    });

    if (categories.length === 0) {
      throw new BadRequestException('None of the selected categories belong to your store');
    }

    // Execute in transaction
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(CategoryEntity)
        .set({ status: dto.status, updatedAt: new Date() })
        .where('id IN (:...ids) AND tenantId = :tenantId', { ids: categories.map((c) => c.id), tenantId })
        .execute();
    });

    return {
      successCount: categories.length,
      failedCount: uniqueIds.length - categories.length,
      message: `Successfully updated ${categories.length} categories to ${dto.status}.`,
    };
  }
}
