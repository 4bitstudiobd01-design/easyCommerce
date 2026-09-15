import { ProductPricingCalculatorService } from './product-pricing-calculator.service';
import { FindPublicStoreProductsService } from './find-public-store-products.service';
import { ProductEntity } from '../entities/product.entity';
import { ProductDiscountType } from '../enums/product-discount-type.enum';
import { TaxCategory } from '../enums/tax-category.enum';

describe('Product Pricing & Tax Services', () => {
  let calculator: ProductPricingCalculatorService;

  beforeEach(() => {
    calculator = new ProductPricingCalculatorService();
  });

  describe('ProductPricingCalculatorService', () => {
    it('should calculate base price with percentage discount', () => {
      const product = {
        basePrice: 1000,
        discountType: ProductDiscountType.PERCENTAGE,
        discountValue: 10,
      } as ProductEntity;

      const result = calculator.calculate(product);

      expect(result.basePrice).toBe(1000);
      expect(result.effectivePrice).toBe(900);
      expect(result.isDiscountActive).toBe(true);
      expect(result.savingsAmount).toBe(100);
      expect(result.savingsPercent).toBe(10);
    });

    it('should calculate base price with fixed discount', () => {
      const product = {
        basePrice: 1000,
        discountType: ProductDiscountType.FIXED,
        discountValue: 200,
      } as ProductEntity;

      const result = calculator.calculate(product);

      expect(result.effectivePrice).toBe(800);
      expect(result.savingsAmount).toBe(200);
    });

    it('should ignore expired scheduled discount', () => {
      const pastEnd = new Date(Date.now() - 3600000); // 1 hour ago
      const pastStart = new Date(Date.now() - 7200000); // 2 hours ago

      const product = {
        basePrice: 1000,
        discountType: ProductDiscountType.PERCENTAGE,
        discountValue: 20,
        discountStartsAt: pastStart,
        discountEndsAt: pastEnd,
      } as ProductEntity;

      const result = calculator.calculate(product);

      expect(result.effectivePrice).toBe(1000);
      expect(result.isDiscountActive).toBe(false);
    });

    it('should calculate exclusive tax correctly', () => {
      const product = {
        basePrice: 1000,
        taxRate: 15,
        isTaxInclusive: false,
        taxCategory: TaxCategory.STANDARD_VAT,
      } as ProductEntity;

      const result = calculator.calculate(product);

      expect(result.taxAmount).toBe(150);
      expect(result.totalWithTax).toBe(1150);
    });

    it('should calculate inclusive tax correctly', () => {
      const product = {
        basePrice: 1150,
        taxRate: 15,
        isTaxInclusive: true,
        taxCategory: TaxCategory.STANDARD_VAT,
      } as ProductEntity;

      const result = calculator.calculate(product);

      expect(result.taxAmount).toBe(150);
      expect(result.totalWithTax).toBe(1150);
    });

    it('should calculate merchant profit and margin percentage correctly', () => {
      const product = {
        basePrice: 1000,
        costPrice: 600,
      } as ProductEntity;

      const result = calculator.calculate(product);

      expect(result.profit).toBe(400);
      expect(result.marginPercent).toBe(40);
    });
  });

  describe('FindPublicStoreProductsService - Cost Price Protection', () => {
    it('should strip costPrice from public storefront product output', async () => {
      const productRepo = {
        find: jest.fn().mockResolvedValue([
          { id: 'prod-1', name: 'Shirt', basePrice: 1000, costPrice: 600, isPublished: true },
        ]),
      };

      const findStoreBySlugService = {
        execute: jest.fn().mockResolvedValue({ id: 'store-1', tenantId: 'tenant-1', slug: 'my-store' }),
      };
      const inventoryStockRepo = { find: jest.fn().mockResolvedValue([]) };

      const service = new FindPublicStoreProductsService(productRepo as any, inventoryStockRepo as any, findStoreBySlugService as any);

      const response = await service.execute('my-store');

      expect(response.products[0].costPrice).toBeUndefined();
      expect(response.products[0].basePrice).toBe(1000);
    });
  });
});
