import { Test, TestingModule } from '@nestjs/testing';
import { OrderCalculationService } from './order-calculation.service';
import { BadRequestException } from '@nestjs/common';

describe('OrderCalculationService', () => {
  let service: OrderCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderCalculationService],
    }).compile();

    service = module.get<OrderCalculationService>(OrderCalculationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateTotals', () => {
    it('should correctly calculate basic order totals', () => {
      const result = service.calculateTotals({
        items: [
          { unitPrice: 100, quantity: 2 },
          { unitPrice: 50.5, quantity: 1 },
        ],
        deliveryFee: 60,
        discountAmount: 10.5,
      });

      expect(result.subtotal).toBe(250.5); // 200 + 50.5
      expect(result.deliveryFee).toBe(60);
      expect(result.discountAmount).toBe(10.5);
      expect(result.grandTotal).toBe(300); // 250.5 + 60 - 10.5
    });

    it('should prevent grand total from being negative', () => {
      const result = service.calculateTotals({
        items: [
          { unitPrice: 10, quantity: 1 },
        ],
        deliveryFee: 0,
        discountAmount: 100,
      });

      expect(result.subtotal).toBe(10);
      expect(result.grandTotal).toBe(0);
    });

    it('should throw error for negative delivery fee', () => {
      expect(() =>
        service.calculateTotals({
          items: [{ unitPrice: 10, quantity: 1 }],
          deliveryFee: -10,
          discountAmount: 0,
        }),
      ).toThrow(BadRequestException);
    });

    it('should throw error for negative quantities or prices', () => {
      expect(() =>
        service.calculateTotals({
          items: [{ unitPrice: -10, quantity: 1 }],
          deliveryFee: 10,
          discountAmount: 0,
        }),
      ).toThrow(BadRequestException);

      expect(() =>
        service.calculateTotals({
          items: [{ unitPrice: 10, quantity: 0 }],
          deliveryFee: 10,
          discountAmount: 0,
        }),
      ).toThrow(BadRequestException);
    });
  });
});
