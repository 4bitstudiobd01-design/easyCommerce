import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryStatus } from '../enums/category-status.enum';

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  status: CategoryStatus;
  sortOrder: number;
  icon?: string;
  image?: string;
  isFeatured: boolean;
  seoTitle?: string;
  metaDescription?: string;
  isVisible: boolean;
  showInStorefront: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  productsCount: number;
  subcategoriesCount: number;
  children: CategoryTreeNode[];
}

@Injectable()
export class GetCategoryTreeService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async execute(tenantId: string): Promise<CategoryTreeNode[]> {
    // Fetch all categories for tenant in a single query with product count
    const rawCategories = await this.categoryRepository
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .addSelect(
        `(SELECT COUNT(p.id)::int FROM products p WHERE p."categoryId" = c.id AND p."tenantId" = :tenantId)`,
        'productsCount',
      )
      .addSelect(
        `(SELECT COUNT(sub.id)::int FROM categories sub WHERE sub."parentId" = c.id AND sub."tenantId" = :tenantId)`,
        'subcategoriesCount',
      )
      .orderBy('c.sortOrder', 'ASC')
      .addOrderBy('c.name', 'ASC')
      .getRawAndEntities();

    const nodeMap = new Map<string, CategoryTreeNode>();
    const rootNodes: CategoryTreeNode[] = [];

    // First pass: map raw items and entities into CategoryTreeNodes
    rawCategories.entities.forEach((entity, index) => {
      const raw = rawCategories.raw[index] || {};
      const productsCount = Number(
        raw.productsCount !== undefined
          ? raw.productsCount
          : raw.c_productsCount !== undefined
          ? raw.c_productsCount
          : 0,
      );
      const subcategoriesCount = Number(
        raw.subcategoriesCount !== undefined
          ? raw.subcategoriesCount
          : raw.c_subcategoriesCount !== undefined
          ? raw.c_subcategoriesCount
          : 0,
      );

      const node: CategoryTreeNode = {
        id: entity.id,
        name: entity.name,
        slug: entity.slug,
        description: entity.description,
        parentId: entity.parentId || null,
        status: entity.status,
        sortOrder: entity.sortOrder ?? 0,
        icon: entity.icon,
        image: entity.image,
        isFeatured: entity.isFeatured,
        seoTitle: entity.seoTitle,
        metaDescription: entity.metaDescription,
        isVisible: entity.isVisible ?? true,
        showInStorefront: entity.showInStorefront ?? true,
        tenantId: entity.tenantId,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        productsCount,
        subcategoriesCount,
        children: [],
      };

      nodeMap.set(node.id, node);
    });

    // Second pass: construct parent -> children hierarchy
    nodeMap.forEach((node) => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!;
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }
}
