import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';

@Injectable()
export class ListParentCategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async execute(tenantId: string): Promise<CategoryEntity[]> {
    return this.categoryRepository.find({
      where: {
        tenantId,
        parentId: IsNull(),
      },
      select: ['id', 'name', 'slug', 'icon', 'status', 'sortOrder', 'createdAt'],
      order: {
        sortOrder: 'ASC',
        name: 'ASC',
      },
    });
  }
}
