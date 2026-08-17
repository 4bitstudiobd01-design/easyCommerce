import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoryEntity } from '../entities/category.entity';
import { CreateCategoryService } from './create-category.service';
import { UpdateCategoryService } from './update-category.service';
import { CategoryStatus } from '../enums/category-status.enum';

describe('Category Image + SEO + Display Settings (Chunk 6)', () => {
  let createService: CreateCategoryService;
  let updateService: UpdateCategoryService;
  let categoryRepo: any;

  const tenantA = 'tenant-store-a';
  const tenantB = 'tenant-store-b';

  let mockCategories: any[] = [];

  beforeEach(async () => {
    mockCategories = [
      {
        id: 'cat-fashion',
        name: 'Fashion & Apparel',
        slug: 'fashion-apparel',
        description: 'All apparel items',
        parentId: null,
        status: CategoryStatus.ACTIVE,
        sortOrder: 0,
        image: 'https://cdn.bitcommerce.app/uploads/fashion.jpg',
        seoTitle: 'Fashion & Apparel BD | BitCommerce',
        metaDescription: 'Shop trendy men and women clothing with home delivery across Bangladesh.',
        isVisible: true,
        showInStorefront: true,
        isFeatured: true,
        tenantId: tenantA,
        createdAt: new Date('2026-08-01T00:00:00Z'),
        updatedAt: new Date('2026-08-01T00:00:00Z'),
      },
      {
        id: 'cat-store-b',
        name: 'Store B Exclusive',
        slug: 'store-b-exclusive',
        description: 'Store B items',
        parentId: null,
        status: CategoryStatus.ACTIVE,
        sortOrder: 0,
        image: 'https://cdn.bitcommerce.app/uploads/storeb.jpg',
        seoTitle: 'Store B Exclusive Collection',
        metaDescription: 'Store B exclusive products',
        isVisible: true,
        showInStorefront: true,
        isFeatured: false,
        tenantId: tenantB,
        createdAt: new Date('2026-08-02T00:00:00Z'),
        updatedAt: new Date('2026-08-02T00:00:00Z'),
      },
    ];

    categoryRepo = {
      findOne: jest.fn().mockImplementation(async ({ where }) => {
        return (
          mockCategories.find((c) => {
            return Object.entries(where).every(([k, v]) => (c as any)[k] === v);
          }) || null
        );
      }),
      create: jest.fn().mockImplementation((dto) => ({
        id: `cat-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...dto,
      })),
      save: jest.fn().mockImplementation(async (entity) => {
        const idx = mockCategories.findIndex((c) => c.id === entity.id);
        if (idx >= 0) {
          mockCategories[idx] = { ...mockCategories[idx], ...entity, updatedAt: new Date() };
          return mockCategories[idx];
        }
        mockCategories.push(entity);
        return entity;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCategoryService,
        UpdateCategoryService,
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: categoryRepo,
        },
      ],
    }).compile();

    createService = module.get<CreateCategoryService>(CreateCategoryService);
    updateService = module.get<UpdateCategoryService>(UpdateCategoryService);
  });

  describe('1. Create Category with Image, SEO & Display Settings', () => {
    it('should create a category with image URL, SEO title, meta description, and display settings', async () => {
      const result = await createService.execute(tenantA, {
        name: 'Footwear & Shoes',
        slug: 'footwear-shoes',
        description: 'Men and women shoes',
        image: 'https://cdn.bitcommerce.app/uploads/shoes.webp',
        seoTitle: 'Footwear & Shoes Collection | BitCommerce',
        metaDescription: 'Shop sneakers, formal shoes, and loafers online with fast courier delivery.',
        isVisible: true,
        showInStorefront: true,
        isFeatured: true,
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Footwear & Shoes');
      expect(result.slug).toBe('footwear-shoes');
      expect(result.image).toBe('https://cdn.bitcommerce.app/uploads/shoes.webp');
      expect(result.seoTitle).toBe('Footwear & Shoes Collection | BitCommerce');
      expect(result.metaDescription).toBe(
        'Shop sneakers, formal shoes, and loafers online with fast courier delivery.',
      );
      expect(result.isVisible).toBe(true);
      expect(result.showInStorefront).toBe(true);
      expect(result.isFeatured).toBe(true);
    });

    it('should default isVisible and showInStorefront to true when omitted', async () => {
      const result = await createService.execute(tenantA, {
        name: 'Electronics Accessories',
      });

      expect(result.isVisible).toBe(true);
      expect(result.showInStorefront).toBe(true);
      expect(result.isFeatured).toBe(false);
      expect(result.image).toBeUndefined();
      expect(result.seoTitle).toBeUndefined();
      expect(result.metaDescription).toBeUndefined();
    });
  });

  describe('2. Update Category Image, SEO & Display Settings', () => {
    it('should update SEO title and meta description independently', async () => {
      const updated = await updateService.execute('cat-fashion', tenantA, {
        seoTitle: 'Updated SEO Title for Fashion',
        metaDescription: 'Updated meta description for fashion catalog.',
      });

      expect(updated.seoTitle).toBe('Updated SEO Title for Fashion');
      expect(updated.metaDescription).toBe('Updated meta description for fashion catalog.');
      expect(updated.name).toBe('Fashion & Apparel'); // existing name preserved
    });

    it('should replace category image URL', async () => {
      const updated = await updateService.execute('cat-fashion', tenantA, {
        image: 'https://cdn.bitcommerce.app/uploads/fashion-new-banner.webp',
      });

      expect(updated.image).toBe(
        'https://cdn.bitcommerce.app/uploads/fashion-new-banner.webp',
      );
    });

    it('should remove category image when passed empty string or null', async () => {
      const updated = await updateService.execute('cat-fashion', tenantA, {
        image: '',
      });

      expect(updated.image).toBeUndefined();
    });

    it('should update storefront visibility and display settings', async () => {
      const updated = await updateService.execute('cat-fashion', tenantA, {
        isVisible: false,
        showInStorefront: false,
        isFeatured: false,
      });

      expect(updated.isVisible).toBe(false);
      expect(updated.showInStorefront).toBe(false);
      expect(updated.isFeatured).toBe(false);
    });
  });

  describe('3. Tenant Isolation & Security', () => {
    it('should reject updating SEO and image for a category belonging to another tenant', async () => {
      await expect(
        updateService.execute('cat-store-b', tenantA, {
          seoTitle: 'Hijacked Title',
          image: 'https://evil.com/image.jpg',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow two different stores to have categories with the same slug and SEO title', async () => {
      const resultB = await createService.execute(tenantB, {
        name: 'Fashion & Apparel',
        slug: 'fashion-apparel',
        seoTitle: 'Fashion & Apparel BD | Store B',
      });

      expect(resultB.slug).toBe('fashion-apparel');
      expect(resultB.tenantId).toBe(tenantB);
    });
  });
});
