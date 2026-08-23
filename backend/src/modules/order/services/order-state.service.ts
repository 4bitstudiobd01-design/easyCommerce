import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderStatusEnum } from '../entities/order.entity';

/**
 * The happy-path fulfilment sequence, in order. ON_HOLD is deliberately NOT part
 * of this sequence — it's a side-branch reachable from PENDING that only ever
 * goes back to PENDING or to CANCELLED (matching the original state machine).
 * CANCELLED/RETURNED sit outside the sequence entirely — reachable from most
 * forward states but never transition onward again (terminal in both directions).
 */
const FORWARD_SEQUENCE: OrderStatusEnum[] = [
  OrderStatusEnum.PENDING,
  OrderStatusEnum.CONFIRMED,
  OrderStatusEnum.PROCESSING,
  OrderStatusEnum.READY_TO_SHIP,
  OrderStatusEnum.SHIPPED,
  OrderStatusEnum.DELIVERED,
  OrderStatusEnum.COMPLETED,
];

const TERMINAL_STATUSES: OrderStatusEnum[] = [OrderStatusEnum.CANCELLED, OrderStatusEnum.RETURNED];

/** Statuses from which the merchant can still cancel the order outright. */
const CANCELLABLE_FROM: OrderStatusEnum[] = [
  OrderStatusEnum.PENDING,
  OrderStatusEnum.ON_HOLD,
  OrderStatusEnum.CONFIRMED,
  OrderStatusEnum.PROCESSING,
  OrderStatusEnum.READY_TO_SHIP,
];

@Injectable()
export class OrderStateService {
  /**
   * Validates if a transition from currentStatus to newStatus is allowed based on domain rules.
   *
   * Forward moves through FORWARD_SEQUENCE are allowed one step at a time. Backward
   * moves (to any earlier state in the same sequence) are also allowed, per the
   * decision that a merchant can correct a fulfilment mistake — every backward move
   * is expected to carry a reason, enforced by `assertTransition`. ON_HOLD is a
   * side-branch off PENDING, not part of the forward sequence, handled separately.
   */
  canTransition(currentStatus: OrderStatusEnum, newStatus: OrderStatusEnum): boolean {
    if (currentStatus === newStatus) return true;

    // Terminal states never transition anywhere, including into each other.
    if (TERMINAL_STATUSES.includes(currentStatus)) return false;

    if (TERMINAL_STATUSES.includes(newStatus)) {
      if (newStatus === OrderStatusEnum.CANCELLED) {
        return CANCELLABLE_FROM.includes(currentStatus);
      }
      // RETURNED is only reachable from DELIVERED or COMPLETED (the return/refund flow).
      return currentStatus === OrderStatusEnum.DELIVERED || currentStatus === OrderStatusEnum.COMPLETED;
    }

    // ON_HOLD: a side-branch off PENDING, going back to PENDING only.
    if (currentStatus === OrderStatusEnum.ON_HOLD) {
      return newStatus === OrderStatusEnum.PENDING;
    }
    if (newStatus === OrderStatusEnum.ON_HOLD) {
      return currentStatus === OrderStatusEnum.PENDING;
    }

    const currentIndex = FORWARD_SEQUENCE.indexOf(currentStatus);
    const newIndex = FORWARD_SEQUENCE.indexOf(newStatus);

    // Either status isn't part of the forward sequence (shouldn't happen given the
    // enum is closed, but fail closed rather than silently allowing an unknown state).
    if (currentIndex === -1 || newIndex === -1) return false;

    // Forward: only one step at a time (no skipping fulfilment stages).
    if (newIndex === currentIndex + 1) return true;

    // Backward: any earlier state in the sequence is reachable, to let a merchant
    // correct a mistaken transition. Reason is enforced by assertTransition.
    if (newIndex < currentIndex) return true;

    return false;
  }

  /**
   * True when moving from `currentStatus` to `newStatus` is a backward move through
   * the forward sequence — i.e. not a same-status no-op, not a forward step, and not
   * a move into/out of a terminal state or ON_HOLD (those already require a reason
   * for other reasons and aren't considered "backward").
   */
  isBackwardTransition(currentStatus: OrderStatusEnum, newStatus: OrderStatusEnum): boolean {
    if (TERMINAL_STATUSES.includes(currentStatus) || TERMINAL_STATUSES.includes(newStatus)) {
      return false;
    }
    if (currentStatus === OrderStatusEnum.ON_HOLD || newStatus === OrderStatusEnum.ON_HOLD) {
      return false;
    }
    const currentIndex = FORWARD_SEQUENCE.indexOf(currentStatus);
    const newIndex = FORWARD_SEQUENCE.indexOf(newStatus);
    if (currentIndex === -1 || newIndex === -1) return false;
    return newIndex < currentIndex;
  }

  /**
   * Asserts that a transition is valid, throwing a BadRequestException if not.
   * Also enforces that a reason is supplied whenever one is required (backward
   * moves and moves into a terminal state) — defense-in-depth behind the frontend's
   * own confirmation-modal gating, so this can never be bypassed by calling the API
   * directly.
   */
  assertTransition(currentStatus: OrderStatusEnum, newStatus: OrderStatusEnum, reason?: string): void {
    if (!this.canTransition(currentStatus, newStatus)) {
      throw new BadRequestException(
        `Invalid order status transition from ${currentStatus} to ${newStatus}`,
      );
    }

    const reasonRequired =
      this.isBackwardTransition(currentStatus, newStatus) || TERMINAL_STATUSES.includes(newStatus);

    if (reasonRequired && (!reason || !reason.trim())) {
      throw new BadRequestException(
        `A reason is required when moving an order from ${currentStatus} to ${newStatus}.`,
      );
    }
  }

  /**
   * Validates if an order can be edited based on its current status.
   */
  isEditable(status: OrderStatusEnum): boolean {
    return [
      OrderStatusEnum.PENDING,
      OrderStatusEnum.ON_HOLD,
      OrderStatusEnum.CONFIRMED,
      OrderStatusEnum.PROCESSING,
    ].includes(status);
  }
}
