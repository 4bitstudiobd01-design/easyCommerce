import { OrderStatusType } from '../api/orderApi';

/**
 * Mirrors the forward fulfilment sequence in the backend's OrderStateService.
 * ON_HOLD is a side-branch off PENDING, not part of this sequence — same as
 * the backend treats it.
 */
const FORWARD_SEQUENCE: OrderStatusType[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
];

const TERMINAL_STATUSES: OrderStatusType[] = ['CANCELLED', 'RETURNED'];

export function isBackwardTransition(current: OrderStatusType, target: OrderStatusType): boolean {
  if (TERMINAL_STATUSES.includes(current) || TERMINAL_STATUSES.includes(target)) return false;
  if (current === 'ON_HOLD' || target === 'ON_HOLD') return false;
  const currentIndex = FORWARD_SEQUENCE.indexOf(current);
  const targetIndex = FORWARD_SEQUENCE.indexOf(target);
  if (currentIndex === -1 || targetIndex === -1) return false;
  return targetIndex < currentIndex;
}

/**
 * A reason is required for any backward move, a move into a terminal state, or
 * un-cancelling an order (CANCELLED can move to any non-RETURNED status, but that
 * correction still needs a reason — mirrors the backend's OrderStateService).
 */
export function requiresReason(current: OrderStatusType, target: OrderStatusType): boolean {
  return isBackwardTransition(current, target) || TERMINAL_STATUSES.includes(target) || current === 'CANCELLED';
}

export function isTerminalTarget(target: OrderStatusType): boolean {
  return TERMINAL_STATUSES.includes(target);
}
