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

    it('should allow un-cancelling CANCELLED to CONFIRMED (merchant correcting a mistaken cancellation)', () => {
      expect(service.canTransition(OrderStatusEnum.CANCELLED, OrderStatusEnum.CONFIRMED)).toBe(true);
    });

    it('should allow un-cancelling CANCELLED to PROCESSING', () => {
      expect(service.canTransition(OrderStatusEnum.CANCELLED, OrderStatusEnum.PROCESSING)).toBe(true);
    });

    it('should reject un-cancelling CANCELLED into RETURNED (return flow only starts from DELIVERED/COMPLETED)', () => {
      expect(service.canTransition(OrderStatusEnum.CANCELLED, OrderStatusEnum.RETURNED)).toBe(false);
    });

    it('should reject RETURNED to SHIPPED', () => {
      expect(service.canTransition(OrderStatusEnum.RETURNED, OrderStatusEnum.SHIPPED)).toBe(false);
    });

    it('should allow skipping fulfilment stages forward (PENDING to SHIPPED)', () => {
      expect(service.canTransition(OrderStatusEnum.PENDING, OrderStatusEnum.SHIPPED)).toBe(true);
    });

    it('should allow skipping fulfilment stages forward (PENDING to DELIVERED)', () => {
      expect(service.canTransition(OrderStatusEnum.PENDING, OrderStatusEnum.DELIVERED)).toBe(true);
    });

    it('should allow DELIVERED to COMPLETED', () => {
      expect(service.canTransition(OrderStatusEnum.DELIVERED, OrderStatusEnum.COMPLETED)).toBe(true);
    });

    it('should allow COMPLETED to be reached directly from any earlier forward-sequence stage (ON_HOLD is a side-branch, not part of the sequence)', () => {
      const reachableGoingForward = [
        OrderStatusEnum.PENDING,
        OrderStatusEnum.ON_HOLD,
        OrderStatusEnum.CONFIRMED,
        OrderStatusEnum.PROCESSING,
        OrderStatusEnum.READY_TO_SHIP,
        OrderStatusEnum.SHIPPED,
      ].filter((from) => service.canTransition(from, OrderStatusEnum.COMPLETED));

      expect(reachableGoingForward).toEqual([
        OrderStatusEnum.PENDING,
        OrderStatusEnum.CONFIRMED,
        OrderStatusEnum.PROCESSING,
        OrderStatusEnum.READY_TO_SHIP,
        OrderStatusEnum.SHIPPED,
      ]);
      expect(service.canTransition(OrderStatusEnum.DELIVERED, OrderStatusEnum.COMPLETED)).toBe(true);
    });

    it('should not require a reason when skipping fulfilment stages forward', () => {
      expect(() =>
        service.assertTransition(OrderStatusEnum.PENDING, OrderStatusEnum.SHIPPED),
      ).not.toThrow();
    });

    it('should treat RETURNED as fully terminal (no transitions out, including into CANCELLED)', () => {
      const allStatuses = Object.values(OrderStatusEnum);
      const onwardTransitions = allStatuses.filter(
        (target) => target !== OrderStatusEnum.RETURNED && service.canTransition(OrderStatusEnum.RETURNED, target),
      );
      expect(onwardTransitions).toEqual([]);
    });

    it('should allow CANCELLED to un-cancel into any non-RETURNED status', () => {
      const allStatuses = Object.values(OrderStatusEnum);
      const reachable = allStatuses.filter(
        (target) => target !== OrderStatusEnum.CANCELLED && service.canTransition(OrderStatusEnum.CANCELLED, target),
      );
      expect(reachable.sort()).toEqual(
        allStatuses.filter((s) => s !== OrderStatusEnum.CANCELLED && s !== OrderStatusEnum.RETURNED).sort(),
      );
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
        service.assertTransition(OrderStatusEnum.RETURNED, OrderStatusEnum.PROCESSING, 'Any reason'),
      ).toThrow(BadRequestException);
    });

    it('should throw when un-cancelling without a reason', () => {
      expect(() =>
        service.assertTransition(OrderStatusEnum.CANCELLED, OrderStatusEnum.PROCESSING),
      ).toThrow(BadRequestException);
    });

    it('should not throw when un-cancelling with a reason', () => {
      expect(() =>
        service.assertTransition(OrderStatusEnum.CANCELLED, OrderStatusEnum.PROCESSING, 'Marked cancelled by mistake'),
      ).not.toThrow();
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
