import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderStatusEnum } from '../entities/order.entity';

@Injectable()
export class OrderStateService {
  /**
   * Validates if a transition from currentStatus to newStatus is allowed based on domain rules.
   */
  canTransition(currentStatus: OrderStatusEnum, newStatus: OrderStatusEnum): boolean {
    // If the status is the same, it's technically a no-op, but we'll allow it or handle it upstream
    if (currentStatus === newStatus) return true;

    switch (currentStatus) {
      case OrderStatusEnum.PENDING:
        return [OrderStatusEnum.CONFIRMED, OrderStatusEnum.CANCELLED].includes(newStatus);
      
      case OrderStatusEnum.CONFIRMED:
        return [OrderStatusEnum.PROCESSING, OrderStatusEnum.CANCELLED].includes(newStatus);
      
      case OrderStatusEnum.PROCESSING:
        return [OrderStatusEnum.READY_TO_SHIP, OrderStatusEnum.CANCELLED].includes(newStatus);
      
      case OrderStatusEnum.READY_TO_SHIP:
        return [OrderStatusEnum.SHIPPED, OrderStatusEnum.CANCELLED].includes(newStatus);
      
      case OrderStatusEnum.SHIPPED:
        return [OrderStatusEnum.DELIVERED, OrderStatusEnum.RETURNED].includes(newStatus);
      
      case OrderStatusEnum.DELIVERED:
        return [OrderStatusEnum.RETURNED].includes(newStatus);
      
      case OrderStatusEnum.CANCELLED:
        // Terminal state
        return false;
      
      case OrderStatusEnum.RETURNED:
        // Terminal state
        return false;
        
      case OrderStatusEnum.ON_HOLD:
        // From hold, we can go back to pending or cancel
        return [OrderStatusEnum.PENDING, OrderStatusEnum.CANCELLED].includes(newStatus);
        
      case OrderStatusEnum.COMPLETED:
        // Terminal state, typically used after delivered if needed, or interchangeable with delivered
        return false;

      default:
        return false;
    }
  }

  /**
   * Asserts that a transition is valid, throwing a BadRequestException if not.
   */
  assertTransition(currentStatus: OrderStatusEnum, newStatus: OrderStatusEnum): void {
    if (!this.canTransition(currentStatus, newStatus)) {
      throw new BadRequestException(
        `Invalid order status transition from ${currentStatus} to ${newStatus}`,
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
