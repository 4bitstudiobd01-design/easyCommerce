import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CategoryStatus } from '../enums/category-status.enum';

@Injectable()
export class CreateCategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async execute(tenantId: string, dto: CreateCategoryDto): Promise<CategoryEntity> {
    const rawSlug = dto.slug && dto.slug.trim() ? dto.slug : dto.name;
    const slug = this.slugify(rawSlug);

    // Slug uniqueness within the same tenant
    const existingCategory = await this.categoryRepository.findOne({
      where: { slug, tenantId },
    });

    if (existingCategory) {
      throw new ConflictException(`Category with slug "${slug}" already exists in this store`);
    }

    // Hierarchy Safety: validate parent category exists and belongs strictly to this tenant
    if (dto.parentId) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: dto.parentId, tenantId },
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found in this store');
      }
    }

    const category = this.categoryRepository.create({
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim(),
      parentId: dto.parentId || undefined,
      status: dto.status || CategoryStatus.ACTIVE,
      sortOrder: dto.sortOrder ?? 0,
      icon: dto.icon?.trim() || undefined,
      image: dto.image?.trim() || undefined,
      isFeatured: dto.isFeatured ?? false,
      seoTitle: dto.seoTitle?.trim() || undefined,
      metaDescription: dto.metaDescription?.trim() || undefined,
      isVisible: dto.isVisible ?? true,
      showInStorefront: dto.showInStorefront ?? true,
      tenantId,
    });

    return this.categoryRepository.save(category);
  }

  private slugify(text: string): string {
    if (!text || !text.trim()) {
      return `category-${Date.now().toString().slice(-6)}`;
    }

    let slug = text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return slug || `category-${Date.now().toString().slice(-6)}`;
  }
}
