import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryListDto } from '../dto/category-list.dto';
import { CategoryStatus } from '../enums/category-status.enum';

export interface CategoryListItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  status: CategoryStatus;
  sortOrder: number;
  icon?: string;
  image?: string;
  isFeatured: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  parentCategory?: {
    id: string;
    name: string;
    slug: string;
  };
  productsCount: number;
  subcategoriesCount: number;
}

export interface CategoryListResult {
  data: CategoryListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
  };
}

@Injectable()
export class ListCategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async execute(tenantId: string, dto?: CategoryListDto): Promise<CategoryListResult> {
    const params = dto || new CategoryListDto();
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const query = this.categoryRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.parentCategory', 'parentCategory')
      .where('c.tenantId = :tenantId', { tenantId });

    // Search filter (name or slug)
    if (params.search && params.search.trim()) {
      const s = `%${params.search.trim()}%`;
      query.andWhere('(c.name ILIKE :s OR c.slug ILIKE :s)', { s });
    }

    // Status filter
    if (params.status) {
      query.andWhere('c.status = :status', { status: params.status });
    }

    // Parent filter
    if (params.parentId && params.parentId !== 'all') {
      if (params.parentId === 'root' || params.parentId === 'null') {
        query.andWhere('c.parentId IS NULL');
      } else {
        query.andWhere('c.parentId = :parentId', { parentId: params.parentId });
      }
    }

    // Add correlated subqueries for accurate product count and subcategory count
    query.addSelect(
      `(SELECT COUNT(p.id)::int FROM products p WHERE p."categoryId" = c.id AND p."tenantId" = :tenantId)`,
      'productsCount',
    );
    query.addSelect(
      `(SELECT COUNT(sub.id)::int FROM categories sub WHERE sub."parentId" = c.id AND sub."tenantId" = :tenantId)`,
      'subcategoriesCount',
    );

    const total = await query.getCount();
    const totalPages = Math.ceil(total / limit) || 1;

    // Sorting with strict field whitelisting
    const sortDir = params.sortOrder === 'DESC' ? 'DESC' : 'ASC';
    if (params.sortBy === 'productsCount') {
      query.orderBy('"productsCount"', sortDir);
    } else if (params.sortBy === 'name') {
      query.orderBy('c.name', sortDir);
    } else if (params.sortBy === 'createdAt') {
      query.orderBy('c.createdAt', sortDir);
    } else if (params.sortBy === 'updatedAt') {
      query.orderBy('c.updatedAt', sortDir);
    } else if (params.sortBy === 'status') {
      query.orderBy('c.status', sortDir);
    } else {
      query.orderBy('c.sortOrder', sortDir).addOrderBy('c.name', 'ASC');
    }

    query.skip(skip).take(limit);

    const { entities, raw } = await query.getRawAndEntities();

    const data: CategoryListItem[] = entities.map((entity, index) => {
      const rawItem = raw[index] || {};
      const productsCount = Number(
        rawItem.productsCount !== undefined
          ? rawItem.productsCount
          : rawItem.c_productsCount !== undefined
          ? rawItem.c_productsCount
          : 0,
      );
      const subcategoriesCount = Number(
        rawItem.subcategoriesCount !== undefined
          ? rawItem.subcategoriesCount
          : rawItem.c_subcategoriesCount !== undefined
          ? rawItem.c_subcategoriesCount
          : 0,
      );

      return {
        id: entity.id,
        name: entity.name,
        slug: entity.slug,
        description: entity.description,
        parentId: entity.parentId,
        status: entity.status,
        sortOrder: entity.sortOrder,
        icon: entity.icon,
        image: entity.image,
        isFeatured: entity.isFeatured,
        tenantId: entity.tenantId,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        parentCategory: entity.parentCategory
          ? {
              id: entity.parentCategory.id,
              name: entity.parentCategory.name,
              slug: entity.parentCategory.slug,
            }
          : undefined,
        productsCount,
        subcategoriesCount,
      };
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    };
  }
}
