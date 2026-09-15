import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { RedxChargeService } from './redx-charge.service';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';
import { CalculateRedxChargeDto } from '../dto/redx-charge.dto';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const TENANT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BASE_URL = 'https://sandbox.redx.com.bd/v1.0.0-beta';

const VALID_CREDS = { apiKey: 'tok-1', sandbox: true };

const DTO: CalculateRedxChargeDto = {
  deliveryAreaId: 12,
  pickupAreaId: 1,
  cashCollectionAmount: 1500,
  weight: 500,
};

describe('RedxChargeService', () => {
  let service: RedxChargeService;
  let resolveCredentials: { execute: jest.Mock };

  beforeEach(async () => {
    resolveCredentials = { execute: jest.fn().mockResolvedValue(VALID_CREDS) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedxChargeService,
        { provide: ConfigService, useValue: new ConfigService({}) },
        { provide: ResolveCourierCredentialsService, useValue: resolveCredentials },
      ],
    }).compile();

    service = module.get(RedxChargeService);
    jest.clearAllMocks();
    resolveCredentials.execute.mockResolvedValue(VALID_CREDS);
  });

  it('rejects when RedX credentials are not configured', async () => {
    resolveCredentials.execute.mockResolvedValue({});
    await expect(service.calculateCharge(TENANT, null, DTO)).rejects.toThrow(BadRequestException);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('calls charge_calculator with the mapped snake_case query params and maps the response back', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { deliveryCharge: 60, codCharge: 15 } });

    const result = await service.calculateCharge(TENANT, null, DTO);

    expect(result).toEqual({ deliveryCharge: 60, codCharge: 15 });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${BASE_URL}/charge/charge_calculator`,
      expect.objectContaining({
        headers: { 'API-ACCESS-TOKEN': 'Bearer tok-1' },
        params: {
          delivery_area_id: 12,
          pickup_area_id: 1,
          cash_collection_amount: 1500,
          weight: 500,
        },
      }),
    );
  });

  it('defaults codCharge to 0 when RedX omits it', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { deliveryCharge: 60 } });
    const result = await service.calculateCharge(TENANT, null, DTO);
    expect(result).toEqual({ deliveryCharge: 60, codCharge: 0 });
  });

  it('rejects when RedX returns no deliveryCharge', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });
    await expect(service.calculateCharge(TENANT, null, DTO)).rejects.toThrow(BadRequestException);
  });
});
