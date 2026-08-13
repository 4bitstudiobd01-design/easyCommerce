import { CreateShippingProfileService, ListShippingProfilesService } from './shipping-profile.service';
import { CreateProductService } from './create-product.service';
import { ProductType } from '../enums/product-type.enum';
import { WeightUnit, DimensionUnit, DigitalDeliveryType, ServiceDeliveryType, ServiceDurationUnit } from '../enums/fulfillment.enum';

describe('Product Shipping & Fulfillment Services (Chunk 10)', () => {
  describe('CreateShippingProfileService & ListShippingProfilesService', () => {
    it('should create and list tenant-scoped shipping profiles', async () => {
      const savedProfiles: any[] = [];
      const shippingRepo = {
        create: jest.fn().mockImplementation((dto) => ({ id: 'sp-1', ...dto })),
        save: jest.fn().mockImplementation((entity) => {
          savedProfiles.push(entity);
          return Promise.resolve(entity);
        }),
        find: jest.fn().mockImplementation(() => Promise.resolve(savedProfiles)),
        update: jest.fn().mockResolvedValue({}),
      };

      const createService = new CreateShippingProfileService(shippingRepo as any);
      const listService = new ListShippingProfilesService(shippingRepo as any);

      const profile = await createService.execute('tenant-1', {
        name: 'Heavy Furniture Shipping',
        description: 'Special profile for heavy items',
        isDefault: true,
      });

      expect(profile.name).toBe('Heavy Furniture Shipping');
      expect(profile.tenantId).toBe('tenant-1');
      expect(profile.isDefault).toBe(true);

      const list = await listService.execute('tenant-1');
      expect(list).toHaveLength(1);
    });
  });

  describe('CreateProductService - Fulfillment Fields', () => {
    it('should assign physical shipping fields for PHYSICAL product type', async () => {
      const productRepo = {
        create: jest.fn().mockImplementation((dto) => ({ id: 'prod-1', ...dto })),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        findOne: jest.fn().mockImplementation(({ where }) => Promise.resolve({ id: 'prod-1', ...where })),
      };

      const variantRepo = { create: jest.fn(), save: jest.fn() };
      const imageRepo = { create: jest.fn(), save: jest.fn() };
      const collectionRepo = { find: jest.fn().mockResolvedValue([]) };
      const stockRepo = { create: jest.fn(), save: jest.fn().mockResolvedValue({ id: 's-1' }) };
      const movementRepo = { create: jest.fn(), save: jest.fn() };
      const warehouseRepo = { findOne: jest.fn().mockResolvedValue({ id: 'wh-1' }), create: jest.fn().mockImplementation((v) => v), save: jest.fn().mockResolvedValue({ id: 'wh-1' }) };
      const slugService = { generateSlug: jest.fn().mockResolvedValue('laptop-pro') };

      const service = new CreateProductService(
        productRepo as any,
        variantRepo as any,
        imageRepo as any,
        collectionRepo as any,
        stockRepo as any,
        movementRepo as any,
        warehouseRepo as any,
        slugService as any,
      );

      await service.execute('tenant-1', {
        name: 'Laptop Pro',
        productType: ProductType.PHYSICAL,
        weight: 1.8,
        weightUnit: WeightUnit.KG,
        length: 35,
        width: 24,
        height: 2,
        dimensionUnit: DimensionUnit.CM,
        shippingProfileId: 'sp-1',
        isFragile: true,
      });

      expect(productRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productType: ProductType.PHYSICAL,
          shippingRequired: true,
          weight: 1.8,
          weightUnit: WeightUnit.KG,
          length: 35,
          width: 24,
          height: 2,
          dimensionUnit: DimensionUnit.CM,
          shippingProfileId: 'sp-1',
          isFragile: true,
        }),
      );
    });

    it('should assign digital delivery fields for DIGITAL product type', async () => {
      const productRepo = {
        create: jest.fn().mockImplementation((dto) => ({ id: 'prod-2', ...dto })),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        findOne: jest.fn().mockImplementation(({ where }) => Promise.resolve({ id: 'prod-2', ...where })),
      };

      const variantRepo = { create: jest.fn(), save: jest.fn() };
      const imageRepo = { create: jest.fn(), save: jest.fn() };
      const collectionRepo = { find: jest.fn().mockResolvedValue([]) };
      const stockRepo = { create: jest.fn(), save: jest.fn().mockResolvedValue({ id: 's-2' }) };
      const movementRepo = { create: jest.fn(), save: jest.fn() };
      const warehouseRepo = { findOne: jest.fn().mockResolvedValue({ id: 'wh-1' }), create: jest.fn().mockImplementation((v) => v), save: jest.fn().mockResolvedValue({ id: 'wh-1' }) };
      const slugService = { generateSlug: jest.fn().mockResolvedValue('ebook-guide') };

      const service = new CreateProductService(
        productRepo as any,
        variantRepo as any,
        imageRepo as any,
        collectionRepo as any,
        stockRepo as any,
        movementRepo as any,
        warehouseRepo as any,
        slugService as any,
      );

      await service.execute('tenant-1', {
        name: 'E-Book Guide PDF',
        productType: ProductType.DIGITAL,
        digitalDeliveryType: DigitalDeliveryType.DOWNLOAD,
        digitalAssetUrl: 'https://cdn.easycommerce.io/assets/guide.pdf',
        downloadLimit: 5,
        downloadExpiryDays: 30,
      });

      expect(productRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productType: ProductType.DIGITAL,
          digitalDeliveryType: DigitalDeliveryType.DOWNLOAD,
          digitalAssetUrl: 'https://cdn.easycommerce.io/assets/guide.pdf',
          downloadLimit: 5,
          downloadExpiryDays: 30,
        }),
      );
    });

    it('should assign service delivery fields for SERVICE product type', async () => {
      const productRepo = {
        create: jest.fn().mockImplementation((dto) => ({ id: 'prod-3', ...dto })),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        findOne: jest.fn().mockImplementation(({ where }) => Promise.resolve({ id: 'prod-3', ...where })),
      };

      const variantRepo = { create: jest.fn(), save: jest.fn() };
      const imageRepo = { create: jest.fn(), save: jest.fn() };
      const collectionRepo = { find: jest.fn().mockResolvedValue([]) };
      const stockRepo = { create: jest.fn(), save: jest.fn().mockResolvedValue({ id: 's-3' }) };
      const movementRepo = { create: jest.fn(), save: jest.fn() };
      const warehouseRepo = { findOne: jest.fn().mockResolvedValue({ id: 'wh-1' }), create: jest.fn().mockImplementation((v) => v), save: jest.fn().mockResolvedValue({ id: 'wh-1' }) };
      const slugService = { generateSlug: jest.fn().mockResolvedValue('consulting') };

      const service = new CreateProductService(
        productRepo as any,
        variantRepo as any,
        imageRepo as any,
        collectionRepo as any,
        stockRepo as any,
        movementRepo as any,
        warehouseRepo as any,
        slugService as any,
      );

      await service.execute('tenant-1', {
        name: '1-on-1 Business Consulting',
        productType: ProductType.SERVICE,
        serviceDeliveryType: ServiceDeliveryType.ONLINE,
        serviceDuration: 60,
        serviceDurationUnit: ServiceDurationUnit.MINUTES,
      });

      expect(productRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productType: ProductType.SERVICE,
          serviceDeliveryType: ServiceDeliveryType.ONLINE,
          serviceDuration: 60,
          serviceDurationUnit: ServiceDurationUnit.MINUTES,
        }),
      );
    });
  });
});
