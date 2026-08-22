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

    it('should allow DELIVERED back to PENDING (merchant correcting a mistake)', () => {
      expect(service.canTransition(OrderStatusEnum.DELIVERED, OrderStatusEnum.PENDING)).toBe(true);
    });

    it('should allow SHIPPED back to PROCESSING', () => {
      expect(service.canTransition(OrderStatusEnum.SHIPPED, OrderStatusEnum.PROCESSING)).toBe(true);
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

    it('should only allow COMPLETED to be reached from DELIVERED (forward) — backward moves from COMPLETED are handled separately', () => {
      const reachableGoingForwardOnly = [
        OrderStatusEnum.PENDING,
        OrderStatusEnum.ON_HOLD,
        OrderStatusEnum.CONFIRMED,
        OrderStatusEnum.PROCESSING,
        OrderStatusEnum.READY_TO_SHIP,
        OrderStatusEnum.SHIPPED,
      ].filter((from) => service.canTransition(from, OrderStatusEnum.COMPLETED));

      // None of the earlier stages can jump straight to COMPLETED — only DELIVERED can.
      expect(reachableGoingForwardOnly).toEqual([]);
      expect(service.canTransition(OrderStatusEnum.DELIVERED, OrderStatusEnum.COMPLETED)).toBe(true);
    });

    it('should treat CANCELLED and RETURNED as fully terminal (no transitions out, including into each other)', () => {
      const terminals = [OrderStatusEnum.CANCELLED, OrderStatusEnum.RETURNED];
      const allStatuses = Object.values(OrderStatusEnum);

      for (const terminal of terminals) {
        const onwardTransitions = allStatuses.filter(
          (target) => target !== terminal && service.canTransition(terminal, target),
        );
        expect(onwardTransitions).toEqual([]);
      }
    });

    it('should allow COMPLETED backward to an earlier fulfilment stage', () => {
      expect(service.canTransition(OrderStatusEnum.COMPLETED, OrderStatusEnum.DELIVERED)).toBe(true);
      expect(service.canTransition(OrderStatusEnum.COMPLETED, OrderStatusEnum.PENDING)).toBe(true);
    });

    it('should only allow CANCELLED from non-terminal, pre-shipment-or-later stages', () => {
      expect(service.canTransition(OrderStatusEnum.READY_TO_SHIP, OrderStatusEnum.CANCELLED)).toBe(true);
      expect(service.canTransition(OrderStatusEnum.DELIVERED, OrderStatusEnum.CANCELLED)).toBe(false);
      expect(service.canTransition(OrderStatusEnum.COMPLETED, OrderStatusEnum.CANCELLED)).toBe(false);
    });

    it('should only allow RETURNED from DELIVERED', () => {
      expect(service.canTransition(OrderStatusEnum.DELIVERED, OrderStatusEnum.RETURNED)).toBe(true);
      expect(service.canTransition(OrderStatusEnum.SHIPPED, OrderStatusEnum.RETURNED)).toBe(false);
      expect(service.canTransition(OrderStatusEnum.COMPLETED, OrderStatusEnum.RETURNED)).toBe(true);
    });
  });

  describe('isBackwardTransition', () => {
    it('should identify SHIPPED to PROCESSING as backward', () => {
      expect(service.isBackwardTransition(OrderStatusEnum.SHIPPED, OrderStatusEnum.PROCESSING)).toBe(true);
    });

    it('should not identify PENDING to CONFIRMED as backward', () => {
      expect(service.isBackwardTransition(OrderStatusEnum.PENDING, OrderStatusEnum.CONFIRMED)).toBe(false);
    });

    it('should not identify a move into CANCELLED as backward (it is a terminal move, handled separately)', () => {
      expect(service.isBackwardTransition(OrderStatusEnum.PROCESSING, OrderStatusEnum.CANCELLED)).toBe(false);
    });
  });

  describe('assertTransition', () => {
    it('should not throw on a valid forward transition without a reason', () => {
      expect(() =>
        service.assertTransition(OrderStatusEnum.PENDING, OrderStatusEnum.CONFIRMED),
      ).not.toThrow();
    });

    it('should throw BadRequestException on an impossible transition', () => {
      expect(() =>
        service.assertTransition(OrderStatusEnum.CANCELLED, OrderStatusEnum.PROCESSING),
      ).toThrow(BadRequestException);
    });

    it('should throw when a backward transition is attempted without a reason', () => {
      expect(() =>
        service.assertTransition(OrderStatusEnum.DELIVERED, OrderStatusEnum.PROCESSING),
      ).toThrow(BadRequestException);
    });

    it('should not throw when a backward transition includes a reason', () => {
      expect(() =>
        service.assertTransition(OrderStatusEnum.DELIVERED, OrderStatusEnum.PROCESSING, 'Marked delivered by mistake'),
      ).not.toThrow();
    });

    it('should throw when cancelling without a reason', () => {
      expect(() =>
        service.assertTransition(OrderStatusEnum.PENDING, OrderStatusEnum.CANCELLED),
      ).toThrow(BadRequestException);
    });

    it('should not throw when cancelling with a reason', () => {
      expect(() =>
        service.assertTransition(OrderStatusEnum.PENDING, OrderStatusEnum.CANCELLED, 'Customer requested cancellation'),
      ).not.toThrow();
    });
  });
});
