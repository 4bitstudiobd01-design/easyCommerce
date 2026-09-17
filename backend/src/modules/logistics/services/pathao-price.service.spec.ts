import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { PathaoPriceService } from './pathao-price.service';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';
import { PathaoAuthService } from './pathao-auth.service';
import { CalculatePathaoPriceDto } from '../dto/pathao-price.dto';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const TENANT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BASE_URL = 'https://courier-api-sandbox.pathao.com';

const VALID_CREDS = {
  clientId: 'c1',
  clientSecret: 's1',
  username: 'merchant@test.com',
  password: 'pw',
  sandbox: true,
};

const DTO: CalculatePathaoPriceDto = {
  storeId: 12345,
  itemType: 2,
  deliveryType: 48,
  itemWeight: 0.5,
  recipientCity: 1,
  recipientZone: 298,
};

describe('PathaoPriceService', () => {
  let service: PathaoPriceService;
  let resolveCredentials: { execute: jest.Mock };
  let pathaoAuth: { getValidAccessToken: jest.Mock };

  beforeEach(async () => {
    resolveCredentials = { execute: jest.fn().mockResolvedValue(VALID_CREDS) };
    pathaoAuth = { getValidAccessToken: jest.fn().mockResolvedValue('tok-1') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PathaoPriceService,
        { provide: ConfigService, useValue: new ConfigService({}) },
        { provide: ResolveCourierCredentialsService, useValue: resolveCredentials },
        { provide: PathaoAuthService, useValue: pathaoAuth },
      ],
    }).compile();

    service = module.get(PathaoPriceService);
    jest.clearAllMocks();
    resolveCredentials.execute.mockResolvedValue(VALID_CREDS);
    pathaoAuth.getValidAccessToken.mockResolvedValue('tok-1');
  });

  it('rejects when Pathao credentials are not configured', async () => {
    resolveCredentials.execute.mockResolvedValue({});
    await expect(service.calculatePrice(TENANT, null, DTO)).rejects.toThrow(BadRequestException);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('calls price-plan with the mapped snake_case payload and maps the response back', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        data: {
          price: 80,
          discount: 0,
          promo_discount: 0,
          plan_id: 69,
          cod_enabled: 1,
          cod_percentage: 0.01,
          additional_charge: 0,
          final_price: 80,
        },
      },
    });

    const result = await service.calculatePrice(TENANT, null, DTO);

    expect(result).toEqual({
      price: 80,
      discount: 0,
      promoDiscount: 0,
      planId: 69,
      codEnabled: true,
      codPercentage: 0.01,
      additionalCharge: 0,
      finalPrice: 80,
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${BASE_URL}/aladdin/api/v1/merchant/price-plan`,
      {
        store_id: 12345,
        item_type: 2,
        delivery_type: 48,
        item_weight: 0.5,
        recipient_city: 1,
        recipient_zone: 298,
      },
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer tok-1' }) }),
    );
  });

  it('rejects when Pathao returns no final_price', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { data: {} } });
    await expect(service.calculatePrice(TENANT, null, DTO)).rejects.toThrow(BadRequestException);
  });
});
