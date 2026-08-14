import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { BulkMoveCategoriesDto } from '../dto/bulk-move-categories.dto';

export interface BulkMoveCategoriesResult {
  successCount: number;
  message: string;
}

@Injectable()
export class BulkMoveCategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(tenantId: string, dto: BulkMoveCategoriesDto): Promise<BulkMoveCategoriesResult> {
    if (!dto.categoryIds || dto.categoryIds.length === 0) {
      throw new BadRequestException('No categories selected for movement');
    }

    const uniqueIds = Array.from(new Set(dto.categoryIds));

    // 1. Fetch all categories in tenant to validate existence and traverse ancestor/descendant relationships
    const allTenantCategories = await this.categoryRepository.find({
      where: { tenantId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    const categoryMap = new Map<string, CategoryEntity>();
    const childrenMap = new Map<string, string[]>();

    allTenantCategories.forEach((cat) => {
      categoryMap.set(cat.id, cat);
      if (cat.parentId) {
        const list = childrenMap.get(cat.parentId) || [];
        list.push(cat.id);
        childrenMap.set(cat.parentId, list);
      }
    });

    // Verify all categoryIds exist in this tenant
    for (const id of uniqueIds) {
      if (!categoryMap.has(id)) {
        throw new NotFoundException(`Category with ID ${id} not found in your store`);
      }
    }

    // 2. Validate target parent
    let parentCategory: CategoryEntity | null = null;
    if (dto.newParentId) {
      parentCategory = categoryMap.get(dto.newParentId) || null;
      if (!parentCategory) {
        throw new NotFoundException(`Target parent category with ID ${dto.newParentId} not found in your store`);
      }

      // Target parent cannot be any of the moving categories
      if (uniqueIds.includes(dto.newParentId)) {
        throw new BadRequestException(`Cannot move category under itself`);
      }

      // Target parent cannot be a descendant of ANY of the moving categories (cycle prevention)
      const isDescendantOf = (ancestorId: string, targetId: string): boolean => {
        const queue = [ancestorId];
        const visited = new Set<string>();
        while (queue.length > 0) {
          const current = queue.shift()!;
          if (visited.has(current)) continue;
          visited.add(current);

          const childIds = childrenMap.get(current) || [];
          for (const childId of childIds) {
            if (childId === targetId) return true;
            queue.push(childId);
          }
        }
        return false;
      };

      for (const movedId of uniqueIds) {
        if (isDescendantOf(movedId, dto.newParentId)) {
          const movedName = categoryMap.get(movedId)?.name || movedId;
          throw new BadRequestException(
            `Circular hierarchy detected: cannot move category "${movedName}" under its own descendant "${parentCategory.name}"`,
          );
        }
      }
    }

    // 3. Compute starting sortOrder for newly moved categories under destination parent
    const existingSiblings = allTenantCategories.filter((c) =>
      dto.newParentId ? c.parentId === dto.newParentId : !c.parentId,
    );
    let maxSortOrder = existingSiblings.reduce((max, c) => Math.max(max, c.sortOrder ?? 0), 0);

    // Filter moving categories in their current sort order
    const movingCategories = allTenantCategories.filter((c) => uniqueIds.includes(c.id));

    // 4. Execute atomic movement transaction
    await this.dataSource.transaction(async (manager) => {
      for (const cat of movingCategories) {
        maxSortOrder += 1;
        await manager.update(
          CategoryEntity,
          { id: cat.id, tenantId },
          {
            parentId: dto.newParentId || null,
            sortOrder: maxSortOrder,
            updatedAt: new Date(),
          },
        );
      }
    });

    const targetDesc = parentCategory ? `under "${parentCategory.name}"` : 'to root level';
    return {
      successCount: movingCategories.length,
      message: `Successfully moved ${movingCategories.length} categories ${targetDesc}.`,
    };
  }
}
