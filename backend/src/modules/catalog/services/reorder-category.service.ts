import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { ReorderCategoryDto } from '../dto/reorder-category.dto';
import { GetCategoryTreeService, CategoryTreeNode } from './get-category-tree.service';

@Injectable()
export class ReorderCategoryService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly getCategoryTreeService: GetCategoryTreeService,
  ) {}

  async execute(tenantId: string, dto: ReorderCategoryDto): Promise<CategoryTreeNode[]> {
    await this.dataSource.transaction(async (manager) => {
      // 1. Verify category exists in this tenant
      const category = await manager.findOne(CategoryEntity, {
        where: { id: dto.categoryId, tenantId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // 2. Normalize target parent ID
      const targetParentId =
        dto.newParentId && dto.newParentId.trim() !== '' && dto.newParentId !== 'root'
          ? dto.newParentId
          : null;

      // 3. Parent Validation & Circular Hierarchy Detection
      if (targetParentId) {
        if (targetParentId === dto.categoryId) {
          throw new BadRequestException('A category cannot be its own parent');
        }

        const targetParent = await manager.findOne(CategoryEntity, {
          where: { id: targetParentId, tenantId },
        });

        if (!targetParent) {
          throw new NotFoundException('Target parent category not found in this store');
        }

        // Walk up the ancestor tree of targetParent to ensure targetParent is not a descendant of category
        let curr: CategoryEntity | null = targetParent;
        const visited = new Set<string>();

        while (curr) {
          if (curr.id === dto.categoryId) {
            throw new BadRequestException(
              'Circular hierarchy detected: cannot move a category under one of its own descendants',
            );
          }
          if (visited.has(curr.id)) break;
          visited.add(curr.id);

          if (!curr.parentId) break;
          curr = await manager.findOne(CategoryEntity, {
            where: { id: curr.parentId, tenantId },
          });
        }
      }

      // 4. Update parentId
      const oldParentId = category.parentId || null;
      category.parentId = targetParentId || undefined;
      await manager.save(category);

      // 5. Sibling Reordering and Sequential Sort Order Normalization
      if (dto.targetSiblingIds && dto.targetSiblingIds.length > 0) {
        for (let idx = 0; idx < dto.targetSiblingIds.length; idx++) {
          const siblingId = dto.targetSiblingIds[idx];
          await manager.update(
            CategoryEntity,
            { id: siblingId, tenantId },
            {
              sortOrder: idx,
              ...(siblingId === dto.categoryId
                ? { parentId: targetParentId || undefined }
                : {}),
            },
          );
        }
      } else {
        // Fetch all siblings under the new parent (excluding the moved category)
        const siblings = await manager.find(CategoryEntity, {
          where: {
            tenantId,
            parentId: targetParentId ? targetParentId : IsNull(),
          },
          order: { sortOrder: 'ASC', name: 'ASC' },
        });

        const filteredSiblings = siblings.filter((s) => s.id !== dto.categoryId);
        const targetIndex =
          dto.newSortOrder !== undefined
            ? Math.max(0, Math.min(filteredSiblings.length, dto.newSortOrder))
            : filteredSiblings.length;

        filteredSiblings.splice(targetIndex, 0, category);

        for (let idx = 0; idx < filteredSiblings.length; idx++) {
          const item = filteredSiblings[idx];
          await manager.update(
            CategoryEntity,
            { id: item.id, tenantId },
            { sortOrder: idx },
          );
        }
      }

      // If moved to a new parent, also normalize old parent's remaining siblings
      if (oldParentId !== targetParentId) {
        const oldSiblings = await manager.find(CategoryEntity, {
          where: {
            tenantId,
            parentId: oldParentId ? oldParentId : IsNull(),
          },
          order: { sortOrder: 'ASC', name: 'ASC' },
        });

        for (let idx = 0; idx < oldSiblings.length; idx++) {
          await manager.update(
            CategoryEntity,
            { id: oldSiblings[idx].id, tenantId },
            { sortOrder: idx },
          );
        }
      }
    });

    // Return the fresh updated tree
    return this.getCategoryTreeService.execute(tenantId);
  }
}
