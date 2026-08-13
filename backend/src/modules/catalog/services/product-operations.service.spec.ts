import { BulkUpdateProductStatusService } from './bulk-update-product-status.service';
import { ExportProductsService } from './export-products.service';
import { ImportProductsService } from './import-products.service';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductType } from '../enums/product-type.enum';

describe('Product Operations Services (Chunk 11)', () => {
  describe('BulkUpdateProductStatusService', () => {
    it('should bulk update valid products and return partial failure counts for invalid ones', async () => {
      const p1 = { id: 'p1', name: 'Valid Product 1', basePrice: 100, status: ProductStatus.DRAFT, tenantId: 'tenant-1' };
      const p2 = { id: 'p2', name: '', basePrice: 100, status: ProductStatus.DRAFT, tenantId: 'tenant-1' }; // Invalid name

      const productRepo = {
        find: jest.fn().mockResolvedValue([p1, p2]),
        save: jest.fn().mockImplementation((entities) => Promise.resolve(entities)),
      };

      const service = new BulkUpdateProductStatusService(productRepo as any);
      const result = await service.execute('tenant-1', {
        productIds: ['p1', 'p2'],
        status: ProductStatus.ACTIVE,
      });

      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.failures[0].productId).toBe('p2');
      expect(result.failures[0].reason).toContain('name');
    });
  });

  describe('ExportProductsService', () => {
    it('should sanitize CSV formulas and format rows correctly', () => {
      const productRepo = {} as any;
      const service = new ExportProductsService(productRepo);

      expect(service.sanitizeCsvFormula('=1+2')).toBe("'=1+2");
      expect(service.sanitizeCsvFormula('+100')).toBe("'+100");
      expect(service.sanitizeCsvFormula('-50')).toBe("'-50");
      expect(service.sanitizeCsvFormula('@cmd')).toBe("'@cmd");
      expect(service.sanitizeCsvFormula('Normal Text')).toBe('Normal Text');

      const formatted = service.formatCsvRow(['ID-1', 'Product, Name', '100']);
      expect(formatted).toBe('"ID-1","Product, Name","100"');
    });

    it('should export products matching filters', async () => {
      const sampleProducts = [
        {
          id: 'p1',
          name: 'Shirt',
          slug: 'shirt',
          sku: 'TS-001',
          barcode: '123',
          productType: ProductType.PHYSICAL,
          status: ProductStatus.ACTIVE,
          basePrice: 1000,
          category: { name: 'Apparel' },
          brand: { name: 'Nike' },
        },
      ];

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(sampleProducts),
      };

      const productRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      };

      const service = new ExportProductsService(productRepo as any);
      const csv = await service.execute('tenant-1', {} as any);

      expect(csv).toContain('"id","name","slug","sku"');
      expect(csv).toContain('Shirt');
      expect(csv).toContain('TS-001');
    });
  });

  describe('ImportProductsService', () => {
    it('should parse CSV rows and support template download', () => {
      const service = new ImportProductsService(null as any, null as any, null as any, null as any, null as any, null as any);
      const rows = service.parseCsvRows('name,sku,price\n"Shirt, Red",TS-001,500');

      expect(rows).toHaveLength(2);
      expect(rows[1][0]).toBe('Shirt, Red');
      expect(rows[1][1]).toBe('TS-001');
      expect(rows[1][2]).toBe('500');

      const template = service.getImportTemplateCsv();
      expect(template).toContain('name,sku,barcode');
    });

    it('should pre-validate rows and handle UPSERT mode', async () => {
      const productRepo = {
        findOne: jest.fn().mockResolvedValue(null), // no existing SKU match
        create: jest.fn().mockImplementation((dto) => ({ id: 'p-new', ...dto })),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      };
      const categoryRepo = { findOne: jest.fn().mockResolvedValue(null) };
      const brandRepo = { findOne: jest.fn().mockResolvedValue(null) };
      const stockRepo = {
        create: jest.fn().mockImplementation((dto) => ({ id: 's-new', ...dto })),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      };
      const slugService = { generateSlug: jest.fn().mockResolvedValue('imported-shoe') };
      const warehouseRepo = {
        findOne: jest.fn().mockResolvedValue({ id: 'wh-1' }),
        create: jest.fn().mockImplementation((v) => v),
        save: jest.fn().mockResolvedValue({ id: 'wh-1' }),
      };

      const service = new ImportProductsService(
        productRepo as any,
        categoryRepo as any,
        brandRepo as any,
        stockRepo as any,
        warehouseRepo as any,
        slugService as any,
      );

      const csvContent = 'name,sku,price,productType,status\nImported Shoe,SHOE-01,2500,PHYSICAL,ACTIVE';
      const result = await service.execute('tenant-1', { csvContent, mode: 'UPSERT' });

      expect(result.totalRows).toBe(1);
      expect(result.createdCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(productRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Imported Shoe',
          sku: 'SHOE-01',
          basePrice: 2500,
          productType: ProductType.PHYSICAL,
          status: ProductStatus.ACTIVE,
        }),
      );
    });
  });
});
