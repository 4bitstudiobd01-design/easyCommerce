import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { PaperflyExchangeService } from './paperfly-exchange.service';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';
import { CreatePaperflyExchangeOrderDto } from '../dto/paperfly-exchange.dto';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const TENANT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BASE_URL = 'https://api.paperfly.com.bd';

const VALID_CREDS = { username: 'merchant1', password: 'pw', apiKey: 'Ovi' };

const DTO: CreatePaperflyExchangeOrderDto = {
  merchantOrderReference: 'Test_01615',
  productBrief: 'Test Product',
  packagePrice: '10',
  maxWeight: '0.3',
  customerName: 'Liton Ovi',
  customerAddress: 'Banani, Dhaka',
  customerPhone: '01610202717',
  exchangeDescription: 'exchange product',
  exchangePrice: '100',
  exchangeWeight: '1.5',
};

describe('PaperflyExchangeService', () => {
  let service: PaperflyExchangeService;
  let resolveCredentials: { execute: jest.Mock };

  beforeEach(async () => {
    resolveCredentials = { execute: jest.fn().mockResolvedValue(VALID_CREDS) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaperflyExchangeService,
        { provide: ConfigService, useValue: new ConfigService({}) },
        { provide: ResolveCourierCredentialsService, useValue: resolveCredentials },
      ],
    }).compile();

    service = module.get(PaperflyExchangeService);
    jest.clearAllMocks();
    resolveCredentials.execute.mockResolvedValue(VALID_CREDS);
  });

  it('rejects when Paperfly credentials are not configured', async () => {
    resolveCredentials.execute.mockResolvedValue({});
    await expect(service.createExchangeOrder(TENANT, null, DTO)).rejects.toThrow(BadRequestException);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('sends orderType Exchange with the exchange-specific fields, defaulting storeName from the saved credential', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: { message: 'successfully inserted', tracking_number: 'Z-051125-63821-A3-A1', tracking_barcode: '751820115459' } },
    });

    const result = await service.createExchangeOrder(TENANT, null, DTO);

    expect(result).toEqual({
      message: 'successfully inserted',
      trackingNumber: 'Z-051125-63821-A3-A1',
      trackingBarcode: '751820115459',
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BASE_URL}/merchant/api/service/new_order_v2.php`,
      expect.objectContaining({
        merchantOrderReference: 'Test_01615',
        storeName: 'Ovi',
        orderType: 'Exchange',
        exchangeDescription: 'exchange product',
        exchangePrice: '100',
        exchangeWeight: '1.5',
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from('merchant1:pw').toString('base64')}`,
        }),
      }),
    );
  });

  it('lets a caller override storeName explicitly', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: { message: 'ok', tracking_number: 'X' } },
    });
    await service.createExchangeOrder(TENANT, null, { ...DTO, storeName: 'OtherStore' });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ storeName: 'OtherStore' }),
      expect.any(Object),
    );
  });

  it('rejects when Paperfly accepts the request but returns no tracking number', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} });
    await expect(service.createExchangeOrder(TENANT, null, DTO)).rejects.toThrow(BadRequestException);
  });
});
