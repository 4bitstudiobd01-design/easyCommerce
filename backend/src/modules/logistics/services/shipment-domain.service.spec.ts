import { ShipmentDomainService } from './shipment-domain.service';
import {
  CodStatusEnum,
  ConsignmentStatusEnum,
} from '../entities/consignment.entity';
import { ShipmentDateRangePreset } from '../dto/list-shipments-query.dto';

describe('ShipmentDomainService', () => {
  let service: ShipmentDomainService;

  beforeEach(() => {
    service = new ShipmentDomainService();
  });

  describe('status transitions', () => {
    it('allows the normal forward delivery path', () => {
      const path: Array<[ConsignmentStatusEnum, ConsignmentStatusEnum]> = [
        [ConsignmentStatusEnum.PENDING, ConsignmentStatusEnum.BOOKED],
        [ConsignmentStatusEnum.BOOKED, ConsignmentStatusEnum.PICKED_UP],
        [ConsignmentStatusEnum.PICKED_UP, ConsignmentStatusEnum.IN_TRANSIT],
        [ConsignmentStatusEnum.IN_TRANSIT, ConsignmentStatusEnum.OUT_FOR_DELIVERY],
        [ConsignmentStatusEnum.OUT_FOR_DELIVERY, ConsignmentStatusEnum.DELIVERED],
      ];

      path.forEach(([from, to]) => {
        expect(service.canTransition(from, to)).toBe(true);
      });
    });

    it('rejects moving a delivered parcel backwards', () => {
      expect(
        service.canTransition(ConsignmentStatusEnum.DELIVERED, ConsignmentStatusEnum.PENDING),
      ).toBe(false);
      expect(
        service.canTransition(ConsignmentStatusEnum.DELIVERED, ConsignmentStatusEnum.IN_TRANSIT),
      ).toBe(false);
    });

    it('rejects any transition out of a terminal state', () => {
      const terminals = [
        ConsignmentStatusEnum.DELIVERED,
        ConsignmentStatusEnum.RETURNED,
        ConsignmentStatusEnum.CANCELLED,
      ];

      terminals.forEach((terminal) => {
        expect(service.isTerminal(terminal)).toBe(true);
        expect(service.allowedTransitions(terminal)).toHaveLength(0);
      });
    });

    it('rejects a no-op transition to the same status', () => {
      expect(
        service.canTransition(ConsignmentStatusEnum.IN_TRANSIT, ConsignmentStatusEnum.IN_TRANSIT),
      ).toBe(false);
    });

    it('rejects skipping straight from booked to delivered', () => {
      expect(
        service.canTransition(ConsignmentStatusEnum.BOOKED, ConsignmentStatusEnum.DELIVERED),
      ).toBe(false);
    });

    it('allows a failed delivery to be re-attempted', () => {
      expect(
        service.canTransition(
          ConsignmentStatusEnum.DELIVERY_FAILED,
          ConsignmentStatusEnum.OUT_FOR_DELIVERY,
        ),
      ).toBe(true);
    });

    it('only completes a return through the RETURNING leg', () => {
      expect(
        service.canTransition(ConsignmentStatusEnum.IN_TRANSIT, ConsignmentStatusEnum.RETURNED),
      ).toBe(false);
      expect(
        service.canTransition(ConsignmentStatusEnum.IN_TRANSIT, ConsignmentStatusEnum.RETURNING),
      ).toBe(true);
      expect(
        service.canTransition(ConsignmentStatusEnum.RETURNING, ConsignmentStatusEnum.RETURNED),
      ).toBe(true);
    });
  });

  describe('cancellation rules', () => {
    it('permits cancelling only before a courier has collected the parcel', () => {
      expect(service.isCancellable(ConsignmentStatusEnum.PENDING)).toBe(true);
      expect(service.isCancellable(ConsignmentStatusEnum.BOOKED)).toBe(true);
    });

    it('refuses to cancel a parcel already in the courier network', () => {
      [
        ConsignmentStatusEnum.PICKED_UP,
        ConsignmentStatusEnum.IN_TRANSIT,
        ConsignmentStatusEnum.OUT_FOR_DELIVERY,
      ].forEach((status) => {
        expect(service.isCancellable(status)).toBe(false);
      });
    });

    it('refuses to cancel a delivered or already-cancelled parcel', () => {
      expect(service.isCancellable(ConsignmentStatusEnum.DELIVERED)).toBe(false);
      expect(service.isCancellable(ConsignmentStatusEnum.CANCELLED)).toBe(false);
    });
  });

  describe('COD derivation', () => {
    it('marks cash collected once the parcel is delivered', () => {
      expect(
        service.deriveCodStatus(ConsignmentStatusEnum.DELIVERED, CodStatusEnum.PENDING),
      ).toBe(CodStatusEnum.COLLECTED);
    });

    it('never resets an already-settled parcel back to collected', () => {
      expect(
        service.deriveCodStatus(ConsignmentStatusEnum.DELIVERED, CodStatusEnum.SETTLED),
      ).toBeUndefined();
    });

    it('leaves a prepaid parcel alone whatever happens in transit', () => {
      [
        ConsignmentStatusEnum.DELIVERED,
        ConsignmentStatusEnum.RETURNED,
        ConsignmentStatusEnum.CANCELLED,
      ].forEach((status) => {
        expect(service.deriveCodStatus(status, CodStatusEnum.NOT_APPLICABLE)).toBeUndefined();
      });
    });

    it('clears pending cash when the parcel comes back', () => {
      expect(
        service.deriveCodStatus(ConsignmentStatusEnum.RETURNED, CodStatusEnum.PENDING),
      ).toBe(CodStatusEnum.RETURNED);
      expect(
        service.deriveCodStatus(ConsignmentStatusEnum.CANCELLED, CodStatusEnum.PENDING),
      ).toBe(CodStatusEnum.RETURNED);
    });

    it('says nothing about cash for mid-flight statuses', () => {
      expect(
        service.deriveCodStatus(ConsignmentStatusEnum.IN_TRANSIT, CodStatusEnum.PENDING),
      ).toBeUndefined();
    });
  });

  describe('percentage maths', () => {
    it('returns null when there is no baseline, never Infinity', () => {
      expect(service.calculateChangePercent(50, 0)).toBeNull();
      expect(service.calculateChangePercent(0, 0)).toBeNull();
    });

    it('computes positive and negative change', () => {
      expect(service.calculateChangePercent(120, 100)).toBe(20);
      expect(service.calculateChangePercent(80, 100)).toBe(-20);
    });

    it('returns 0 rather than NaN when the total is zero', () => {
      expect(service.calculatePercentage(5, 0)).toBe(0);
    });

    it('computes a share of a total', () => {
      expect(service.calculatePercentage(456, 1256)).toBe(36.3);
    });
  });

  describe('period resolution', () => {
    const now = new Date('2026-08-15T09:00:00.000Z');
    // Asia/Dhaka is UTC+6, so the merchant's day starts at 18:00 UTC the day before.
    const dhakaOffset = 360;

    it('resolves "today" to the merchant calendar day, not the server day', () => {
      const period = service.resolvePeriod(
        ShipmentDateRangePreset.TODAY,
        undefined,
        undefined,
        dhakaOffset,
        now,
      );
      expect(period.currentStart.toISOString()).toBe('2026-08-14T18:00:00.000Z');
      expect(period.currentEnd.toISOString()).toBe('2026-08-15T18:00:00.000Z');
    });

    it('gives the previous window exactly the same length as the current one', () => {
      const period = service.resolvePeriod(
        ShipmentDateRangePreset.LAST_30_DAYS,
        undefined,
        undefined,
        dhakaOffset,
        now,
      );
      const currentSpan = period.currentEnd.getTime() - period.currentStart.getTime();
      const previousSpan = period.previousEnd.getTime() - period.previousStart.getTime();

      expect(previousSpan).toBe(currentSpan);
      // The two windows must abut, never overlap.
      expect(period.previousEnd.getTime()).toBe(period.currentStart.getTime());
    });

    it('treats a date-only custom "to" as inclusive of that whole day', () => {
      const period = service.resolvePeriod(
        ShipmentDateRangePreset.CUSTOM,
        '2026-08-01',
        '2026-08-07',
        dhakaOffset,
        now,
      );
      expect(period.currentEnd.toISOString()).toBe('2026-08-08T00:00:00.000Z');
    });

    it('falls back to the platform default for an unknown timezone', () => {
      expect(service.resolveTimezoneOffsetMinutes('Not/AZone')).toBe(360);
    });

    it('resolves the merchant month start in UTC terms', () => {
      const monthStart = service.resolveMonthStart(dhakaOffset, now);
      expect(monthStart.toISOString()).toBe('2026-07-31T18:00:00.000Z');
    });
  });
});
