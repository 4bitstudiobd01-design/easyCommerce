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

    it('should reject CANCELLED to PROCESSING', () => {
      expect(service.canTransition(OrderStatusEnum.CANCELLED, OrderStatusEnum.PROCESSING)).toBe(false);
    });

    it('should reject RETURNED to SHIPPED', () => {
      expect(service.canTransition(OrderStatusEnum.RETURNED, OrderStatusEnum.SHIPPED)).toBe(false);
    });

    it('should reject skipping fulfilment stages (PENDING to SHIPPED)', () => {
      expect(service.canTransition(OrderStatusEnum.PENDING, OrderStatusEnum.SHIPPED)).toBe(false);
    });

    it('should reject skipping fulfilment stages (PENDING to DELIVERED)', () => {
      expect(service.canTransition(OrderStatusEnum.PENDING, OrderStatusEnum.DELIVERED)).toBe(false);
    });

    it('should allow DELIVERED to COMPLETED', () => {
      expect(service.canTransition(OrderStatusEnum.DELIVERED, OrderStatusEnum.COMPLETED)).toBe(true);
    });

    it('should only allow COMPLETED to be reached from DELIVERED', () => {
      const reachableFrom = [
        OrderStatusEnum.PENDING,
        OrderStatusEnum.ON_HOLD,
        OrderStatusEnum.CONFIRMED,
        OrderStatusEnum.PROCESSING,
        OrderStatusEnum.READY_TO_SHIP,
        OrderStatusEnum.SHIPPED,
        OrderStatusEnum.DELIVERED,
        OrderStatusEnum.CANCELLED,
        OrderStatusEnum.RETURNED,
      ].filter((from) => service.canTransition(from, OrderStatusEnum.COMPLETED));

      expect(reachableFrom).toEqual([OrderStatusEnum.DELIVERED]);
    });

    it('should treat CANCELLED, RETURNED and COMPLETED as terminal', () => {
      const terminals = [
        OrderStatusEnum.CANCELLED,
        OrderStatusEnum.RETURNED,
        OrderStatusEnum.COMPLETED,
      ];
      const allStatuses = Object.values(OrderStatusEnum);

      for (const terminal of terminals) {
        const onwardTransitions = allStatuses.filter(
          (target) => target !== terminal && service.canTransition(terminal, target),
        );
        expect(onwardTransitions).toEqual([]);
      }
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
