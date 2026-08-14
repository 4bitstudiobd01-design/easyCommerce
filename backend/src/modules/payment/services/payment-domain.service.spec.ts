import { Test, TestingModule } from '@nestjs/testing';
import { PaymentDomainService } from './payment-domain.service';
import { PaymentTransactionStatusEnum } from '../entities/payment.entity';
import { PaymentDateRangePreset } from '../dto/list-payment-transactions-query.dto';

describe('PaymentDomainService', () => {
  let service: PaymentDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentDomainService],
    }).compile();

    service = module.get<PaymentDomainService>(PaymentDomainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateChangePercent', () => {
    it('computes the percentage change between two periods', () => {
      expect(service.calculateChangePercent(112.5, 100)).toBe(12.5);
      expect(service.calculateChangePercent(94.6, 100)).toBe(-5.4);
    });

    it('returns null instead of Infinity when the previous period is zero', () => {
      expect(service.calculateChangePercent(5000, 0)).toBeNull();
    });

    it('returns null instead of NaN when both periods are zero', () => {
      const result = service.calculateChangePercent(0, 0);
      expect(result).toBeNull();
      expect(Number.isNaN(result as number)).toBe(false);
    });
  });

  describe('calculatePercentage', () => {
    it('computes a share of the total', () => {
      expect(service.calculatePercentage(720000, 845000)).toBe(85.2);
    });

    it('returns 0 rather than NaN when the total is zero', () => {
      expect(service.calculatePercentage(0, 0)).toBe(0);
    });
  });

  describe('isRefundable', () => {
    it('allows refunding a completed payment with remaining balance', () => {
      expect(
        service.isRefundable(PaymentTransactionStatusEnum.COMPLETED, 1000, 0),
      ).toBe(true);
    });

    it('allows refunding the remainder of a partially refunded payment', () => {
      expect(
        service.isRefundable(PaymentTransactionStatusEnum.PARTIALLY_REFUNDED, 1000, 400),
      ).toBe(true);
    });

    it('refuses to refund a fully refunded payment', () => {
      expect(
        service.isRefundable(PaymentTransactionStatusEnum.REFUNDED, 1000, 1000),
      ).toBe(false);
    });

    it('refuses to refund failed, cancelled or pending payments', () => {
      expect(service.isRefundable(PaymentTransactionStatusEnum.FAILED, 1000, 0)).toBe(false);
      expect(service.isRefundable(PaymentTransactionStatusEnum.CANCELLED, 1000, 0)).toBe(false);
      expect(service.isRefundable(PaymentTransactionStatusEnum.PENDING, 1000, 0)).toBe(false);
      expect(service.isRefundable(PaymentTransactionStatusEnum.PROCESSING, 1000, 0)).toBe(false);
    });
  });

  describe('resolveSettledStatus', () => {
    it('maps refunded totals onto the canonical settled status', () => {
      expect(service.resolveSettledStatus(1000, 0)).toBe(
        PaymentTransactionStatusEnum.COMPLETED,
      );
      expect(service.resolveSettledStatus(1000, 400)).toBe(
        PaymentTransactionStatusEnum.PARTIALLY_REFUNDED,
      );
      expect(service.resolveSettledStatus(1000, 1000)).toBe(
        PaymentTransactionStatusEnum.REFUNDED,
      );
    });
  });

  describe('maskGatewayReference', () => {
    it('masks long gateway references so full credentials are never exposed', () => {
      const masked = service.maskGatewayReference('SSLCZ8F92A1B3C4D5E6F7');
      expect(masked).toBe('SSLCZ8F92A...');
      expect(masked).not.toContain('E6F7');
    });

    it('returns undefined when there is no reference', () => {
      expect(service.maskGatewayReference(undefined)).toBeUndefined();
      expect(service.maskGatewayReference(null)).toBeUndefined();
    });
  });

  describe('resolvePeriod', () => {
    // 2025-08-14T04:00:00Z === 2025-08-14 10:00 in Dhaka (UTC+6)
    const now = new Date('2025-08-14T04:00:00.000Z');

    it('resolves "today" to the merchant-local calendar day, not the server day', () => {
      const period = service.resolvePeriod(PaymentDateRangePreset.TODAY, undefined, undefined, 360, now);
      // Dhaka midnight on Aug 14 is 2025-08-13T18:00:00Z
      expect(period.currentStart.toISOString()).toBe('2025-08-13T18:00:00.000Z');
      expect(period.currentEnd.toISOString()).toBe('2025-08-14T18:00:00.000Z');
    });

    it('gives the previous period the same length, immediately before the current one', () => {
      const period = service.resolvePeriod(
        PaymentDateRangePreset.LAST_30_DAYS,
        undefined,
        undefined,
        360,
        now,
      );
      const currentSpan = period.currentEnd.getTime() - period.currentStart.getTime();
      const previousSpan = period.previousEnd.getTime() - period.previousStart.getTime();

      expect(previousSpan).toBe(currentSpan);
      // The windows abut exactly — no gap and no overlap, so nothing is double counted.
      expect(period.previousEnd.getTime()).toBe(period.currentStart.getTime());
    });

    it('covers exactly 30 days for the 30-day preset', () => {
      const period = service.resolvePeriod(
        PaymentDateRangePreset.LAST_30_DAYS,
        undefined,
        undefined,
        360,
        now,
      );
      const days = (period.currentEnd.getTime() - period.currentStart.getTime()) / 86400000;
      expect(days).toBe(30);
    });

    it('resolves yesterday without overlapping today', () => {
      const yesterday = service.resolvePeriod(
        PaymentDateRangePreset.YESTERDAY,
        undefined,
        undefined,
        360,
        now,
      );
      const today = service.resolvePeriod(
        PaymentDateRangePreset.TODAY,
        undefined,
        undefined,
        360,
        now,
      );
      expect(yesterday.currentEnd.getTime()).toBe(today.currentStart.getTime());
    });

    it('extends a date-only custom end bound to cover the whole final day', () => {
      const period = service.resolvePeriod(
        PaymentDateRangePreset.CUSTOM,
        '2025-08-01',
        '2025-08-07',
        360,
        now,
      );
      // Aug 7 must be included rather than truncated at its midnight — the
      // classic off-by-one-day export bug.
      expect(period.currentEnd.toISOString()).toBe('2025-08-08T00:00:00.000Z');
    });

    it('falls back to the default window for an unknown timezone', () => {
      expect(service.resolveTimezoneOffsetMinutes('Not/AZone')).toBe(360);
    });

    it('resolves a known IANA timezone to its offset', () => {
      expect(service.resolveTimezoneOffsetMinutes('Asia/Dhaka', now)).toBe(360);
      expect(service.resolveTimezoneOffsetMinutes('UTC', now)).toBe(0);
    });
  });
});
