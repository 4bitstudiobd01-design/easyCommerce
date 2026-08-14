import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { UpdateCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class UpdateCategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async execute(
    categoryId: string,
    tenantId: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Hierarchy Safety Checks
    if (dto.parentId !== undefined) {
      if (dto.parentId === categoryId) {
        throw new BadRequestException('A category cannot be its own parent');
      }

      if (dto.parentId && dto.parentId.trim() !== '' && dto.parentId !== 'root') {
        const parentCategory = await this.categoryRepository.findOne({
          where: { id: dto.parentId, tenantId },
        });

        if (!parentCategory) {
          throw new NotFoundException('Parent category not found in this store');
        }

        // Circular hierarchy check: walk up ancestor hierarchy of the new parent
        let curr: CategoryEntity | undefined = parentCategory;
        const visited = new Set<string>();

        while (curr) {
          if (curr.id === categoryId) {
            throw new BadRequestException(
              'Circular category hierarchy detected: new parent is a descendant of this category',
            );
          }
          if (visited.has(curr.id)) break;
          visited.add(curr.id);

          if (!curr.parentId) break;
          curr =
            (await this.categoryRepository.findOne({
              where: { id: curr.parentId, tenantId },
            })) || undefined;
        }

        category.parentId = dto.parentId;
      } else {
        category.parentId = undefined;
      }
    }

    // Slug validation and uniqueness
    if (dto.slug !== undefined && dto.slug.trim() !== '') {
      const newSlug = this.slugify(dto.slug);
      if (newSlug !== category.slug) {
        const existingWithSlug = await this.categoryRepository.findOne({
          where: { slug: newSlug, tenantId },
        });
        if (existingWithSlug && existingWithSlug.id !== categoryId) {
          throw new ConflictException(`Category with slug "${newSlug}" already exists in this store`);
        }
        category.slug = newSlug;
      }
    }

    if (dto.name !== undefined && dto.name.trim() !== '') {
      category.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      category.description = dto.description?.trim();
    }
    if (dto.status !== undefined) {
      category.status = dto.status;
    }
    if (dto.sortOrder !== undefined) {
      category.sortOrder = dto.sortOrder;
    }
    if (dto.icon !== undefined) {
      category.icon = dto.icon?.trim() || undefined;
    }
    if (dto.image !== undefined) {
      category.image = dto.image?.trim() || undefined;
    }
    if (dto.isFeatured !== undefined) {
      category.isFeatured = dto.isFeatured;
    }
    if (dto.seoTitle !== undefined) {
      category.seoTitle = dto.seoTitle ? dto.seoTitle.trim() : undefined;
    }
    if (dto.metaDescription !== undefined) {
      category.metaDescription = dto.metaDescription ? dto.metaDescription.trim() : undefined;
    }
    if (dto.isVisible !== undefined) {
      category.isVisible = dto.isVisible;
    }
    if (dto.showInStorefront !== undefined) {
      category.showInStorefront = dto.showInStorefront;
    }

    return this.categoryRepository.save(category);
  }

  private slugify(text: string): string {
    if (!text || !text.trim()) {
      return `category-${Date.now().toString().slice(-6)}`;
    }

    const slug = text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return slug || `category-${Date.now().toString().slice(-6)}`;
  }
}
