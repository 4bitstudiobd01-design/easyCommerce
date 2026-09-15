import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CategoryEntity } from '../entities/category.entity';
import { ProductEntity } from '../entities/product.entity';
import { CreateCategoryService } from './create-category.service';
import { FindCategoryByIdService } from './find-category-by-id.service';
import { UpdateCategoryService } from './update-category.service';
import { DeleteCategoryService } from './delete-category.service';
import { ListCategoriesService } from './list-categories.service';
import { CategoryStatus } from '../enums/category-status.enum';

describe('Category Domain & Database Foundation (Chunk 1)', () => {
  let createService: CreateCategoryService;
  let findByIdService: FindCategoryByIdService;
  let updateService: UpdateCategoryService;
  let deleteService: DeleteCategoryService;
  let listService: ListCategoriesService;

  let categoryRepo: any;
  let productRepo: any;

  const tenantA = 'tenant-uuid-store-a';
  const tenantB = 'tenant-uuid-store-b';

  beforeEach(async () => {
    // In-memory mock store for Category repository
    const categoriesStore: CategoryEntity[] = [];

    categoryRepo = {
      create: jest.fn().mockImplementation((dto) => ({
        id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: CategoryStatus.ACTIVE,
        sortOrder: 0,
        ...dto,
      })),
      save: jest.fn().mockImplementation(async (entity) => {
        const idx = categoriesStore.findIndex((c) => c.id === entity.id);
        if (idx >= 0) {
          categoriesStore[idx] = { ...categoriesStore[idx], ...entity };
          return categoriesStore[idx];
        }
        categoriesStore.push(entity);
        return entity;
      }),
      findOne: jest.fn().mockImplementation(async ({ where }) => {
        return categoriesStore.find((c) => {
          return Object.entries(where).every(([key, val]) => (c as any)[key] === val);
        }) || null;
      }),
      find: jest.fn().mockImplementation(async ({ where }) => {
        return categoriesStore.filter((c) => {
          return Object.entries(where).every(([key, val]) => (c as any)[key] === val);
        });
      }),
      remove: jest.fn().mockImplementation(async (entity) => {
        const idx = categoriesStore.findIndex((c) => c.id === entity.id);
        if (idx >= 0) {
          categoriesStore.splice(idx, 1);
        }
        return entity;
      }),
      update: jest.fn().mockImplementation(async (criteria, partial) => {
        categoriesStore.forEach((c) => {
          const match = Object.entries(criteria).every(([k, v]) => (c as any)[k] === v);
          if (match) {
            Object.assign(c, partial);
          }
        });
        return { affected: 1 };
      }),
      createQueryBuilder: jest.fn().mockImplementation(() => {
        let tenantFilter = '';
        const qb: any = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockImplementation((_sql, params) => {
            if (params?.tenantId) tenantFilter = params.tenantId;
            return qb;
          }),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockImplementation(async () => {
            return categoriesStore.filter((c) => c.tenantId === tenantFilter).length;
          }),
          getRawOne: jest.fn().mockResolvedValue({ productsCount: 0, subcategoriesCount: 0 }),
          getRawAndEntities: jest.fn().mockImplementation(async () => {
            const entities = categoriesStore.filter((c) => c.tenantId === tenantFilter);
            const raw = entities.map(() => ({ productsCount: 0, subcategoriesCount: 0 }));
            return { entities, raw };
          }),
        };
        return qb;
      }),
      query: jest.fn().mockResolvedValue([]),
    };

    productRepo = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCategoryService,
        FindCategoryByIdService,
        UpdateCategoryService,
        DeleteCategoryService,
        ListCategoriesService,
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: categoryRepo,
        },
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: productRepo,
        },
      ],
    }).compile();

    createService = module.get<CreateCategoryService>(CreateCategoryService);
    findByIdService = module.get<FindCategoryByIdService>(FindCategoryByIdService);
    updateService = module.get<UpdateCategoryService>(UpdateCategoryService);
    deleteService = module.get<DeleteCategoryService>(DeleteCategoryService);
    listService = module.get<ListCategoriesService>(ListCategoriesService);
  });

  describe('1. Category Creation', () => {
    it('should create a category with defaults (status ACTIVE, sortOrder 0, slug from name)', async () => {
      const category = await createService.execute(tenantA, {
        name: 'Men Fashion',
        description: 'Apparel for men',
      });

      expect(category).toBeDefined();
      expect(category.name).toBe('Men Fashion');
      expect(category.slug).toBe('men-fashion');
      expect(category.status).toBe(CategoryStatus.ACTIVE);
      expect(category.sortOrder).toBe(0);
      expect(category.tenantId).toBe(tenantA);
    });

    it('should allow custom slug, status, and sortOrder', async () => {
      const category = await createService.execute(tenantA, {
        name: 'Winter Jackets',
        slug: 'custom-winter-sale',
        status: CategoryStatus.DRAFT,
        sortOrder: 5,
      });

      expect(category.slug).toBe('custom-winter-sale');
      expect(category.status).toBe(CategoryStatus.DRAFT);
      expect(category.sortOrder).toBe(5);
    });
  });

  describe('2. Duplicate Slug Within Same Tenant', () => {
    it('should reject creating a category with duplicate slug within the same tenant', async () => {
      await createService.execute(tenantA, {
        name: 'Electronics',
        slug: 'electronics',
      });

      await expect(
        createService.execute(tenantA, {
          name: 'Electronics Gadgets',
          slug: 'electronics',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject updating category to a slug already used in the same tenant', async () => {
      const cat1 = await createService.execute(tenantA, { name: 'Books', slug: 'books' });
      const cat2 = await createService.execute(tenantA, { name: 'Novels', slug: 'novels' });

      await expect(
        updateService.execute(cat2.id, tenantA, { slug: 'books' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('3. Same Slug Across Different Tenants', () => {
    it('should allow the same slug in different tenant stores', async () => {
      const storeACat = await createService.execute(tenantA, {
        name: 'Fashion',
        slug: 'fashion',
      });

      const storeBCat = await createService.execute(tenantB, {
        name: 'Fashion',
        slug: 'fashion',
      });

      expect(storeACat.slug).toBe('fashion');
      expect(storeBCat.slug).toBe('fashion');
      expect(storeACat.tenantId).toBe(tenantA);
      expect(storeBCat.tenantId).toBe(tenantB);
    });
  });

  describe('4. Invalid / Non-existent Parent', () => {
    it('should reject category creation when parent category does not exist', async () => {
      await expect(
        createService.execute(tenantA, {
          name: 'Sub Item',
          parentId: 'non-existent-parent-uuid',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject category update when target parent does not exist', async () => {
      const cat = await createService.execute(tenantA, { name: 'Shoes' });

      await expect(
        updateService.execute(cat.id, tenantA, {
          parentId: 'invalid-parent-uuid',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('5. Cross-Tenant Parent', () => {
    it('should reject creating category referencing a parent from another tenant', async () => {
      const storeBCat = await createService.execute(tenantB, { name: 'Store B Parent' });

      await expect(
        createService.execute(tenantA, {
          name: 'Store A Child',
          parentId: storeBCat.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject updating category to a parent belonging to another tenant', async () => {
      const storeACat = await createService.execute(tenantA, { name: 'Store A Cat' });
      const storeBCat = await createService.execute(tenantB, { name: 'Store B Cat' });

      await expect(
        updateService.execute(storeACat.id, tenantA, {
          parentId: storeBCat.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('6. Self-Parenting Prevention', () => {
    it('should reject updating a category to be its own parent', async () => {
      const cat = await createService.execute(tenantA, { name: 'Gadgets' });

      await expect(
        updateService.execute(cat.id, tenantA, {
          parentId: cat.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('7. Circular Hierarchy Prevention', () => {
    it('should reject circular parent reference (A -> B -> A)', async () => {
      // Create root category A
      const catA = await createService.execute(tenantA, { name: 'Root Fashion' });

      // Create child category B with parent A
      const catB = await createService.execute(tenantA, {
        name: 'Men Fashion',
        parentId: catA.id,
      });

      // Attempt to set A's parent to B (creating A -> B -> A cycle)
      await expect(
        updateService.execute(catA.id, tenantA, {
          parentId: catB.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject deep circular parent reference (A -> B -> C -> A)', async () => {
      const catA = await createService.execute(tenantA, { name: 'Electronics' });
      const catB = await createService.execute(tenantA, {
        name: 'Computers',
        parentId: catA.id,
      });
      const catC = await createService.execute(tenantA, {
        name: 'Laptops',
        parentId: catB.id,
      });

      // Attempt to set A's parent to C
      await expect(
        updateService.execute(catA.id, tenantA, {
          parentId: catC.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('8. Tenant Isolation', () => {
    it('Store A user CANNOT access Store B Category via findById', async () => {
      const catB = await createService.execute(tenantB, { name: 'Secret Store B Category' });

      await expect(
        findByIdService.execute(catB.id, tenantA),
      ).rejects.toThrow(NotFoundException);
    });

    it('Store A user CAN access Store A Category via findById', async () => {
      const catA = await createService.execute(tenantA, { name: 'Store A Category' });
      const result = await findByIdService.execute(catA.id, tenantA);

      expect(result).toBeDefined();
      expect(result.id).toBe(catA.id);
      expect(result.tenantId).toBe(tenantA);
    });

    it('Store A user CANNOT update Store B Category', async () => {
      const catB = await createService.execute(tenantB, { name: 'Store B Category' });

      await expect(
        updateService.execute(catB.id, tenantA, { name: 'Hacked' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('Store A user CANNOT delete Store B Category', async () => {
      const catB = await createService.execute(tenantB, { name: 'Store B Category' });

      await expect(
        deleteService.execute(catB.id, tenantA),
      ).rejects.toThrow(NotFoundException);
    });

    it('List service should strictly filter by tenantId', async () => {
      await createService.execute(tenantA, { name: 'Store A Item 1' });
      await createService.execute(tenantA, { name: 'Store A Item 2' });
      await createService.execute(tenantB, { name: 'Store B Item 1' });

      const listA = await listService.execute(tenantA);
      const listB = await listService.execute(tenantB);

      expect(listA.data.length).toBe(2);
      expect(listA.data.every((c) => c.tenantId === tenantA)).toBe(true);

      expect(listB.data.length).toBe(1);
      expect(listB.data.every((c) => c.tenantId === tenantB)).toBe(true);
    });
  });

  describe('9. Delete Category Safety', () => {
    it('should unbind product categoryIds when category is deleted', async () => {
      const cat = await createService.execute(tenantA, { name: 'Temporary Category' });

      const res = await deleteService.execute(cat.id, tenantA);
      expect(res.message).toBe('Category deleted successfully');
      expect(productRepo.update).toHaveBeenCalledWith(
        { categoryId: cat.id, tenantId: tenantA },
        { categoryId: undefined },
      );
    });
  });
});
