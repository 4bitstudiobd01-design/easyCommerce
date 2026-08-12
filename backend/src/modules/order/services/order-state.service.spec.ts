import { Test, TestingModule } from '@nestjs/testing';
import { OrderStateService } from './order-state.service';
import { OrderStatusEnum } from '../entities/order.entity';
import { BadRequestException } from '@nestjs/common';

describe('OrderStateService', () => {
  let service: OrderStateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderStateService],
    }).compile();

    service = module.get<OrderStateService>(OrderStateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('canTransition', () => {
    it('should allow PENDING to CONFIRMED', () => {
      expect(service.canTransition(OrderStatusEnum.PENDING, OrderStatusEnum.CONFIRMED)).toBe(true);
    });

    it('should allow PENDING to CANCELLED', () => {
      expect(service.canTransition(OrderStatusEnum.PENDING, OrderStatusEnum.CANCELLED)).toBe(true);
    });

    it('should allow SHIPPED to DELIVERED', () => {
      expect(service.canTransition(OrderStatusEnum.SHIPPED, OrderStatusEnum.DELIVERED)).toBe(true);
    });

    it('should reject DELIVERED to PENDING', () => {
      expect(service.canTransition(OrderStatusEnum.DELIVERED, OrderStatusEnum.PENDING)).toBe(false);
    });

    it('should reject CANCELLED to CONFIRMED', () => {
      expect(service.canTransition(OrderStatusEnum.CANCELLED, OrderStatusEnum.CONFIRMED)).toBe(false);
    });
  });

  describe('assertTransition', () => {
    it('should not throw on valid transition', () => {
      expect(() =>
        service.assertTransition(OrderStatusEnum.PENDING, OrderStatusEnum.CONFIRMED),
      ).not.toThrow();
    });

    it('should throw BadRequestException on invalid transition', () => {
      expect(() =>
        service.assertTransition(OrderStatusEnum.DELIVERED, OrderStatusEnum.PROCESSING),
      ).toThrow(BadRequestException);
    });
  });
});
