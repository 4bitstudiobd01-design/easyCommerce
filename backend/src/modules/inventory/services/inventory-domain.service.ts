import { Injectable, BadRequestException } from '@nestjs/common';
import { StockStatus } from '../../catalog/enums/stock-status.enum';

export interface StockCalculationResult {
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  status: StockStatus;
}

@Injectable()
export class InventoryDomainService {
  /**
   * Calculates the authoritative available stock for sellable inventory.
   * availableStock = onHand - reserved (cannot be negative unless allowBackorder is explicitly enabled)
   */
  calculateAvailableStock(
    onHand: number,
    reserved: number,
    allowBackorder: boolean = false,
  ): number {
    const safeOnHand = Math.max(0, Number(onHand) || 0);
    const safeReserved = Math.max(0, Number(reserved) || 0);
    const rawAvailable = safeOnHand - safeReserved;

    if (allowBackorder) {
      return rawAvailable;
    }
    return Math.max(0, rawAvailable);
  }

  /**
   * Evaluates the canonical stock status according to BitCommerce business rules:
   * 1. If trackInventory is false -> NOT_TRACKED
   * 2. If availableStock <= 0 -> OUT_OF_STOCK
   * 3. If availableStock <= lowStockThreshold -> LOW_STOCK
   * 4. Else -> IN_STOCK
   */
  calculateStockStatus(
    availableStock: number,
    lowStockThreshold: number = 10,
    trackInventory: boolean = true,
  ): StockStatus {
    if (!trackInventory) {
      return StockStatus.NOT_TRACKED;
    }

    const available = Number(availableStock);
    const threshold = Math.max(0, Number(lowStockThreshold) || 0);

    if (available <= 0) {
      return StockStatus.OUT_OF_STOCK;
    }

    if (available <= threshold) {
      return StockStatus.LOW_STOCK;
    }

    return StockStatus.IN_STOCK;
  }

  /**
   * Aggregates and calculates complete inventory metrics from raw quantities.
   */
  computeStockMetrics(params: {
    onHand: number;
    reserved?: number;
    lowStockThreshold?: number;
    trackInventory?: boolean;
    allowBackorder?: boolean;
  }): StockCalculationResult {
    const onHand = Math.max(0, Number(params.onHand) || 0);
    const reserved = Math.max(0, Number(params.reserved) || 0);
    const lowStockThreshold = Math.max(0, Number(params.lowStockThreshold ?? 10));
    const trackInventory = params.trackInventory !== false;
    const allowBackorder = Boolean(params.allowBackorder);

    const available = this.calculateAvailableStock(onHand, reserved, allowBackorder);
    const status = this.calculateStockStatus(available, lowStockThreshold, trackInventory);

    return {
      onHand,
      reserved,
      available,
      lowStockThreshold,
      trackInventory,
      allowBackorder,
      status,
    };
  }

  /**
   * Validates and computes the new on-hand quantity for an adjustment action.
   * Throws BadRequestException on illegal operations (e.g. negative stock when backorder disallowed).
   */
  computeAdjustmentNewOnHand(params: {
    currentOnHand: number;
    adjustmentQuantity: number;
    action: 'ADD' | 'SET' | 'REMOVE';
    allowBackorder?: boolean;
  }): number {
    const currentOnHand = Math.max(0, Number(params.currentOnHand) || 0);
    const delta = Number(params.adjustmentQuantity);
    const allowBackorder = Boolean(params.allowBackorder);

    if (isNaN(delta) || delta < 0) {
      throw new BadRequestException('Adjustment quantity must be a non-negative number.');
    }

    let newOnHand = currentOnHand;

    switch (params.action) {
      case 'ADD':
        newOnHand = currentOnHand + delta;
        break;

      case 'SET':
        newOnHand = delta;
        break;

      case 'REMOVE':
        if (!allowBackorder && currentOnHand - delta < 0) {
          throw new BadRequestException(
            `Insufficient on-hand stock: ${currentOnHand} available on hand, ${delta} requested to remove.`,
          );
        }
        newOnHand = allowBackorder ? currentOnHand - delta : Math.max(0, currentOnHand - delta);
        break;

      default:
        throw new BadRequestException(`Invalid adjustment action: ${params.action}`);
    }

    if (!allowBackorder && newOnHand < 0) {
      throw new BadRequestException('Resulting on-hand stock cannot be negative.');
    }

    return newOnHand;
  }

  /**
   * Validates reserving inventory units for a pending order/checkout.
   */
  validateAndComputeReservation(params: {
    currentOnHand: number;
    currentReserved: number;
    requestedReserve: number;
    allowBackorder?: boolean;
  }): { newReserved: number; availableBefore: number; availableAfter: number } {
    const currentOnHand = Math.max(0, Number(params.currentOnHand) || 0);
    const currentReserved = Math.max(0, Number(params.currentReserved) || 0);
    const requested = Number(params.requestedReserve);
    const allowBackorder = Boolean(params.allowBackorder);

    if (isNaN(requested) || requested <= 0) {
      throw new BadRequestException('Reservation quantity must be a positive number.');
    }

    const availableBefore = currentOnHand - currentReserved;

    if (!allowBackorder && availableBefore < requested) {
      throw new BadRequestException(
        `Insufficient available stock for reservation. Available: ${Math.max(0, availableBefore)}, requested: ${requested}.`,
      );
    }

    const newReserved = currentReserved + requested;
    const availableAfter = currentOnHand - newReserved;

    return {
      newReserved,
      availableBefore: Math.max(0, availableBefore),
      availableAfter: allowBackorder ? availableAfter : Math.max(0, availableAfter),
    };
  }

  /**
   * Validates releasing reserved stock (e.g. cancelled order / expired checkout session).
   */
  validateAndComputeRelease(params: {
    currentReserved: number;
    requestedRelease: number;
  }): number {
    const currentReserved = Math.max(0, Number(params.currentReserved) || 0);
    const requested = Number(params.requestedRelease);

    if (isNaN(requested) || requested <= 0) {
      throw new BadRequestException('Release quantity must be a positive number.');
    }

    if (requested > currentReserved) {
      throw new BadRequestException(
        `Cannot release ${requested} units when only ${currentReserved} are reserved.`,
      );
    }

    return Math.max(0, currentReserved - requested);
  }
}
