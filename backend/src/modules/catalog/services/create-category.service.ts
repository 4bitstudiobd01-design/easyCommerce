import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class CreateCategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async execute(tenantId: string, dto: CreateCategoryDto): Promise<CategoryEntity> {
    const slug = dto.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    const existingCategory = await this.categoryRepository.findOne({
      where: { slug, tenantId },
    });

    if (existingCategory) {
      return existingCategory;
    }

    const category = this.categoryRepository.create({
      name: dto.name,
      slug,
      description: dto.description,
      parentId: dto.parentId || undefined,
      icon: dto.icon || undefined,
      image: dto.image || undefined,
      isFeatured: dto.isFeatured ?? false,
      tenantId,
    });

    return this.categoryRepository.save(category);
  }
}
