import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadGatewayException } from '@nestjs/common';
import axios from 'axios';
import { PaperflyCourierAdapter } from './paperfly.adapter';
import { CourierBookingPayload, CourierCredentials } from './courier.adapter';
import { ConsignmentStatusEnum } from '../entities/consignment.entity';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const CREDS: CourierCredentials = {
  username: 'merchant1',
  password: 'pw',
  apiKey: 'Ovi', // storeName
};

const BASE_PAYLOAD: CourierBookingPayload = {
  invoice: 'EC-1001',
  recipientName: 'Liton Ovi',
  recipientPhone: '01610202717',
  recipientAddress: 'Banani, Dhaka',
  city: 'Dhaka',
  codAmount: 900,
  ...CREDS,
};

describe('PaperflyCourierAdapter', () => {
  let adapter: PaperflyCourierAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaperflyCourierAdapter, { provide: ConfigService, useValue: new ConfigService({}) }],
    }).compile();

    adapter = module.get(PaperflyCourierAdapter);
    jest.clearAllMocks();
  });

  describe('bookParcel', () => {
    it('runs in sandbox mode with a fabricated tracking code when no credentials are configured', async () => {
      const result = await adapter.bookParcel({ ...BASE_PAYLOAD, username: undefined, password: undefined, apiKey: undefined });
      expect(result.status).toBe('BOOKED');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('sends Basic Auth + paperflykey header and the mapped request body', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: { message: 'successfully inserted', tracking_number: 'Z-051125-63821-A3-A1' }, response_code: 200 },
      });

      const result = await adapter.bookParcel(BASE_PAYLOAD);

      expect(result.trackingCode).toBe('Z-051125-63821-A3-A1');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.paperfly.com.bd/merchant/api/service/new_order_v2.php',
        expect.objectContaining({
          merchantOrderReference: 'EC-1001',
          storeName: 'Ovi',
          customerName: 'Liton Ovi',
          customerPhone: '01610202717',
          customerAddress: 'Banani, Dhaka',
          packagePrice: '900',
          max_weight: '0.5',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Basic ${Buffer.from('merchant1:pw').toString('base64')}`,
            paperflykey: 'Paperfly_~La?Rj73FcLm',
          }),
        }),
      );
    });

    it('throws when Paperfly accepts the request but returns no tracking number', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { response_code: 200 } });
      await expect(adapter.bookParcel(BASE_PAYLOAD)).rejects.toThrow(BadGatewayException);
    });
  });

  describe('trackParcel', () => {
    it('runs in sandbox mode with no fabricated movement when no credentials are configured', async () => {
      const result = await adapter.trackParcel('TRK1', {});
      expect(result.currentStatus).toBe(ConsignmentStatusEnum.BOOKED);
      expect(result.events).toEqual([]);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('derives BOOKED when no lifecycle stage has happened yet', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: { trackingStatus: [{ Pick: null, inTransit: '', Delivered: '' }] } },
      });
      const result = await adapter.trackParcel('TRK1', CREDS);
      expect(result.currentStatus).toBe(ConsignmentStatusEnum.BOOKED);
    });

    it('derives PICKED_UP once Pick is populated', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: { trackingStatus: [{ Pick: '2020-02-05', inTransit: '', Delivered: '' }] } },
      });
      const result = await adapter.trackParcel('TRK1', CREDS);
      expect(result.currentStatus).toBe(ConsignmentStatusEnum.PICKED_UP);
    });

    it('derives DELIVERED once Delivered is populated, even if earlier stages are also set', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: {
            trackingStatus: [
              { Pick: '2020-02-05', inTransit: '2020-02-06', PickedForDelivery: '2020-02-07', Delivered: '2020-02-08' },
            ],
          },
        },
      });
      const result = await adapter.trackParcel('TRK1', CREDS);
      expect(result.currentStatus).toBe(ConsignmentStatusEnum.DELIVERED);
    });

    it('derives RETURNED as the furthest stage even over Delivered', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: { trackingStatus: [{ Delivered: '2020-02-08', Returned: '2020-02-10' }] } },
      });
      const result = await adapter.trackParcel('TRK1', CREDS);
      expect(result.currentStatus).toBe(ConsignmentStatusEnum.RETURNED);
    });
  });

  describe('cancelParcel', () => {
    it('cancels locally in sandbox mode when no credentials are configured', async () => {
      const result = await adapter.cancelParcel('TRK1', {});
      expect(result.cancelled).toBe(true);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('calls the cancel-order endpoint and reports success', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: { message: 'succesfully canceled', response_code: 200 } } });
      const result = await adapter.cancelParcel('TRK1', CREDS);
      expect(result).toEqual({ cancelled: true, message: 'succesfully canceled' });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.paperfly.com.bd/api/v1/cancel-order',
        { order_id: 'TRK1' },
        expect.any(Object),
      );
    });

    it('reports failure rather than throwing when the request errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('network down'));
      const result = await adapter.cancelParcel('TRK1', CREDS);
      expect(result.cancelled).toBe(false);
    });
  });
});
