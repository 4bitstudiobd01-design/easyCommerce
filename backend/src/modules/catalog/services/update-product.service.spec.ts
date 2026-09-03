import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateProductService } from './update-product.service';
import { ProductEntity } from '../entities/product.entity';
import { CollectionEntity } from '../entities/collection.entity';
import { ProductSlugService } from './product-slug.service';
import { ProductType } from '../enums/product-type.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { CategoryEntity } from '../entities/category.entity';

describe('UpdateProductService', () => {
  let service: UpdateProductService;
  let productRepo: any;
  let slugService: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockProductId = 'prod-100';

  beforeEach(async () => {
    productRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    slugService = {
      generateSlug: jest.fn().mockResolvedValue('updated-product-name'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProductService,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: productRepo,
        },
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: {
            findOne: jest.fn().mockImplementation(({ where }) => {
              if (where?.id === 'cat-invalid') return Promise.resolve(null);
              return Promise.resolve({ id: where?.id || 'cat-1', tenantId: where?.tenantId || mockTenantId, name: 'Mock Cat' });
            }),
          },
        },
        {
          provide: getRepositoryToken(CollectionEntity),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: ProductSlugService,
          useValue: slugService,
        },
      ],
    }).compile();

    service = module.get<UpdateProductService>(UpdateProductService);
  });

  it('should update product name and recalculate tenant-unique slug', async () => {
    const existingProduct = {
      id: mockProductId,
      name: 'Old Product Name',
      slug: 'old-product-name',
      productType: ProductType.PHYSICAL,
      status: ProductStatus.DRAFT,
      tenantId: mockTenantId,
    };

    productRepo.findOne
      .mockResolvedValueOnce(existingProduct)
      .mockResolvedValueOnce({ ...existingProduct, name: 'Updated Product Name', slug: 'updated-product-name' });

    const result = await service.execute(mockProductId, mockTenantId, { name: 'Updated Product Name' });

    expect(slugService.generateSlug).toHaveBeenCalledWith('Updated Product Name', mockTenantId, mockProductId);
    expect(productRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Product Name',
        slug: 'updated-product-name',
      }),
    );
  });

  it('should throw NotFoundException if product belongs to another tenant (IDOR Protection)', async () => {
    productRepo.findOne.mockResolvedValue(null);

    await expect(
      service.execute(mockProductId, mockTenantId, { name: 'Unauthorized Change' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if attempting to set an empty name', async () => {
    productRepo.findOne.mockResolvedValue({ id: mockProductId, tenantId: mockTenantId, name: 'Valid' });

    await expect(
      service.execute(mockProductId, mockTenantId, { name: '   ' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject an update that leaves compare-at price at or below the selling price', async () => {
    productRepo.findOne.mockResolvedValue({
      id: mockProductId,
      tenantId: mockTenantId,
      name: 'Valid',
      status: ProductStatus.DRAFT,
      basePrice: 1000,
      compareAtPrice: 1500,
      variants: [],
    });

    await expect(
      service.execute(mockProductId, mockTenantId, { compareAtPrice: 800 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject publishing a non-variant product that has no selling price', async () => {
    productRepo.findOne.mockResolvedValue({
      id: mockProductId,
      tenantId: mockTenantId,
      name: 'Valid',
      status: ProductStatus.DRAFT,
      hasVariants: false,
      basePrice: 0,
      variants: [],
    });

    await expect(
      service.execute(mockProductId, mockTenantId, { status: ProductStatus.ACTIVE }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject publishing a variant product with no enabled priced variant', async () => {
    productRepo.findOne.mockResolvedValue({
      id: mockProductId,
      tenantId: mockTenantId,
      name: 'Valid',
      status: ProductStatus.DRAFT,
      hasVariants: true,
      basePrice: 0,
      variants: [{ id: 'v1', isEnabled: false, price: 500 }],
    });

    await expect(
      service.execute(mockProductId, mockTenantId, { status: ProductStatus.ACTIVE }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should allow publishing a variant product with at least one enabled priced variant', async () => {
    const product = {
      id: mockProductId,
      tenantId: mockTenantId,
      name: 'Valid',
      status: ProductStatus.DRAFT,
      hasVariants: true,
      basePrice: 0,
      variants: [{ id: 'v1', isEnabled: true, price: 500 }],
    };
    productRepo.findOne.mockResolvedValueOnce(product).mockResolvedValueOnce({ ...product, status: ProductStatus.ACTIVE });

    await expect(
      service.execute(mockProductId, mockTenantId, { status: ProductStatus.ACTIVE }),
    ).resolves.toBeDefined();
  });
});
