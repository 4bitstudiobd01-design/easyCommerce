import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderItemEntity } from '../entities/order-item.entity';

export interface OrderCalculationInput {
  items: Array<{
    unitPrice: number;
    quantity: number;
  }>;
  deliveryFee: number;
  discountAmount: number;
}

export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  grandTotal: number;
}

@Injectable()
export class OrderCalculationService {
  /**
   * Calculates the grand total and other derived amounts based on the items, delivery fee, and discount.
   */
  calculateTotals(input: OrderCalculationInput): OrderTotals {
    if (input.deliveryFee < 0) {
      throw new BadRequestException('Delivery fee cannot be negative');
    }

    if (input.discountAmount < 0) {
      throw new BadRequestException('Discount amount cannot be negative');
    }

    let subtotal = 0;

    for (const item of input.items) {
      if (item.unitPrice < 0) {
        throw new BadRequestException('Unit price cannot be negative');
      }
      if (item.quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than zero');
      }

      // Convert to a precise number, e.g., cents if using integers, but since JS is float, 
      // we'll just do standard float math and round appropriately.
      // In a real financial system, you would use a library like Decimal.js or currency.js
      subtotal += item.unitPrice * item.quantity;
    }

    // subtotal + deliveryFee - discountAmount
    let grandTotal = subtotal + input.deliveryFee - input.discountAmount;

    // Grand total cannot be negative
    if (grandTotal < 0) {
      grandTotal = 0;
    }

    return {
      subtotal: this.roundToTwo(subtotal),
      deliveryFee: this.roundToTwo(input.deliveryFee),
      discountAmount: this.roundToTwo(input.discountAmount),
      grandTotal: this.roundToTwo(grandTotal),
    };
  }

  private roundToTwo(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
}
