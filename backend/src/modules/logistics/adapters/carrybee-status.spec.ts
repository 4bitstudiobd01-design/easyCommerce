import { normalizeCarrybeeStatus, CARRYBEE_STATUS_MAP } from './carrybee.adapter';
import { ConsignmentStatusEnum } from '../entities/consignment.entity';

describe('normalizeCarrybeeStatus', () => {
  it('collapses the Title-Case spaced form from transfer_status', () => {
    expect(normalizeCarrybeeStatus('Pickup cancelled')).toBe('pickup-cancelled');
  });

  it('strips the order. prefix from a webhook event code', () => {
    expect(normalizeCarrybeeStatus('order.pickup-cancelled')).toBe('pickup-cancelled');
  });

  it('collapses underscores', () => {
    expect(normalizeCarrybeeStatus('IN_TRANSIT')).toBe('in-transit');
  });

  it('handles null / undefined', () => {
    expect(normalizeCarrybeeStatus(undefined)).toBe('');
    expect(normalizeCarrybeeStatus(null)).toBe('');
  });
});

describe('CARRYBEE_STATUS_MAP', () => {
  it('maps the "Pickup cancelled" transfer_status to CANCELLED', () => {
    expect(CARRYBEE_STATUS_MAP[normalizeCarrybeeStatus('Pickup cancelled')]).toBe(
      ConsignmentStatusEnum.CANCELLED,
    );
  });

  it('maps a delivered webhook code to DELIVERED', () => {
    expect(CARRYBEE_STATUS_MAP[normalizeCarrybeeStatus('order.delivered')]).toBe(
      ConsignmentStatusEnum.DELIVERED,
    );
  });

  it('maps an in-transit status to IN_TRANSIT', () => {
    expect(CARRYBEE_STATUS_MAP[normalizeCarrybeeStatus('In transit')]).toBe(
      ConsignmentStatusEnum.IN_TRANSIT,
    );
  });
});
