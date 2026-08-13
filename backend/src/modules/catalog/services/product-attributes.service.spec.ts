import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { CreateAttributeService } from './create-attribute.service';
import { GetCategoryAttributesService } from './get-category-attributes.service';
import { SetProductAttributeValuesService } from './set-product-attribute-values.service';
import { ProductSlugService } from './product-slug.service';

import { AttributeDefinitionEntity } from '../entities/attribute-definition.entity';
import { AttributeOptionEntity } from '../entities/attribute-option.entity';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryAttributeEntity } from '../entities/category-attribute.entity';
import { ProductEntity } from '../entities/product.entity';
import { ProductAttributeValueEntity } from '../entities/product-attribute-value.entity';
import { AttributeType } from '../enums/attribute-type.enum';

describe('Product Attribute Services', () => {
  let createAttributeService: CreateAttributeService;
  let getCategoryAttributesService: GetCategoryAttributesService;
  let setProductAttributeValuesService: SetProductAttributeValuesService;

  let attrRepo: any;
  let optionRepo: any;
  let categoryRepo: any;
  let categoryAttrRepo: any;
  let productRepo: any;
  let valueRepo: any;
  let slugService: any;

  const mockTenantId = 'tenant-uuid-1';

  beforeEach(async () => {
    attrRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((dto) => ({ id: 'attr-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    optionRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'opt-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    categoryRepo = {
      findOne: jest.fn(),
    };

    categoryAttrRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((dto) => ({ id: 'cat-attr-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      delete: jest.fn().mockResolvedValue(true),
    };

    productRepo = {
      findOne: jest.fn(),
    };

    valueRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((dto) => ({ id: 'val-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      delete: jest.fn().mockResolvedValue(true),
    };

    slugService = {
      generateSlug: jest.fn().mockImplementation((val) => Promise.resolve(val.toLowerCase().replace(/\s+/g, '-'))),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAttributeService,
        GetCategoryAttributesService,
        SetProductAttributeValuesService,
        { provide: getRepositoryToken(AttributeDefinitionEntity), useValue: attrRepo },
        { provide: getRepositoryToken(AttributeOptionEntity), useValue: optionRepo },
        { provide: getRepositoryToken(CategoryEntity), useValue: categoryRepo },
        { provide: getRepositoryToken(CategoryAttributeEntity), useValue: categoryAttrRepo },
        { provide: getRepositoryToken(ProductEntity), useValue: productRepo },
        { provide: getRepositoryToken(ProductAttributeValueEntity), useValue: valueRepo },
        { provide: ProductSlugService, useValue: slugService },
      ],
    }).compile();

    createAttributeService = module.get<CreateAttributeService>(CreateAttributeService);
    getCategoryAttributesService = module.get<GetCategoryAttributesService>(GetCategoryAttributesService);
    setProductAttributeValuesService = module.get<SetProductAttributeValuesService>(SetProductAttributeValuesService);
  });

  describe('CreateAttributeService', () => {
    it('should create attribute with normalized key and slug', async () => {
      attrRepo.findOne.mockImplementation(({ where }) => {
        if (where.id === 'attr-1') {
          return Promise.resolve({ id: 'attr-1', name: 'Screen Size', key: 'screen_size', tenantId: mockTenantId });
        }
        return Promise.resolve(null);
      });

      const result = await createAttributeService.execute(mockTenantId, {
        name: 'Screen Size',
        type: AttributeType.TEXT,
      });

      expect(result.name).toBe('Screen Size');
      expect(result.key).toBe('screen_size');
      expect(result.tenantId).toBe(mockTenantId);
    });

    it('should throw BadRequestException on duplicate attribute key for tenant', async () => {
      attrRepo.findOne.mockResolvedValue({ id: 'existing-attr', key: 'ram' });

      await expect(
        createAttributeService.execute(mockTenantId, {
          name: 'RAM',
          type: AttributeType.NUMBER,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GetCategoryAttributesService - Ancestor Parent Inheritance', () => {
    it('should resolve attributes for subcategory and parent category', async () => {
      categoryRepo.findOne.mockImplementation(({ where }) => {
        if (where.id === 'sub-cat-1') return Promise.resolve({ id: 'sub-cat-1', parentId: 'parent-cat-1', tenantId: mockTenantId });
        if (where.id === 'parent-cat-1') return Promise.resolve({ id: 'parent-cat-1', parentId: null, tenantId: mockTenantId });
        return Promise.resolve(null);
      });

      categoryAttrRepo.find.mockResolvedValue([
        { categoryId: 'sub-cat-1', attributeId: 'attr-ram' },
        { categoryId: 'parent-cat-1', attributeId: 'attr-brand' },
      ]);

      attrRepo.find.mockResolvedValue([
        { id: 'attr-ram', name: 'RAM', type: AttributeType.NUMBER },
        { id: 'attr-brand', name: 'Brand Tier', type: AttributeType.TEXT },
      ]);

      const result = await getCategoryAttributesService.execute('sub-cat-1', mockTenantId);

      expect(result.length).toBe(2);
      expect(result.map((a) => a.name)).toContain('RAM');
      expect(result.map((a) => a.name)).toContain('Brand Tier');
    });
  });

  describe('SetProductAttributeValuesService - Type Safety Validation', () => {
    it('should reject invalid NUMBER input with BadRequestException', async () => {
      productRepo.findOne.mockResolvedValue({ id: 'prod-1', tenantId: mockTenantId });
      attrRepo.find.mockResolvedValue([
        { id: 'attr-ram', name: 'RAM', type: AttributeType.NUMBER, options: [] },
      ]);

      await expect(
        setProductAttributeValuesService.execute('prod-1', mockTenantId, {
          attributes: [{ attributeId: 'attr-ram', value: 'not-a-number' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid URL input with BadRequestException', async () => {
      productRepo.findOne.mockResolvedValue({ id: 'prod-1', tenantId: mockTenantId });
      attrRepo.find.mockResolvedValue([
        { id: 'attr-url', name: 'Spec Sheet URL', type: AttributeType.URL, options: [] },
      ]);

      await expect(
        setProductAttributeValuesService.execute('prod-1', mockTenantId, {
          attributes: [{ attributeId: 'attr-url', value: 'javascript:alert(1)' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate and save SELECT option values correctly', async () => {
      productRepo.findOne.mockResolvedValue({ id: 'prod-1', tenantId: mockTenantId });
      attrRepo.find.mockResolvedValue([
        {
          id: 'attr-color',
          name: 'Color',
          type: AttributeType.SELECT,
          options: [
            { label: 'Midnight Black', value: 'midnight-black' },
            { label: 'Snow White', value: 'snow-white' },
          ],
        },
      ]);

      await setProductAttributeValuesService.execute('prod-1', mockTenantId, {
        attributes: [{ attributeId: 'attr-color', value: 'midnight-black' }],
      });

      expect(valueRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if attribute belongs to another tenant (IDOR Protection)', async () => {
      productRepo.findOne.mockResolvedValue({ id: 'prod-1', tenantId: mockTenantId });
      // attrRepo returns empty array because attribute belongs to different tenant
      attrRepo.find.mockResolvedValue([]);

      await expect(
        setProductAttributeValuesService.execute('prod-1', mockTenantId, {
          attributes: [{ attributeId: 'other-tenant-attr', value: 'Test' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
