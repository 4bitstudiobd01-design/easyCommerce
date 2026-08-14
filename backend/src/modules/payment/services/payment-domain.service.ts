import { Injectable } from '@nestjs/common';
import {
  PaymentTransactionStatusEnum,
  SETTLED_PAYMENT_STATUSES,
} from '../entities/payment.entity';
import {
  PaymentDateRangePreset,
} from '../dto/list-payment-transactions-query.dto';

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
 * Canonical payment business rules shared by every payment use case.
 * Pure logic only — no repository access — so it is cheap to unit test.
 */
@Injectable()
export class PaymentDomainService {
  /**
   * A payment may be refunded only when money was actually captured and some
   * of it is still unrefunded. Failed, cancelled, pending and fully refunded
   * payments are never refundable.
   */
  isRefundable(
    status: PaymentTransactionStatusEnum,
    amount: number,
    refundedAmount: number,
  ): boolean {
    if (!SETTLED_PAYMENT_STATUSES.includes(status)) return false;
    const total = Number(amount) || 0;
    const refunded = Number(refundedAmount) || 0;
    return total - refunded > 0.009;
  }

  /**
   * Derives the settled status implied by a refunded total, so refund state is
   * always consistent with the money actually returned.
   */
  resolveSettledStatus(
    amount: number,
    refundedAmount: number,
  ): PaymentTransactionStatusEnum {
    const total = Number(amount) || 0;
    const refunded = Number(refundedAmount) || 0;
    if (refunded <= 0.009) return PaymentTransactionStatusEnum.COMPLETED;
    if (refunded >= total - 0.009) return PaymentTransactionStatusEnum.REFUNDED;
    return PaymentTransactionStatusEnum.PARTIALLY_REFUNDED;
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
   * Masks a gateway transaction reference for merchant display.
   * Keeps a reconcilable prefix and never reveals the full credential.
   */
  maskGatewayReference(reference?: string | null): string | undefined {
    if (!reference) return undefined;
    const value = String(reference);
    if (value.length <= 10) return value;
    return `${value.slice(0, 10)}...`;
  }

  /**
   * Resolves a relative preset (or explicit custom range) into absolute UTC
   * instants, plus the equally-long preceding window used for KPI comparison.
   *
   * `offsetMinutes` is the merchant timezone offset east of UTC, so "today"
   * means the merchant's calendar day rather than the server's.
   */
  resolvePeriod(
    preset: PaymentDateRangePreset | undefined,
    dateFrom?: string,
    dateTo?: string,
    offsetMinutes = 360, // Asia/Dhaka (UTC+6) — the platform's primary market
    now: Date = new Date(),
  ): ResolvedPeriod {
    // Custom range wins whenever both bounds are supplied.
    if (preset === PaymentDateRangePreset.CUSTOM || (dateFrom && dateTo)) {
      if (dateFrom && dateTo) {
        const start = new Date(dateFrom);
        const rawEnd = new Date(dateTo);
        // `dateTo` is an inclusive calendar day: extend to the end of that day
        // in merchant-local terms unless an explicit time was supplied.
        const end = this.isDateOnly(dateTo)
          ? new Date(rawEnd.getTime() + DAY_MS)
          : rawEnd;
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
      case PaymentDateRangePreset.TODAY:
        currentStart = new Date(todayStartUtc);
        currentEnd = new Date(todayStartUtc + DAY_MS);
        break;
      case PaymentDateRangePreset.YESTERDAY:
        currentStart = new Date(todayStartUtc - DAY_MS);
        currentEnd = new Date(todayStartUtc);
        break;
      case PaymentDateRangePreset.LAST_7_DAYS:
        currentStart = new Date(todayStartUtc - 6 * DAY_MS);
        currentEnd = new Date(todayStartUtc + DAY_MS);
        break;
      case PaymentDateRangePreset.LAST_90_DAYS:
        currentStart = new Date(todayStartUtc - 89 * DAY_MS);
        currentEnd = new Date(todayStartUtc + DAY_MS);
        break;
      case PaymentDateRangePreset.LAST_30_DAYS:
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
