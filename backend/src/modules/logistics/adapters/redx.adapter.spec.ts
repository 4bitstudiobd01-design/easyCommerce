import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { RedxCourierAdapter } from './redx.adapter';
import { CourierBookingPayload, CourierCredentials } from './courier.adapter';
import { ConsignmentStatusEnum } from '../entities/consignment.entity';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const BASE_PAYLOAD: CourierBookingPayload = {
  invoice: 'EC-1001',
  recipientName: 'Test Customer',
  recipientPhone: '01812345678',
  recipientAddress: 'Test Address',
  city: 'Dhaka',
  codAmount: 900,
  apiKey: 'tok-1',
  merchantStoreId: '1',
  deliveryAreaId: 12,
  sandbox: true,
};

describe('RedxCourierAdapter.bookParcel', () => {
  let adapter: RedxCourierAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedxCourierAdapter, { provide: ConfigService, useValue: new ConfigService({}) }],
    }).compile();

    adapter = module.get(RedxCourierAdapter);
    jest.clearAllMocks();
  });

  it('runs in sandbox mode with a fabricated tracking code when no token is configured', async () => {
    const result = await adapter.bookParcel({ ...BASE_PAYLOAD, apiKey: undefined });
    expect(result.status).toBe('BOOKED');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('rejects when a token exists but no delivery area was selected', async () => {
    await expect(
      adapter.bookParcel({ ...BASE_PAYLOAD, deliveryAreaId: undefined }),
    ).rejects.toThrow(BadRequestException);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('rejects when a token exists but no pickup store id is configured', async () => {
    await expect(
      adapter.bookParcel({ ...BASE_PAYLOAD, merchantStoreId: undefined }),
    ).rejects.toThrow(BadRequestException);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('sends delivery_area_id, pickup_store_id and value on the real booking call', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { tracking_id: '20A312THJDJ8' } });

    const result = await adapter.bookParcel(BASE_PAYLOAD);

    expect(result.trackingCode).toBe('20A312THJDJ8');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://sandbox.redx.com.bd/v1.0.0-beta/parcel',
      expect.objectContaining({
        delivery_area_id: 12,
        pickup_store_id: 1,
        value: 900, // falls back to codAmount when declaredValue is omitted
        parcel_weight: 500, // 0.5kg default → 500g
      }),
      expect.objectContaining({ headers: expect.objectContaining({ 'API-ACCESS-TOKEN': 'Bearer tok-1' }) }),
    );
  });

  it('uses declaredValue over codAmount when both are given', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { tracking_id: 'X' } });
    await adapter.bookParcel({ ...BASE_PAYLOAD, declaredValue: 3000 });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ value: 3000 }),
      expect.any(Object),
    );
  });
});

describe('RedxCourierAdapter.trackParcel', () => {
  let adapter: RedxCourierAdapter;
  const CREDS: CourierCredentials = { apiKey: 'tok-1', sandbox: true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedxCourierAdapter, { provide: ConfigService, useValue: new ConfigService({}) }],
    }).compile();

    adapter = module.get(RedxCourierAdapter);
    jest.clearAllMocks();
  });

  it('reads current status from parcel/info, not parcel/track (which has no status field)', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { parcel: { status: 'pickup-pending' } } }) // /parcel/info/{id}
      .mockResolvedValueOnce({ data: { tracking: [] } }); // /parcel/track/{id}

    const result = await adapter.trackParcel('TRK1', CREDS);

    expect(result.currentStatus).toBe(ConsignmentStatusEnum.BOOKED);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      1,
      'https://sandbox.redx.com.bd/v1.0.0-beta/parcel/info/TRK1',
      expect.any(Object),
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      'https://sandbox.redx.com.bd/v1.0.0-beta/parcel/track/TRK1',
      expect.any(Object),
    );
  });

  it('maps a delivered status correctly', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { parcel: { status: 'delivered' } } })
      .mockResolvedValueOnce({ data: { tracking: [] } });

    const result = await adapter.trackParcel('TRK1', CREDS);
    expect(result.currentStatus).toBe(ConsignmentStatusEnum.DELIVERED);
  });

  it('stamps every track-history entry with the resolved current status rather than a per-entry field that does not exist', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { parcel: { status: 'in-transit' } } })
      .mockResolvedValueOnce({
        data: {
          tracking: [
            { message_en: 'Package is created successfully', time: '2020-02-04T21:19:41.000Z' },
            { message_en: 'Package is picked up', time: '2020-02-05T11:41:03.000Z' },
          ],
        },
      });

    const result = await adapter.trackParcel('TRK1', CREDS);

    expect(result.events).toHaveLength(2);
    expect(result.events.every((e) => e.status === ConsignmentStatusEnum.IN_TRANSIT)).toBe(true);
    expect(result.events[0].description).toBe('Package is created successfully');
  });

  it('still returns the resolved status when the track endpoint fails (best-effort)', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { parcel: { status: 'delivered' } } })
      .mockRejectedValueOnce(new Error('track endpoint down'));

    const result = await adapter.trackParcel('TRK1', CREDS);

    expect(result.currentStatus).toBe(ConsignmentStatusEnum.DELIVERED);
    expect(result.events).toHaveLength(1); // synthesized single event, not empty
  });

  it('throws when parcel/info itself fails — status is not optional', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('info endpoint down'));
    await expect(adapter.trackParcel('TRK1', CREDS)).rejects.toThrow();
  });

  it('runs in sandbox mode with no fabricated movement when no token is configured', async () => {
    const result = await adapter.trackParcel('TRK1', { sandbox: true });
    expect(result.currentStatus).toBe(ConsignmentStatusEnum.BOOKED);
    expect(result.events).toEqual([]);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });
});

describe('RedxCourierAdapter.cancelParcel', () => {
  let adapter: RedxCourierAdapter;
  const CREDS: CourierCredentials = { apiKey: 'tok-1', sandbox: true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedxCourierAdapter, { provide: ConfigService, useValue: new ConfigService({}) }],
    }).compile();

    adapter = module.get(RedxCourierAdapter);
    jest.clearAllMocks();
  });

  it('cancels locally in sandbox mode when no token is configured', async () => {
    const result = await adapter.cancelParcel('TRK1', { sandbox: true });
    expect(result.cancelled).toBe(true);
    expect(mockedAxios.patch).not.toHaveBeenCalled();
  });

  it('calls the plural PATCH /parcels endpoint with a status update', async () => {
    mockedAxios.patch.mockResolvedValueOnce({ data: { success: true, message: 'Request Accepted' } });

    const result = await adapter.cancelParcel('TRK1', CREDS);

    expect(result).toEqual({ cancelled: true, message: 'Request Accepted' });
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'https://sandbox.redx.com.bd/v1.0.0-beta/parcels',
      {
        entity_type: 'parcel-tracking-id',
        entity_id: 'TRK1',
        update_details: {
          property_name: 'status',
          new_value: 'cancelled',
          reason: 'Cancelled by merchant via BitCommerce.',
        },
      },
      expect.objectContaining({ headers: expect.objectContaining({ 'API-ACCESS-TOKEN': 'Bearer tok-1' }) }),
    );
  });

  it('reports failure when RedX does not accept the request', async () => {
    mockedAxios.patch.mockResolvedValueOnce({ data: { success: false, message: 'Cannot cancel a delivered parcel' } });
    const result = await adapter.cancelParcel('TRK1', CREDS);
    expect(result).toEqual({ cancelled: false, message: 'Cannot cancel a delivered parcel' });
  });

  it('reports failure rather than throwing when the request errors', async () => {
    mockedAxios.patch.mockRejectedValueOnce(new Error('network down'));
    const result = await adapter.cancelParcel('TRK1', CREDS);
    expect(result.cancelled).toBe(false);
  });
});
