import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { InventoryDomainService } from './inventory-domain.service';
import { StockStatus } from '../../catalog/enums/stock-status.enum';

describe('InventoryDomainService', () => {
  let service: InventoryDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryDomainService],
    }).compile();

    service = module.get<InventoryDomainService>(InventoryDomainService);
  });

  describe('calculateAvailableStock', () => {
    it('should calculate available stock as onHand - reserved (45 onHand, 3 reserved -> 42 available)', () => {
      const available = service.calculateAvailableStock(45, 3);
      expect(available).toBe(42);
    });

    it('should return 0 available stock when reserved exceeds onHand without backorders', () => {
      const available = service.calculateAvailableStock(5, 10, false);
      expect(available).toBe(0);
    });

    it('should allow negative available stock when allowBackorder is true', () => {
      const available = service.calculateAvailableStock(5, 10, true);
      expect(available).toBe(-5);
    });

    it('should handle zero and negative inputs safely by treating negative inputs as 0', () => {
      expect(service.calculateAvailableStock(0, 0)).toBe(0);
      expect(service.calculateAvailableStock(-5, -2)).toBe(0);
    });
  });

  describe('calculateStockStatus', () => {
    it('should return NOT_TRACKED when trackInventory is false', () => {
      const status = service.calculateStockStatus(0, 10, false);
      expect(status).toBe(StockStatus.NOT_TRACKED);
    });

    it('should return OUT_OF_STOCK when availableStock <= 0', () => {
      expect(service.calculateStockStatus(0, 10, true)).toBe(StockStatus.OUT_OF_STOCK);
      expect(service.calculateStockStatus(-2, 10, true)).toBe(StockStatus.OUT_OF_STOCK);
    });

    it('should return LOW_STOCK when availableStock > 0 and <= lowStockThreshold', () => {
      // Threshold = 10, Available = 10 -> LOW_STOCK
      expect(service.calculateStockStatus(10, 10, true)).toBe(StockStatus.LOW_STOCK);
      // Threshold = 10, Available = 7 -> LOW_STOCK
      expect(service.calculateStockStatus(7, 10, true)).toBe(StockStatus.LOW_STOCK);
      // Threshold = 10, Available = 1 -> LOW_STOCK
      expect(service.calculateStockStatus(1, 10, true)).toBe(StockStatus.LOW_STOCK);
    });

    it('should return IN_STOCK when availableStock > lowStockThreshold', () => {
      // Threshold = 10, Available = 11 -> IN_STOCK
      expect(service.calculateStockStatus(11, 10, true)).toBe(StockStatus.IN_STOCK);
      // Threshold = 10, Available = 20 -> IN_STOCK
      expect(service.calculateStockStatus(20, 10, true)).toBe(StockStatus.IN_STOCK);
    });
  });

  describe('computeStockMetrics', () => {
    it('should compute complete stock metrics for typical product in stock', () => {
      const result = service.computeStockMetrics({
        onHand: 45,
        reserved: 3,
        lowStockThreshold: 10,
        trackInventory: true,
        allowBackorder: false,
      });

      expect(result).toEqual({
        onHand: 45,
        reserved: 3,
        available: 42,
        lowStockThreshold: 10,
        trackInventory: true,
        allowBackorder: false,
        status: StockStatus.IN_STOCK,
      });
    });

    it('should compute complete stock metrics for low stock product', () => {
      const result = service.computeStockMetrics({
        onHand: 7,
        reserved: 0,
        lowStockThreshold: 10,
        trackInventory: true,
        allowBackorder: false,
      });

      expect(result.available).toBe(7);
      expect(result.status).toBe(StockStatus.LOW_STOCK);
    });

    it('should compute complete stock metrics for out of stock product', () => {
      const result = service.computeStockMetrics({
        onHand: 0,
        reserved: 0,
        lowStockThreshold: 10,
        trackInventory: true,
        allowBackorder: false,
      });

      expect(result.available).toBe(0);
      expect(result.status).toBe(StockStatus.OUT_OF_STOCK);
    });
  });

  describe('computeAdjustmentNewOnHand', () => {
    it('should ADD quantity to current on-hand stock', () => {
      const newOnHand = service.computeAdjustmentNewOnHand({
        currentOnHand: 20,
        adjustmentQuantity: 15,
        action: 'ADD',
      });
      expect(newOnHand).toBe(35);
    });

    it('should SET exact quantity for on-hand stock', () => {
      const newOnHand = service.computeAdjustmentNewOnHand({
        currentOnHand: 20,
        adjustmentQuantity: 50,
        action: 'SET',
      });
      expect(newOnHand).toBe(50);
    });

    it('should REMOVE quantity from on-hand stock safely', () => {
      const newOnHand = service.computeAdjustmentNewOnHand({
        currentOnHand: 20,
        adjustmentQuantity: 5,
        action: 'REMOVE',
        allowBackorder: false,
      });
      expect(newOnHand).toBe(15);
    });

    it('should reject REMOVE when requested quantity exceeds on-hand stock without backorders', () => {
      expect(() =>
        service.computeAdjustmentNewOnHand({
          currentOnHand: 10,
          adjustmentQuantity: 15,
          action: 'REMOVE',
          allowBackorder: false,
        }),
      ).toThrow(BadRequestException);
    });

    it('should allow REMOVE when backorder is enabled', () => {
      const newOnHand = service.computeAdjustmentNewOnHand({
        currentOnHand: 10,
        adjustmentQuantity: 15,
        action: 'REMOVE',
        allowBackorder: true,
      });
      expect(newOnHand).toBe(-5);
    });

    it('should reject negative adjustment quantities', () => {
      expect(() =>
        service.computeAdjustmentNewOnHand({
          currentOnHand: 10,
          adjustmentQuantity: -5,
          action: 'ADD',
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('validateAndComputeReservation', () => {
    it('should successfully reserve stock when sufficient available stock exists', () => {
      const result = service.validateAndComputeReservation({
        currentOnHand: 50,
        currentReserved: 10,
        requestedReserve: 5,
        allowBackorder: false,
      });

      expect(result.newReserved).toBe(15);
      expect(result.availableBefore).toBe(40);
      expect(result.availableAfter).toBe(35);
    });

    it('should reject reservation when requested quantity exceeds available stock without backorders', () => {
      expect(() =>
        service.validateAndComputeReservation({
          currentOnHand: 20,
          currentReserved: 18,
          requestedReserve: 5, // available is only 2
          allowBackorder: false,
        }),
      ).toThrow(BadRequestException);
    });

    it('should allow reservation when backorders are enabled', () => {
      const result = service.validateAndComputeReservation({
        currentOnHand: 20,
        currentReserved: 18,
        requestedReserve: 5,
        allowBackorder: true,
      });

      expect(result.newReserved).toBe(23);
      expect(result.availableAfter).toBe(-3);
    });

    it('should reject non-positive reservation requests', () => {
      expect(() =>
        service.validateAndComputeReservation({
          currentOnHand: 20,
          currentReserved: 5,
          requestedReserve: 0,
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('validateAndComputeRelease', () => {
    it('should successfully release reserved stock', () => {
      const newReserved = service.validateAndComputeRelease({
        currentReserved: 15,
        requestedRelease: 5,
      });
      expect(newReserved).toBe(10);
    });

    it('should reject releasing more stock than is currently reserved', () => {
      expect(() =>
        service.validateAndComputeRelease({
          currentReserved: 5,
          requestedRelease: 10,
        }),
      ).toThrow(BadRequestException);
    });

    it('should reject non-positive release requests', () => {
      expect(() =>
        service.validateAndComputeRelease({
          currentReserved: 5,
          requestedRelease: 0,
        }),
      ).toThrow(BadRequestException);
    });
  });
});
