import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryAttributeEntity } from '../entities/category-attribute.entity';
import { AttributeDefinitionEntity } from '../entities/attribute-definition.entity';

@Injectable()
export class GetCategoryAttributesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(CategoryAttributeEntity)
    private readonly categoryAttributeRepository: Repository<CategoryAttributeEntity>,
    @InjectRepository(AttributeDefinitionEntity)
    private readonly attributeRepository: Repository<AttributeDefinitionEntity>,
  ) {}

  async execute(categoryId: string, tenantId: string): Promise<AttributeDefinitionEntity[]> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Walk up the category hierarchy to resolve ancestor category IDs
    const categoryIds: string[] = [category.id];
    let currentCategory: CategoryEntity | undefined = category;

    while (currentCategory?.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: currentCategory.parentId, tenantId },
      });
      if (parent && !categoryIds.includes(parent.id)) {
        categoryIds.push(parent.id);
        currentCategory = parent;
      } else {
        break;
      }
    }

    const categoryAttributes = await this.categoryAttributeRepository.find({
      where: { categoryId: In(categoryIds), tenantId },
    });

    const attributeIds = Array.from(new Set(categoryAttributes.map((ca) => ca.attributeId)));

    if (attributeIds.length === 0) {
      return [];
    }

    return this.attributeRepository.find({
      where: { id: In(attributeIds), tenantId },
      relations: ['options'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }
}
