import { Injectable } from '@nestjs/common';
import {
  CodStatusEnum,
  ConsignmentStatusEnum,
  TERMINAL_CONSIGNMENT_STATUSES,
} from '../entities/consignment.entity';
import { ShipmentDateRangePreset } from '../dto/list-shipments-query.dto';

export interface ResolvedPeriod {
  /** Inclusive start of the current window. */
  currentStart: Date;
  /** Exclusive end of the current window. */
  currentEnd: Date;
  /** Inclusive start of the immediately preceding, equally-long window. */
  previousStart: Date;
  /** Exclusive end of the preceding window (=== currentStart). */
  previousEnd: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The only legal forward moves in the shipment lifecycle.
 *
 * Status is never freely settable from the client: every change is validated
 * against this map, so a delivered parcel can not be walked back to pending and
 * a cancelled one can not be resurrected.
 */
const ALLOWED_TRANSITIONS: Record<ConsignmentStatusEnum, readonly ConsignmentStatusEnum[]> = {
  [ConsignmentStatusEnum.PENDING]: [
    ConsignmentStatusEnum.BOOKED,
    ConsignmentStatusEnum.CANCELLED,
  ],
  [ConsignmentStatusEnum.BOOKED]: [
    ConsignmentStatusEnum.PICKED_UP,
    ConsignmentStatusEnum.CANCELLED,
  ],
  [ConsignmentStatusEnum.PICKED_UP]: [
    ConsignmentStatusEnum.IN_TRANSIT,
    ConsignmentStatusEnum.OUT_FOR_DELIVERY,
    ConsignmentStatusEnum.DELIVERY_FAILED,
    ConsignmentStatusEnum.RETURNING,
  ],
  [ConsignmentStatusEnum.IN_TRANSIT]: [
    ConsignmentStatusEnum.OUT_FOR_DELIVERY,
    ConsignmentStatusEnum.DELIVERY_FAILED,
    ConsignmentStatusEnum.RETURNING,
  ],
  [ConsignmentStatusEnum.OUT_FOR_DELIVERY]: [
    ConsignmentStatusEnum.DELIVERED,
    ConsignmentStatusEnum.DELIVERY_FAILED,
    ConsignmentStatusEnum.RETURNING,
  ],
  // A failed attempt is retryable — couriers re-attempt before giving up.
  [ConsignmentStatusEnum.DELIVERY_FAILED]: [
    ConsignmentStatusEnum.OUT_FOR_DELIVERY,
    ConsignmentStatusEnum.IN_TRANSIT,
    ConsignmentStatusEnum.RETURNING,
  ],
  [ConsignmentStatusEnum.RETURNING]: [ConsignmentStatusEnum.RETURNED],
  [ConsignmentStatusEnum.DELIVERED]: [],
  [ConsignmentStatusEnum.RETURNED]: [],
  [ConsignmentStatusEnum.CANCELLED]: [],
};

/** Merchant-facing labels — status must never be conveyed by colour alone. */
export const CONSIGNMENT_STATUS_LABELS: Record<ConsignmentStatusEnum, string> = {
  [ConsignmentStatusEnum.PENDING]: 'Pending',
  [ConsignmentStatusEnum.BOOKED]: 'Booked',
  [ConsignmentStatusEnum.PICKED_UP]: 'Picked Up',
  [ConsignmentStatusEnum.IN_TRANSIT]: 'In Transit',
  [ConsignmentStatusEnum.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [ConsignmentStatusEnum.DELIVERED]: 'Delivered',
  [ConsignmentStatusEnum.DELIVERY_FAILED]: 'Failed Delivery',
  [ConsignmentStatusEnum.RETURNING]: 'Returning',
  [ConsignmentStatusEnum.RETURNED]: 'Returned',
  [ConsignmentStatusEnum.CANCELLED]: 'Cancelled',
};

export const COD_STATUS_LABELS: Record<CodStatusEnum, string> = {
  [CodStatusEnum.NOT_APPLICABLE]: 'Prepaid',
  [CodStatusEnum.PENDING]: 'Pending',
  [CodStatusEnum.COLLECTED]: 'Collected',
  [CodStatusEnum.SETTLED]: 'Settled',
  [CodStatusEnum.RETURNED]: 'Returned',
};

/**
 * Canonical shipment business rules shared by every logistics use case.
 * Pure logic only — no repository access — so it is cheap to unit test.
 */
@Injectable()
export class ShipmentDomainService {
  /** Whether `next` is a legal move from `current`. */
  canTransition(current: ConsignmentStatusEnum, next: ConsignmentStatusEnum): boolean {
    if (current === next) return false;
    return (ALLOWED_TRANSITIONS[current] ?? []).includes(next);
  }

  /** Legal next states, used to build the row action menu. */
  allowedTransitions(current: ConsignmentStatusEnum): readonly ConsignmentStatusEnum[] {
    return ALLOWED_TRANSITIONS[current] ?? [];
  }

  isTerminal(status: ConsignmentStatusEnum): boolean {
    return TERMINAL_CONSIGNMENT_STATUSES.includes(status);
  }

  /**
   * A parcel can be cancelled only before a courier has physically taken it.
   * Once it is picked up, the return flow — not cancellation — applies.
   */
  isCancellable(status: ConsignmentStatusEnum): boolean {
    return this.canTransition(status, ConsignmentStatusEnum.CANCELLED);
  }

  /**
   * COD state implied by a shipment reaching `status`.
   *
   * Returns undefined when the delivery status says nothing new about the cash,
   * so an already-settled parcel is never silently reset to collected.
   */
  deriveCodStatus(
    status: ConsignmentStatusEnum,
    currentCodStatus: CodStatusEnum,
  ): CodStatusEnum | undefined {
    // A prepaid parcel never has cash to collect, whatever happens in transit.
    if (currentCodStatus === CodStatusEnum.NOT_APPLICABLE) return undefined;

    if (status === ConsignmentStatusEnum.DELIVERED) {
      // Settlement is a later, separate event — never skip straight to SETTLED.
      return currentCodStatus === CodStatusEnum.PENDING
        ? CodStatusEnum.COLLECTED
        : undefined;
    }

    if (
      status === ConsignmentStatusEnum.RETURNED ||
      status === ConsignmentStatusEnum.CANCELLED
    ) {
      return currentCodStatus === CodStatusEnum.PENDING
        ? CodStatusEnum.RETURNED
        : undefined;
    }

    return undefined;
  }

  /**
   * Percentage change between two periods.
   * Returns null when there is no comparable baseline, which the UI renders as
   * a neutral dash rather than Infinity%/NaN%.
   */
  calculateChangePercent(current: number, previous: number): number | null {
    const prev = Number(previous) || 0;
    const curr = Number(current) || 0;
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  }

  /** Share of a total, 0-100, safe when the total is zero. */
  calculatePercentage(part: number, total: number): number {
    const t = Number(total) || 0;
    if (t === 0) return 0;
    return Math.round(((Number(part) || 0) / t) * 1000) / 10;
  }

  /**
   * Resolves a relative preset (or explicit custom range) into absolute UTC
   * instants, plus the equally-long preceding window used for KPI comparison.
   *
   * `offsetMinutes` is the merchant timezone offset east of UTC, so "today"
   * means the merchant's calendar day rather than the server's.
   */
  resolvePeriod(
    preset: ShipmentDateRangePreset | undefined,
    dateFrom?: string,
    dateTo?: string,
    offsetMinutes = 360, // Asia/Dhaka (UTC+6) — the platform's primary market
    now: Date = new Date(),
  ): ResolvedPeriod {
    if (preset === ShipmentDateRangePreset.CUSTOM || (dateFrom && dateTo)) {
      if (dateFrom && dateTo) {
        const start = new Date(dateFrom);
        const rawEnd = new Date(dateTo);
        // `dateTo` is an inclusive calendar day: extend to the end of that day
        // unless an explicit time was supplied.
        const end = this.isDateOnly(dateTo) ? new Date(rawEnd.getTime() + DAY_MS) : rawEnd;
        const span = Math.max(end.getTime() - start.getTime(), DAY_MS);
        return {
          currentStart: start,
          currentEnd: end,
          previousStart: new Date(start.getTime() - span),
          previousEnd: start,
        };
      }
    }

    const localNow = new Date(now.getTime() + offsetMinutes * 60 * 1000);
    const localMidnight = Date.UTC(
      localNow.getUTCFullYear(),
      localNow.getUTCMonth(),
      localNow.getUTCDate(),
    );
    // Start of the merchant's current calendar day, expressed in UTC.
    const todayStartUtc = localMidnight - offsetMinutes * 60 * 1000;

    let currentStart: Date;
    let currentEnd: Date;

    switch (preset) {
      case ShipmentDateRangePreset.TODAY:
        currentStart = new Date(todayStartUtc);
        currentEnd = new Date(todayStartUtc + DAY_MS);
        break;
      case ShipmentDateRangePreset.YESTERDAY:
        currentStart = new Date(todayStartUtc - DAY_MS);
        currentEnd = new Date(todayStartUtc);
        break;
      case ShipmentDateRangePreset.LAST_7_DAYS:
        currentStart = new Date(todayStartUtc - 6 * DAY_MS);
        currentEnd = new Date(todayStartUtc + DAY_MS);
        break;
      case ShipmentDateRangePreset.LAST_90_DAYS:
        currentStart = new Date(todayStartUtc - 89 * DAY_MS);
        currentEnd = new Date(todayStartUtc + DAY_MS);
        break;
      case ShipmentDateRangePreset.LAST_30_DAYS:
      default:
        currentStart = new Date(todayStartUtc - 29 * DAY_MS);
        currentEnd = new Date(todayStartUtc + DAY_MS);
        break;
    }

    const span = currentEnd.getTime() - currentStart.getTime();
    return {
      currentStart,
      currentEnd,
      previousStart: new Date(currentStart.getTime() - span),
      previousEnd: currentStart,
    };
  }

  /** Start of the merchant's current calendar month, expressed in UTC. */
  resolveMonthStart(offsetMinutes = 360, now: Date = new Date()): Date {
    const localNow = new Date(now.getTime() + offsetMinutes * 60 * 1000);
    const localMonthStart = Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), 1);
    return new Date(localMonthStart - offsetMinutes * 60 * 1000);
  }

  /** Converts an IANA timezone into its current offset in minutes east of UTC. */
  resolveTimezoneOffsetMinutes(timezone?: string, at: Date = new Date()): number {
    if (!timezone) return 360;
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const parts = formatter.formatToParts(at);
      const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
      const asUtc = Date.UTC(
        get('year'),
        get('month') - 1,
        get('day'),
        get('hour') % 24,
        get('minute'),
        get('second'),
      );
      return Math.round((asUtc - at.getTime()) / 60000);
    } catch {
      // Unknown timezone identifier — fall back to the platform default.
      return 360;
    }
  }

  private isDateOnly(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  }
}
