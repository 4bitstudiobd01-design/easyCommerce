import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryAttributeEntity } from '../entities/category-attribute.entity';

@Injectable()
export class AssignCategoryAttributesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(CategoryAttributeEntity)
    private readonly categoryAttributeRepository: Repository<CategoryAttributeEntity>,
  ) {}

  async execute(
    categoryId: string,
    tenantId: string,
    attributeIds: string[],
  ): Promise<{ message: string; count: number }> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Clear existing category attribute bindings for this category
    await this.categoryAttributeRepository.delete({ categoryId, tenantId });

    if (attributeIds && attributeIds.length > 0) {
      const uniqueAttributeIds = Array.from(new Set(attributeIds));
      const entities = uniqueAttributeIds.map((attrId, idx) =>
        this.categoryAttributeRepository.create({
          categoryId,
          attributeId: attrId,
          sortOrder: idx,
          tenantId,
        }),
      );
      await this.categoryAttributeRepository.save(entities);
      return { message: 'Attributes assigned to category successfully', count: entities.length };
    }

    return { message: 'Category attributes cleared successfully', count: 0 };
  }
}
