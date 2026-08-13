import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  parentId?: string | null;
  icon?: string;
  image?: string;
  isFeatured?: boolean;
}

@Injectable()
export class UpdateCategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async execute(categoryId: string, tenantId: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === categoryId) {
        throw new BadRequestException('A category cannot be its own parent');
      }

      if (dto.parentId) {
        const parentCategory = await this.categoryRepository.findOne({
          where: { id: dto.parentId, tenantId },
        });

        if (!parentCategory) {
          throw new NotFoundException('Parent category not found');
        }

        // Circular reference check: walk up parent hierarchy of new parent
        let curr: CategoryEntity | undefined = parentCategory;
        const visited = new Set<string>();

        while (curr) {
          if (curr.id === categoryId) {
            throw new BadRequestException('Circular category hierarchy detected: new parent is a descendant of this category');
          }
          if (visited.has(curr.id)) break;
          visited.add(curr.id);

          if (!curr.parentId) break;
          curr = await this.categoryRepository.findOne({ where: { id: curr.parentId, tenantId } }) || undefined;
        }

        category.parentId = dto.parentId;
      } else {
        category.parentId = undefined;
      }
    }

    if (dto.name && dto.name.trim()) {
      category.name = dto.name.trim();
      category.slug = dto.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
    }

    if (dto.description !== undefined) category.description = dto.description;
    if (dto.icon !== undefined) category.icon = dto.icon;
    if (dto.image !== undefined) category.image = dto.image;
    if (dto.isFeatured !== undefined) category.isFeatured = dto.isFeatured;

    return this.categoryRepository.save(category);
  }
}
